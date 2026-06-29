import { statusBadgeClass } from '@/lib/status';

export function StatusBadge({ status }: { status: string }) {
  return <span className={statusBadgeClass(status)}>{status}</span>;
}
