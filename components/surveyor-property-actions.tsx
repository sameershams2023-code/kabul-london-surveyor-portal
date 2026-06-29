'use client';

import { CheckCircle2, DoorOpen, Footprints, HelpCircle } from 'lucide-react';

const actions = [
  { label: 'Completed', status: 'Completed', icon: CheckCircle2, className: 'border-emerald-200 bg-emerald-50 text-emerald-800' },
  { label: '1st Attempt', status: 'First attempt', icon: Footprints, className: 'border-amber-200 bg-amber-50 text-amber-900' },
  { label: '2nd Attempt', status: 'Second attempt', icon: Footprints, className: 'border-orange-200 bg-orange-50 text-orange-900' },
  { label: '3rd Attempt', status: 'Third attempt', icon: Footprints, className: 'border-rose-200 bg-rose-50 text-rose-900' },
  { label: 'No Access', status: 'No access', icon: DoorOpen, className: 'border-red-200 bg-red-50 text-red-800' },
  { label: 'No Show', status: 'No Show', icon: HelpCircle, className: 'border-yellow-200 bg-yellow-50 text-yellow-900' }
] as const;

export function SurveyorPropertyActions({ leadId }: { leadId: string }) {
  async function updateStatus(status: string) {
    const response = await fetch('/api/leads/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lead_id: leadId, status })
    });

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      alert(body?.error ?? 'Could not update this property.');
      return;
    }

    window.location.reload();
  }

  return (
    <div className="mt-4 grid grid-cols-2 gap-2">
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <button
            className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-md border px-2 py-2 text-xs font-extrabold ${action.className}`}
            key={action.status}
            onClick={(event) => {
              event.preventDefault();
              updateStatus(action.status);
            }}
            type="button"
          >
            <Icon className="h-4 w-4" />
            {action.label}
          </button>
        );
      })}
    </div>
  );
}
