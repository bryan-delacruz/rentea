import Link from 'next/link';
import type { Currency, Payment } from '@/domain/entities';
import type { Dictionary, Locale } from '@/i18n';
import { interpolate } from '@/i18n';
import { formatDate, formatMoney } from '@/shared/format';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/ui/atoms/table';
import { PaymentStatusBadge } from '@/ui/molecules/StatusBadge';
import { PaymentActions } from './PaymentActions';

export interface PaymentRow {
  payment: Payment;
  leaseId: string;
  currency: Currency;
  propertyName: string;
  tenant: { name: string; phone: string } | null;
}

interface PaymentsListProps {
  rows: PaymentRow[];
  t: Dictionary;
  locale: Locale;
}

function DueDate({ payment, t, locale }: { payment: Payment; t: Dictionary; locale: Locale }) {
  return (
    <div className="flex flex-col">
      <span>{formatDate(payment.dueDate, locale)}</span>
      {payment.overdueDays > 0 && (
        <span className="text-xs font-medium text-destructive">
          {interpolate(t.payments.daysLate, { count: payment.overdueDays })}
        </span>
      )}
    </div>
  );
}

function Amount({ row, t, locale }: { row: PaymentRow; t: Dictionary; locale: Locale }) {
  const money = (value: number) => formatMoney(value, row.currency, locale);
  return (
    <div className="flex flex-col">
      <span>{money(row.payment.amount)}</span>
      {row.payment.status === 'PARTIAL' && (
        <span className="text-xs font-medium text-success">
          {interpolate(t.payments.partialPaid, { amount: money(row.payment.amountPaid) })}
        </span>
      )}
    </div>
  );
}

function Actions({ row }: { row: PaymentRow }) {
  if (!row.tenant) return null;
  return (
    <PaymentActions payment={row.payment} currency={row.currency} tenant={row.tenant} propertyName={row.propertyName} />
  );
}

/** Charges as a table from tablet width up, and as stacked cards on phones. */
export function PaymentsList({ rows, t, locale }: PaymentsListProps) {
  if (rows.length === 0) {
    return (
      <p className="rounded-2xl border border-glass-border bg-card p-8 text-center text-muted-foreground backdrop-blur-xl">
        {t.payments.empty}
      </p>
    );
  }

  return (
    <>
      <ul className="space-y-3 md:hidden">
        {rows.map((row) => (
          <li
            key={row.payment.id}
            className="rounded-2xl border border-glass-border bg-card p-4 shadow-glass backdrop-blur-xl"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <Link href={`/leases/${row.leaseId}`} className="font-medium hover:underline">
                  {row.propertyName}
                </Link>
                {row.tenant && <p className="truncate text-sm text-muted-foreground">{row.tenant.name}</p>}
              </div>
              <PaymentStatusBadge status={row.payment.status} />
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-xs text-muted-foreground">{t.payments.dueDate}</dt>
                <dd>
                  <DueDate payment={row.payment} t={t} locale={locale} />
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">{t.payments.amount}</dt>
                <dd>
                  <Amount row={row} t={t} locale={locale} />
                </dd>
              </div>
            </dl>
            <div className="mt-3 flex justify-end border-t border-border pt-3">
              <Actions row={row} />
            </div>
          </li>
        ))}
      </ul>

      <div className="hidden rounded-2xl border border-glass-border bg-card shadow-glass backdrop-blur-xl md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t.payments.property}</TableHead>
              <TableHead>{t.payments.dueDate}</TableHead>
              <TableHead>{t.payments.amount}</TableHead>
              <TableHead>{t.common.status}</TableHead>
              <TableHead className="hidden lg:table-cell">{t.payments.paidOn}</TableHead>
              <TableHead className="text-right">{t.common.actions}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.payment.id}>
                <TableCell className="font-medium">
                  <Link href={`/leases/${row.leaseId}`} className="hover:underline">
                    {row.propertyName}
                  </Link>
                  <div className="text-xs font-normal text-muted-foreground">{row.tenant?.name}</div>
                </TableCell>
                <TableCell>
                  <DueDate payment={row.payment} t={t} locale={locale} />
                </TableCell>
                <TableCell>
                  <Amount row={row} t={t} locale={locale} />
                </TableCell>
                <TableCell>
                  <PaymentStatusBadge status={row.payment.status} />
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  {row.payment.paidDate ? formatDate(row.payment.paidDate, locale) : '—'}
                </TableCell>
                <TableCell className="text-right">
                  <Actions row={row} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
