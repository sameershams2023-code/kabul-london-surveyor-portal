import { redirect } from 'next/navigation';
import Link from 'next/link';
import { SurveyorPropertyCard } from '@/components/surveyor-property-card';
import { createSupabaseServerClient, hasSupabaseEnv } from '@/lib/supabase/server';
import type { Lead, Surveyor } from '@/lib/types';

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
    .select(
      'id,customer_name,phone,email,property_address,postcode,service_type,source,current_status,assigned_surveyor_id,created_by,created_at,updated_at'
    )
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
          leads.map((lead) => <SurveyorPropertyCard key={lead.id} lead={lead} />)
        ) : (
          <div className="rounded-md border border-line bg-white p-5 text-center text-sm font-medium text-slate-500">
            No properties assigned yet
          </div>
        )}
      </section>
    </div>
  );
}
