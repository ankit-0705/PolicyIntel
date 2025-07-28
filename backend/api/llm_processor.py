import json
import re
import spacy
from groq import Groq
from .utils.env_loader import GROQ_API_KEY

nlp = spacy.load("en_core_web_sm")
groq_client = Groq(api_key=GROQ_API_KEY)

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
\"\"\"{query}\"\"\"
"""}
            ]
        )
        raw = response.choices[0].message.content.strip()
        json_data = json.loads(raw[raw.find("{"):raw.rfind("}")+1])
        result.update(json_data)
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
        doc = nlp(query)
        for ent in doc.ents:
            if ent.label_ == "GPE":
                result["location"] = ent.text
                break

    return result


def make_decision(parsed_input, top_chunks, source_name="Policy Document A"):
    # Format matched clauses for LLM and UI
    formatted_clauses = []
    for chunk_text, score in top_chunks:
        formatted_clauses.append({
            "text": chunk_text.strip(),
            "similarity": round(score * 100, 2),  # as percentage
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
        result_json = json.loads(raw[raw.find("{"):raw.rfind("}")+1])

        # Attach raw similarity/source metadata back
        result_json["matched_clauses"] = formatted_clauses
        return result_json

    except Exception as e:
        print(f"[ERROR] Decision LLM failed: {e}")
        return {
            "decision": "Rejected",
            "justification": f"LLM processing error: {str(e)}",
            "matched_clauses": formatted_clauses
        }
