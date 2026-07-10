import { cache } from 'react';
import { getUserRoleSafe } from '@/lib/authz';
import { createSupabaseServerClient, hasSupabaseEnv } from '@/lib/supabase/server';
import type { Role } from '@/lib/types';

export const getSessionState = cache(async (): Promise<{ loggedIn: boolean; role: Role | null; userId: string | null }> => {
  if (!hasSupabaseEnv()) {
    return { loggedIn: false, role: null, userId: null };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return { loggedIn: false, role: null, userId: null };
  }

  return {
    loggedIn: true,
    role: await getUserRoleSafe(user.id),
    userId: user.id
  };
});
