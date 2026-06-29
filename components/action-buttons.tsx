'use client';

import { MessageSquareText, Save } from 'lucide-react';
import { leadStatuses } from '@/lib/status';

export function LeadActions({ leadId }: { leadId: string }) {
  async function updateStatus(status: string) {
    const response = await fetch('/api/leads/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lead_id: leadId, status })
    });

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      alert(body?.error ?? 'Status could not be updated.');
      return;
    }

    window.location.reload();
  }

  async function sendSms() {
    const response = await fetch('/api/sms/send-booking-link', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lead_id: leadId })
    });

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      alert(body?.error ?? 'SMS could not be sent.');
      return;
    }

    window.location.reload();
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="mb-3 text-base font-semibold text-ink">Update status</h2>
        <div className="flex flex-wrap gap-2">
          {leadStatuses
            .filter((status) => status !== 'New' && status !== 'Cancelled')
            .map((status) => (
              <button
                key={status}
                className="rounded-md border border-line bg-white px-3 py-2 text-sm font-medium hover:border-brand hover:text-brand"
                onClick={() => updateStatus(status)}
                type="button"
              >
                {status}
              </button>
            ))}
        </div>
      </div>

      <button
        onClick={sendSms}
        className="inline-flex items-center gap-2 rounded-md bg-action px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
        type="button"
      >
        <MessageSquareText className="h-4 w-4" />
        Send TidyCal Booking SMS
      </button>

      <form
        className="space-y-3"
        onSubmit={async (event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          const note = String(form.get('note') ?? '').trim();
          if (!note) return;

          const response = await fetch('/api/notes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ lead_id: leadId, note })
          });

          if (!response.ok) {
            const body = await response.json().catch(() => null);
            alert(body?.error ?? 'Note could not be saved.');
            return;
          }

          window.location.reload();
        }}
      >
        <label className="block text-sm font-semibold text-ink" htmlFor="note">
          Add note
        </label>
        <textarea
          id="note"
          name="note"
          className="min-h-28 w-full rounded-md border border-line bg-white px-3 py-2"
          placeholder="Write a call note..."
        />
        <button
          className="inline-flex items-center gap-2 rounded-md border border-line bg-white px-4 py-2 text-sm font-semibold hover:border-brand hover:text-brand"
          type="submit"
        >
          <Save className="h-4 w-4" />
          Save note
        </button>
      </form>
    </div>
  );
}
