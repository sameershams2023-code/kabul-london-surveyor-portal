import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createSupabaseAdminClient, createSupabaseServerClient, hasSupabaseEnv } from '@/lib/supabase/server';
import { getUserRole, hasRole } from '@/lib/authz';

const rowSchema = z.object({
  customer_name: z.string().min(1),
  phone: z.string().regex(/^\+?[0-9\s-]{10,18}$/),
  email: z.string().email().optional().or(z.literal('')),
  property_address: z.string().min(1),
  postcode: z.string().min(1),
  service_type: z.string().min(1),
  assigned_surveyor_email: z.string().email()
});

function normalisePhone(phone: string) {
  const compact = phone.replace(/[^\d+]/g, '');
  if (compact.startsWith('07')) return `+44${compact.slice(1)}`;
  if (compact.startsWith('7')) return `+44${compact}`;
  return compact;
}

function normaliseRow(row: Record<string, string>) {
  const email = String(row.email ?? '').trim();
  return {
    ...row,
    phone: normalisePhone(String(row.phone ?? '')),
    email: email.toUpperCase() === 'N/A' ? '' : email,
    assigned_surveyor_email: String(row.assigned_surveyor_email ?? '').trim().toLowerCase()
  };
}

export async function POST(request: Request) {
  if (!hasSupabaseEnv()) {
    return NextResponse.json({ error: 'Connect Supabase before importing leads.' }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  const rows = z.array(z.record(z.string())).safeParse(body?.rows);
  if (!rows.success) {
    return NextResponse.json({ error: 'rows must be an array of CSV records.' }, { status: 422 });
  }

  const userClient = await createSupabaseServerClient();
  const {
    data: { user }
  } = await userClient.auth.getUser();

  const role = await getUserRole(user?.id);
  if (!hasRole(role, ['owner', 'admin', 'manager'])) {
    return NextResponse.json({ error: 'Only admins and managers can import leads.' }, { status: 403 });
  }

  const admin = createSupabaseAdminClient();
  const { data: surveyors } = await admin.from('surveyors').select('id,email');
  const byEmail = new Map((surveyors ?? []).map((surveyor) => [surveyor.email.toLowerCase(), surveyor.id]));

  const validRows = rows.data.flatMap((rawRow) => {
    const normalised = normaliseRow(rawRow);
    const parsed = rowSchema.safeParse(normalised);

    if (!parsed.success || !byEmail.has(parsed.data.assigned_surveyor_email.toLowerCase())) {
      return [];
    }

    return [parsed.data];
  });

  const insertRows = validRows.map((row) => {
    return {
      customer_name: row.customer_name,
      phone: row.phone,
      email: row.email || null,
      property_address: row.property_address,
      postcode: row.postcode,
      service_type: row.service_type,
      source: 'CSV import',
      current_status: 'New',
      assigned_surveyor_id: byEmail.get(row.assigned_surveyor_email.toLowerCase()),
      created_by: user?.id ?? null
    };
  });

  const { error } = insertRows.length ? await admin.from('leads').insert(insertRows) : { error: null };
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ imported: insertRows.length, failed: rows.data.length - insertRows.length });
}
