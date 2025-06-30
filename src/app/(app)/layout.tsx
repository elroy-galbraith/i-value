'use client'; // AppShell uses client-side hooks like usePathname

import { AppShell } from '@/components/app-shell';

export default function AppPagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell>{children}</AppShell>;
}
