import { GeneratePaymentsButton } from "@/ui/organisms/GeneratePaymentsButton";
import { PaymentsList, type PaymentRow } from "@/ui/organisms/PaymentsList";
import { getPortfolio } from "@/server/queries";
import { getI18n } from "@/i18n/server";

export default async function PaymentsPage() {
  const [{ locale, t }, { properties, tenants, leases, payments }] = await Promise.all([getI18n(), getPortfolio()]);
  const leaseById = new Map(leases.map((lease) => [lease.id, lease]));
  const propertyById = new Map(properties.map((property) => [property.id, property]));
  const tenantById = new Map(tenants.map((tenant) => [tenant.id, tenant]));

  const rows: PaymentRow[] = payments.flatMap((payment) => {
    const lease = leaseById.get(payment.leaseId);
    if (!lease) return [];
    const tenant = tenantById.get(lease.tenantId);
    return [
      {
        payment,
        leaseId: lease.id,
        currency: lease.currency,
        propertyName: propertyById.get(lease.propertyId)?.name ?? t.common.unknown,
        tenant: tenant ? { name: tenant.name, phone: tenant.phone } : null,
      },
    ];
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">{t.payments.title}</h1>
        <GeneratePaymentsButton />
      </div>
      <PaymentsList rows={rows} t={t} locale={locale} />
    </div>
  );
}
