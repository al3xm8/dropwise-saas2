# Dropwise Web App

This is the Next.js frontend for Dropwise.

## Current Scope

- public marketing pages such as `/`, `/pricing`, and `/contact-sales`
- Auth0-based sign-in
- protected `/onboarding` flow
- protected `/dashboard` placeholder route
- Slack OAuth install and callback routes hosted on the web app

## Local Development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Required Environment Variables

Core auth:

- `AUTH0_DOMAIN`
- `AUTH0_CLIENT_ID`
- `AUTH0_CLIENT_SECRET`
- `AUTH0_SECRET`
- `APP_BASE_URL`

Frontend to API:

- `NEXT_PUBLIC_API_BASE_URL`
- `API_BASE_URL`

Slack OAuth:

- `SLACK_CLIENT_ID`
- `SLACK_CLIENT_SECRET`
- `SLACK_OAUTH_REDIRECT_URI`
- `SLACK_OAUTH_BOT_SCOPES`
- `SLACK_OAUTH_USER_SCOPES`

Use `.env.local.example` as the reference.

## Deployment Notes

- the web app is deployed on Vercel
- the production callback host is currently `https://dropwise-eight.vercel.app`
- Slack OAuth callback route lives at `/api/slack/oauth/callback`
- browser-side onboarding calls use `NEXT_PUBLIC_API_BASE_URL`
- server-side Slack callback persistence uses `API_BASE_URL`
