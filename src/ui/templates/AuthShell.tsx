import type { ReactNode } from 'react';
import Link from 'next/link';
import { LocaleSwitcher } from '@/ui/molecules/LocaleSwitcher';

/** Sign-in and sign-up: the brand, the Clerk form and the language switch, centered. */
export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-4">
      <Link href="/" className="text-2xl font-semibold tracking-tight text-primary">
        Rentea
      </Link>
      {children}
      <LocaleSwitcher />
    </div>
  );
}
