import Link from "next/link";
import { History, Plus } from "lucide-react";
import { Button } from "@/ui/atoms/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/ui/atoms/table";
import { EditLeaseDialog } from "@/ui/organisms/EditLeaseDialog";
import { TerminateLeaseDialog } from "@/ui/organisms/TerminateLeaseDialog";
import { LeaseStatusBadge } from "@/ui/molecules/StatusBadge";
import { listLeases, listProperties, listTenants } from "@/server/queries";
import { formatDate, formatMoney } from "@/shared/format";
import { interpolate } from "@/i18n";
import { getI18n } from "@/i18n/server";

export default async function LeasesPage() {
  const [{ locale, t }, leases, properties, tenants] = await Promise.all([
    getI18n(),
    listLeases(),
    listProperties(),
    listTenants(),
  ]);
  const propertyById = new Map(properties.map((property) => [property.id, property]));
  const tenantById = new Map(tenants.map((tenant) => [tenant.id, tenant]));
  const date = (value: string) => formatDate(value, locale);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">{t.leases.title}</h1>
        <Button asChild>
          <Link href="/leases/new">
            <Plus className="mr-2 h-4 w-4" aria-hidden /> {t.leases.add}
          </Link>
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t.leases.property}</TableHead>
              <TableHead className="hidden md:table-cell">{t.leases.tenant}</TableHead>
              <TableHead className="hidden xl:table-cell">{t.leases.duration}</TableHead>
              <TableHead className="hidden sm:table-cell">{t.leases.rent}</TableHead>
              <TableHead>{t.common.status}</TableHead>
              <TableHead className="hidden text-right sm:table-cell">{t.common.actions}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leases.map((lease) => {
              const property = propertyById.get(lease.propertyId);
              const actions = (
                <>
                      <Button size="icon" variant="ghost" asChild>
                        <Link href={`/leases/${lease.id}`} aria-label={t.leases.history} title={t.leases.history}>
                          <History className="h-4 w-4" />
                        </Link>
                      </Button>
                      <EditLeaseDialog lease={lease} property={property} />
                      {lease.status === "ACTIVE" && <TerminateLeaseDialog leaseId={lease.id} />}
                </>
              );
              return (
                <TableRow key={lease.id}>
                  <TableCell className="font-medium">
                    {property?.name ?? t.common.unknown}
                    {/* Columns hidden on smaller screens move under the property name. */}
                    <div className="text-xs font-normal text-muted-foreground md:hidden">{tenantById.get(lease.tenantId)?.name ?? t.common.unknown}</div>
                    <div className="text-xs font-normal text-muted-foreground xl:hidden">
                      {interpolate(t.leases.range, { start: date(lease.startDate), end: date(lease.endDate) })}
                    </div>
                    <div className="text-xs font-normal text-muted-foreground sm:hidden">{formatMoney(lease.monthlyRent, lease.currency, locale)}</div>
                    {/* On phones the actions sit under the details instead of in their own column. */}
                    <div className="mt-2 flex gap-1 sm:hidden">{actions}</div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{tenantById.get(lease.tenantId)?.name ?? t.common.unknown}</TableCell>
                  <TableCell className="hidden xl:table-cell">
                    {interpolate(t.leases.range, { start: date(lease.startDate), end: date(lease.endDate) })}
                    {lease.status === "TERMINATED" && lease.terminationDate && (
                      <div className="text-xs text-muted-foreground">
                        {interpolate(t.leases.terminatedOn, { date: date(lease.terminationDate) })}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">{formatMoney(lease.monthlyRent, lease.currency, locale)}</TableCell>
                  <TableCell>
                    <LeaseStatusBadge status={lease.status} />
                  </TableCell>
                  <TableCell className="hidden text-right sm:table-cell">
                    <div className="flex justify-end gap-2">{actions}</div>
                  </TableCell>
                </TableRow>
              );
            })}
            {leases.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  {t.leases.empty}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
