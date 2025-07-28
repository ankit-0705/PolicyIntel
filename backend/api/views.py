from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from rest_framework.authtoken.models import Token

from .document_parser import parse_document, split_text_to_chunks
from .embeddings import embed_chunks, embed_query, get_top_k_chunks
from .llm_processor import hybrid_parse_input, make_decision
from .models import PolicyDocument, ClaimQuery, UserProfile

# Temporary in-memory store (just for live session usage)
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
        return Response({'error': 'Username already exists'}, status=400)

    user = User.objects.create_user(
        username=username,
        password=password,
        email=email,
        first_name=first_name,
        last_name=last_name
    )

    UserProfile.objects.create(user=user, organization=organization, role=role)
    token = Token.objects.create(user=user)
    return Response({'token': token.key}, status=201)

@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    username = request.data.get('username')
    password = request.data.get('password')
    user = authenticate(username=username, password=password)

    if not user:
        return Response({'error': 'Invalid credentials'}, status=400)

    token, _ = Token.objects.get_or_create(user=user)
    return Response({'token': token.key})

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_info(request):
    user = request.user
    try:
        profile = UserProfile.objects.get(user=user)
    except UserProfile.DoesNotExist:
        profile = None

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
    file = request.FILES['file']
    filename = file.name
    text = parse_document(file, filename)
    chunks = split_text_to_chunks(text)
    embeddings = embed_chunks(chunks)

    document = PolicyDocument.objects.create(
        user=request.user,
        filename=filename
    )

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

    if document_id not in DOC_STORAGE:
        return Response({"error": "Session expired or document not uploaded again"}, status=400)

    parsed_input = hybrid_parse_input(query)
    query_embedding = embed_query(query)
    top_chunks = get_top_k_chunks(
        query_embedding,
        DOC_STORAGE[document_id]['embeddings'],
        DOC_STORAGE[document_id]['chunks']
    )

    result = make_decision(parsed_input, top_chunks, source_name=DOC_STORAGE[document_id]['filename'])

    # Save in DB
    ClaimQuery.objects.create(
        user=request.user,
        document=PolicyDocument.objects.get(id=document_id),
        query_text=query,
        parsed_input=parsed_input,
        decision_response=result
    )

    return Response(result)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_queries(request):
    queries = ClaimQuery.objects.filter(user=request.user).order_by('-created_at')
    data = [
        {
            'query_text': q.query_text,
            'parsed_input': q.parsed_input,
            'decision_response': q.decision_response,
            'document_id': str(q.document.id) if q.document else None,
            'filename': q.document.filename if q.document else None,
            'created_at': q.created_at
        }
        for q in queries
    ]
    return Response(data)
