import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  BarChart3,
  ClipboardList,
  LogIn,
  LogOut,
  Menu,
  Home
} from 'lucide-react';
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

const adminMenuItems = [
  { href: '/dashboard', label: 'Dashboard', icon: BarChart3 },
  { href: '/leads', label: 'Leads', icon: ClipboardList }
];

const surveyorMenuItems = [
  { href: '/my-leads', label: 'Home', icon: Home },
  { href: '/my-leads#my-properties', label: 'Leads', icon: ClipboardList }
];

export function MobileTopMenu({ loggedIn, role }: { loggedIn: boolean; role: Role | null }) {
  const menuItems = role === 'surveyor' ? surveyorMenuItems : adminMenuItems;

  return (
    <div className="flex items-center gap-4 md:hidden">
      <span className="h-3 w-3 rounded-full bg-emerald-500" />
      <details className="group">
        <summary className="list-none rounded-md p-1 text-ink marker:hidden">
          <Menu className="h-8 w-8" />
        </summary>
        <div className="fixed inset-x-0 top-[92px] z-30 border-b border-line bg-white px-8 py-3 shadow-soft">
          <div className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className="flex items-center gap-5 rounded-md px-2 py-4 text-lg font-medium text-ink hover:bg-slate-50"
                >
                  <Icon className="h-6 w-6 text-slate-700" />
                  {item.label}
                </Link>
              );
            })}
          </div>
          <div className="mt-3 border-t border-line pt-3">
            {loggedIn ? (
              <form action={signOut}>
                <button className="flex w-full items-center gap-5 rounded-md px-2 py-4 text-left text-lg font-medium text-ink hover:bg-slate-50">
                  <LogOut className="h-6 w-6 text-slate-700" />
                  Sign out
                </button>
              </form>
            ) : (
              <Link href="/login" className="flex items-center gap-5 rounded-md px-2 py-4 text-lg font-medium text-ink">
                <LogIn className="h-6 w-6 text-slate-700" />
                Login
              </Link>
            )}
          </div>
        </div>
      </details>
    </div>
  );
}

export function MobileBottomNavigation({ loggedIn, role }: { loggedIn: boolean; role: Role | null }) {
  const isSurveyor = role === 'surveyor';

  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-3 border-t border-line bg-white md:hidden">
      <Link className="flex flex-col items-center gap-1 px-2 py-3 text-xs font-semibold text-ink" href={isSurveyor ? '/my-leads' : '/dashboard'}>
        <Home className="h-5 w-5" />
        Home
      </Link>
      <Link className="flex flex-col items-center gap-1 px-2 py-3 text-xs font-semibold text-ink" href={isSurveyor ? '/my-leads#my-properties' : '/leads'}>
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
