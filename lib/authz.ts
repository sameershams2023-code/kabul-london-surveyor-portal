import { createSupabaseAdminClient } from '@/lib/supabase/server';
import type { Role } from '@/lib/types';

export async function getUserRole(userId: string | null | undefined): Promise<Role | null> {
  if (!userId) return null;
  const admin = createSupabaseAdminClient();
  const { data } = await admin.from('user_roles').select('role').eq('user_id', userId).single();
  return (data?.role as Role | undefined) ?? null;
}

export async function getUserRoleSafe(userId: string | null | undefined): Promise<Role | null> {
  try {
    return await getUserRole(userId);
  } catch {
    return null;
  }
}

export function hasRole(role: Role | null, allowed: Role[]) {
  return Boolean(role && allowed.includes(role));
}
