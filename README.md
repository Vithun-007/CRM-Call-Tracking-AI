# CRM Call Tracking & AI Intelligence

A full-stack CRM application for managing customer leads, recording call interactions, and generating AI-powered call summaries and structured customer insights.

## 1. Features

### Lead Management
- Create, view, update, and delete leads.
- Search and manage customer information.
- Track lead status, priority, and follow-up details.

### Call Tracking
- Select an existing lead and record a customer interaction.
- Enter original shorthand call notes.
- Generate a professional AI summary.
- Review and apply the generated summary.
- Preserve original notes separately from edited notes.
- Save call interactions and view call history.

### AI Call Intelligence
The application uses a LangGraph workflow with the Groq-hosted `openai/gpt-oss-120b` model.

The workflow contains three nodes:

1. `analyze_call` – extracts customer intent, requirements, interests, action items, and a follow-up recommendation.
2. `generate_summary` – generates a professional summary using the original notes and structured analysis.
3. `validate_result` – checks whether the generated summary is empty or too short.

LangGraph manages the execution flow and conditional retry of summary generation when validation fails.

The AI analysis is exposed through the `/api/v1/ai/analyze` endpoint.

### Dashboard and Call History
- Dashboard statistics and recent activity.
- Searchable call history.
- Lead and date filters.
- Call interaction details.

## 2. Technology Stack

| Layer | Technologies |
|---|---|
| Frontend | React, TypeScript, Vite |
| Styling | Tailwind CSS |
| API communication | Axios |
| Backend | Python, FastAPI |
| Database | SQLite |
| ORM | SQLAlchemy |
| Validation | Pydantic |
| LLM integration | LangChain, ChatGroq |
| AI workflow | LangGraph |
| LLM provider | Groq |
| Model | openai/gpt-oss-120b |
| Testing | Pytest, HTTPX |

## 3. Application Architecture

```text
React + TypeScript Frontend
          |
          v
      Axios Client
          |
          v
      FastAPI Backend
          |
     +----+-----+
     |          |
     v          v
 Lead APIs   Call APIs
     |          |
     v          v
 Lead Service  Call Service

          AI API
            |
            v
        AI Service
            |
            v
       LangGraph Agent
            |
     +------+------+
     |      |      |
     v      v      v
  Analyze Summary Validate
     |      |      |
     +------+------+
            |
            v
       Groq Model
   openai/gpt-oss-120b

Database operations use SQLAlchemy and SQLite.
```

## 4. Project Structure

```text
Call_Tracking_Module/
|
|-- backend/
|   |-- app/
|   |   |-- core/
|   |   |-- db/
|   |   |-- models/
|   |   |-- routers/
|   |   |-- schemas/
|   |   |-- services/
|   |   |   |-- ai_service.py
|   |   |   |-- call_intelligence_agent.py
|   |   |   |-- call_service.py
|   |   |   |-- lead_service.py
|   |   |-- main.py
|   |-- data/
|   |-- tests/
|   |-- .env.example
|   |-- requirements.txt
|
|-- frontend/
|   |-- src/
|   |   |-- components/
|   |   |-- pages/
|   |   |-- services/
|   |   |-- types/
|   |-- package.json
|
|-- .gitignore
|-- README.md
```

## 5. Prerequisites

Install the following:

- Python 3.11 or later
- Node.js and npm
- Git
- A Groq API key

## 6. Backend Setup

Open PowerShell and navigate to the project backend:

```powershell
cd D:\Call_Tracking_Module\backend
```

Create a virtual environment:

```powershell
python -m venv .venv
```

Activate it:

```powershell
.\.venv\Scripts\Activate.ps1
```

Install dependencies:

```powershell
python -m pip install --upgrade pip
pip install -r requirements.txt
```

## 7. Environment Configuration

Create the backend environment file:

```powershell
Copy-Item .env.example .env
```

Open `backend/.env` and configure your Groq API key:

```env
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=openai/gpt-oss-120b
```

Do not commit your actual `.env` file or expose your API key.

## 8. Run the Backend

