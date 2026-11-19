import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/ui/atoms/button";
import { Badge } from "@/ui/atoms/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/ui/atoms/table";
import { EditTenantDialog } from "@/ui/organisms/EditTenantDialog";
import { DeleteTenantDialog } from "@/ui/organisms/DeleteTenantDialog";
import { listLeases, listTenants } from "@/server/queries";
import { formatPhone } from "@/shared/format";
import { getI18n } from "@/i18n/server";

export default async function TenantsPage() {
  const [{ t }, tenants, leases] = await Promise.all([getI18n(), listTenants(), listLeases()]);
  const activeIds = new Set(leases.filter((lease) => lease.status === "ACTIVE").map((lease) => lease.tenantId));
  const f = t.tenants.fields;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">{t.tenants.title}</h1>
        <Button asChild>
          <Link href="/tenants/new">
            <Plus className="mr-2 h-4 w-4" aria-hidden /> {t.tenants.add}
          </Link>
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{f.name}</TableHead>
              <TableHead className="hidden md:table-cell">{f.dni}</TableHead>
              <TableHead className="hidden sm:table-cell">{f.phone}</TableHead>
              <TableHead className="hidden xl:table-cell">{f.address}</TableHead>
              <TableHead>{t.common.status}</TableHead>
              <TableHead className="text-right">{t.common.actions}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tenants.map((tenant) => {
              const isActive = activeIds.has(tenant.id);
              return (
                <TableRow key={tenant.id}>
                  <TableCell className="font-medium">
                    {tenant.name}
                    {/* Columns hidden on smaller screens move under the name. */}
                    <div className="text-xs font-normal text-muted-foreground md:hidden">{f.dni} {tenant.dni}</div>
                    <div className="text-xs font-normal text-muted-foreground sm:hidden">{formatPhone(tenant.phone)}</div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{tenant.dni}</TableCell>
                  <TableCell className="hidden sm:table-cell">{formatPhone(tenant.phone)}</TableCell>
                  <TableCell className="hidden xl:table-cell">{tenant.address}</TableCell>
                  <TableCell>
                    <Badge variant={isActive ? "default" : "secondary"}>
                      {isActive ? t.tenants.active : t.tenants.inactive}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <EditTenantDialog tenant={tenant} />
                      <DeleteTenantDialog tenantId={tenant.id} tenantName={tenant.name} />
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
            {tenants.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  {t.tenants.empty}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
