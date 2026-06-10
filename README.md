# Universes of RPG

A social platform for RPG creators — share character sheets, coded profile themes, stories, and marketplace creations.

## Stack

- **Next.js 16** + TypeScript + Tailwind CSS
- **Supabase** — auth, PostgreSQL, storage, realtime
- **Monaco Editor** — CodePen-style creation forge
- **Stripe** (planned) — creator marketplace payouts

## Getting started

```bash
npm install
cp .env.local.example .env.local
# Add your Supabase URL and publishable key to .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Supabase setup

1. Create a project at [supabase.com](https://supabase.com)
2. Run `supabase/migrations/001_initial_schema.sql` in the SQL Editor
3. Copy your project URL and publishable key into `.env.local`

## MVP features

- Social feed (mock data + Supabase-ready schema)
- RPG profile pages
- Code editor with live preview
- Marketplace browse UI
- Auth (signup / login via Supabase)
- Like button (requires login)

## License

Private — all rights reserved.
