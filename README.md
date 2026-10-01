# ScopeAI — AI Client Discovery & Project Planning

> Turn unstructured client briefs into validated project scopes using a stateful LangGraph agent with human-in-the-loop clarification.

**Stack**: Next.js · TypeScript · Tailwind · shadcn/ui · FastAPI · LangGraph · Groq · Supabase  
**Cost**: $0 — all free tiers

---

## Project Structure

```
scope-ai/
├── frontend/          # Next.js App Router + TypeScript + shadcn/ui
├── backend/           # FastAPI + LangGraph agent
│   └── app/
│       ├── agents/    # LangGraph graph, state, nodes, tools
│       ├── api/       # FastAPI routes
│       ├── models/    # Pydantic schemas
│       └── services/  # Supabase client, Groq LLM
├── supabase/
│   └── migrations/    # 001_initial_schema.sql
└── docker-compose.yml
```

---

## Setup

### 1. Supabase
1. Go to [supabase.com](https://supabase.com) → create a free project
2. In SQL Editor, paste and run `supabase/migrations/001_initial_schema.sql`
3. Copy your **Project URL** and **anon key** (Settings → API)
4. Copy your **service_role key** (for the backend)

### 2. Groq API Key
1. Go to [console.groq.com](https://console.groq.com) → create free account
2. API Keys → Create new key → copy it

### 3. Backend
```bash
cd backend
python -m venv venv
.\venv\Scripts\activate        # Windows
# source venv/bin/activate     # Mac/Linux

pip install -r requirements.txt

# Copy and fill in your keys
copy .env.example .env
# Edit .env with your Supabase and Groq credentials

uvicorn app.main:app --reload --port 8000
```

### 4. Frontend
```bash
cd frontend

# Copy and fill in your keys
copy .env.local.example .env.local
# Edit .env.local with your Supabase URL and anon key

npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## LangGraph Agent Flow

```
START
  → analyze_brief          (extract problem, users, goals)
  → extract_requirements   (functional + non-functional)
  → detect_missing_info    ──── needs_clarification? ────┐
                                                          │ YES
                           ←─── generate_questions ───────┘
                           ←─── HUMAN_INTERRUPT (frontend shows Q&A)
                           ←─── receive_answers
                           ←─── detect_missing_info (loop, max 2 rounds)
  → design_solution        (architecture + components)
  → analyze_risks          (risk register with mitigations)
  → create_roadmap         (phased milestones + tasks)
  → assemble_scope
END
```

---

## Deployment (Free)

| Service | Provider | Cost |
|---|---|---|
| Frontend | Vercel Hobby | $0 |
| Backend | Railway (500hrs/mo free) | $0 |
| Database + Auth | Supabase Free | $0 |
| LLM | Groq Free Tier | $0 |

---

## Environment Variables

**`backend/.env`**
```
GROQ_API_KEY=your_key
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_key
FRONTEND_URL=http://localhost:3000
```

**`frontend/.env.local`**
```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```
