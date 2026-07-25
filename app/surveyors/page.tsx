import { redirect } from 'next/navigation';
import { SurveyorManager } from '@/components/surveyor-manager';
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

async function updateSurveyor(formData: FormData) {
  'use server';

  if (!hasSupabaseEnv()) {
    redirect('/surveyors?error=Connect%20Supabase%20before%20updating%20surveyor%20logins');
  }

  const surveyorId = String(formData.get('surveyor_id') ?? '').trim();
  const userId = String(formData.get('user_id') ?? '').trim();
  const fullName = String(formData.get('full_name') ?? '').trim();
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const password = String(formData.get('password') ?? '');
  const phone = String(formData.get('phone') ?? '').trim();
  const serviceArea = String(formData.get('service_area') ?? '').trim();
  const tidycalLink = String(formData.get('tidycal_link') ?? '').trim();
  const active = formData.get('active') === 'true';

  if (!surveyorId || !fullName || !email) {
    redirect('/surveyors?error=Surveyor,%20full%20name,%20and%20email%20are%20required');
  }

  const admin = createSupabaseAdminClient();

  if (userId) {
    const authUpdate: {
      email: string;
      password?: string;
      user_metadata: {
        full_name: string;
        role: 'surveyor';
      };
    } = {
      email,
      user_metadata: {
        full_name: fullName,
        role: 'surveyor'
      }
    };

    if (password) {
      authUpdate.password = password;
    }

    const { error: authError } = await admin.auth.admin.updateUserById(userId, authUpdate);

    if (authError) {
      redirect(`/surveyors?error=${encodeURIComponent(authError.message)}`);
    }

    const { error: roleError } = await admin.from('user_roles').upsert({
      user_id: userId,
      role: 'surveyor'
    });

    if (roleError) {
      redirect(`/surveyors?error=${encodeURIComponent(roleError.message)}`);
    }
  }

  const { error: surveyorError } = await admin
    .from('surveyors')
    .update({
      full_name: fullName,
      email,
      phone: phone || null,
      tidycal_link: tidycalLink || null,
      service_area: serviceArea || null,
      active
    })
    .eq('id', surveyorId);

  if (surveyorError) {
    redirect(`/surveyors?error=${encodeURIComponent(surveyorError.message)}`);
  }

  redirect(`/surveyors?updated=1&selected=${surveyorId}`);
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
  const updated = params.updated === '1';
  const selectedId = typeof params.selected === 'string' ? params.selected : null;

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

      {updated ? (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
          Surveyor details saved.
        </div>
      ) : null}

      <SurveyorManager
        canSubmit={hasSupabaseEnv()}
        createSurveyorAction={createSurveyor}
        selectedId={selectedId}
        surveyors={surveyors}
        updateSurveyorAction={updateSurveyor}
      />
    </div>
  );
}
