import { Dashboard } from "@/ui/organisms/Dashboard";
import { todayISO } from "@/domain/billing";
import { getPortfolio } from "@/server/queries";

export default async function DashboardPage() {
  // Charges are created by the daily cron and the "generate" button, never on render.
  const { properties, tenants, leases, payments } = await getPortfolio();

  return (
    <Dashboard
      properties={properties}
      leases={leases}
      payments={payments}
      tenants={tenants}
      today={todayISO()}
    />
  );
}
