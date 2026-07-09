import { redirect } from 'next/navigation';
import { LeadTable } from '@/components/lead-table';
import { StatusBadge } from '@/components/status-badge';
import { getUserRoleSafe } from '@/lib/authz';
import { getLeadMetrics, getLeads, getRecentStatusHistory, getSurveyors } from '@/lib/data';
import { createSupabaseServerClient, hasSupabaseEnv } from '@/lib/supabase/server';

export default async function DashboardPage() {
  if (hasSupabaseEnv()) {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    const role = await getUserRoleSafe(user?.id);

    if (role === 'surveyor') {
      redirect('/my-leads');
    }
  }

  const [leads, surveyors, history] = await Promise.all([getLeads(), getSurveyors(), getRecentStatusHistory()]);
  const metrics = getLeadMetrics(leads);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink">Dashboard</h1>
        <p className="text-sm text-slate-600">Full operational overview for Kabul London Ltd.</p>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {metrics.map((metric) => (
          <div key={metric.label} className="rounded-md border border-line bg-white p-4 shadow-soft">
            <div className="text-sm font-medium text-slate-500">{metric.label}</div>
            <div className="mt-2 text-3xl font-semibold text-ink">{metric.value}</div>
          </div>
        ))}
      </section>

      <section className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-ink">Latest leads</h2>
          <LeadTable leads={leads.slice(0, 8)} />
        </div>

        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-ink">Surveyor performance</h2>
          <div className="rounded-md border border-line bg-white shadow-soft">
            {surveyors.map((surveyor) => {
              const assigned = leads.filter((lead) => lead.assigned_surveyor_id === surveyor.id);
              const completed = assigned.filter((lead) => lead.current_status === 'Completed').length;
              return (
                <div key={surveyor.id} className="border-b border-line p-4 last:border-b-0">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold text-ink">{surveyor.full_name}</div>
                      <div className="text-sm text-slate-500">{surveyor.service_area}</div>
                    </div>
                    <span className="rounded-md bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800">
                      {surveyor.active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                    <div className="rounded-md bg-panel p-3">
                      <div className="text-slate-500">Assigned</div>
                      <div className="font-semibold text-ink">{assigned.length}</div>
                    </div>
                    <div className="rounded-md bg-panel p-3">
                      <div className="text-slate-500">Completed</div>
                      <div className="font-semibold text-ink">{completed}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold text-ink">Who did what</h2>
          <p className="text-sm text-slate-600">Latest property status changes by surveyor or office user.</p>
        </div>

        <div className="overflow-hidden rounded-md border border-line bg-white shadow-soft">
          {history.length ? (
            <div className="divide-y divide-line">
              {history.map((item) => (
                <div key={item.id} className="grid gap-3 p-4 md:grid-cols-[1fr_auto]">
                  <div>
                    <div className="font-semibold text-ink">
                      {item.changed_by_surveyor?.full_name ?? item.changed_by_email ?? item.changed_by ?? 'Unknown user'}
                    </div>
                    <div className="mt-1 text-sm text-slate-600">
                      Updated {item.leads?.customer_name ?? 'a property'}
                      {item.leads?.property_address ? ` at ${item.leads.property_address}` : ''}
                    </div>
                    {item.note ? <div className="mt-1 text-sm text-slate-500">{item.note}</div> : null}
                    <div className="mt-1 text-xs font-medium text-slate-500">
                      {new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short' }).format(
                        new Date(item.created_at)
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.old_status ? <StatusBadge status={item.old_status} /> : null}
                    <span className="text-sm font-semibold text-slate-400">to</span>
                    <StatusBadge status={item.new_status} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-5 text-sm text-slate-500">
              No status changes yet. When surveyors press their property buttons, activity will appear here.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
