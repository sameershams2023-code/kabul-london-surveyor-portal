import Link from 'next/link';
import { LogIn, LogOut } from 'lucide-react';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient, hasSupabaseEnv } from '@/lib/supabase/server';

async function signOut() {
  'use server';

  if (hasSupabaseEnv()) {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
  }

  redirect('/login');
}

export function AuthButtons({ loggedIn }: { loggedIn: boolean }) {
  if (!loggedIn) {
    return (
      <Link
        href="/login"
        className="inline-flex items-center gap-2 rounded-md border border-line bg-white px-3 py-2 text-sm font-medium text-ink hover:border-brand hover:text-brand"
      >
        <LogIn className="h-4 w-4" />
        Login
      </Link>
    );
  }

  return (
    <form action={signOut}>
      <button className="inline-flex items-center gap-2 rounded-md border border-line bg-white px-3 py-2 text-sm font-medium text-ink hover:border-brand hover:text-brand">
        <LogOut className="h-4 w-4" />
        Sign out
      </button>
    </form>
  );
}
