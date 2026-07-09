import { redirect } from 'next/navigation';
import Link from 'next/link';
import { CalendarDays, Clock, MapPinned, Navigation, Phone } from 'lucide-react';
import { getTodaysBookingsForSurveyor } from '@/lib/data';
import { createSupabaseServerClient, hasSupabaseEnv } from '@/lib/supabase/server';
import type { Surveyor } from '@/lib/types';

function mapsDirectionsUrl(address: string) {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;
}

export default async function SchedulePage() {
  if (!hasSupabaseEnv()) {
    redirect('/login?error=Connect%20Supabase%20first%20to%20use%20real%20surveyor%20accounts');
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: surveyorData } = await supabase.from('surveyors').select('*').eq('user_id', user.id).single();
  const surveyor = surveyorData as Surveyor | null;

  if (!surveyor) {
    return (
      <div className="rounded-md border border-amber-200 bg-amber-50 p-5 text-amber-900">
        Your login is working, but this user is not linked to a surveyor profile yet.
      </div>
    );
  }

  const bookings = await getTodaysBookingsForSurveyor(surveyor.id);
  const today = new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(new Date());

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
        <Link className="text-ink" href="/my-leads">
          Home
        </Link>
        <span>&gt;</span>
        <span>My schedule</span>
      </div>

      <section className="rounded-md border border-line bg-white p-5 shadow-soft">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-md bg-brand text-white">
            <CalendarDays className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-ink">Today&apos;s Schedule</h1>
            <p className="text-sm font-medium text-slate-600">{today}</p>
          </div>
        </div>
      </section>

      {bookings.length ? (
        <section className="space-y-3">
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
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-extrabold text-ink">{lead?.customer_name ?? booking.customer_name}</h2>
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
                  </div>
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
        </section>
      ) : (
        <section className="rounded-md border border-line bg-white p-6 text-center shadow-soft">
          <h2 className="text-lg font-extrabold text-ink">No bookings today</h2>
          <p className="mt-2 text-sm text-slate-600">
            When TidyCal bookings are synced to this app, today&apos;s booked addresses will appear here.
          </p>
        </section>
      )}
    </div>
  );
}
