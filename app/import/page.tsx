import { redirect } from 'next/navigation';
import { ImportPreview } from '@/components/import-preview';
import { getSessionState } from '@/lib/session';
import { hasSupabaseEnv } from '@/lib/supabase/server';

export default async function ImportPage() {
  if (!hasSupabaseEnv()) {
    redirect('/login?error=Connect%20Supabase%20first');
  }

  const { loggedIn, role } = await getSessionState();

  if (!loggedIn) redirect('/login');
  if (role !== 'owner' && role !== 'admin') {
    redirect(role === 'surveyor' ? '/my-properties' : '/leads');
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-ink">CSV import</h1>
        <p className="text-sm text-slate-600">
          Preview leads, validate phone numbers, and import valid rows only.
        </p>
      </div>
      <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        The `assigned_surveyor_email` column must contain the surveyor login email, for example
        `sameer@kabullondon.co.uk`. It cannot be a postcode or service area.
      </div>
      <ImportPreview />
    </div>
  );
}
