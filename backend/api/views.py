from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from rest_framework.authtoken.models import Token

import requests
from io import BytesIO
import traceback
import re
from urllib.parse import urlparse

from .document_parser import parse_document, split_text_to_chunks
from .embeddings import embed_chunks, embed_query, get_top_k_chunks
from .llm_processor import hybrid_parse_input, make_decision
from .models import PolicyDocument, ClaimQuery, UserProfile

from groq import Groq
from .utils.env_loader import GROQ_API_KEY

groq_client = Groq(api_key=GROQ_API_KEY)

# Temporary in-memory store (only for current session)
DOC_STORAGE = {}

@api_view(['POST'])
@permission_classes([AllowAny])
def signup(request):
    username = request.data.get('username')
    password = request.data.get('password')
    email = request.data.get('email')
    first_name = request.data.get('first_name', '')
    last_name = request.data.get('last_name', '')
    organization = request.data.get('organization', '')
    role = request.data.get('role', '')

    if User.objects.filter(username=username).exists():
        return Response({'error': 'Username already exists'}, status=status.HTTP_400_BAD_REQUEST)

    user = User.objects.create_user(
        username=username,
        password=password,
        email=email,
        first_name=first_name,
        last_name=last_name
    )
    UserProfile.objects.create(user=user, organization=organization, role=role)

    token = Token.objects.create(user=user)
    return Response({'token': token.key}, status=status.HTTP_201_CREATED)

@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    username = request.data.get('username')
    password = request.data.get('password')
    user = authenticate(username=username, password=password)

    if not user:
        return Response({'error': 'Invalid credentials'}, status=status.HTTP_400_BAD_REQUEST)

    token, _ = Token.objects.get_or_create(user=user)
    return Response({'token': token.key})

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_info(request):
    user = request.user
    profile = None
    try:
        profile = UserProfile.objects.get(user=user)
    except UserProfile.DoesNotExist:
        pass

    return Response({
        'username': user.username,
        'email': user.email,
        'first_name': user.first_name,
        'last_name': user.last_name,
        'organization': profile.organization if profile else '',
        'role': profile.role if profile else ''
    })

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_document(request):
    if 'file' not in request.FILES:
        return Response({'error': 'No file uploaded'}, status=status.HTTP_400_BAD_REQUEST)

    file = request.FILES['file']
    filename = file.name

    try:
        text = parse_document(file, filename)
    except Exception as e:
        return Response({'error': f'Failed to parse document: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)

    chunks = split_text_to_chunks(text)
    embeddings = embed_chunks(chunks)

    document = PolicyDocument.objects.create(user=request.user, filename=filename)

    DOC_STORAGE[str(document.id)] = {
        "chunks": chunks,
        "embeddings": embeddings,
        "filename": filename
    }

    return Response({"document_id": str(document.id)})

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def analyze_query(request):
    query = request.data.get('query')
    document_id = request.data.get('document_id')

    if not query:
        return Response({"error": "Query is required"}, status=status.HTTP_400_BAD_REQUEST)

    if not document_id or document_id not in DOC_STORAGE:
        return Response({"error": "Invalid or expired document session"}, status=status.HTTP_400_BAD_REQUEST)

    parsed_input = hybrid_parse_input(query)
    query_embedding = embed_query(query)
    top_chunks = get_top_k_chunks(
        query_embedding,
        DOC_STORAGE[document_id]['embeddings'],
        DOC_STORAGE[document_id]['chunks']
    )

    result = make_decision(parsed_input, top_chunks, source_name=DOC_STORAGE[document_id]['filename'])

    try:
        document_obj = PolicyDocument.objects.get(id=document_id)
    except PolicyDocument.DoesNotExist:
        document_obj = None

    try:
        ClaimQuery.objects.create(
            user=request.user,
            document=document_obj,
            query_text=query,
            parsed_input=parsed_input,
            decision_response=result
        )
    except Exception as e:
        print(f"[WARN] Failed to save query: {e}")

    return Response(result)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_queries(request):
    queries = ClaimQuery.objects.filter(user=request.user).order_by('-created_at')
    data = []
    for q in queries:
        data.append({
            'query_text': q.query_text,
            'parsed_input': q.parsed_input,
            'decision_response': q.decision_response,
            'document_id': str(q.document.id) if q.document else None,
            'filename': q.document.filename if q.document else None,
            'created_at': q.created_at.strftime('%Y-%m-%d %H:%M:%S'),
        })
    return Response(data)

# 🚀 Updated HackRx Webhook Evaluation Endpoint
@api_view(['POST'])
@permission_classes([AllowAny])
def hackrx_run(request):
    try:
        raw_doc_url = request.data.get("documents")
        questions = request.data.get("questions", [])
        
        # Clean up and extract the real URL
        if raw_doc_url:
            match = re.match(r"\[.*\]\((.*)\)", raw_doc_url)
            if match:
                document_url = match.group(1).strip()
            else:
                document_url = raw_doc_url.strip("[](); ")
        else:
            document_url = None
        
        if not document_url or not questions:
            return Response({"error": "Missing documents or questions"}, status=400)
        
        response = requests.get(document_url)
        response.raise_for_status()
        file_like = BytesIO(response.content)
        
        # Extract the clean filename
        parsed_url = urlparse(document_url)
        filename = parsed_url.path.split("/")[-1]
        
        text = parse_document(file_like, filename)

        # Continue rest of your logic without changes...
        chunks = split_text_to_chunks(text)
        embeddings = embed_chunks(chunks)

        answers = []
        for idx, question in enumerate(questions):
            query_embedding = embed_query(question)
            top_chunks = get_top_k_chunks(query_embedding, embeddings, chunks)
            top_text = "\n\n".join([chunk for chunk, _ in top_chunks])

            llm_response = groq_client.chat.completions.create(
                model="llama3-70b-8192",
                messages=[
                    {
                        "role": "system",
                        "content": "You are a helpful assistant that answers questions based on the provided policy document content."
                    },
                    {
                        "role": "user",
                        "content": f"""Document Content:
{top_text}

Question: {question}

Answer the question based only on the content above. Be clear, concise, and factual."""
                    }
                ]
            )

            answer = llm_response.choices[0].message.content.strip()
            answers.append(answer)

        return Response({"answers": answers})

    except Exception as e:
        print("[ERROR in hackrx_run]")
        print("Exception:", str(e))
        tb = traceback.format_exc()
        print(tb)
        return Response({"error": str(e)}, status=500)