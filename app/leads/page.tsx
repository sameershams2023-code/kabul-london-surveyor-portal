import { redirect } from 'next/navigation';
import { Filter, Upload } from 'lucide-react';
import Link from 'next/link';
import { LeadTable } from '@/components/lead-table';
import { getLeads, getSurveyors } from '@/lib/data';
import { getSessionState } from '@/lib/session';
import { leadStatuses } from '@/lib/status';

export default async function LeadsPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { role } = await getSessionState();

  if (role === 'surveyor') {
    redirect('/my-properties');
  }

  const params = await searchParams;
  const [leads, surveyors] = await Promise.all([getLeads(), getSurveyors()]);
  const canAssignAndImport = role === 'owner' || role === 'admin';
  const query = String(params.q ?? '').toLowerCase();
  const status = String(params.status ?? '');
  const surveyor = String(params.surveyor ?? '');

  const filtered = leads.filter((lead) => {
    const matchesQuery =
      !query ||
      [lead.customer_name, lead.phone, lead.postcode].some((value) => value.toLowerCase().includes(query));
    const matchesStatus = !status || lead.current_status === status;
    const matchesSurveyor = !surveyor || lead.assigned_surveyor_id === surveyor;
    return matchesQuery && matchesStatus && matchesSurveyor;
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Leads</h1>
          <p className="text-sm text-slate-600">Filter, search, bulk assign, and import customer leads.</p>
        </div>
        {canAssignAndImport ? (
          <Link
            className="inline-flex items-center gap-2 rounded-md bg-action px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
            href="/import"
          >
            <Upload className="h-4 w-4" />
            CSV import
          </Link>
        ) : null}
      </div>

      <form className="grid gap-3 rounded-md border border-line bg-white p-4 shadow-soft md:grid-cols-5">
        <input
          className="rounded-md border border-line px-3 py-2 md:col-span-2"
          name="q"
          placeholder="Search name, phone, postcode"
          defaultValue={query}
        />
        <select className="rounded-md border border-line px-3 py-2" name="status" defaultValue={status}>
          <option value="">All statuses</option>
          {leadStatuses.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
        <select className="rounded-md border border-line px-3 py-2" name="surveyor" defaultValue={surveyor}>
          <option value="">All surveyors</option>
          {surveyors.map((item) => (
            <option key={item.id} value={item.id}>
              {item.full_name}
            </option>
          ))}
        </select>
        <button className="inline-flex items-center justify-center gap-2 rounded-md border border-line px-3 py-2 font-semibold hover:border-brand hover:text-brand">
          <Filter className="h-4 w-4" />
          Apply
        </button>
      </form>

      {canAssignAndImport ? (
        <section className="rounded-md border border-line bg-white p-4 shadow-soft">
          <div className="grid gap-3 md:grid-cols-[1fr_240px_auto]">
            <select className="rounded-md border border-line px-3 py-2" defaultValue="">
              <option value="">Select visible leads</option>
              <option value="all">All filtered leads</option>
            </select>
            <select className="rounded-md border border-line px-3 py-2" defaultValue="">
              <option value="">Assign to surveyor</option>
              {surveyors.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.full_name}
                </option>
              ))}
            </select>
            <button className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white">Bulk assign</button>
          </div>
        </section>
      ) : null}

      <LeadTable leads={filtered} />
    </div>
  );
}
