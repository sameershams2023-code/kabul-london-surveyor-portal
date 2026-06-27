# Kabul London Surveyor Portal

MakerKit-friendly Next.js + Supabase portal for Kabul London Ltd surveyor team management.

## What is included

- Admin dashboard with lead totals, status cards, latest leads, and surveyor performance.
- Lead list with status, surveyor, and search filters.
- Lead detail page with status actions, notes, SMS history, booking history, and TidyCal booking SMS action.
- Surveyor management page with TidyCal booking links.
- Surveyor-only `/my-leads` view.
- CSV import preview with required-column and phone validation.
- Server-side Yay.com SMS adapter at `POST /api/sms/send-booking-link`.
- Supabase migration with RLS policies.
- Seed data SQL for one admin, two surveyors, and ten sample leads.

## Environment Variables

Copy `.env.example` to `.env.local`.

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

YAY_API_KEY=
YAY_SENDER_ID=
YAY_SMS_ENDPOINT=https://api.yay.com/sms/send

TIDYCAL_API_KEY=
```

`YAY_API_KEY`, `YAY_SENDER_ID`, `SUPABASE_SERVICE_ROLE_KEY`, and `TIDYCAL_API_KEY` are server-only values. Do not expose them in frontend code.

`YAY_SMS_ENDPOINT` is configurable because Yay.com account/API setups can differ. Keep it on the server and update it to the SMS endpoint supplied by Yay.com.

## Run Locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000/login`.

Real logins require Supabase environment variables and the database migration.

## Supabase Setup

1. Create a Supabase project.
2. Add the values from Project Settings to `.env.local`.
3. Run the migration in `supabase/migrations/20260625180000_kabul_london_portal.sql`.
4. Create the first admin user in Supabase Authentication.
5. Add that user to `public.user_roles` with role `admin`.
6. Log in to the app.
7. Use `/surveyors` to create surveyor logins and store their phone, service area, and TidyCal link.
8. Use `/import` to import leads and assign them to surveyors.

## Roles

- Owner/Admin: full access, including lead deletion and role management.
- Manager: view all leads, assign leads, import CSV, view reports.
- Surveyor: only assigned leads.
- Office Agent: update leads and send SMS, no admin settings access.

Roles are stored in `public.user_roles` and enforced by RLS helper functions.

## Creating Surveyor Logins

Each surveyor needs two records:

1. A Supabase Auth user for their email and password.
2. A `surveyors` row linked to that Auth user's UUID in `surveyors.user_id`.

You can create surveyor logins inside the app from `/surveyors`. The app will:

1. Create the Supabase Auth login.
2. Add `user_roles.role = surveyor`.
3. Add the linked `surveyors` row.
4. Store phone, service area, and TidyCal link.

When that surveyor logs in at `/login`, `/my-leads` shows only leads where `assigned_surveyor_id` matches their surveyor profile.

The surveyor dashboard shows:

- Assigned leads.
- Not completed leads.
- Completed leads.
- Appointments booked.
- Status breakdown.

Admins and managers can still see all leads from `/dashboard` and `/leads`.

## Yay.com SMS

The SMS action calls `POST /api/sms/send-booking-link` with:

```json
{ "lead_id": "..." }
```

The route:

1. Loads the lead.
2. Loads the assigned surveyor.
3. Reads that surveyor's `tidycal_link`.
4. Builds this SMS:

```text
Hi [customer_name], this is Kabul London Ltd. Please book your property survey appointment here: [tidycal_link]. Thank you.
```

5. Sends through the server-side Yay adapter.
6. Saves `sms_messages`.
7. Updates the lead status to `SMS sent`.
8. Adds `lead_status_history`.

## TidyCal

Add each surveyor's booking URL in `/surveyors`, stored in `surveyors.tidycal_link`.

`bookings` includes `tidycal_booking_id`, `booking_time`, and `booking_status` so a future TidyCal API or webhook sync can upsert booking records and move matching leads to `Appointment booked`.

## CSV Import

Required columns:

```text
customer_name
phone
email
property_address
postcode
service_type
assigned_surveyor_email
```

The import preview validates required columns and phone format. The server import endpoint imports valid rows only and reports failed rows.

## Deployment

Deploy to Vercel or the MakerKit deployment target:

1. Add the environment variables in the hosting provider.
2. Run Supabase migrations against production.
3. Confirm RLS is enabled on all portal tables.
4. Add real Yay.com credentials.
5. Add each surveyor's TidyCal link.

## Acceptance Test Path

1. Admin logs in.
2. Admin creates surveyor Sameer Shams and adds his TidyCal link.
3. Admin imports leads by CSV.
4. Admin assigns leads to Sameer.
5. Sameer logs in.
6. Sameer sees only his assigned leads at `/my-leads`.
7. Sameer marks one lead `First attempt`.
8. Sameer sends TidyCal booking SMS.
9. Lead status becomes `SMS sent`.
10. Admin dashboard updates.
11. Sameer marks the lead `Completed`.
12. Admin can see completed status in overview.
