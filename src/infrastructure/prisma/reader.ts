import 'server-only';
import type { PortfolioReader } from '@/application/ports';
import { prisma } from './client';
import { toLease, toPayment, toProperty, toTenant } from './mappers';

export const prismaPortfolioReader: PortfolioReader = {
  async listProperties(ownerId) {
    const rows = await prisma.property.findMany({ where: { ownerId }, orderBy: { name: 'asc' } });
    return rows.map(toProperty);
  },

  async listTenants(ownerId) {
    const rows = await prisma.tenant.findMany({ where: { ownerId }, orderBy: { name: 'asc' } });
    return rows.map(toTenant);
  },

  async listLeases(ownerId, today) {
    const rows = await prisma.lease.findMany({ where: { ownerId }, orderBy: { startDate: 'desc' } });
    return rows.map((row) => toLease(row, today));
  },

  async listPayments(ownerId, today) {
    const rows = await prisma.payment.findMany({
      where: { ownerId },
      include: { transactions: true },
      orderBy: { dueDate: 'desc' },
    });
    return rows.map((row) => toPayment(row, today));
  },

  async getLeaseDetail(ownerId, id, today) {
    const row = await prisma.lease.findFirst({
      where: { id, ownerId },
      include: {
        property: true,
        tenant: true,
        payments: { include: { transactions: true }, orderBy: { dueDate: 'desc' } },
      },
    });
    if (!row) return null;
    return {
      lease: toLease(row, today),
      property: toProperty(row.property),
      tenant: toTenant(row.tenant),
      payments: row.payments.map((payment) => toPayment(payment, today)),
    };
  },
};
