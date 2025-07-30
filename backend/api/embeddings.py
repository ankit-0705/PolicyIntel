import os
import numpy as np
import requests
from gensim.models import KeyedVectors

_model = None
GLOVE_DIR = os.path.join(os.path.dirname(__file__), "glove")
os.makedirs(GLOVE_DIR, exist_ok=True)

# Use Google Drive FILE IDs only
GLOVE_FILES = {
    "glove_model.kv": "1mcVE0_kPyffRgDAQ3dYI0tqpdZfKVtJo",
    "glove_model.kv.vectors.npy": "1z44-_Am8ILlxmmKxJYULqMNntG5bsp6g",
}


def download_file_from_google_drive(file_id, destination):
    if os.path.exists(destination):
        print(f"{destination} already exists, skipping download.")
        return

    print(f"Downloading {destination} ...")
    URL = "https://docs.google.com/uc?export=download"
    session = requests.Session()

    response = session.get(URL, params={"id": file_id}, stream=True)
    token = get_confirm_token(response)

    if token:
        params = {"id": file_id, "confirm": token}
        response = session.get(URL, params=params, stream=True)

    save_response_content(response, destination)

    # Quick HTML content check (bad download)
    with open(destination, "rb") as f:
        head = f.read(1024)
        if b"<html" in head.lower():
            os.remove(destination)
            raise ValueError(f"{destination} appears to be an HTML file. Check your Google Drive link or quota.")

    print(f"Downloaded {destination}.")


def get_confirm_token(response):
    for key, value in response.cookies.items():
        if key.startswith("download_warning"):
            return value
    return None


def save_response_content(response, destination):
    CHUNK_SIZE = 32768
    with open(destination, "wb") as f:
        for chunk in response.iter_content(CHUNK_SIZE):
            if chunk:
                f.write(chunk)


def ensure_glove_files():
    for filename, file_id in GLOVE_FILES.items():
        local_path = os.path.join(GLOVE_DIR, filename)
        download_file_from_google_drive(file_id, local_path)


def get_model():
    global _model
    if _model is None:
        ensure_glove_files()
        model_path = os.path.join(GLOVE_DIR, "glove_model.kv")

        # Patch np.load to allow pickle
        orig_np_load = np.load
        np.load = lambda *a, **k: orig_np_load(*a, allow_pickle=True, **k)

        _model = KeyedVectors.load(model_path, mmap='r')

        # Restore np.load
        np.load = orig_np_load
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
