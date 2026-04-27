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
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini
GROQ_API_KEY=
GROQ_MODEL=llama-3.1-70b-versatile
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.1
```

If no LLM key/base URL is configured, `POST /api/analyse-job` returns deterministic mock analysis.

## Supabase

Run `supabase/schema.sql` in the Supabase SQL editor. The API route uses `SUPABASE_SERVICE_ROLE_KEY` on the server to save analyses. Do not expose the service role key in frontend code.