From the backend directory, activate the virtual environment and run:

```powershell
uvicorn app.main:app --reload
```

Backend URL:

```text
http://127.0.0.1:8000
```

Interactive API documentation:

```text
http://127.0.0.1:8000/docs
```

The SQLite database and required tables are initialized when the backend starts.

## 9. Frontend Setup

Open a second PowerShell terminal:

```powershell
cd D:\Call_Tracking_Module\frontend
```

Install frontend dependencies:

```powershell
npm install
```

Start the frontend development server:

```powershell
npm run dev
```

Open the local Vite URL shown in the terminal, normally:

```text
http://localhost:5173
```

The frontend uses the backend API at:

```text
http://127.0.0.1:8000/api/v1
```

You can override this using the `VITE_API_BASE_URL` environment variable if required.

## 10. Demonstrating the AI Agent

1. Start both the backend and frontend.
2. Open the CRM application.
3. Navigate to Call Tracking.
4. Select a lead and enter call notes in the Notes textbox.
5. Click the AI summary generation button.
6. The frontend sends the notes to the backend AI endpoint.
7. FastAPI invokes the AI service, which executes the LangGraph workflow.
8. The Groq model generates structured call analysis and a professional summary.
9. Review the summary and structured insights displayed in the application.
10. Apply the summary if appropriate and save the call interaction.

Example notes:

```text
Customer interested in CRM solution.
Asked about pricing and product demo.
Our team agreed to share the proposal by Friday.
Customer requested a technical discussion next week.
```

The agent returns:
- Customer intent
- Requirements
- Customer interests
- Explicit action items
- Follow-up recommendation
- Professional call summary

The agent distinguishes confirmed commitments from customer requests and AI-suggested next steps.

## 11. API Reference

Base URL:

```text
http://127.0.0.1:8000/api/v1
```

### Lead Management

| Method | Endpoint | Description |
|---|---|---|
| POST | `/leads` | Create a lead |
| GET | `/leads` | Retrieve leads |
| GET | `/leads/{lead_id}` | Retrieve one lead |
| PUT | `/leads/{lead_id}` | Update a lead |
| DELETE | `/leads/{lead_id}` | Delete a lead |

### Call Tracking

| Method | Endpoint | Description |
|---|---|---|
| POST | `/leads/{lead_id}/calls` | Create a call interaction |
| GET | `/leads/{lead_id}/calls` | Retrieve calls for a lead |
| GET | `/calls` | Retrieve call history |
| GET | `/calls/{call_id}` | Retrieve one call |
| PUT | `/calls/{call_id}` | Update a call |
| DELETE | `/calls/{call_id}` | Delete a call |

### AI Call Intelligence

| Method | Endpoint | Description |
|---|---|---|
| POST | `/ai/analyze` | Generate structured call intelligence and summary |
| POST | `/ai/summarize` | Generate a professional call summary |

Example request:

```json
{
  "notes": "Customer interested in CRM demo and asked about pricing."
}
```

### Dashboard and Health

| Method | Endpoint | Description |
|---|---|---|
| GET | `/dashboard/summary` | Retrieve dashboard statistics |
| GET | `/` | Backend root endpoint |
| GET | `/health` | Health check |

## 12. Testing

Run backend tests from the backend directory:

```powershell
pytest -v
```

Run frontend linting:

```powershell
cd ..\frontend
npm run lint
```

Build the frontend:

```powershell
npm run build
```

## 13. Database

The application uses SQLite with SQLAlchemy ORM.

The database file is created automatically under:

```text
backend/data/crm_database.db
```

The main tables are:

- `leads`
- `call_interactions`

A lead can have multiple associated call interactions through a foreign-key relationship.

## 14. Security and Configuration

- Groq API credentials are read from environment variables.
- Local `.env` files are excluded from version control.
- Pydantic validates API request data.
- SQLite foreign-key enforcement is enabled.
- The project is intended as a technical assignment demonstration, not a production deployment.

## 15. License

Developed as a technical assignment. No separate open-source license has been specified.
