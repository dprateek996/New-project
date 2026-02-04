# Issue — Premium Issue Generator MVP

A dark‑mode publishing studio that turns URLs into curated PDF Issues.

## Stack
- Next.js App Router
- Supabase Auth + Postgres + Storage
- Upstash QStash
- Render worker for Puppeteer
- Resend email
- PostHog analytics

## Setup
1. Install dependencies (requires network):
   - `npm install`
2. Copy `.env.example` to `.env.local` and fill values.
3. Apply Supabase schema:
   - Run the SQL in `supabase/schema.sql` in your Supabase SQL editor.
4. Create a Supabase storage bucket named `issues`.
5. Deploy the worker from `worker/` to Render.
6. Configure QStash to publish to the worker URL with the `x-worker-secret` header.

## Scripts
- `npm run dev`
- `npm run build`
- `npm run start`

## Notes
- Public share pages use signed URLs generated server‑side.
- The worker handles parsing, PDF generation, storage, and credit deduction.
