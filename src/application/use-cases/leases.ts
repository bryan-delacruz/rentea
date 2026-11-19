import type { ISODate } from '@/domain/billing';
import { DomainError } from '@/domain/errors';
import { canTerminateOn, hasValidTerm, utilityCostsFor } from '@/domain/lease';
import type { LeaseTerms, UnitOfWork } from '../ports';
import type { LeaseInput, LeaseTermsInput } from '../validation';

function termsOf(input: LeaseTermsInput): LeaseTerms {
  return {
    startDate: input.startDate,
    endDate: input.endDate,
    monthlyRent: input.monthlyRent,
    currency: input.currency,
    advanceMonths: input.advanceMonths,
    warrantyMonths: input.warrantyMonths,
  };
}

/** Creates a lease and claims its property, so two leases can't take it at once. */
export function createLease(uow: UnitOfWork, ownerId: string, input: LeaseInput): Promise<{ id: string }> {
  if (!hasValidTerm(input.startDate, input.endDate)) throw new DomainError('invalidDates', ['endDate']);

  return uow.run(async ({ properties, tenants, leases }) => {
    const [property, tenant] = await Promise.all([
      properties.find(ownerId, input.propertyId),
      tenants.find(ownerId, input.tenantId),
    ]);
    if (!property || !tenant) throw new DomainError('notFound');
    if (property.status !== 'AVAILABLE') throw new DomainError('propertyUnavailable');
    if (!(await properties.claim(ownerId, property.id))) throw new DomainError('propertyUnavailable');

    return leases.create({
      ownerId,
      propertyId: property.id,
      tenantId: tenant.id,
      ...termsOf(input),
      ...utilityCostsFor(property.type, input),
    });
  });
}

export function updateLease(uow: UnitOfWork, ownerId: string, id: string, input: LeaseTermsInput): Promise<void> {
  if (!hasValidTerm(input.startDate, input.endDate)) throw new DomainError('invalidDates', ['endDate']);

  return uow.run(async ({ leases }) => {
    const lease = await leases.find(ownerId, id);
    if (!lease) throw new DomainError('notFound');
    await leases.update(id, { ...termsOf(input), ...utilityCostsFor(lease.propertyType, input) });
  });
}

/** Ends an active lease and frees its property. */
export function terminateLease(uow: UnitOfWork, ownerId: string, id: string, terminationDate: ISODate): Promise<void> {
  return uow.run(async ({ leases, properties }) => {
    const lease = await leases.find(ownerId, id);
    if (!lease || lease.status !== 'ACTIVE') throw new DomainError('notFound');
    if (!canTerminateOn(lease.startDate, terminationDate)) throw new DomainError('invalidDates');
    await leases.terminate(id, terminationDate);
    await properties.setStatus(lease.propertyId, 'AVAILABLE');
  });
}
