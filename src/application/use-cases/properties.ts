import { DomainError } from '@/domain/errors';
import type { UnitOfWork } from '../ports';
import type { PropertyInput, PropertyUpdateInput } from '../validation';

export function createProperty(uow: UnitOfWork, ownerId: string, input: PropertyInput): Promise<void> {
  return uow.run(({ properties }) => properties.create(ownerId, input));
}

export function updateProperty(
  uow: UnitOfWork,
  ownerId: string,
  id: string,
  input: PropertyUpdateInput,
): Promise<void> {
  return uow.run(async ({ properties }) => {
    const current = await properties.find(ownerId, id);
    if (!current) throw new DomainError('notFound');
    const { status, ...fields } = input;
    // OCCUPIED is managed by leases, so a landlord can only toggle maintenance.
    const canChangeStatus = current.status !== 'OCCUPIED' && status !== undefined;
    await properties.update(id, canChangeStatus ? { ...fields, status } : fields);
  });
}

export function deleteProperty(uow: UnitOfWork, ownerId: string, id: string): Promise<void> {
  return uow.run(async ({ properties }) => {
    const property = await properties.find(ownerId, id);
    if (!property) throw new DomainError('notFound');
    if (property.leaseCount > 0) throw new DomainError('hasLeases');
    await properties.delete(id);
  });
}
