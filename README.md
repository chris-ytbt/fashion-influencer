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
- Example files are provided:
  - backend/.env.example
  - .env.local.example
- Create actual env files and populate values:
  - backend/.env
  - .env.local

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