import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/ui/atoms/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/ui/atoms/table";
import { EditPropertyDialog } from "@/ui/organisms/EditPropertyDialog";
import { DeletePropertyDialog } from "@/ui/organisms/DeletePropertyDialog";
import { PropertyStatusBadge } from "@/ui/molecules/StatusBadge";
import { listLeases, listProperties } from "@/server/queries";
import { formatMoney } from "@/shared/format";
import { getI18n } from "@/i18n/server";

export default async function PropertiesPage() {
  const [{ locale, t }, properties, leases] = await Promise.all([getI18n(), listProperties(), listLeases()]);
  const occupiedIds = new Set(leases.filter((lease) => lease.status === "ACTIVE").map((lease) => lease.propertyId));
  const f = t.properties.fields;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">{t.properties.title}</h1>
        <Button asChild>
          <Link href="/properties/new">
            <Plus className="mr-2 h-4 w-4" aria-hidden /> {t.properties.add}
          </Link>
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{f.name}</TableHead>
              <TableHead className="hidden sm:table-cell">{f.type}</TableHead>
              <TableHead className="hidden xl:table-cell">{f.location}</TableHead>
              <TableHead className="hidden xl:table-cell">{f.floor}</TableHead>
              <TableHead>{f.status}</TableHead>
              <TableHead>{f.price}</TableHead>
              <TableHead className="hidden text-right sm:table-cell">{t.common.actions}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {properties.map((property) => {
              const isOccupied = occupiedIds.has(property.id);
              const actions = (
                <>
                  <EditPropertyDialog property={property} isOccupied={isOccupied} />
                  <DeletePropertyDialog propertyId={property.id} propertyName={property.name} />
                </>
              );
              return (
                <TableRow key={property.id}>
                  <TableCell className="font-medium">
                    {property.name}
                    {/* Columns hidden on smaller screens move under the name. */}
                    <div className="text-xs font-normal text-muted-foreground sm:hidden">{t.propertyType[property.type]}</div>
                    <div className="text-xs font-normal text-muted-foreground xl:hidden">
                      {property.location} · {f.floor} {property.floor}
                    </div>
                    {/* On phones the actions sit under the details instead of in their own column. */}
                    <div className="mt-2 flex gap-1 sm:hidden">{actions}</div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">{t.propertyType[property.type]}</TableCell>
                  <TableCell className="hidden xl:table-cell">{property.location}</TableCell>
                  <TableCell className="hidden xl:table-cell">{property.floor}</TableCell>
                  <TableCell>
                    <PropertyStatusBadge status={isOccupied ? "OCCUPIED" : property.status} />
                  </TableCell>
                  <TableCell>{formatMoney(property.price, property.currency, locale)}</TableCell>
                  <TableCell className="hidden text-right sm:table-cell">
                    <div className="flex justify-end gap-2">{actions}</div>
                  </TableCell>
                </TableRow>
              );
            })}
            {properties.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  {t.properties.empty}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
