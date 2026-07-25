import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Search } from 'lucide-react';
import { SurveyorPropertyCard } from '@/components/surveyor-property-card';
import { createSupabaseServerClient, hasSupabaseEnv } from '@/lib/supabase/server';
import type { Lead, Surveyor } from '@/lib/types';

function matchesSearch(lead: Lead, query: string) {
  if (!query) {
    return true;
  }

  return [lead.customer_name, lead.phone, lead.email, lead.property_address, lead.postcode, lead.service_type, lead.current_status]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
    .includes(query);
}

export default async function MyPropertiesPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const query = String(params.q ?? '').trim().toLowerCase();

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
    .select(
      'id,customer_name,phone,email,property_address,postcode,service_type,source,current_status,assigned_surveyor_id,created_by,created_at,updated_at'
    )
    .eq('assigned_surveyor_id', surveyor.id)
    .order('created_at', { ascending: false });

  const leads = (data as Lead[] | null) ?? [];
  const filteredLeads = leads.filter((lead) => matchesSearch(lead, query));

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

      <form className="rounded-md border border-line bg-white p-3 shadow-soft">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            className="w-full rounded-md border border-line py-3 pl-10 pr-3 text-base font-medium text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            defaultValue={query}
            name="q"
            placeholder="Search name, phone, address, postcode..."
            type="search"
          />
        </label>
        <button className="mt-3 w-full rounded-md bg-brand px-4 py-3 text-sm font-extrabold text-white" type="submit">
          Search properties
        </button>
        {query ? (
          <Link className="mt-3 inline-flex text-sm font-semibold text-slate-600" href="/my-properties">
            Clear search
          </Link>
        ) : null}
      </form>

      <section className="space-y-3 pb-8">
        {query ? (
          <div className="text-sm font-semibold text-slate-500">
            Showing {filteredLeads.length} of {leads.length} properties
          </div>
        ) : null}

        {filteredLeads.length ? (
          filteredLeads.map((lead) => <SurveyorPropertyCard key={lead.id} lead={lead} />)
        ) : (
          <div className="rounded-md border border-line bg-white p-5 text-center text-sm font-medium text-slate-500">
            {leads.length ? 'No properties match your search' : 'No properties assigned yet'}
          </div>
        )}
      </section>
    </div>
  );
}
