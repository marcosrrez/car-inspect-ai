# Cloud Sync Setup (optional)

The app works fully **local-first** with no setup — data lives in the browser.
To sync the same garage across devices, connect a free Supabase project. Until
these environment variables are set, the "Sync" button simply doesn't appear.

## 1. Create a Supabase project
- Go to https://supabase.com, create a (free) project.
- In **Project Settings → API**, copy:
  - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
  - **anon / public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  (The anon key is safe to expose in the browser; access is protected by the
  Row Level Security policies below.)

## 2. Create the table
- Open **SQL Editor**, paste the contents of [`schema.sql`](./schema.sql), and Run.
- This creates a `garages` table (one JSON row per user) with RLS so each user
  can only read/write their own row.

## 3. Turn on sign-in methods
- **Authentication → Providers → Email**: enable it (magic-link works out of the box).
- (Optional) **Google**: enable the Google provider and add your Google OAuth
  client ID/secret. Skip this if you only want email sign-in.
- **Authentication → URL Configuration**: add your site URL
  (e.g. `https://car-inspect-ai-pi.vercel.app`) to **Site URL** and **Redirect URLs**.

## 4. Add the env vars to Vercel
- Vercel → project **car-inspect-ai** → **Settings → Environment Variables**, add
  both keys for Production (and Preview), then redeploy.
- Or hand the Project URL + anon key to the assistant and it will set them via the
  Vercel API and trigger a redeploy.

Once deployed with those vars, a **Sync** button appears in the header. Sign in on
each device and your garage (vehicles, service history, reports, pending items)
stays in sync. Last write wins; on sign-in the cloud copy is loaded if present,
otherwise the current device's data seeds the cloud.
