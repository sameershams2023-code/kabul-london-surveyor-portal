import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Inter } from 'next/font/google';
import Link from 'next/link';
import { BarChart3, ClipboardList, Upload, UsersRound, UserRoundCheck } from 'lucide-react';
import { AuthButtons } from '@/components/auth/auth-buttons';
import { MobileBottomNavigation, MobileTopMenu } from '@/components/mobile-navigation';
import { getSessionState } from '@/lib/session';
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

const surveyorNav = [
  { href: '/my-leads', label: 'Home', icon: BarChart3 },
  { href: '/my-properties', label: 'Leads', icon: ClipboardList }
];

export default async function RootLayout({ children }: { children: ReactNode }) {
  const { loggedIn, role } = await getSessionState();
  const hideNavigation = !loggedIn;
  const visibleNav = role === 'surveyor' ? surveyorNav : nav;
  const homeHref = role === 'surveyor' ? '/my-leads' : '/dashboard';

  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen">
          {hideNavigation ? null : (
            <>
              <div className="h-4 bg-brand md:h-5" />
              <header className="border-b border-line bg-white">
                <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4">
                  <Link href={homeHref} className="flex items-center gap-3 text-lg font-semibold text-ink">
                    <img
                      src="/icon-192.png"
                      alt="Kabul London"
                      className="h-9 w-9 rounded-md border border-line bg-white object-contain"
                    />
                    Kabul London
                  </Link>
                  <nav className="hidden flex-wrap gap-2 md:flex">
                    {visibleNav.map((item) => {
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
                    <AuthButtons loggedIn={loggedIn} />
                  </nav>
                  <MobileTopMenu loggedIn={loggedIn} role={role} />
                </div>
              </header>
            </>
          )}
          <main className={`mx-auto max-w-7xl px-4 py-6 ${hideNavigation ? 'md:py-10' : 'pb-24 md:pb-6'}`}>
            {children}
          </main>
          {hideNavigation ? null : <MobileBottomNavigation loggedIn={loggedIn} role={role} />}
        </div>
      </body>
    </html>
  );
}
