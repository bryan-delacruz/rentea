import 'server-only';
import type { Prisma, PrismaClient } from '@prisma/client';
import { centsToDecimalString, dateToISO, isoToDate, toCents } from '@/domain/billing';
import type {
  LeaseRepository,
  LeaseSummary,
  PaymentRepository,
  PropertyRepository,
  Repositories,
  TenantRepository,
  UnitOfWork,
} from '@/application/ports';
import { prisma } from './client';
import { withDomainErrors } from './errors';

type Db = PrismaClient | Prisma.TransactionClient;

function propertyRepository(db: Db): PropertyRepository {
  return {
    async create(ownerId, data) {
      await db.property.create({ data: { ...data, ownerId, status: 'AVAILABLE' } });
    },
    async find(ownerId, id) {
      const row = await db.property.findFirst({
        where: { id, ownerId },
        include: { _count: { select: { leases: true } } },
      });
      return row && { id: row.id, type: row.type, status: row.status, leaseCount: row._count.leases };
    },
    async update(id, data) {
      await db.property.update({ where: { id }, data });
    },
    async claim(ownerId, id) {
      const { count } = await db.property.updateMany({
        where: { id, ownerId, status: 'AVAILABLE' },
        data: { status: 'OCCUPIED' },
      });
      return count > 0;
    },
    async setStatus(id, status) {
      await db.property.update({ where: { id }, data: { status } });
    },
    async delete(id) {
      await db.property.delete({ where: { id } });
    },
  };
}

function tenantRepository(db: Db): TenantRepository {
  return {
    async create(ownerId, data) {
      await db.tenant.create({ data: { ...data, ownerId } });
    },
    async update(ownerId, id, data) {
      const { count } = await db.tenant.updateMany({ where: { id, ownerId }, data });
      return count > 0;
    },
    async find(ownerId, id) {
      const row = await db.tenant.findFirst({
        where: { id, ownerId },
        include: { _count: { select: { leases: true } } },
      });
      return row && { id: row.id, leaseCount: row._count.leases };
    },
    async delete(id) {
      await db.tenant.delete({ where: { id } });
    },
  };
}

type LeaseRowWithType = Prisma.LeaseGetPayload<{ include: { property: { select: { type: true } } } }>;

function toLeaseSummary(row: LeaseRowWithType): LeaseSummary {
  return {
    id: row.id,
    ownerId: row.ownerId,
    propertyId: row.propertyId,
    propertyType: row.property.type,
    status: row.status,
    startDate: dateToISO(row.startDate),
    endDate: dateToISO(row.endDate),
    terminationDate: row.terminationDate ? dateToISO(row.terminationDate) : null,
    monthlyRent: row.monthlyRent.toString(),
  };
}

const withPropertyType = { property: { select: { type: true } } } as const;

function leaseRepository(db: Db): LeaseRepository {
  return {
    async create(data) {
      const { id } = await db.lease.create({
        data: {
          ...data,
          startDate: isoToDate(data.startDate),
          endDate: isoToDate(data.endDate),
          status: 'ACTIVE',
        },
      });
      return { id };
    },
    async find(ownerId, id) {
      const row = await db.lease.findFirst({ where: { id, ownerId }, include: withPropertyType });
      return row && toLeaseSummary(row);
    },
    async update(id, data) {
      await db.lease.update({
        where: { id },
        data: { ...data, startDate: isoToDate(data.startDate), endDate: isoToDate(data.endDate) },
      });
    },
    async terminate(id, terminationDate) {
      await db.lease.update({
        where: { id },
        data: { status: 'TERMINATED', terminationDate: isoToDate(terminationDate) },
      });
    },
    async listActive(ownerId) {
      const rows = await db.lease.findMany({
        where: { status: 'ACTIVE', ...(ownerId ? { ownerId } : {}) },
        include: withPropertyType,
      });
      return rows.map(toLeaseSummary);
    },
  };
}

function paymentRepository(db: Db): PaymentRepository {
  return {
    async find(ownerId, id) {
      const row = await db.payment.findFirst({ where: { id, ownerId } });
      return (
        row && {
          id: row.id,
          leaseId: row.leaseId,
          amountCents: toCents(row.amount),
          paidCents: toCents(row.amountPaid),
        }
      );
    },
    async addTransaction(paymentId, amount, paidAt) {
      await db.paymentTransaction.create({ data: { paymentId, amount, paidAt: isoToDate(paidAt) } });
    },
    async deleteTransaction(paymentId, transactionId) {
      const { count } = await db.paymentTransaction.deleteMany({ where: { id: transactionId, paymentId } });
      return count > 0;
    },
    async listTransactions(paymentId) {
      const rows = await db.paymentTransaction.findMany({ where: { paymentId } });
      return rows.map((row) => ({ amountCents: toCents(row.amount), paidAt: dateToISO(row.paidAt) }));
    },
    async setTotals(paymentId, paidCents, lastPaidAt) {
      await db.payment.update({
        where: { id: paymentId },
        data: {
          amountPaid: centsToDecimalString(paidCents),
          paidDate: lastPaidAt ? isoToDate(lastPaidAt) : null,
        },
      });
    },
    async update(id, data) {
      await db.payment.update({ where: { id }, data: { amount: data.amount, dueDate: isoToDate(data.dueDate) } });
    },
    async delete(id) {
      // Transactions are removed by the ON DELETE CASCADE relation.
      await db.payment.delete({ where: { id } });
    },
    async createCharges(charges) {
      const { count } = await db.payment.createMany({
        data: charges.map((charge) => ({ ...charge, dueDate: isoToDate(charge.dueDate) })),
        skipDuplicates: true,
      });
      return count;
    },
  };
}

export function createRepositories(db: Db): Repositories {
  return {
    properties: propertyRepository(db),
    tenants: tenantRepository(db),
    leases: leaseRepository(db),
    payments: paymentRepository(db),
  };
}

/** Each run is one database transaction; Prisma errors become domain errors. */
export const prismaUnitOfWork: UnitOfWork = {
  run: (work) => withDomainErrors(() => prisma.$transaction((tx) => work(createRepositories(tx)))),
};
