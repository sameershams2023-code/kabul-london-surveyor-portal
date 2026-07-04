import { redirect } from 'next/navigation';
import Link from 'next/link';
import { CalendarDays, Clock, MapPinned, Navigation, Phone } from 'lucide-react';
import { getTodaysBookingsForSurveyor } from '@/lib/data';
import { createSupabaseServerClient, hasSupabaseEnv } from '@/lib/supabase/server';
import type { Surveyor } from '@/lib/types';

function mapsDirectionsUrl(address: string) {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;
}

export default async function MyLeadsPage() {
  let surveyor: Surveyor | null = null;

  if (!hasSupabaseEnv()) {
    redirect('/login?error=Connect%20Supabase%20first%20to%20use%20real%20surveyor%20accounts');
  } else {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) redirect('/login');

    const { data: surveyorData } = await supabase.from('surveyors').select('*').eq('user_id', user.id).single();
    surveyor = surveyorData as Surveyor | null;

    if (!surveyor) {
      return (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-5 text-amber-900">
          Your login is working, but this user is not linked to a surveyor profile yet. Ask the admin to set
          `surveyors.user_id` for this account.
        </div>
      );
    }

  }

  const bookings = surveyor ? await getTodaysBookingsForSurveyor(surveyor.id) : [];
  const now = new Date();
  const greeting = now.getHours() < 12 ? 'Good morning' : now.getHours() < 18 ? 'Good afternoon' : 'Good evening';
  const today = new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(now);
  const firstName = surveyor?.full_name.split(' ')[0] ?? 'Admin';

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
        <Link className="text-ink" href="/my-leads">
          Home
        </Link>
      </div>

      <section className="flex items-center gap-4 border-b border-line pb-6">
        <div className="flex h-14 w-14 items-center justify-center rounded-md bg-brand text-white shadow-soft">
          <BarIcon />
        </div>
        <div>
          <h1 className="text-xl font-bold text-ink">Kabul London Surveying</h1>
          <p className="text-sm font-medium text-slate-600">
            {surveyor?.service_area ? `${surveyor.service_area} Properties` : 'Operations Platform'}
          </p>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-extrabold tracking-tight text-ink">
          {greeting}, {firstName}
        </h2>
        <p className="mt-1 text-base font-medium text-slate-600">{today}</p>
      </section>

      <section className="space-y-3 border-t border-line pt-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-extrabold text-ink">Booked For Today</h2>
          <Link className="text-sm font-semibold text-slate-600" href="/my-properties">
            All leads -&gt;
          </Link>
        </div>
        {bookings.length ? (
          <div className="space-y-3">
            {bookings.map((booking) => {
              const lead = booking.leads;
              const fullAddress = [lead?.property_address, lead?.postcode].filter(Boolean).join(', ');
              const bookingTime = booking.booking_time
                ? new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit' }).format(
                    new Date(booking.booking_time)
                  )
                : 'Time not set';

              return (
                <article key={booking.id} className="rounded-md border border-line bg-white p-4 shadow-soft">
                  <h3 className="text-lg font-extrabold text-ink">{lead?.customer_name ?? booking.customer_name}</h3>
                  <div className="mt-2 flex items-center gap-2 text-sm font-medium text-slate-600">
                    <Clock className="h-4 w-4" />
                    {bookingTime}
                  </div>
                  <div className="mt-2 flex items-start gap-2 text-sm font-medium text-slate-600">
                    <MapPinned className="mt-0.5 h-4 w-4" />
                    <span>{fullAddress || 'Address not linked yet'}</span>
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-sm font-medium text-slate-600">
                    <Phone className="h-4 w-4" />
                    {lead?.phone ?? booking.customer_phone ?? 'No phone saved'}
                  </div>
                  {fullAddress ? (
                    <a
                      className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-md bg-brand px-4 py-3 text-sm font-extrabold text-white"
                      href={mapsDirectionsUrl(fullAddress)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Navigation className="h-4 w-4" />
                      Give directions
                    </a>
                  ) : null}
                </article>
              );
            })}
          </div>
        ) : (
          <div className="rounded-md border border-line bg-white p-5 text-center text-sm font-medium text-slate-500">
            No bookings today
          </div>
        )}
      </section>
    </div>
  );
}

function BarIcon() {
  return (
    <svg aria-hidden="true" className="h-8 w-8" viewBox="0 0 32 32" fill="none">
      <rect x="7" y="15" width="4" height="9" rx="1" fill="currentColor" />
      <rect x="14" y="9" width="4" height="15" rx="1" fill="currentColor" />
      <rect x="21" y="5" width="4" height="19" rx="1" fill="currentColor" />
    </svg>
  );
}
