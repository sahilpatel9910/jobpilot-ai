# JobPilot AI

Resume-worthy MVP foundation for an AI-powered job hunt agent system.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

The app works in mock AI mode by default, so no LLM key is required for the UI and workflow.

## Product flow

JobPilot uses a browse-first auth flow:

- Anyone can view the overview page.
- Anyone can open `/jobs/new` and inspect/fill the analysis form.
- Login is required when the user tries to run and save an analysis.
- `/dashboard` and saved job detail pages are private.
- Each logged-in user sees only their own resume profile, applications, notes, cover letters, status history, and agent traces.

## Environment variables

Create `.env.local` for local development. Start from `.env.example`:

```bash
cp .env.example .env.local
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

For local or production testing:

1. Run `supabase/schema.sql`.
2. Create an account through `/signup`.
3. Run an analysis from `/jobs/new`.
4. Confirm the saved job appears in `/dashboard`.
5. Log out and sign in as a second user to confirm the dashboard is empty.

For a fresh MVP reset, delete old shared rows before enforcing `user_id not null`. The project database was cleared during the auth migration.

## Validation tests

```bash
npm run test:validation
npm run typecheck
npm run build
```

The validation runner checks accepted real-world job descriptions across industries, swapped resume/JD fields, prompt injection, random text, HTML/script cleanup, long input, and short low-quality input.

## Production readiness

After deploying `main` to Vercel:

1. Add the environment variables from `.env.example` in Vercel Project Settings.
2. Run the latest `supabase/schema.sql` in Supabase SQL Editor.
3. Open `/api/readiness` on the deployed URL.
4. Confirm all required checks pass.
5. Create a test account, run one analysis, generate a cover letter, then sign in as a second user and confirm the dashboard is empty.

`/api/readiness` is safe to expose. It reports only configuration status, AI mode, and table reachability. It never returns API keys, service role keys, prompts, resumes, job descriptions, or user data.
