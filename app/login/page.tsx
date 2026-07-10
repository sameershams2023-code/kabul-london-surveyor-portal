import { redirect } from 'next/navigation';
import { LockKeyhole } from 'lucide-react';
import { createSupabaseServerClient, hasSupabaseEnv } from '@/lib/supabase/server';
import { getUserRoleSafe } from '@/lib/authz';

async function signIn(formData: FormData) {
  'use server';

  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');

  if (!hasSupabaseEnv()) {
    redirect('/login?error=Connect%20Supabase%20first%20to%20use%20real%20logins');
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  const role = await getUserRoleSafe(data.user?.id);

  if (role === 'owner' || role === 'admin' || role === 'manager' || role === 'office_agent') {
    redirect('/dashboard');
  }

  redirect('/my-leads');
}

export default async function LoginPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const error = typeof params.error === 'string' ? params.error : null;

  return (
    <div className="mx-auto max-w-md rounded-md border border-line bg-white p-6 shadow-soft">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-md bg-brand text-white">
          <LockKeyhole className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-ink">Kabul London login</h1>
          <p className="text-sm text-slate-600">Sign in to continue.</p>
        </div>
      </div>

      {!hasSupabaseEnv() ? (
        <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          Real logins need Supabase connected. Add your Supabase keys to `.env.local`, restart the app, then create
          your first admin at `/setup-admin`.
        </div>
      ) : null}

      {error ? (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div>
      ) : null}

      <form action={signIn} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-semibold text-ink" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            name="email"
            className="w-full rounded-md border border-line px-3 py-2"
            placeholder="sameer@kabullondon.co.uk"
            type="email"
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold text-ink" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            name="password"
            className="w-full rounded-md border border-line px-3 py-2"
            placeholder="Password"
            type="password"
            required
          />
        </div>
        <button className="w-full rounded-md bg-action px-4 py-2 font-semibold text-white" type="submit">
          Log in
        </button>
      </form>
    </div>
  );
}
