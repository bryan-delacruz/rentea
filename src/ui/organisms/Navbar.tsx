'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserButton } from '@clerk/nextjs';
import { LayoutDashboard, Building2, CreditCard, Users, FileText } from 'lucide-react';
import { cn } from '@/shared/utils';
import { useI18n } from '@/i18n/client';
import { LocaleSwitcher } from '@/ui/molecules/LocaleSwitcher';
import { useMediaQuery } from '@/ui/hooks/useMediaQuery';

/**
 * Desktop (1024px and up): a glass sidebar. Phones and tablets: a slim top bar for the brand,
 * language and account, and a bottom tab bar so every section stays in reach.
 */
export function Navbar() {
  const pathname = usePathname();
  const { t } = useI18n();

  const navItems = [
    { href: '/dashboard', label: t.nav.dashboard, icon: LayoutDashboard },
    { href: '/properties', label: t.nav.properties, icon: Building2 },
    { href: '/tenants', label: t.nav.tenants, icon: Users },
    { href: '/leases', label: t.nav.leases, icon: FileText },
    { href: '/payments', label: t.nav.payments, icon: CreditCard },
  ];
  // Clerk mounts one account menu per page, so render it only in the visible bar.
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <>
      {/* Phones and tablets: top bar */}
      <header className="sticky top-0 z-40 flex items-center justify-between gap-3 border-b border-glass-border bg-sidebar px-4 py-3 backdrop-blur-xl backdrop-saturate-150 lg:hidden">
        <Link href="/dashboard" className="text-xl font-semibold tracking-tight text-primary">
          Rentea
        </Link>
        <div className="flex items-center gap-3">
          <LocaleSwitcher />
          {!isDesktop && <UserButton />}
        </div>
      </header>

      {/* Phones and tablets: bottom tab bar */}
      <nav
        aria-label={t.nav.main}
        className="fixed inset-x-0 bottom-0 z-40 border-t border-glass-border bg-sidebar pb-[env(safe-area-inset-bottom)] backdrop-blur-xl backdrop-saturate-150 lg:hidden"
      >
        <ul className="mx-auto grid max-w-lg grid-cols-5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'flex flex-col items-center gap-1 px-1 pb-2 pt-2.5 text-[11px] font-medium leading-none transition-colors',
                    active ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  <span
                    className={cn(
                      'flex h-7 w-12 items-center justify-center rounded-full transition-colors',
                      active && 'bg-primary text-primary-foreground shadow-[inset_0_-2px_0_var(--brass)]',
                    )}
                  >
                    <Icon className="h-[18px] w-[18px]" aria-hidden />
                  </span>
                  <span className="max-w-full truncate">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Desktop: sidebar */}
      <nav
        aria-label={t.nav.main}
        className="sticky top-0 hidden h-screen w-56 shrink-0 flex-col border-r border-glass-border bg-sidebar p-4 backdrop-blur-xl backdrop-saturate-150 lg:flex"
      >
        <Link href="/dashboard" className="mb-8 px-4 text-2xl font-semibold tracking-tight text-primary">
          Rentea
        </Link>
        <div className="flex flex-col gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-4 py-3 transition-colors',
                  active
                    ? 'bg-primary text-primary-foreground shadow-[inset_3px_0_0_var(--brass)]'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
              >
                <Icon className="h-5 w-5" aria-hidden />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
        <div className="mt-auto flex items-center justify-between gap-2 px-4">
          <LocaleSwitcher />
          {isDesktop && <UserButton />}
        </div>
      </nav>
    </>
  );
}
