# Kabul London Surveyor Portal

Next.js and Supabase surveyor management app for Kabul London Ltd.

## Local Setup

1. Install Node.js.
2. Add Supabase values to `.env.local`.
3. Run:

```powershell
npm.cmd install
npm.cmd run dev
```

Open:

```text
http://localhost:3000/login
```

## Environment Variables

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
YAY_API_KEY
YAY_SENDER_ID
YAY_SMS_ENDPOINT
TIDYCAL_API_KEY
```

Never upload `.env.local` to GitHub.

## Deploy

Upload the project to GitHub, connect it to Vercel, add the environment variables in Vercel Project Settings, then deploy.

## Supabase

Run the SQL files in `supabase/migrations` in Supabase SQL Editor.

## TidyCal

Add each surveyor's TidyCal link on the Surveyors page. The booking sync structure is prepared through the `bookings` table.

## Yay.com

Add `YAY_API_KEY`, `YAY_SENDER_ID`, and `YAY_SMS_ENDPOINT` in the environment. SMS sending is handled server-side only.
