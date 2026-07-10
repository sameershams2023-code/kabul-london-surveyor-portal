'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';

export function HideOnLogin({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  if (pathname === '/login') {
    return null;
  }

  return <>{children}</>;
}
