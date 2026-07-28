import { NextResponse } from 'next/server';
import { getUserRoleSafe, hasRole } from '@/lib/authz';
import { createSupabaseServerClient, hasSupabaseEnv } from '@/lib/supabase/server';
import { syncTidyCalBookings } from '@/lib/tidycal';

async function canSync(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get('authorization');

  if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
    return true;
  }

  if (!hasSupabaseEnv()) return false;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  const role = await getUserRoleSafe(user?.id);
  return hasRole(role, ['owner', 'admin', 'manager']);
}

async function sync(request: Request) {
  if (!(await canSync(request))) {
    return NextResponse.json({ error: 'Only admin or manager can sync TidyCal bookings.' }, { status: 403 });
  }

  try {
    const result = await syncTidyCalBookings(30);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'TidyCal sync failed.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  return sync(request);
}

export async function POST(request: Request) {
  return sync(request);
}
