import os
import nltk
# Dynamically add the local nltk_data path
LOCAL_NLTK_DATA = os.path.join(os.path.dirname(__file__), "nltk_data")
nltk.data.path.append(LOCAL_NLTK_DATA)

from nltk.tokenize import sent_tokenize
import pdfplumber
from docx import Document

def extract_text_from_pdf(file, max_pages=200):
    text = ""
    with pdfplumber.open(file) as pdf:
        for i, page in enumerate(pdf.pages):
            if i >= max_pages:
                break
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
    return text.strip()


def extract_text_from_docx(file, max_paragraphs=500):
    doc = Document(file)
    lines = []
    for i, p in enumerate(doc.paragraphs):
        if i >= max_paragraphs:
            break
        text = p.text.strip()
        if text:
            lines.append(text)
    return "\n".join(lines).strip()

def parse_document(file_obj, filename, max_pages=200, max_paragraphs=500):
    if filename.endswith(".pdf"):
        return extract_text_from_pdf(file_obj, max_pages=max_pages)
    elif filename.endswith(".docx"):
        return extract_text_from_docx(file_obj, max_paragraphs=max_paragraphs)
    else:
        raise ValueError("Unsupported file format")

def split_text_to_chunks(text, max_words=300):
    paragraphs = [p.strip() for p in text.split('\n') if p.strip()]
    chunks = []
    current_chunk = ""
    current_word_count = 0

    for para in paragraphs:
        try:
            # Attempt tokenization using Punkt
            sentences = sent_tokenize(para, language="english")
        except LookupError as e:
            raise RuntimeError(
                f"NLTK resource missing: {e}\n"
                f"Ensure 'punkt' and 'punkt_tab/english' are available under: {LOCAL_NLTK_DATA}"
            )

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
