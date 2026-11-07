
---

# Career Intelligence Assistant

An AI-powered full-stack application that bridges the gap between job seekers and employers by analyzing resumes against job descriptions.

## Overview
The job market is highly competitive, and candidates often struggle to understand why they are rejected or what specific skills they lack for a particular role. Conversely, recruiters spend countless hours manually screening resumes.

I chose to build the **Career Intelligence Assistant** because it solves a tangible, real-world problem using modern GenAI. Instead of a standard Q&A bot, this application leverages **RAG (Retrieval-Augmented Generation)** to provide a dual-dashboard experience:
*   **For Candidates:** Upload PDF resumes, browse jobs, and receive an AI-driven Match Score, a breakdown of missing skills, and tailored interview questions. They can also chat with an AI assistant to ask, *"How can I improve my fit for this role?"*
*   **For Employers:** Post detailed job descriptions, manage listings, and define dynamic metadata (Mode, Type, Experience Level) using a fully manageable master data system.

## Quick Setup

### Prerequisites
*   Python 3.12+
*   Node.js 20+ (We used v24.19.0 for development)
*   PostgreSQL (We used [Neon.tech](https://neon.tech) for serverless Postgres + pgvector)

### 1. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Create a `.env` file in the `backend` directory:
```env
APP_NAME="Career Intelligence RAG"
DATABASE_URL="postgresql+asyncpg://user:password@ep-xxx.neon.tech/neondb?ssl=require"
GROQ_API_KEY="your_groq_api_key"
GEMINI_API_KEY="your_gemini_api_key"
JWT_SECRET="super_secret_key"
```

Run the backend:
```bash
uvicorn app.main:app --reload
```
*(The application automatically creates tables, seeds default roles, and enables the pgvector extension on startup. You can access the Swagger UI at `http://localhost:8000/docs`)*

### 2. Frontend Setup
```bash
cd frontend/vite-version
npm install
```

Create a `.env` file in `frontend/vite-version`:
```env
VITE_API_URL=http://127.0.0.1:8000/api/v1
```

Run the frontend:
```bash
npm run dev
```

---

## Architecture Overview

```text
[Frontend: React + Vite + Shadcn UI]
        |
        | (REST APIs with JWT Auth)
        v
[Backend: FastAPI + SQLAlchemy Async]
        |
        |---> [LLM: Groq (openai/gpt-oss-20b) / Gemini Fallback]
        |---> [Embeddings: Gemini Embedding API]
        v
[Database: PostgreSQL + pgvector (Neon)]
```

---

## RAG / LLM Approach & Decisions

*   **LLM Choice:** **Groq (`openai/gpt-oss-20b`)** is the primary LLM for analysis and chat due to its sub-second latency and strict JSON mode support. **Gemini 2.5 Flash** is used as a fallback.
*   **Embedding Model:** **Gemini `gemini-embedding-001`**. It provides 768-dimensional vectors, balancing quality and storage efficiency.
*   **Vector Database:** **Neon (PostgreSQL) + pgvector**. Chosen over dedicated vector DBs (like Pinecone) to keep the architecture simple, leveraging a single database for both relational data and vector data.
*   **Chunking Strategy:** Simple character-based chunking (500 characters with 50 overlap). Resumes are also stored with their first 3000 characters as an "Overall Summary" for holistic context.
*   **Prompt Engineering:**
    *   **Structured Output:** Injected Pydantic JSON schemas directly into the prompt for consistent analysis.
    *   **Deterministic Scoring:** Set `temperature=0.0` for the analysis phase and implemented a strict Scoring Rubric in the prompt to ensure the Match Score remains consistent across multiple runs.
    *   **Context Enrichment:** Chat API is provided with both RAG chunks and the Job Details (Mode, Type, Level) to answer questions accurately.
*   **Guardrails:** Pydantic validation ensures the LLM returns the exact JSON structure. The frontend uses `react-markdown` to safely render AI outputs. Prompt rules restrict the use of HTML tags inside tables.
*   **Observability:** Standard Python `print` statements and FastAPI logs are used for debugging LLM latency and errors. (Future improvement: integrate LangSmith).

---

## Key Technical Decisions

**1. Reusable CRUD Pattern & Dynamic Routing (The 10-Minute Rule)**
To accelerate development within the 2-day constraint, I implemented a generic `BaseRepository` and a dynamic route handler in FastAPI.
*   **The Problem:** In a typical enterprise app, you often need dozens of master tables (e.g., Job Modes, Job Types, Experience Levels, Departments). Writing separate CRUD endpoints for each table is repetitive, time-consuming, and bloated.
*   **The Solution:** I created a `TABLE_MAPPING` dictionary and a generic repository that handles database operations dynamically based on the URL path. Instead of creating hardcoded routes, the API uses a dynamic URL pattern: `/api/v1/masters/{table_name}`.
*   **The Impact:** This architectural choice saved hours of boilerplate coding. Once a SQLAlchemy model is defined, adding it to the `TABLE_MAPPING` instantly provides fully functional `GET`, `POST`, `PUT`, and `DELETE` endpoints with built-in pagination and filtering. Adding a new master table now takes less than 10 minutes, keeping the codebase exceptionally clean and highly scalable.

**2. Direct `asyncpg` for Vector Operations**
Encountered a complex ORM compatibility issue between SQLAlchemy and `asyncpg` when saving `pgvector` embeddings. Solved it by bypassing the ORM for vector inserts/updates and using raw `asyncpg` connections with explicit SQL casts (`$1::vector`). This also improved insert performance.

**3. Data Isolation & Security**
Implemented JWT-based authentication with strict row-level filtering (`created_by`). Candidates can only access their own resumes, while Employers can only manage their own job postings. This ensures a secure multi-tenant architecture.

**4. Markdown Rendering**
AI chat responses are rendered using `react-markdown` with `remark-gfm` to support tables, bold text, and bullet points seamlessly. This ensures a rich, readable user experience without exposing the app to XSS risks.

---

## What would be required to productionize & scale?

*   **Deployment:**
    *   **Backend:** Containerize with Docker, deploy to AWS ECS or Google Cloud Run.
    *   **Frontend:** Deploy to Vercel or AWS Amplify.
    *   **Database:** Upgrade Neon to a paid tier with high availability and read replicas.
*   **Scalability:**
    *   Implement a task queue (Celery + Redis) for asynchronous resume parsing and embedding generation.
    *   Cache frequently accessed master data.
    *   Introduce rate limiting on API endpoints to prevent abuse of LLM quotas.
*   **Observability:**
    *   Integrate **LangSmith** or **Arize** for LLM tracing (latency, token usage, cost).
    *   Set up Prometheus + Grafana for API metrics.
    *   Use Sentry for error tracking.
*   **Security:** Add file size limits, antivirus scanning for uploaded PDFs, and implement refresh tokens for JWT.

---

## Engineering Standards

*   **Followed:**
    *   Clean separation of concerns (Routers -> Services -> Repositories).
    *   Type safety using Pydantic (Backend) and TypeScript (Frontend).
    *   Environment variable management (`.env` files).
    *   Responsive UI with Shadcn UI components.
*   **Skipped (Due to time):**
    *   Comprehensive unit and integration tests (Pytest).
    *   Alembic migrations (Used SQLAlchemy's `create_all` for speed).
    *   CI/CD pipelines (GitHub Actions).

---

## How I used AI Tools
I used **Cursor / ChatGPT** extensively as a coding pair-programmer.
*   **Do's:** Used AI to generate boilerplate code (CRUD, Pydantic schemas), debug complex issues (like the `asyncpg` vector bug), and design UI components.
*   **Don'ts:** I did not trust AI for architectural decisions (like choosing the DB schema or security flows). I manually verified all code, especially around data isolation and JWT handling. I also wrote the prompts and README based on my own understanding.

## What I'd do differently with more time
1.  **Testing:** Write extensive tests for the RAG pipeline to ensure retrieval accuracy.
2.  **PDF Parsing:** Use a more robust PDF parser (like `unstructured.io`) to handle complex resume formats better.
3.  **Deterministic Post-Processing:** Add a Python logic layer to calculate the Match Score instead of relying on the LLM's output, ensuring 100% consistency.
4.  **Streaming Responses:** Implement Server-Sent Events (SSE) for the chat to stream LLM responses token-by-token.

---

## Screenshots

### 1. Login & Registration
![Login / Register](docs/screenshots/01_auth_login.png)
![Login / Register](docs/screenshots/01_auth_register.png)

### 2. Employer Portal (Dynamic Job Management & Masters)
![Employer Dashboard](docs/screenshots/02_employer_dashboard.png)
![Employer Dashboard](docs/screenshots/02_employer_jobs.png)
![Employer Dashboard](docs/screenshots/master_crud.png)
![Employer Dashboard](docs/screenshots/02_employer_masters.png)

### 3. Candidate Dashboard (Resume Upload)
![Candidate Dashboard](docs/screenshots/03_candidate_dashboard.png)
![Candidate Dashboard](docs/screenshots/03_candidate_resumes.png)

### 4. Match Analysis (Score & Skills)
![Match Analysis](docs/screenshots/04_jobs_list.png)
![Match Analysis](docs/screenshots/04_match_analysis.png)
![Match Analysis](docs/screenshots/04_match_analysis2.png)

### 5. Conversational Career Assistant (AI Chat)
![AI Chat](docs/screenshots/05_ai_chat.png)
![AI Chat](docs/screenshots/05_ai_chat2.png)
![AI Chat](docs/screenshots/05_ai_chat3.png)

---
**Developed by:** Punniyamoorthy B