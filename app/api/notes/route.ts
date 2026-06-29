import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createSupabaseAdminClient, createSupabaseServerClient, hasSupabaseEnv } from '@/lib/supabase/server';
import { getUserRole, hasRole } from '@/lib/authz';

const schema = z.object({
  lead_id: z.string().min(1),
  note: z.string().min(1).max(2000)
});

export async function POST(request: Request) {
  if (!hasSupabaseEnv()) {
    return NextResponse.json({ error: 'Connect Supabase before saving notes.' }, { status: 400 });
  }

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'A lead_id and note are required.' }, { status: 422 });
  }

  const userClient = await createSupabaseServerClient();
  const {
    data: { user }
  } = await userClient.auth.getUser();

  if (!user) return NextResponse.json({ error: 'You must be signed in to save notes.' }, { status: 401 });

  const role = await getUserRole(user.id);
  if (!hasRole(role, ['owner', 'admin', 'manager', 'surveyor', 'office_agent'])) {
    return NextResponse.json({ error: 'You do not have permission to save notes.' }, { status: 403 });
  }

  const admin = createSupabaseAdminClient();
  const { data: lead } = await admin
    .from('leads')
    .select('id,surveyors(user_id)')
    .eq('id', parsed.data.lead_id)
    .single();

  if (!lead) return NextResponse.json({ error: 'Lead was not found.' }, { status: 404 });
  const surveyor = Array.isArray(lead.surveyors) ? lead.surveyors[0] : lead.surveyors;
  if (role === 'surveyor' && surveyor?.user_id !== user.id) {
    return NextResponse.json({ error: 'Surveyors can only add notes to their own leads.' }, { status: 403 });
  }

  const { error } = await admin.from('notes').insert({
    lead_id: parsed.data.lead_id,
    user_id: user.id,
    note: parsed.data.note
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
