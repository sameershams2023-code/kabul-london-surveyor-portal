import { redirect } from 'next/navigation';
import { ShieldCheck } from 'lucide-react';
import { createSupabaseAdminClient, hasSupabaseEnv } from '@/lib/supabase/server';

async function createAdmin(formData: FormData) {
  'use server';

  if (!hasSupabaseEnv()) {
    redirect('/setup-admin?error=Connect%20Supabase%20first');
  }

  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const password = String(formData.get('password') ?? '');
  const fullName = String(formData.get('full_name') ?? '').trim() || 'Kabul London Admin';

  if (!email || !password) {
    redirect('/setup-admin?error=Email%20and%20password%20are%20required');
  }

  const admin = createSupabaseAdminClient();
  const { data: existingUsers } = await admin.auth.admin.listUsers();
  const existing = existingUsers?.users.find((user) => user.email?.toLowerCase() === email);

  let userId = existing?.id;

  if (!userId) {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        role: 'admin'
      }
    });

    if (error || !data.user) {
      redirect(`/setup-admin?error=${encodeURIComponent(error?.message ?? 'Could not create admin')}`);
    }

    userId = data.user.id;
  } else if (password) {
    await admin.auth.admin.updateUserById(userId, {
      password,
      user_metadata: {
        full_name: fullName,
        role: 'admin'
      }
    });
  }

  const { error: roleError } = await admin.from('user_roles').upsert({
    user_id: userId,
    role: 'admin'
  });

  if (roleError) {
    redirect(`/setup-admin?error=${encodeURIComponent(roleError.message)}`);
  }

  redirect('/login?message=Admin%20created.%20Log%20in%20now.');
}

export default async function SetupAdminPage({
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
          <ShieldCheck className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-ink">Create admin</h1>
          <p className="text-sm text-slate-600">Set up the first Kabul London admin login.</p>
        </div>
      </div>

      {!hasSupabaseEnv() ? (
        <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          Supabase is not connected yet. Add keys to `.env.local`, restart the app, then come back here.
        </div>
      ) : null}

      {error ? (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div>
      ) : null}

      <form action={createAdmin} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-semibold text-ink" htmlFor="full_name">
            Full name
          </label>
          <input
            id="full_name"
            name="full_name"
            className="w-full rounded-md border border-line px-3 py-2"
            placeholder="Kabul London Admin"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold text-ink" htmlFor="email">
            Admin email
          </label>
          <input
            id="email"
            name="email"
            className="w-full rounded-md border border-line px-3 py-2"
            placeholder="admin@kabullondon.co.uk"
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
            placeholder="Choose a password"
            type="password"
            required
          />
        </div>
        <button
          className="w-full rounded-md bg-action px-4 py-2 font-semibold text-white disabled:opacity-50"
          disabled={!hasSupabaseEnv()}
          type="submit"
        >
          Create admin account
        </button>
      </form>
    </div>
  );
}
