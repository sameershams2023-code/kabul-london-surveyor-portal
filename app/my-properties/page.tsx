import { redirect } from 'next/navigation';
import Link from 'next/link';
import { MapPin, MessageSquareText, Navigation, Phone } from 'lucide-react';
import { StatusBadge } from '@/components/status-badge';
import { SurveyorPropertyActions } from '@/components/surveyor-property-actions';
import { createSupabaseServerClient, hasSupabaseEnv } from '@/lib/supabase/server';
import type { Lead, Surveyor } from '@/lib/types';

function directionsUrl(address: string) {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;
}

export default async function MyPropertiesPage() {
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

  const { data } = await supabase
    .from('leads')
    .select('*, surveyors(full_name,email,tidycal_link)')
    .eq('assigned_surveyor_id', surveyor.id)
    .order('created_at', { ascending: false });

  const leads = (data as Lead[] | null) ?? [];

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
        <Link className="text-ink" href="/my-leads">
          Home
        </Link>
        <span>&gt;</span>
        <span>Leads</span>
      </div>

      <section>
        <h1 className="text-2xl font-extrabold text-ink">My Assigned Properties</h1>
        <p className="mt-1 text-sm font-medium text-slate-600">
          {leads.length} assigned {leads.length === 1 ? 'property' : 'properties'}
        </p>
      </section>

      <section className="space-y-3 pb-8">
        {leads.length ? (
          leads.map((lead) => <LeadCard key={lead.id} lead={lead} />)
        ) : (
          <div className="rounded-md border border-line bg-white p-5 text-center text-sm font-medium text-slate-500">
            No properties assigned yet
          </div>
        )}
      </section>
    </div>
  );
}

function LeadCard({ lead }: { lead: Lead }) {
  const fullAddress = [lead.property_address, lead.postcode].filter(Boolean).join(', ');

  return (
    <article className="rounded-md border border-line bg-white p-4 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-bold text-ink">{lead.customer_name}</div>
          <div className="mt-1 flex items-center gap-1 text-sm text-slate-600">
            <MapPin className="h-4 w-4" />
            {fullAddress}
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
      <a
        className="ml-2 mt-3 inline-flex items-center gap-2 rounded-md bg-brand px-3 py-2 text-xs font-extrabold text-white"
        href={directionsUrl(fullAddress)}
        target="_blank"
        rel="noreferrer"
      >
        <Navigation className="h-4 w-4" />
        Give directions
      </a>
      <SurveyorPropertyActions leadId={lead.id} />
    </article>
  );
}
