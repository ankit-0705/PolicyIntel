import json
import re
import uuid
from datetime import datetime
from geotext import GeoText
from groq import Groq
from .utils.env_loader import GROQ_API_KEY

groq_client = Groq(api_key=GROQ_API_KEY)

def extract_json_from_text(text):
    # Try to extract first {...} JSON substring from text robustly
    try:
        json_str = re.search(r'\{.*\}', text, re.DOTALL)
        if json_str:
            return json.loads(json_str.group())
    except json.JSONDecodeError:
        pass
    return None

def extract_location(text):
    places = GeoText(text)
    if places.cities:
        return places.cities[0]
    elif places.countries:
        return places.countries[0]
    return None

def hybrid_parse_input(query):
    result = {
        "age": None,
        "gender": None,
        "procedure": None,
        "location": None,
        "policy_duration": None
    }

    try:
        response = groq_client.chat.completions.create(
            model="llama3-70b-8192",
            messages=[
                {"role": "system", "content": "You are a helpful assistant that extracts structured data from insurance-related questions."},
                {"role": "user", "content": f"""
Extract the following fields from this insurance query:
- age
- gender
- procedure
- location
- policy_duration

Only return valid JSON.
Query:
\"\"\"{query}\"\"\""""}
            ]
        )
        raw = response.choices[0].message.content.strip()
        json_data = extract_json_from_text(raw)
        if json_data:
            # Validate and typecast fields if needed
            if "age" in json_data and json_data["age"] is not None:
                try:
                    json_data["age"] = int(json_data["age"])
                except Exception:
                    json_data["age"] = None
            result.update(json_data)
        else:
            print("[WARN] Failed to parse JSON from LLM response")

    except Exception as e:
        print(f"[WARN] Groq LLM parse failed: {e}")

    # Fallbacks
    if not result["age"]:
        match = re.search(r"(\d{2})\s*(?:year|yr)?\s*old", query.lower())
        if match:
            result["age"] = int(match.group(1))

    if not result["gender"]:
        if "female" in query.lower() or re.search(r"\b\d{2}f\b", query.lower()):
            result["gender"] = "female"
        elif "male" in query.lower() or re.search(r"\b\d{2}m\b", query.lower()):
            result["gender"] = "male"

    if not result["location"]:
        location = extract_location(query)
        if location:
            result["location"] = location

    return result

def make_decision(parsed_input, top_chunks, source_name="Policy Document A"):
    formatted_clauses = []
    for chunk_text, score in top_chunks:
        formatted_clauses.append({
            "text": chunk_text.strip(),
            "similarity": round(score * 100, 2) if score is not None else None,
            "source": source_name
        })

    clause_text_block = "\n\n".join(
        f"Clause from {c['source']} (Match: {c['similarity']}%):\n{c['text']}"
        for c in formatted_clauses
    )

    try:
        response = groq_client.chat.completions.create(
            model="llama3-70b-8192",
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert insurance claims decision engine. Read the user input and policy clauses to make an informed decision."
                },
                {
                    "role": "user",
                    "content": f"""
User Information:
{json.dumps(parsed_input, indent=2)}

Policy Clauses (with match % and sources):
{clause_text_block}

Instructions:
Analyze the input and determine whether the claim should be approved or rejected.
Explain your decision.
Return only valid JSON in the format:
{{
  "decision": "Approved" or "Rejected",
  "justification": "...",
  "matched_clauses": [
    {{
      "text": "...",
      "similarity": float,
      "source": "..."
    }},
    ...
  ]
}}
"""}
            ]
        )
        raw = response.choices[0].message.content.strip()
        result_json = extract_json_from_text(raw)
        if not result_json:
            raise ValueError("Failed to parse JSON from decision LLM response")

        result_json["matched_clauses"] = formatted_clauses
        return result_json

    except Exception as e:
        print(f"[ERROR] Decision LLM failed: {e}")
        return {
            "decision": "Rejected",
            "justification": f"LLM processing error: {str(e)}",
            "matched_clauses": formatted_clauses
        }

def process_claim(query, top_chunks, summary="", document_id=None, filename=None):
    """
    Master function to produce the full output JSON with consistent structure.

    Parameters:
        - query (str): user input text
        - top_chunks (list): list of tuples (chunk_text, similarity_score)
        - summary (str): optional summary string
        - document_id (str): optional document identifier
        - filename (str): optional filename string

    Returns:
        dict: structured response matching your original format
    """
    parsed_input = hybrid_parse_input(query)
    decision_response = make_decision(parsed_input, top_chunks)

    return {
        "id": str(uuid.uuid4()),
        "summary": summary,
        "input": parsed_input,
        "decision": decision_response,
        "document_id": document_id,
        "filename": filename,
        "created_at": datetime.utcnow().isoformat() + "Z"
    }
