import type { ReactNode } from 'react';
import { Navbar } from '@/ui/organisms/Navbar';

/**
 * Signed-in layout: sidebar on desktop, top and bottom bars on phones and
 * tablets. Content stops at 80rem so wide screens don't stretch the cards.
 */
export function AppShell({ banner, children }: { banner?: ReactNode; children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <Navbar />
      <div className="flex min-w-0 flex-1 flex-col">
        {banner && (
          <div className="border-b bg-warning-soft px-4 py-2 text-center text-sm text-warning md:px-8">
            {banner}
          </div>
        )}
        {/* Bottom padding leaves room for the phone tab bar. */}
        <main className="flex-1 px-4 pb-28 pt-6 sm:px-6 md:px-8 lg:p-8 xl:p-10">
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
