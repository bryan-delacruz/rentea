import Link from "next/link";
import { notFound } from "next/navigation";
import { Fragment } from "react";
import { ArrowLeft, Calendar, Home, User } from "lucide-react";
import { Button } from "@/ui/atoms/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/atoms/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/ui/atoms/table";
import { PaymentActions } from "@/ui/organisms/PaymentActions";
import { LeaseStatusBadge, PaymentStatusBadge } from "@/ui/molecules/StatusBadge";
import { centsToAmount, sumCents, toCents } from "@/domain/billing";
import { getLeaseDetail } from "@/server/queries";
import { formatDate, formatMoney, formatPhone } from "@/shared/format";
import { interpolate } from "@/i18n";
import { getI18n } from "@/i18n/server";

export default async function LeaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [{ locale, t }, detail] = await Promise.all([getI18n(), getLeaseDetail(id)]);
  if (!detail) notFound();

  const { lease, property, tenant, payments } = detail;
  const money = (value: number) => formatMoney(value, lease.currency, locale);
  const date = (value: string) => formatDate(value, locale);
  const balance = centsToAmount(
    sumCents(payments.map((payment) => toCents(payment.amount) - toCents(payment.amountPaid))),
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/leases" aria-label={t.common.back}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">{t.leases.detailTitle}</h1>
        <LeaseStatusBadge status={lease.status} />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.leases.property}</CardTitle>
            <Home className="h-4 w-4 text-muted-foreground" aria-hidden />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{property.name}</div>
            <p className="text-xs text-muted-foreground">
              {property.location} · {t.propertyType[property.type]}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {interpolate(t.leases.range, { start: date(lease.startDate), end: date(lease.endDate) })}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.leases.tenant}</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" aria-hidden />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tenant.name}</div>
            <p className="text-xs text-muted-foreground">{formatPhone(tenant.phone)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.leases.balance}</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" aria-hidden />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{money(balance)}</div>
            <p className="text-xs text-muted-foreground">{t.leases.balanceHint}</p>
          </CardContent>
        </Card>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t.payments.dueDate}</TableHead>
              <TableHead>{t.payments.amount}</TableHead>
              <TableHead className="hidden sm:table-cell">{t.payments.paid}</TableHead>
              <TableHead>{t.common.status}</TableHead>
              <TableHead className="hidden text-right sm:table-cell">{t.common.actions}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.map((payment) => (
              <Fragment key={payment.id}>
                <TableRow className={payment.transactions.length > 0 ? "border-b-0" : undefined}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span>{date(payment.dueDate)}</span>
                      {payment.overdueDays > 0 && (
                        <span className="text-xs font-medium text-destructive">
                          {interpolate(t.payments.daysLate, { count: payment.overdueDays })}
                        </span>
                      )}
                    </div>
                    {/* On phones the actions sit under the date instead of in their own column. */}
                    <div className="mt-2 sm:hidden">
                      <PaymentActions payment={payment} currency={lease.currency} tenant={{ name: tenant.name, phone: tenant.phone }} propertyName={property.name} />
                    </div>
                  </TableCell>
                  <TableCell>
                    {money(payment.amount)}
                    {payment.amountPaid > 0 && (
                      <div className="text-xs font-medium text-success sm:hidden">
                        {t.payments.paid}: {money(payment.amountPaid)}
                      </div>
                    )}
                  </TableCell>
                  <TableCell
                    className={payment.amountPaid > 0 ? "hidden font-medium text-success sm:table-cell" : "hidden sm:table-cell"}
                  >
                    {money(payment.amountPaid)}
                  </TableCell>
                  <TableCell>
                    <PaymentStatusBadge status={payment.status} />
                  </TableCell>
                  <TableCell className="hidden text-right sm:table-cell">
                    <PaymentActions
                      payment={payment}
                      currency={lease.currency}
                      tenant={{ name: tenant.name, phone: tenant.phone }}
                      propertyName={property.name}
                    />
                  </TableCell>
                </TableRow>
                {payment.transactions.length > 0 && (
                  <TableRow className="bg-muted/30">
                    <TableCell colSpan={5} className="px-4 py-2">
                      <p className="mb-2 text-xs font-semibold text-muted-foreground">{t.leases.paymentHistory}</p>
                      <ul className="ml-4 max-w-md space-y-1">
                        {payment.transactions.map((tx) => (
                          <li key={tx.id} className="flex justify-between text-xs">
                            <span>{date(tx.date)}</span>
                            <span className="font-medium text-success">+ {money(tx.amount)}</span>
                          </li>
                        ))}
                      </ul>
                    </TableCell>
                  </TableRow>
                )}
              </Fragment>
            ))}
            {payments.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  {t.leases.noPayments}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
