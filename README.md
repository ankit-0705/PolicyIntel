🧠 LLM-Powered Policy Query System
A system that leverages Large Language Models (LLMs) to intelligently process natural language queries and retrieve relevant clauses from large, unstructured documents such as insurance policies, contracts, and emails. Designed to enhance decision-making in domains like insurance claim processing and legal compliance.

🚀 Project Overview
This system allows users to input natural language queries like:

“46-year-old male, knee surgery in Pune, 3-month-old insurance policy”

It will then:

Parse the query to extract structured information (age, procedure, location, duration, etc.).

Semantically search large documents (PDFs, Word files, emails) for relevant clauses.

Apply logical reasoning using the retrieved information.

Generate a structured JSON response with:

✅ Decision (e.g., approved/rejected)

💰 Amount (if applicable)

📄 Justification (including clause mapping)


🧱 Project Structure
.
├── backend/                # Django/Flask/FastAPI backend (API, logic, DB)
│   ├── api/                # Query parsing, retrieval, and reasoning logic
│   ├── insurance_backend/  # App configuration
│   ├── db.sqlite3          # Sample DB (if applicable)
│   └── manage.py
│
├── frontend/               # Vite + React frontend for user interface
│   ├── public/
│   ├── src/                # React components, pages
│   ├── index.html
│   └── vite.config.js
│
├── .gitignore
├── README.md               # ← You are here
└── ...

⚙️ Features
🔍 Semantic Document Search – Uses embeddings and LLMs to understand document content beyond keywords.

🤖 Query Parsing – Extracts structured info from vague or conversational queries.

📚 Multi-format Document Support – PDFs, DOCX, and email text.

🧠 Explainable Decisions – Returns mapped clauses with each decision.

💬 Natural Language Input – No special format needed; just type your query.

📦 Modular Design – Easy to extend with more document types, logic layers, or domain rules.

🛠️ Tech Stack
Layer	Tech
Backend	Python,Django
Frontend	React, Vite
LLM Inference	Groq
Database	SQLite 
Document Parsing	PyMuPDF, python-docx, email-parser

🧪 Sample Query
"46M, knee surgery, Pune, 3-month policy"

🔁 Sample Response
{
  "decision": "approved",
  "amount": 150000,
  "justification": {
    "clauses_used": [
      {
        "clause": "Knee surgeries are covered for insured individuals after 3 months of continuous coverage.",
        "source": "policy_doc_2023.pdf",
        "page": 12
      }
    ],
    "reasoning": "The individual qualifies based on age, surgery type, location irrelevance, and policy age."
  }
}

🧩 Use Cases
🏥 Insurance Claim Processing

⚖️ Legal Document Analysis

📄 Contract Compliance Verification

🧑‍💼 HR Policy Query Systems

📦 Getting Started
Backend
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python manage.py runserver

Frontend
cd frontend
npm install
npm run dev

📁 Documents Input
Supported formats:

.pdf

.docx

.eml or raw email text

Drop them into a designated folder or upload through the UI.

🔐 Security Note
Make sure to secure your .env file – it may contain API keys for LLMs or embedding services.

📜 License
MIT License. See LICENSE file for details.

🙌 Contributions
Open to contributions! Feel free to:

Improve parsing accuracy

Add support for new document formats

Enhance the frontend interface

Connect to a production-ready DB

  
