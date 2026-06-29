import { clsx } from 'clsx';

export const leadStatuses = [
  'New',
  'First attempt',
  'Second attempt',
  'Third attempt',
  'SMS sent',
  'Appointment booked',
  'Completed',
  'Refused',
  'No Show',
  'No answer',
  'No access',
  'Wrong number',
  'Cancelled'
] as const;

export type LeadStatus = (typeof leadStatuses)[number];

const badgeStyles: Record<LeadStatus, string> = {
  New: 'bg-sky-100 text-sky-800 border-sky-200',
  'First attempt': 'bg-amber-100 text-amber-900 border-amber-200',
  'Second attempt': 'bg-orange-100 text-orange-900 border-orange-200',
  'Third attempt': 'bg-rose-100 text-rose-900 border-rose-200',
  'SMS sent': 'bg-indigo-100 text-indigo-800 border-indigo-200',
  'Appointment booked': 'bg-violet-100 text-violet-800 border-violet-200',
  Completed: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  Refused: 'bg-stone-200 text-stone-800 border-stone-300',
  'No Show': 'bg-yellow-100 text-yellow-900 border-yellow-200',
  'No answer': 'bg-yellow-100 text-yellow-900 border-yellow-200',
  'No access': 'bg-red-100 text-red-800 border-red-200',
  'Wrong number': 'bg-zinc-200 text-zinc-800 border-zinc-300',
  Cancelled: 'bg-slate-200 text-slate-800 border-slate-300'
};

export function statusBadgeClass(status: string) {
  return clsx(
    'inline-flex min-w-24 justify-center rounded-md border px-2.5 py-1 text-xs font-semibold',
    badgeStyles[status as LeadStatus] ?? 'border-line bg-white text-ink'
  );
}
