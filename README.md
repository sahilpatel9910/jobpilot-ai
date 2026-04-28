# JobPilot AI

Resume-worthy MVP foundation for an AI-powered job hunt agent system.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

The app works in mock AI mode by default, so no LLM key is required for the UI and workflow.

## Environment variables

Create `.env.local` for local development:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Optional LLM providers. Server-side only.
# Use LLM_PROVIDER=auto, anthropic, openai, groq, or ollama.
LLM_PROVIDER=auto
ANTHROPIC_API_KEY=
ANTHROPIC_MODEL=claude-sonnet-4-20250514
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini
GROQ_API_KEY=
GROQ_MODEL=llama-3.1-70b-versatile
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.1
```

If no LLM key/base URL is configured, `POST /api/analyse-job` returns deterministic mock analysis. In `auto` mode, configured providers are tried in this order: Anthropic, OpenAI, Groq, Ollama.

## Input validation

`POST /api/analyse-job` validates and sanitises input server-side before any AI workflow runs. The validation layer removes pasted HTML/script tags, rejects short or low-quality resume/job description text, detects likely swapped fields, scores prompt-injection risk, and enforces maximum input lengths. Invalid requests return HTTP 400 and do not call the LLM or save an application.

## Cover letter workflow

`POST /api/analyse-job` saves the resume/JD match analysis first without generating the final cover letter. Open the saved job detail page, review the gaps, optionally add clarification context, then use `POST /api/generate-cover-letter` from the UI to generate or regenerate the cover letter. The cover letter context, latest revision instruction, generated timestamp, and status are stored on the application record.

## Supabase

Run `supabase/schema.sql` in the Supabase SQL editor. The schema uses Supabase Auth user ownership and RLS policies so each logged-in user only sees their own applications, resume profile, status history, and agent traces.

The server still uses `SUPABASE_SERVICE_ROLE_KEY` inside API routes for trusted writes, but every route authenticates the Supabase user first and scopes reads/writes by `user_id`. Do not expose the service role key in frontend code.

Auth pages:
- `/login`
- `/signup`

For a fresh MVP reset, delete old shared rows before enforcing `user_id not null`. The project database was cleared during the auth migration.
