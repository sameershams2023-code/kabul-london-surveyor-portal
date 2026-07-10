'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  CheckCircle2,
  DoorOpen,
  Footprints,
  HelpCircle,
  MapPin,
  MessageSquareText,
  Navigation,
  Phone
} from 'lucide-react';
import { StatusBadge } from '@/components/status-badge';
import type { Lead } from '@/lib/types';

const actions = [
  { label: 'Completed', status: 'Completed', icon: CheckCircle2, className: 'border-emerald-200 bg-emerald-50 text-emerald-800' },
  { label: '1st Attempt', status: 'First attempt', icon: Footprints, className: 'border-amber-200 bg-amber-50 text-amber-900' },
  { label: '2nd Attempt', status: 'Second attempt', icon: Footprints, className: 'border-orange-200 bg-orange-50 text-orange-900' },
  { label: '3rd Attempt', status: 'Third attempt', icon: Footprints, className: 'border-rose-200 bg-rose-50 text-rose-900' },
  { label: 'No Access', status: 'No access', icon: DoorOpen, className: 'border-red-200 bg-red-50 text-red-800' },
  { label: 'No Show', status: 'No Show', icon: HelpCircle, className: 'border-yellow-200 bg-yellow-50 text-yellow-900' }
] as const;

function directionsUrl(address: string) {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;
}

export function SurveyorPropertyCard({ lead }: { lead: Lead }) {
  const [status, setStatus] = useState(lead.current_status);
  const [savingStatus, setSavingStatus] = useState<string | null>(null);
  const fullAddress = [lead.property_address, lead.postcode].filter(Boolean).join(', ');

  async function updateStatus(nextStatus: string) {
    const previousStatus = status;
    setStatus(nextStatus);
    setSavingStatus(nextStatus);

    const response = await fetch('/api/leads/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lead_id: lead.id, status: nextStatus })
    });

    setSavingStatus(null);

    if (!response.ok) {
      setStatus(previousStatus);
      const body = await response.json().catch(() => null);
      alert(body?.error ?? 'Could not update this property.');
    }
  }

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
        <StatusBadge status={status} />
      </div>

      {savingStatus ? <div className="mt-3 text-xs font-semibold text-slate-500">Saving...</div> : null}

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

      <div className="mt-4 grid grid-cols-2 gap-2">
        {actions.map((action) => {
          const Icon = action.icon;
          const isActive = status === action.status;
          return (
            <button
              className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-md border px-2 py-2 text-xs font-extrabold ${
                action.className
              } ${isActive ? 'ring-2 ring-brand ring-offset-1' : ''}`}
              disabled={Boolean(savingStatus)}
              key={action.status}
              onClick={() => updateStatus(action.status)}
              type="button"
            >
              <Icon className="h-4 w-4" />
              {action.label}
            </button>
          );
        })}
      </div>
    </article>
  );
}
