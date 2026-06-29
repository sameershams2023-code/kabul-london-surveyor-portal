import { NextResponse } from 'next/server';
import { z } from 'zod';
import { leadStatuses } from '@/lib/status';
import { createSupabaseAdminClient, createSupabaseServerClient, hasSupabaseEnv } from '@/lib/supabase/server';
import { getUserRole, hasRole } from '@/lib/authz';

const schema = z.object({
  lead_id: z.string().min(1),
  status: z.enum(leadStatuses)
});

export async function POST(request: Request) {
  if (!hasSupabaseEnv()) {
    return NextResponse.json({ error: 'Connect Supabase before saving status updates.' }, { status: 400 });
  }

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Valid lead_id and status are required.' }, { status: 422 });
  }

  const userClient = await createSupabaseServerClient();
  const {
    data: { user }
  } = await userClient.auth.getUser();

  const role = await getUserRole(user?.id);
  if (!hasRole(role, ['owner', 'admin', 'manager', 'surveyor', 'office_agent'])) {
    return NextResponse.json({ error: 'You do not have permission to update leads.' }, { status: 403 });
  }

  const admin = createSupabaseAdminClient();
  const { data: lead } = await admin
    .from('leads')
    .select('id,current_status,created_by,surveyors(user_id)')
    .eq('id', parsed.data.lead_id)
    .single();

  if (!lead) return NextResponse.json({ error: 'Lead was not found.' }, { status: 404 });
  const surveyor = Array.isArray(lead.surveyors) ? lead.surveyors[0] : lead.surveyors;
  if (role === 'surveyor' && surveyor?.user_id !== user?.id) {
    return NextResponse.json({ error: 'Surveyors can only update their own leads.' }, { status: 403 });
  }

  await admin
    .from('leads')
    .update({ current_status: parsed.data.status, updated_at: new Date().toISOString() })
    .eq('id', lead.id);

  await admin.from('lead_status_history').insert({
    lead_id: lead.id,
    old_status: lead.current_status,
    new_status: parsed.data.status,
    changed_by: user?.id ?? lead.created_by ?? null,
    note: 'Status changed from portal.'
  });

  return NextResponse.json({ ok: true });
}
