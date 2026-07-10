'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { BarChart3, ClipboardList, Home, LogIn, LogOut, Menu, X } from 'lucide-react';
import type { Role } from '@/lib/types';

type SignOutAction = () => void | Promise<void>;

const adminMenuItems = [
  { href: '/dashboard', label: 'Dashboard', icon: BarChart3 },
  { href: '/leads', label: 'Leads', icon: ClipboardList }
];

const surveyorMenuItems = [
  { href: '/my-leads', label: 'Home', icon: Home },
  { href: '/my-properties', label: 'Leads', icon: ClipboardList }
];

export function MobileTopMenuClient({
  loggedIn,
  role,
  signOut
}: {
  loggedIn: boolean;
  role: Role | null;
  signOut: SignOutAction;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const menuItems = role === 'surveyor' ? surveyorMenuItems : adminMenuItems;

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <div className="flex items-center gap-4 md:hidden">
      <span className="h-3 w-3 rounded-full bg-emerald-500" />
      <button
        aria-expanded={open}
        aria-label={open ? 'Close menu' : 'Open menu'}
        className="rounded-md p-1 text-ink"
        onClick={() => setOpen((value) => !value)}
        type="button"
      >
        {open ? <X className="h-8 w-8" /> : <Menu className="h-8 w-8" />}
      </button>

      {open ? (
        <div className="fixed inset-x-0 top-[92px] z-30 border-b border-line bg-white px-8 py-3 shadow-soft">
          <div className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setOpen(false)}
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
              <form action={signOut} onSubmit={() => setOpen(false)}>
                <button className="flex w-full items-center gap-5 rounded-md px-2 py-4 text-left text-lg font-medium text-ink hover:bg-slate-50">
                  <LogOut className="h-6 w-6 text-slate-700" />
                  Sign out
                </button>
              </form>
            ) : (
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="flex items-center gap-5 rounded-md px-2 py-4 text-lg font-medium text-ink"
              >
                <LogIn className="h-6 w-6 text-slate-700" />
                Login
              </Link>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
