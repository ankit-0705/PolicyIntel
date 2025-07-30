import numpy as np
import os
from gensim.models import KeyedVectors

_model = None  # Global model reference for reuse

def get_model():
    global _model
    if _model is None:
        model_path = os.path.join(os.path.dirname(__file__), "glove", "glove_model.kv")
        _model = KeyedVectors.load(model_path, mmap='r')
    return _model

def average_embedding(text):
    model = get_model()
    words = text.split()
    embeddings = [model[word] for word in words if word in model]
    if not embeddings:
        return np.zeros(model.vector_size)
    return np.mean(embeddings, axis=0)

def embed_chunks(chunks):
    return [average_embedding(chunk) for chunk in chunks]

def embed_query(query):
    return average_embedding(query)

def cosine_similarity(vec1, vec2):
    if np.linalg.norm(vec1) == 0 or np.linalg.norm(vec2) == 0:
        return 0.0
    return np.dot(vec1, vec2) / (np.linalg.norm(vec1) * np.linalg.norm(vec2))

def get_top_k_chunks(query_embedding, chunk_embeddings, chunks, k=3):
    similarities = [cosine_similarity(query_embedding, emb) for emb in chunk_embeddings]
    top_k_indices = np.argsort(similarities)[-k:][::-1]
    return [(chunks[i], float(similarities[i])) for i in top_k_indices]
