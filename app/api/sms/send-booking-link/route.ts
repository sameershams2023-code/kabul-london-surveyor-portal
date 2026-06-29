import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createSupabaseAdminClient, createSupabaseServerClient, hasSupabaseEnv } from '@/lib/supabase/server';
import { sendYaySms } from '@/lib/yay';
import { getUserRole, hasRole } from '@/lib/authz';

const schema = z.object({
  lead_id: z.string().min(1)
});

export async function POST(request: Request) {
  if (!hasSupabaseEnv()) {
    return NextResponse.json({ error: 'Connect Supabase before sending live SMS messages.' }, { status: 400 });
  }

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'lead_id is required.' }, { status: 422 });
  }

  const userClient = await createSupabaseServerClient();
  const {
    data: { user }
  } = await userClient.auth.getUser();

  const role = await getUserRole(user?.id);
  if (!hasRole(role, ['owner', 'admin', 'manager', 'surveyor', 'office_agent'])) {
    return NextResponse.json({ error: 'You do not have permission to send booking SMS messages.' }, { status: 403 });
  }

  const admin = createSupabaseAdminClient();
  const { data: lead, error: leadError } = await admin
    .from('leads')
    .select('*, surveyors(*)')
    .eq('id', parsed.data.lead_id)
    .single();

  if (leadError || !lead) {
    return NextResponse.json({ error: 'Lead was not found.' }, { status: 404 });
  }

  const surveyor = lead.surveyors;
  if (role === 'surveyor' && surveyor?.user_id !== user?.id) {
    return NextResponse.json({ error: 'Surveyors can only send SMS for their own leads.' }, { status: 403 });
  }

  if (!surveyor?.tidycal_link) {
    return NextResponse.json({ error: 'Assigned surveyor does not have a TidyCal link.' }, { status: 400 });
  }

  const message = `Hi ${lead.customer_name}, this is Kabul London Ltd. Please book your property survey appointment here: ${surveyor.tidycal_link}. Thank you.`;
  const yay = await sendYaySms({ to: lead.phone, body: message });
  const sentBy = user?.id ?? lead.created_by ?? null;

  const { error: smsError } = await admin.from('sms_messages').insert({
    lead_id: lead.id,
    surveyor_id: lead.assigned_surveyor_id,
    recipient_phone: lead.phone,
    message_body: message,
    yay_message_id: yay.messageId,
    delivery_status: yay.deliveryStatus,
    sent_by: sentBy
  });

  if (smsError) return NextResponse.json({ error: smsError.message }, { status: 500 });

  await admin.from('leads').update({ current_status: 'SMS sent', updated_at: new Date().toISOString() }).eq('id', lead.id);
  await admin.from('lead_status_history').insert({
    lead_id: lead.id,
    old_status: lead.current_status,
    new_status: 'SMS sent',
    changed_by: sentBy,
    note: 'TidyCal booking SMS sent through Yay.com.'
  });

  return NextResponse.json({ ok: true, delivery_status: yay.deliveryStatus });
}
