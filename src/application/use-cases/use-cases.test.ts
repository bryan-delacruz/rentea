import { describe, expect, it } from 'vitest';
import { DomainError } from '@/domain/errors';
import type { PropertyStatus, PropertyType } from '@/domain/entities';
import type { Clock, LeaseSummary, NewCharge, NewLease, Repositories, UnitOfWork } from '../ports';
import { generateMonthlyCharges } from './charges';
import { createLease, terminateLease } from './leases';
import { registerPayment } from './payments';

/** In-memory fakes: the use cases only see the ports, so no database is needed. */
function fakeWorld() {
  const properties = new Map<string, { ownerId: string; type: PropertyType; status: PropertyStatus }>();
  const tenants = new Map<string, { ownerId: string }>();
  const leases = new Map<string, LeaseSummary>();
  const payments = new Map<string, { ownerId: string; leaseId: string; amountCents: number }>();
  const transactions: { paymentId: string; amountCents: number; paidAt: string }[] = [];
  const totals = new Map<string, { paidCents: number; lastPaidAt: string | null }>();
  const charges: NewCharge[] = [];

  const repos: Repositories = {
    properties: {
      async create() {},
      async find(ownerId, id) {
        const p = properties.get(id);
        return p && p.ownerId === ownerId ? { id, type: p.type, status: p.status, leaseCount: 0 } : null;
      },
      async update() {},
      async claim(ownerId, id) {
        const p = properties.get(id);
        if (!p || p.ownerId !== ownerId || p.status !== 'AVAILABLE') return false;
        p.status = 'OCCUPIED';
        return true;
      },
      async setStatus(id, status) {
        properties.get(id)!.status = status;
      },
      async delete() {},
    },
    tenants: {
      async create() {},
      async update() {
        return true;
      },
      async find(ownerId, id) {
        const t = tenants.get(id);
        return t && t.ownerId === ownerId ? { id, leaseCount: 0 } : null;
      },
      async delete() {},
    },
    leases: {
      async create(data: NewLease) {
        const id = `lease-${leases.size + 1}`;
        leases.set(id, {
          id,
          ownerId: data.ownerId,
          propertyId: data.propertyId,
          propertyType: properties.get(data.propertyId)!.type,
          status: 'ACTIVE',
          startDate: data.startDate,
          endDate: data.endDate,
          terminationDate: null,
          monthlyRent: data.monthlyRent,
        });
        return { id };
      },
      async find(ownerId, id) {
        const l = leases.get(id);
        return l && l.ownerId === ownerId ? l : null;
      },
      async update() {},
      async terminate(id, terminationDate) {
        const l = leases.get(id)!;
        leases.set(id, { ...l, status: 'TERMINATED', terminationDate });
      },
      async listActive(ownerId) {
        return [...leases.values()].filter((l) => l.status === 'ACTIVE' && (!ownerId || l.ownerId === ownerId));
      },
    },
    payments: {
      async find(ownerId, id) {
        const p = payments.get(id);
        if (!p || p.ownerId !== ownerId) return null;
        return { id, leaseId: p.leaseId, amountCents: p.amountCents, paidCents: totals.get(id)?.paidCents ?? 0 };
      },
      async addTransaction(paymentId, amount, paidAt) {
        transactions.push({ paymentId, amountCents: Math.round(Number(amount) * 100), paidAt });
      },
      async deleteTransaction() {
        return true;
      },
      async listTransactions(paymentId) {
        return transactions.filter((t) => t.paymentId === paymentId);
      },
      async setTotals(paymentId, paidCents, lastPaidAt) {
        totals.set(paymentId, { paidCents, lastPaidAt });
      },
      async update() {},
      async delete() {},
      async createCharges(newCharges) {
        charges.push(...newCharges);
        return newCharges.length;
      },
    },
  };

  const uow: UnitOfWork = { run: (work) => work(repos) };
  const clock: Clock = { today: () => '2026-11-18' };
  return { uow, clock, properties, tenants, leases, payments, totals, charges };
}

