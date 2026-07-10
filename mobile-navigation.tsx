import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ClipboardList, Home, LogIn, LogOut } from 'lucide-react';
import { MobileTopMenuClient } from '@/components/mobile-top-menu-client';
import { createSupabaseServerClient, hasSupabaseEnv } from '@/lib/supabase/server';
import type { Role } from '@/lib/types';

async function signOut() {
  'use server';

  if (hasSupabaseEnv()) {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
  }

  redirect('/login');
}

export function MobileTopMenu({ loggedIn, role }: { loggedIn: boolean; role: Role | null }) {
  return <MobileTopMenuClient loggedIn={loggedIn} role={role} signOut={signOut} />;
}

export function MobileBottomNavigation({ loggedIn, role }: { loggedIn: boolean; role: Role | null }) {
  const isSurveyor = role === 'surveyor';

  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-3 border-t border-line bg-white md:hidden">
      <Link className="flex flex-col items-center gap-1 px-2 py-3 text-xs font-semibold text-ink" href={isSurveyor ? '/my-leads' : '/dashboard'}>
        <Home className="h-5 w-5" />
        Home
      </Link>
      <Link className="flex flex-col items-center gap-1 px-2 py-3 text-xs font-semibold text-ink" href={isSurveyor ? '/my-properties' : '/leads'}>
        <ClipboardList className="h-5 w-5" />
        Leads
      </Link>
      {loggedIn ? (
        <form action={signOut}>
          <button className="flex w-full flex-col items-center gap-1 px-2 py-3 text-xs font-semibold text-ink">
            <LogOut className="h-5 w-5" />
            Sign out
          </button>
        </form>
      ) : (
        <Link className="flex flex-col items-center gap-1 px-2 py-3 text-xs font-semibold text-ink" href="/login">
          <LogIn className="h-5 w-5" />
          Login
        </Link>
      )}
    </nav>
  );
}
