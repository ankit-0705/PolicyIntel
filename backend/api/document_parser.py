import os
import nltk
nltk.data.path.append(os.path.join(os.path.dirname(__file__), "nltk_data")) 

import pdfplumber
from docx import Document
from nltk.tokenize import sent_tokenize

def extract_text_from_pdf(file):
    text = ""
    with pdfplumber.open(file) as pdf:
        for page in pdf.pages:
            text += page.extract_text() + "\n"
    return text.strip()

def extract_text_from_docx(file):
    doc = Document(file)
    return "\n".join([p.text for p in doc.paragraphs if p.text.strip()]).strip()

def parse_document(file_obj, filename):
    if filename.endswith(".pdf"):
        return extract_text_from_pdf(file_obj)
    elif filename.endswith(".docx"):
        return extract_text_from_docx(file_obj)
    else:
        raise ValueError("Unsupported file format")

def split_text_to_chunks(text, max_words=300):
    paragraphs = [p.strip() for p in text.split('\n') if p.strip()]
    chunks = []
    current_chunk = ""
    current_word_count = 0

    for para in paragraphs:
        sentences = sent_tokenize(para)
        for sent in sentences:
            sent_word_count = len(sent.split())
            if current_word_count + sent_word_count > max_words:
                chunks.append(current_chunk.strip())
                current_chunk = sent
                current_word_count = sent_word_count
            else:
                current_chunk += " " + sent if current_chunk else sent
                current_word_count += sent_word_count

    if current_chunk:
        chunks.append(current_chunk.strip())

    return chunks
