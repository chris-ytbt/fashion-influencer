This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

# Fashion Influencer Image Generation

This is a Next.js project bootstrapped with create-next-app.

## Getting Started

First, run the development servers:

Frontend (Next.js):

```
npm run dev
```

Backend (FastAPI):

```
cd backend
uvicorn main:app --reload
```

Open http://localhost:3000 with your browser to see the result.

## Environment & Secrets

- Backend requires GEMINI_API_KEY to be set. Do NOT commit real keys.
- Supabase auth requires NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.
- Example files are provided:
  - backend/.env.example
  - .env.local.example
- Create actual env files and populate values:
  - backend/.env
  - .env.local

### Supabase Setup (Google SSO + Profiles)
1. Create a free Supabase project (https://supabase.com/):
   - Choose region near you.
2. In Project Settings → API, copy:
   - Project URL → set as NEXT_PUBLIC_SUPABASE_URL
   - Publishable key → set as NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
3. In Authentication → Providers:
   - Google: Toggle Enabled, set Client ID/Secret (or use Quickstart), add Authorized redirect URI: http://localhost:3000/auth/callback (and your deployed domain)
   - Email: Toggle Enabled to support email/password sign in
4. Create the profiles table/trigger (done in your Supabase SQL editor):
   - See issue instructions. After this, each new user will have a row in public.profiles with email, full_name, avatar_url.
5. (Optional) Restrict access to specific emails:
   - Create a table allowlist(email text primary key)
   - Add a Postgres function or use RLS policies on auth.users to check email in allowlist.
   - We can help generate exact SQL when you share the test emails.

### Local Run
- Install deps after pulling changes: npm install
- Create .env.local at the project root (same folder as package.json) with the two Supabase vars:
  - NEXT_PUBLIC_SUPABASE_URL=...
  - NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
- Restart dev server after editing env: Ctrl+C then `npm run dev`
- Visit http://localhost:3000 → Landing
- Click Log In → enter email/password or Continue with Google → on success you will be redirected to /app
- Direct access to /app and /settings requires login (middleware-protected)

### Troubleshooting
- Error "@supabase/ssr: Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY": 
  - Ensure .env.local exists at the repository root (not under src/)
  - Ensure variables start with NEXT_PUBLIC_ so they are exposed to the browser
  - Restart the dev server after changes

## Deploy on Vercel

The application is ready to deploy entirely on Vercel as a single Next.js application.

Steps:
1. Connect your GitHub repository to Vercel
2. In your Vercel Project Settings → Environment Variables, set:
   - `GEMINI_API_KEY` = your Google Gemini API key
3. Deploy - Vercel will automatically build and deploy your Next.js app
4. The deployed app will handle both frontend and API routes on the same domain

## Benefits of Single Deployment

- **Simplified Architecture**: No separate backend deployment needed
- **No CORS Issues**: Frontend and API on the same domain
- **Easier Environment Management**: Single set of environment variables
- **Better Performance**: Reduced network latency between frontend and API
- **Cost Effective**: Single deployment reduces hosting costs

## Learn More

- Next.js Documentation: https://nextjs.org/docs
- Vercel Deployment: https://nextjs.org/docs/app/building-your-application/deploying