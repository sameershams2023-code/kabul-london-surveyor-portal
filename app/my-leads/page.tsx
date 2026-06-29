import { redirect } from 'next/navigation';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { CalendarCheck, CheckCircle2, ClipboardList, DoorOpen, MapPin, MessageSquareText, Phone } from 'lucide-react';
import { StatusBadge } from '@/components/status-badge';
import { SurveyorPropertyActions } from '@/components/surveyor-property-actions';
import { getLeads } from '@/lib/data';
import { createSupabaseServerClient, hasSupabaseEnv } from '@/lib/supabase/server';
import type { Lead, Surveyor } from '@/lib/types';

export default async function MyLeadsPage() {
  let leads: Lead[];
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

    const { data } = await supabase
      .from('leads')
      .select('*, surveyors(full_name,email,tidycal_link)')
      .eq('assigned_surveyor_id', surveyor.id)
      .order('created_at', { ascending: false });

    leads = (data as Lead[] | null) ?? [];
  }

  const completed = leads.filter((lead) => lead.current_status === 'Completed').length;
  const booked = leads.filter((lead) => lead.current_status === 'Appointment booked').length;
  const refusedAccess = leads.filter((lead) => lead.current_status === 'No access').length;
  const pending = leads.filter((lead) => !['Completed', 'Appointment booked', 'Refused', 'No access'].includes(lead.current_status)).length;
  const noShow = leads.filter((lead) => ['No Show', 'No answer', 'Wrong number'].includes(lead.current_status)).length;
  const doorKnocks = leads.filter((lead) =>
    ['First attempt', 'Second attempt', 'Third attempt', 'No answer', 'No access'].includes(lead.current_status)
  ).length;
  const completionRate = leads.length ? Math.round((completed / leads.length) * 100) : 0;
  const now = new Date();
  const greeting = now.getHours() < 12 ? 'Good morning' : now.getHours() < 18 ? 'Good afternoon' : 'Good evening';
  const today = new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(now);
  const firstName = surveyor?.full_name.split(' ')[0] ?? 'Admin';
  const todaysBookings = leads.filter((lead) => lead.current_status === 'Appointment booked');

  return (
    <div className="mx-auto max-w-3xl space-y-7">
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
        <Link className="text-ink" href="/dashboard">
          Home
        </Link>
        <span>&gt;</span>
        <span>My leads</span>
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

      <section className="grid grid-cols-2 gap-x-8 gap-y-14 py-6">
        <Kpi icon={<ClipboardList className="h-6 w-6" />} label="Total Properties" value={leads.length} />
        <Kpi icon={<CalendarCheck className="h-6 w-6" />} label="Bookings This Week" value={booked} />
        <Kpi icon={<CheckCircle2 className="h-6 w-6" />} label="Completion Rate" value={`${completionRate}%`} />
        <Kpi icon={<DoorOpen className="h-6 w-6" />} label="Door Knocks This Week" value={doorKnocks} />
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-extrabold text-ink">Properties by Status</h2>
        <div className="flex flex-wrap gap-3">
          <StatusPill className="bg-amber-100 text-amber-900" label="Booked" value={booked} />
          <StatusPill className="bg-slate-100 text-slate-800" label="Pending" value={pending} />
          <StatusPill className="bg-emerald-100 text-emerald-800" label="Completed" value={completed} />
          <StatusPill className="bg-yellow-100 text-yellow-900" label="No Show" value={noShow} />
          <StatusPill className="bg-rose-100 text-rose-900" label="Refused Access" value={refusedAccess} />
        </div>
      </section>

      <section className="space-y-3 border-t border-line pt-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-extrabold text-ink">Today's Bookings</h2>
          <Link className="text-sm font-semibold text-slate-600" href="/leads">
            View schedule -&gt;
          </Link>
        </div>
        {todaysBookings.length ? (
          <div className="space-y-3">
            {todaysBookings.map((lead) => (
              <LeadCard key={lead.id} lead={lead} />
            ))}
          </div>
        ) : (
          <div className="rounded-md border border-line bg-white p-5 text-center text-sm font-medium text-slate-500">
            No bookings today
          </div>
        )}
      </section>

      <section className="space-y-3 pb-8">
        <h2 className="text-lg font-extrabold text-ink">My Properties</h2>
        <div className="space-y-3">
          {leads.map((lead) => (
            <LeadCard key={lead.id} lead={lead} />
          ))}
        </div>
      </section>
    </div>
  );
}

function Kpi({ icon, label, value }: { icon: ReactNode; label: string; value: string | number }) {
  return (
    <div className="grid grid-cols-[34px_1fr] gap-3">
      <div className="pt-1 text-slate-500">{icon}</div>
      <div>
        <div className="text-base font-medium leading-tight text-slate-600">{label}</div>
        <div className="mt-1 text-3xl font-extrabold leading-none text-ink">{value}</div>
      </div>
    </div>
  );
}

function StatusPill({ label, value, className }: { label: string; value: number; className: string }) {
  return (
    <span className={`rounded-md px-3 py-2 text-sm font-extrabold ${className}`}>
      {label} {value}
    </span>
  );
}

function LeadCard({ lead }: { lead: Lead }) {
  return (
    <article className="rounded-md border border-line bg-white p-4 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-bold text-ink">{lead.customer_name}</div>
          <div className="mt-1 flex items-center gap-1 text-sm text-slate-600">
            <MapPin className="h-4 w-4" />
            {lead.property_address}
          </div>
          <div className="mt-1 flex items-center gap-1 text-sm text-slate-600">
            <MessageSquareText className="h-4 w-4" />
            Contact: {lead.phone}
          </div>
          <div className="mt-1 flex items-center gap-1 text-sm text-slate-600">
            <Phone className="h-4 w-4" />
            {lead.email ?? 'No email saved'}
          </div>
        </div>
        <StatusBadge status={lead.current_status} />
      </div>
      <Link
        className="mt-3 inline-flex rounded-md border border-line px-3 py-2 text-xs font-extrabold text-ink hover:border-brand hover:text-brand"
        href={`/leads/${lead.id}`}
      >
        View details
      </Link>
      <SurveyorPropertyActions leadId={lead.id} />
    </article>
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
