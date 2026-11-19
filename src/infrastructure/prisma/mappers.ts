import 'server-only';
import type {
  Lease as LeaseRow,
  Payment as PaymentRow,
  PaymentTransaction as TransactionRow,
  Property as PropertyRow,
  Tenant as TenantRow,
} from '@prisma/client';
import {
  centsToAmount,
  dateToISO,
  isCurrency,
  isExpired,
  overdueDays,
  paymentStatus,
  toCents,
  type Currency,
  type ISODate,
} from '@/domain/billing';
import type { Lease, Payment, Property, Tenant } from '@/domain/entities';

/** Converts database rows into the client-safe entities of the domain. */

const amount = (value: { toString(): string }) => centsToAmount(toCents(value));
const asCurrency = (value: string): Currency => (isCurrency(value) ? value : 'PEN');

export function toProperty(row: PropertyRow): Property {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    status: row.status,
    price: amount(row.price),
    currency: asCurrency(row.currency),
    location: row.location,
    floor: row.floor,
  };
}

export function toTenant(row: TenantRow): Tenant {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    dni: row.dni,
    address: row.address,
  };
}

export function toLease(row: LeaseRow, today: ISODate): Lease {
  const startDate = dateToISO(row.startDate);
  const endDate = dateToISO(row.endDate);
  const terminationDate = row.terminationDate ? dateToISO(row.terminationDate) : null;
  // An active lease past its end date is shown as expired without a write.
  const status = isExpired({ status: row.status, startDate, endDate, terminationDate }, today)
    ? 'EXPIRED'
    : row.status;
  const hasUtilities = row.waterCost !== null || row.electricityCost !== null || row.gasCost !== null;
  return {
    id: row.id,
    propertyId: row.propertyId,
    tenantId: row.tenantId,
    startDate,
    endDate,
    monthlyRent: amount(row.monthlyRent),
    currency: asCurrency(row.currency),
    status,
    advanceMonths: row.advanceMonths,
    warrantyMonths: row.warrantyMonths,
    utilityCosts: hasUtilities
      ? {
          water: row.waterCost ? amount(row.waterCost) : 0,
          electricity: row.electricityCost ? amount(row.electricityCost) : 0,
          gas: row.gasCost ? amount(row.gasCost) : 0,
        }
      : null,
    terminationDate,
  };
}

export function toPayment(
  row: PaymentRow & { transactions: TransactionRow[] },
  today: ISODate,
): Payment {
  const amountCents = toCents(row.amount);
  const paidCents = toCents(row.amountPaid);
  const dueDate = dateToISO(row.dueDate);
  return {
    id: row.id,
    leaseId: row.leaseId,
    dueDate,
    amount: centsToAmount(amountCents),
    amountPaid: centsToAmount(paidCents),
    paidDate: row.paidDate ? dateToISO(row.paidDate) : null,
    status: paymentStatus(amountCents, paidCents, dueDate, today),
    overdueDays: overdueDays(amountCents, paidCents, dueDate, today),
    transactions: [...row.transactions]
      .sort((a, b) => a.paidAt.getTime() - b.paidAt.getTime() || a.createdAt.getTime() - b.createdAt.getTime())
      .map((tx) => ({ id: tx.id, date: dateToISO(tx.paidAt), amount: amount(tx.amount) })),
  };
}
