import { redirect } from 'next/navigation';
import { CalendarCheck, Plus, UserRoundPlus } from 'lucide-react';
import { getSurveyors } from '@/lib/data';
import { createSupabaseAdminClient, hasSupabaseEnv } from '@/lib/supabase/server';

async function createSurveyor(formData: FormData) {
  'use server';

  if (!hasSupabaseEnv()) {
    redirect('/surveyors?error=Connect%20Supabase%20before%20creating%20surveyor%20logins');
  }

  const fullName = String(formData.get('full_name') ?? '').trim();
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const password = String(formData.get('password') ?? '');
  const phone = String(formData.get('phone') ?? '').trim();
  const serviceArea = String(formData.get('service_area') ?? '').trim();
  const tidycalLink = String(formData.get('tidycal_link') ?? '').trim();

  if (!fullName || !email || !password) {
    redirect('/surveyors?error=Full%20name,%20email,%20and%20password%20are%20required');
  }

  const admin = createSupabaseAdminClient();
  const { data: authUser, error: authError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      role: 'surveyor'
    }
  });

  let userId = authUser.user?.id;

  if (authError || !userId) {
    const message = authError?.message ?? 'Could not create login';
    const mightAlreadyExist = message.toLowerCase().includes('already') || message.toLowerCase().includes('registered');

    if (!mightAlreadyExist) {
      redirect(`/surveyors?error=${encodeURIComponent(message)}`);
    }

    const { data: users, error: listError } = await admin.auth.admin.listUsers();
    const existing = users?.users.find((user) => user.email?.toLowerCase() === email);

    if (listError || !existing) {
      redirect(`/surveyors?error=${encodeURIComponent(listError?.message ?? message)}`);
    }

    userId = existing.id;
  }

  const { error: roleError } = await admin.from('user_roles').upsert({
    user_id: userId,
    role: 'surveyor'
  });

  if (roleError) {
    redirect(`/surveyors?error=${encodeURIComponent(roleError.message)}`);
  }

  const { error: surveyorError } = await admin.from('surveyors').upsert(
  {
    user_id: userId,
    full_name: fullName,
    email,
    phone: phone || null,
    tidycal_link: tidycalLink || null,
    service_area: serviceArea || null,
    active: true
  },
  { onConflict: 'email' }
  );

  if (surveyorError) {
    redirect(`/surveyors?error=${encodeURIComponent(surveyorError.message)}`);
  }

  redirect('/surveyors?created=1');
}

export default async function SurveyorsPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const surveyors = await getSurveyors();
  const error = typeof params.error === 'string' ? params.error : null;
  const created = params.created === '1';

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Surveyors</h1>
          <p className="text-sm text-slate-600">Create real surveyor logins and assign them properties.</p>
        </div>
      </div>

      {!hasSupabaseEnv() ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Supabase is not connected yet. Add your Supabase keys in `.env.local`, restart the app, then create
          surveyor logins here.
        </div>
      ) : null}

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>
      ) : null}

      {created ? (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
          Surveyor login created. You can now assign properties to this surveyor.
        </div>
      ) : null}

      <section className="rounded-md border border-line bg-white p-5 shadow-soft">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-brand text-white">
            <UserRoundPlus className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-ink">Add surveyor login</h2>
            <p className="text-sm text-slate-600">This creates their app login and surveyor profile together.</p>
          </div>
        </div>

        <form action={createSurveyor} className="grid gap-3 md:grid-cols-2">
          <Field label="Full name" name="full_name" placeholder="Sameer Shams" required />
          <Field label="Email login" name="email" placeholder="sameer@kabullondon.co.uk" type="email" required />
          <Field label="Temporary password" name="password" placeholder="Set a strong password" type="password" required />
          <Field label="Phone" name="phone" placeholder="+447..." />
          <Field label="Service area" name="service_area" placeholder="West London" />
          <Field label="TidyCal booking link" name="tidycal_link" placeholder="https://tidycal.com/..." />
          <div className="md:col-span-2">
            <button
              className="inline-flex items-center gap-2 rounded-md bg-action px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              disabled={!hasSupabaseEnv()}
              type="submit"
            >
              <Plus className="h-4 w-4" />
              Create surveyor login
            </button>
          </div>
        </form>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        {surveyors.map((surveyor) => (
          <article key={surveyor.id} className="rounded-md border border-line bg-white p-5 shadow-soft">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-ink">{surveyor.full_name}</h2>
                <p className="text-sm text-slate-600">{surveyor.email}</p>
              </div>
              <span className="rounded-md bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800">
                {surveyor.active ? 'Active' : 'Inactive'}
              </span>
            </div>
            <dl className="mt-5 grid gap-3 text-sm">
              <div>
                <dt className="font-semibold text-slate-500">Phone</dt>
                <dd>{surveyor.phone ?? 'Not saved'}</dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-500">Service area</dt>
                <dd>{surveyor.service_area ?? 'Not saved'}</dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-500">TidyCal booking link</dt>
                <dd className="mt-1 inline-flex items-center gap-2 break-all text-brand">
                  <CalendarCheck className="h-4 w-4 shrink-0" />
                  {surveyor.tidycal_link ?? 'Not set'}
                </dd>
              </div>
            </dl>
          </article>
        ))}
      </div>
    </div>
  );
}

function Field({
  label,
  name,
  placeholder,
  type = 'text',
  required = false
}: {
  label: string;
  name: string;
  placeholder: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-semibold text-ink">{label}</span>
      <input
        className="w-full rounded-md border border-line px-3 py-2"
        name={name}
        placeholder={placeholder}
        required={required}
        type={type}
      />
    </label>
  );
}
