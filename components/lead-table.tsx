import Link from 'next/link';
import { StatusBadge } from '@/components/status-badge';
import type { Lead } from '@/lib/types';

export function LeadTable({ leads }: { leads: Lead[] }) {
  return (
    <div className="table-scroll overflow-x-auto rounded-md border border-line bg-white shadow-soft">
      <table className="min-w-full divide-y divide-line text-sm">
        <thead className="bg-panel text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
          <tr>
            <th className="px-4 py-3">Customer</th>
            <th className="px-4 py-3">Phone</th>
            <th className="px-4 py-3">Postcode</th>
            <th className="px-4 py-3">Service</th>
            <th className="px-4 py-3">Surveyor</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Created</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {leads.map((lead) => (
            <tr key={lead.id} className="hover:bg-panel">
              <td className="px-4 py-3 font-medium text-ink">
                <Link className="hover:text-brand" href={`/leads/${lead.id}`}>
                  {lead.customer_name}
                </Link>
                <div className="text-xs font-normal text-slate-500">{lead.email}</div>
              </td>
              <td className="px-4 py-3">{lead.phone}</td>
              <td className="px-4 py-3">{lead.postcode}</td>
              <td className="px-4 py-3">{lead.service_type}</td>
              <td className="px-4 py-3">{lead.surveyors?.full_name ?? 'Unassigned'}</td>
              <td className="px-4 py-3">
                <StatusBadge status={lead.current_status} />
              </td>
              <td className="px-4 py-3 text-slate-600">
                {new Intl.DateTimeFormat('en-GB').format(new Date(lead.created_at))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
