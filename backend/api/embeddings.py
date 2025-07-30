import os
import numpy as np
import requests
from gensim.models import KeyedVectors

_model = None
GLOVE_DIR = os.path.join(os.path.dirname(__file__), "glove")
os.makedirs(GLOVE_DIR, exist_ok=True)

GLOVE_FILES = {
    "glove_model.kv": "https://drive.google.com/uc?export=download&id=1mcVE0_kPyffRgDAQ3dYI0tqpdZfKVtJo",
    "glove_model.kv.vectors.npy": "https://drive.google.com/uc?export=download&id=1z44-_Am8ILlxmmKxJYULqMNntG5bsp6g",
}

def download_file_from_google_drive(url, destination):
    if os.path.exists(destination):
        print(f"{destination} already exists, skipping download.")
        return
    
    print(f"Downloading {destination} ...")
    session = requests.Session()

    response = session.get(url, stream=True)
    response.raise_for_status()

    with open(destination, "wb") as f:
        for chunk in response.iter_content(chunk_size=32768):
            if chunk:
                f.write(chunk)

    print(f"Downloaded {destination}.")

def ensure_glove_files():
    for filename, url in GLOVE_FILES.items():
        local_path = os.path.join(GLOVE_DIR, filename)
        download_file_from_google_drive(url, local_path)

def get_model():
    global _model
    if _model is None:
        ensure_glove_files()
        model_path = os.path.join(GLOVE_DIR, "glove_model.kv")
        
        # Patch np.load to allow pickle temporarily
        orig_np_load = np.load
        np.load = lambda *a, **k: orig_np_load(*a, allow_pickle=True, **k)
        
        _model = KeyedVectors.load(model_path, mmap='r')
        
        np.load = orig_np_load  # Restore original np.load
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
