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

## Deploy on Netlify

Repo: [github.com/LinneaNatAlex/universesofrpg](https://github.com/LinneaNatAlex/universesofrpg)

### 1. Connect the site

1. Go to [app.netlify.com](https://app.netlify.com) → **Add new site** → **Import an existing project**
2. Choose **GitHub** → select `universesofrpg`
3. Build settings (auto-detected from `netlify.toml`):
   - Build command: `npm run build`
   - Publish directory: `.next`
4. Click **Deploy**

### 2. Environment variables

In **Site configuration → Environment variables**, add:

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://qfataluxujybeiksfjjg.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | your `sb_publishable_...` key |

Then trigger **Deploys → Trigger deploy → Clear cache and deploy**.

### 3. Supabase auth URLs (required for login/signup)

Set on **Netlify → Environment variables**:

- `NEXT_PUBLIC_SITE_URL` = `https://YOUR-SITE.netlify.app` (no trailing slash)

In [Supabase Dashboard](https://supabase.com/dashboard) → **Authentication → URL Configuration**:

- **Site URL:** `https://YOUR-SITE.netlify.app` (must **not** be `http://localhost:3000` in production — otherwise confirm-email links open `localhost` on phones and fail)
- **Redirect URLs:** add:
  - `https://YOUR-SITE.netlify.app/auth/callback`
  - `http://localhost:3000/auth/callback` (for local dev only)

Replace `YOUR-SITE` with your Netlify subdomain (e.g. `universofrpg.netlify.app`).

After changing Supabase URLs, ask users who already received a broken link to use **Sign up** again or resend confirmation from Supabase → Authentication → Users.

### 4. Database

Run `supabase/migrations/001_initial_schema.sql` in Supabase SQL Editor if you have not already.

## License

Private — all rights reserved.
