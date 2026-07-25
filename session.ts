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

  const role = await getUserRoleSafe(user.id);

  if (!role) {
    const { data: surveyor } = await supabase.from('surveyors').select('id').eq('user_id', user.id).maybeSingle();

    if (surveyor?.id) {
      return {
        loggedIn: true,
        role: 'surveyor',
        userId: user.id
      };
    }
  }

  return {
    loggedIn: true,
    role,
    userId: user.id
  };
});