const leaseInput = {
  propertyId: 'p1',
  tenantId: 't1',
  startDate: '2026-01-01',
  endDate: '2026-12-31',
  monthlyRent: '650.00',
  currency: 'PEN' as const,
  advanceMonths: 1,
  warrantyMonths: 1,
};

describe('createLease', () => {
  it('claims the property and creates an active lease', async () => {
    const world = fakeWorld();
    world.properties.set('p1', { ownerId: 'owner', type: 'ROOM', status: 'AVAILABLE' });
    world.tenants.set('t1', { ownerId: 'owner' });

    const { id } = await createLease(world.uow, 'owner', leaseInput);

    expect(world.properties.get('p1')!.status).toBe('OCCUPIED');
    expect(world.leases.get(id)!.status).toBe('ACTIVE');
  });

  it('rejects a property that is already occupied', async () => {
    const world = fakeWorld();
    world.properties.set('p1', { ownerId: 'owner', type: 'ROOM', status: 'OCCUPIED' });
    world.tenants.set('t1', { ownerId: 'owner' });

    await expect(createLease(world.uow, 'owner', leaseInput)).rejects.toThrow(
      new DomainError('propertyUnavailable'),
    );
  });

  it("can't see another landlord's property", async () => {
    const world = fakeWorld();
    world.properties.set('p1', { ownerId: 'someone-else', type: 'ROOM', status: 'AVAILABLE' });
    world.tenants.set('t1', { ownerId: 'owner' });

    await expect(createLease(world.uow, 'owner', leaseInput)).rejects.toThrow(new DomainError('notFound'));
  });

  it('rejects an end date before the start date and points at endDate', () => {
    const world = fakeWorld();
    try {
      createLease(world.uow, 'owner', { ...leaseInput, endDate: '2025-12-31' });
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(DomainError);
      expect((error as DomainError).fields).toEqual(['endDate']);
    }
  });
});

describe('terminateLease', () => {
  it('ends the lease and frees the property', async () => {
    const world = fakeWorld();
    world.properties.set('p1', { ownerId: 'owner', type: 'ROOM', status: 'AVAILABLE' });
    world.tenants.set('t1', { ownerId: 'owner' });
    const { id } = await createLease(world.uow, 'owner', leaseInput);

    await terminateLease(world.uow, 'owner', id, '2026-06-30');

    expect(world.leases.get(id)!.status).toBe('TERMINATED');
    expect(world.properties.get('p1')!.status).toBe('AVAILABLE');
  });
});

describe('registerPayment', () => {
  it('records a partial payment dated today and updates the totals', async () => {
    const world = fakeWorld();
    world.payments.set('pay1', { ownerId: 'owner', leaseId: 'lease-1', amountCents: 65_000 });

    const { leaseId } = await registerPayment(world.uow, world.clock, 'owner', {
      paymentId: 'pay1',
      amount: '200.00',
    });

    expect(leaseId).toBe('lease-1');
    expect(world.totals.get('pay1')).toEqual({ paidCents: 20_000, lastPaidAt: '2026-11-18' });
  });

  it('refuses to collect more than the balance', async () => {
    const world = fakeWorld();
    world.payments.set('pay1', { ownerId: 'owner', leaseId: 'lease-1', amountCents: 65_000 });

    await expect(
      registerPayment(world.uow, world.clock, 'owner', { paymentId: 'pay1', amount: '650.01' }),
    ).rejects.toThrow(new DomainError('overpayment'));
  });
});

describe('generateMonthlyCharges', () => {
  it("charges this month's rent for every active lease of the owner", async () => {
    const world = fakeWorld();
    world.properties.set('p1', { ownerId: 'owner', type: 'ROOM', status: 'AVAILABLE' });
    world.tenants.set('t1', { ownerId: 'owner' });
    await createLease(world.uow, 'owner', leaseInput);

    const { created } = await generateMonthlyCharges(world.uow, world.clock, { ownerId: 'owner' });

    expect(created).toBe(1);
    expect(world.charges[0]).toMatchObject({ dueDate: '2026-11-01', amount: '650.00', ownerId: 'owner' });
  });
});
