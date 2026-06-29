import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  BarChart3,
  CalendarDays,
  ClipboardList,
  DoorOpen,
  LogIn,
  LogOut,
  Map,
  Menu,
  NotebookTabs,
  UserRoundCheck
} from 'lucide-react';
import { createSupabaseServerClient, hasSupabaseEnv } from '@/lib/supabase/server';

async function signOut() {
  'use server';

  if (hasSupabaseEnv()) {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
  }

  redirect('/login');
}

const mobileMenuItems = [
  { href: '/my-leads', label: 'My Schedule', icon: CalendarDays },
  { href: '/my-leads', label: 'My Properties', icon: ClipboardList },
  { href: '/my-leads', label: 'Map', icon: Map },
  { href: '/my-leads', label: 'Door Knock Map', icon: DoorOpen },
  { href: '/dashboard', label: 'My Report', icon: BarChart3 },
  { href: '/dashboard', label: 'My Activity', icon: NotebookTabs }
];

async function getLoggedIn() {
  if (!hasSupabaseEnv()) {
    return false;
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  return Boolean(user);
}

export async function MobileTopMenu() {
  const loggedIn = await getLoggedIn();

  return (
    <div className="flex items-center gap-4 md:hidden">
      <span className="h-3 w-3 rounded-full bg-emerald-500" />
      <details className="group">
        <summary className="list-none rounded-md p-1 text-ink marker:hidden">
          <Menu className="h-8 w-8" />
        </summary>
        <div className="fixed inset-x-0 top-[92px] z-30 border-b border-line bg-white px-8 py-3 shadow-soft">
          <div className="space-y-1">
            {mobileMenuItems.map((item) => {
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

export async function MobileBottomNavigation() {
  const loggedIn = await getLoggedIn();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-4 border-t border-line bg-white md:hidden">
      <Link className="flex flex-col items-center gap-1 px-2 py-3 text-xs font-semibold text-ink" href="/dashboard">
        <BarChart3 className="h-5 w-5" />
        Home
      </Link>
      <Link className="flex flex-col items-center gap-1 px-2 py-3 text-xs font-semibold text-ink" href="/my-leads">
        <UserRoundCheck className="h-5 w-5" />
        My leads
      </Link>
      <Link className="flex flex-col items-center gap-1 px-2 py-3 text-xs font-semibold text-ink" href="/leads">
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
