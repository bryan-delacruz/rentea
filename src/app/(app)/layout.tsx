import { auth } from "@clerk/nextjs/server";
import { AppShell } from "@/ui/templates/AppShell";
import { isDemoOwner } from "@/infrastructure/auth/clerk";
import { getI18n } from "@/i18n/server";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth.protect();
  const { t } = await getI18n();

  return <AppShell banner={isDemoOwner(userId) ? t.nav.demoBanner : undefined}>{children}</AppShell>;
}
