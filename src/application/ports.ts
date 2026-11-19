import type { Currency, ISODate } from '@/domain/billing';
import type {
  Lease,
  LeaseStatus,
  Payment,
  Property,
  PropertyStatus,
  PropertyType,
  Tenant,
} from '@/domain/entities';
import type { UtilityCostValues } from '@/domain/lease';
import type { PropertyInput, TenantInput } from './validation';

/**
 * What the use cases need from the outside world. The application layer only
 * knows these interfaces; infrastructure implements them (Prisma today).
 * Every lookup is scoped by owner so one landlord never touches another's data.
 */

export interface PropertySummary {
  id: string;
  type: PropertyType;
  status: PropertyStatus;
  leaseCount: number;
}

export interface PropertyRepository {
  create(ownerId: string, data: PropertyInput): Promise<void>;
  find(ownerId: string, id: string): Promise<PropertySummary | null>;
  update(id: string, data: PropertyInput & { status?: PropertyStatus }): Promise<void>;
  /** Marks an available property as occupied; false if someone else got it first. */
  claim(ownerId: string, id: string): Promise<boolean>;
  setStatus(id: string, status: PropertyStatus): Promise<void>;
  delete(id: string): Promise<void>;
}

export interface TenantRepository {
  create(ownerId: string, data: TenantInput): Promise<void>;
  /** Returns false when the tenant doesn't exist for this owner. */
  update(ownerId: string, id: string, data: TenantInput): Promise<boolean>;
  find(ownerId: string, id: string): Promise<{ id: string; leaseCount: number } | null>;
  delete(id: string): Promise<void>;
}

export interface LeaseTerms {
  startDate: ISODate;
  endDate: ISODate;
  monthlyRent: string;
  currency: Currency;
  advanceMonths: number;
  warrantyMonths: number;
}

export interface NewLease extends LeaseTerms, UtilityCostValues {
  ownerId: string;
  propertyId: string;
  tenantId: string;
}

export interface LeaseSummary {
  id: string;
  ownerId: string;
  propertyId: string;
  propertyType: PropertyType;
  status: LeaseStatus;
  startDate: ISODate;
  endDate: ISODate;
  terminationDate: ISODate | null;
  monthlyRent: string;
}

export interface LeaseRepository {
  create(data: NewLease): Promise<{ id: string }>;
  find(ownerId: string, id: string): Promise<LeaseSummary | null>;
  update(id: string, data: LeaseTerms & UtilityCostValues): Promise<void>;
  terminate(id: string, terminationDate: ISODate): Promise<void>;
  /** Active leases of one owner, or of every owner when ownerId is omitted. */
  listActive(ownerId?: string): Promise<LeaseSummary[]>;
}

export interface PaymentSummary {
  id: string;
  leaseId: string;
  amountCents: number;
  paidCents: number;
}

export interface NewCharge {
  ownerId: string;
  leaseId: string;
  dueDate: ISODate;
  amount: string;
}

export interface PaymentRepository {
  find(ownerId: string, id: string): Promise<PaymentSummary | null>;
  addTransaction(paymentId: string, amount: string, paidAt: ISODate): Promise<void>;
  /** Returns false when the transaction doesn't belong to the payment. */
  deleteTransaction(paymentId: string, transactionId: string): Promise<boolean>;
  listTransactions(paymentId: string): Promise<{ amountCents: number; paidAt: ISODate }[]>;
  setTotals(paymentId: string, paidCents: number, lastPaidAt: ISODate | null): Promise<void>;
  update(id: string, data: { amount: string; dueDate: ISODate }): Promise<void>;
  /** Also removes its transactions. */
  delete(id: string): Promise<void>;
  /** Skips charges that already exist; returns how many were created. */
  createCharges(charges: NewCharge[]): Promise<number>;
}

export interface Repositories {
  properties: PropertyRepository;
  tenants: TenantRepository;
  leases: LeaseRepository;
  payments: PaymentRepository;
}

/** Runs a piece of work atomically: everything inside commits or nothing does. */
export interface UnitOfWork {
  run<T>(work: (repos: Repositories) => Promise<T>): Promise<T>;
}

export interface LeaseDetail {
  lease: Lease;
  property: Property;
  tenant: Tenant;
  payments: Payment[];
}

/** Read side: client-safe entities, already computed for "today". */
export interface PortfolioReader {
  listProperties(ownerId: string): Promise<Property[]>;
  listTenants(ownerId: string): Promise<Tenant[]>;
  listLeases(ownerId: string, today: ISODate): Promise<Lease[]>;
  listPayments(ownerId: string, today: ISODate): Promise<Payment[]>;
  getLeaseDetail(ownerId: string, id: string, today: ISODate): Promise<LeaseDetail | null>;
}

export interface Clock {
  /** Today's date in the business time zone (Lima). */
  today(): ISODate;
}
