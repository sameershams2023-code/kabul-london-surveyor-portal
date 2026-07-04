import { createSupabaseAdminClient, createSupabaseServerClient, hasSupabaseEnv } from '@/lib/supabase/server';
import type { Booking, Lead, LeadStatusHistory, Note, SmsMessage, Surveyor } from '@/lib/types';

export async function getSurveyors(): Promise<Surveyor[]> {
  if (!hasSupabaseEnv()) return [];
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from('surveyors').select('*').order('full_name');
  return (data as Surveyor[] | null) ?? [];
}

export async function getLeads(): Promise<Lead[]> {
  if (!hasSupabaseEnv()) return [];
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from('leads')
    .select('*, surveyors(full_name,email,tidycal_link)')
    .order('created_at', { ascending: false });
  return (data as Lead[] | null) ?? [];
}

export async function getLead(id: string): Promise<Lead | null> {
  const leads = await getLeads();
  return leads.find((lead) => lead.id === id) ?? null;
}

export async function getLeadActivity(leadId: string): Promise<{
  notes: Note[];
  smsMessages: SmsMessage[];
  bookings: Booking[];
}> {
  if (!hasSupabaseEnv()) {
    return {
      notes: [],
      smsMessages: [],
      bookings: []
    };
  }

  const supabase = await createSupabaseServerClient();
  const [notes, smsMessages, bookings] = await Promise.all([
    supabase.from('notes').select('*').eq('lead_id', leadId).order('created_at', { ascending: false }),
    supabase.from('sms_messages').select('*').eq('lead_id', leadId).order('created_at', { ascending: false }),
    supabase.from('bookings').select('*').eq('lead_id', leadId).order('created_at', { ascending: false })
  ]);

  return {
    notes: (notes.data as Note[] | null) ?? [],
    smsMessages: (smsMessages.data as SmsMessage[] | null) ?? [],
    bookings: (bookings.data as Booking[] | null) ?? []
  };
}

export async function getTodaysBookingsForSurveyor(surveyorId: string): Promise<Booking[]> {
  if (!hasSupabaseEnv()) return [];

  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from('bookings')
    .select(
      `
      *,
      leads(id,customer_name,phone,property_address,postcode,service_type)
    `
    )
    .eq('surveyor_id', surveyorId)
    .gte('booking_time', start.toISOString())
    .lt('booking_time', end.toISOString())
    .order('booking_time', { ascending: true });

  return (data as Booking[] | null) ?? [];
}

export async function getRecentStatusHistory(limit = 20): Promise<LeadStatusHistory[]> {
  if (!hasSupabaseEnv()) return [];

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from('lead_status_history')
    .select(
      `
      id,
      lead_id,
      old_status,
      new_status,
      changed_by,
      note,
      created_at,
      leads(customer_name,property_address,postcode)
    `
    )
    .order('created_at', { ascending: false })
    .limit(limit);

  const history = (data as LeadStatusHistory[] | null) ?? [];
  const changedByIds = Array.from(new Set(history.map((item) => item.changed_by).filter(Boolean))) as string[];

  if (!changedByIds.length) return history;

  const { data: surveyors } = await supabase
    .from('surveyors')
    .select('user_id,full_name,email')
    .in('user_id', changedByIds);

  const surveyorByUserId = new Map(
    (surveyors ?? []).map((surveyor) => [
      surveyor.user_id,
      {
        full_name: surveyor.full_name,
        email: surveyor.email
      }
    ])
  );

  const missingUserIds = changedByIds.filter((id) => !surveyorByUserId.has(id));
  const authEmailByUserId = new Map<string, string>();

  if (missingUserIds.length) {
    try {
      const admin = createSupabaseAdminClient();
      const users = await Promise.all(missingUserIds.map((id) => admin.auth.admin.getUserById(id)));
      users.forEach((result, index) => {
        const email = result.data.user?.email;
        if (email) authEmailByUserId.set(missingUserIds[index], email);
      });
    } catch {
      // If the service role key is missing, the dashboard can still show surveyor names and status changes.
    }
  }

  return history.map((item) => ({
    ...item,
    changed_by_surveyor: item.changed_by ? surveyorByUserId.get(item.changed_by) ?? null : null,
    changed_by_email: item.changed_by ? authEmailByUserId.get(item.changed_by) ?? null : null
  }));
}

export function getLeadMetrics(leads: Lead[]) {
  const today = new Date().toISOString().slice(0, 10);
  const count = (status: string) => leads.filter((lead) => lead.current_status === status).length;

  return [
    { label: 'Total leads', value: leads.length },
    { label: 'New leads', value: count('New') },
    { label: 'First attempts', value: count('First attempt') },
    { label: 'Second attempts', value: count('Second attempt') },
    { label: 'Third attempts', value: count('Third attempt') },
    { label: 'Appointments booked', value: count('Appointment booked') },
    { label: 'Completed', value: count('Completed') },
    { label: 'Refused', value: count('Refused') },
    { label: 'No access', value: count('No access') },
    { label: 'No Show', value: count('No Show') },
    {
      label: 'SMS sent today',
      value: leads.filter((lead) => lead.current_status === 'SMS sent' && lead.updated_at.startsWith(today)).length
    }
  ];
}
