import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Inter } from 'next/font/google';
import Link from 'next/link';
import { BarChart3, ClipboardList, LogIn, Menu, Upload, UsersRound, UserRoundCheck } from 'lucide-react';
import { AuthButtons } from '@/components/auth/auth-buttons';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Kabul London Surveyor Portal',
  description: 'Team management portal for Kabul London Ltd surveyors',
  icons: {
    icon: [
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' }
    ],
    apple: [{ url: '/icon-192.png', sizes: '192x192', type: 'image/png' }]
  }
};

const nav = [
  { href: '/dashboard', label: 'Dashboard', icon: BarChart3 },
  { href: '/leads', label: 'Leads', icon: ClipboardList },
  { href: '/my-leads', label: 'My leads', icon: UserRoundCheck },
  { href: '/surveyors', label: 'Surveyors', icon: UsersRound },
  { href: '/import', label: 'Import', icon: Upload }
];

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen">
          <div className="h-4 bg-brand md:h-5" />
          <header className="border-b border-line bg-white">
            <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4">
              <Link href="/dashboard" className="flex items-center gap-3 text-lg font-semibold text-ink">
                <img
                  src="/icon-192.png"
                  alt="Kabul London"
                  className="h-9 w-9 rounded-md border border-line bg-white object-contain"
                />
                Kabul London
              </Link>
              <nav className="hidden flex-wrap gap-2 md:flex">
                {nav.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="inline-flex items-center gap-2 rounded-md border border-line bg-white px-3 py-2 text-sm font-medium text-ink hover:border-brand hover:text-brand"
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  );
                })}
                <AuthButtons />
              </nav>
              <div className="flex items-center gap-4 md:hidden">
                <span className="h-3 w-3 rounded-full bg-emerald-500" />
                <Menu className="h-7 w-7 text-ink" />
              </div>
            </div>
          </header>
          <main className="mx-auto max-w-7xl px-4 py-6 pb-24 md:pb-6">{children}</main>
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
            <Link className="flex flex-col items-center gap-1 px-2 py-3 text-xs font-semibold text-ink" href="/login">
              <LogIn className="h-5 w-5" />
              Login
            </Link>
          </nav>
        </div>
      </body>
    </html>
  );
}
