# DECODE - Vercel Deployment Guide

This document replaces the old GitHub Pages deployment path. Decode is now a full-stack Next.js application with Auth.js route handlers, Prisma, and future API endpoints, so static export and GitHub Pages are no longer valid production targets.

## Deployment Target

Use Vercel for production and preview deployments.

- Framework preset: Next.js
- Install command: `npm ci`
- Build command: `npm run build`
- Output directory: Vercel default
- Node.js: 22.x

The repository still uses GitHub Actions for quality gates, not for production hosting.

## Required Environment Variables

Configure these in Vercel project settings before the first production deployment:

```text
APP_URL
NEXT_PUBLIC_APP_URL
AUTH_SECRET
NEXTAUTH_SECRET
NEXTAUTH_URL
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
GITHUB_ID
GITHUB_SECRET
DATABASE_URL
CLOUDFLARE_ACCOUNT_ID
R2_ACCESS_KEY_ID
R2_SECRET_ACCESS_KEY
R2_BUCKET_NAME
R2_ENDPOINT
R2_PUBLIC_BASE_URL
SENTRY_DSN
NEXT_PUBLIC_SENTRY_DSN
SENTRY_ORG
SENTRY_PROJECT
SENTRY_AUTH_TOKEN
```

Use `.env.example` as the source of truth for variable names.

## OAuth Callback URLs

Register these callback URLs with each OAuth provider:

```text
https://your-domain.com/api/auth/callback/google
https://your-domain.com/api/auth/callback/github
```

For local development:

```text
http://localhost:3000/api/auth/callback/google
http://localhost:3000/api/auth/callback/github
```

## Verification

Run the same gates locally before pushing:

```powershell
npm run lint
npm run typecheck
$env:DATABASE_URL="postgresql://decode:decode@localhost:26257/decode?sslmode=disable"; npm run prisma:validate
npm run build
```

After deployment, verify:

- `/api/auth/signin` renders Google and GitHub provider options.
- `/api/auth/callback/google` and `/api/auth/callback/github` are reachable as Auth.js callback routes.
- The app loads from the root path without `/decode`.
- Static assets such as `/logo.png`, `/manifest.json`, and `/sw.js` resolve from the root path.

## Rollback

Use Vercel's deployment history to promote the last known-good deployment. Do not reintroduce static export, `basePath`, `assetPrefix`, or GitHub Pages deployment steps as a rollback strategy.
