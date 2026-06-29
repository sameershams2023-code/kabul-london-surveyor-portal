import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import { LeadActions } from '@/components/action-buttons';
import { StatusBadge } from '@/components/status-badge';
import { getLead, getLeadActivity } from '@/lib/data';

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [lead, activity] = await Promise.all([getLead(id), getLeadActivity(id)]);

  if (!lead) notFound();

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <section className="space-y-5">
        <div className="rounded-md border border-line bg-white p-5 shadow-soft">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-ink">{lead.customer_name}</h1>
              <p className="text-sm text-slate-600">{lead.property_address}</p>
            </div>
            <StatusBadge status={lead.current_status} />
          </div>

          <dl className="mt-5 grid gap-4 md:grid-cols-2">
            {[
              ['Phone', lead.phone],
              ['Email', lead.email ?? 'Not provided'],
              ['Postcode', lead.postcode],
              ['Service type', lead.service_type],
              ['Source', lead.source ?? 'Not provided'],
              ['Assigned surveyor', lead.surveyors?.full_name ?? 'Unassigned'],
              ['TidyCal link', lead.surveyors?.tidycal_link ?? 'Missing'],
              ['Last updated', new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(lead.updated_at))]
            ].map(([label, value]) => (
              <div key={label} className="rounded-md bg-panel p-3">
                <dt className="text-xs font-semibold uppercase text-slate-500">{label}</dt>
                <dd className="mt-1 text-sm font-medium text-ink">{value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <ActivityPanel title="Notes" empty="No notes yet.">
            {activity.notes.map((note) => (
              <div key={note.id} className="border-b border-line py-3 last:border-b-0">
                <p className="text-sm text-ink">{note.note}</p>
                <p className="mt-1 text-xs text-slate-500">{new Date(note.created_at).toLocaleString('en-GB')}</p>
              </div>
            ))}
          </ActivityPanel>

          <ActivityPanel title="SMS history" empty="No SMS messages yet.">
            {activity.smsMessages.map((message) => (
              <div key={message.id} className="border-b border-line py-3 last:border-b-0">
                <p className="text-sm text-ink">{message.message_body}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {message.delivery_status ?? 'queued'} · {new Date(message.created_at).toLocaleString('en-GB')}
                </p>
              </div>
            ))}
          </ActivityPanel>
        </div>

        <ActivityPanel title="Booking history" empty="No bookings synced yet.">
          {activity.bookings.map((booking) => (
            <div key={booking.id} className="border-b border-line py-3 last:border-b-0">
              <p className="text-sm font-semibold text-ink">{booking.booking_status}</p>
              <p className="text-sm text-slate-600">
                {booking.booking_time
                  ? new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short' }).format(
                      new Date(booking.booking_time)
                    )
                  : 'Time not set'}
              </p>
            </div>
          ))}
        </ActivityPanel>
      </section>

      <aside className="rounded-md border border-line bg-white p-5 shadow-soft">
        <LeadActions leadId={lead.id} />
      </aside>
    </div>
  );
}

function ActivityPanel({
  title,
  empty,
  children
}: {
  title: string;
  empty: string;
  children: ReactNode;
}) {
  const hasChildren = Array.isArray(children) ? children.length > 0 : Boolean(children);
  return (
    <section className="rounded-md border border-line bg-white p-5 shadow-soft">
      <h2 className="text-base font-semibold text-ink">{title}</h2>
      <div className="mt-3">{hasChildren ? children : <p className="text-sm text-slate-500">{empty}</p>}</div>
    </section>
  );
}
