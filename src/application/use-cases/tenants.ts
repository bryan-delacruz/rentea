import { DomainError } from '@/domain/errors';
import type { UnitOfWork } from '../ports';
import type { TenantInput } from '../validation';

export function createTenant(uow: UnitOfWork, ownerId: string, input: TenantInput): Promise<void> {
  return uow.run(({ tenants }) => tenants.create(ownerId, input));
}

export function updateTenant(uow: UnitOfWork, ownerId: string, id: string, input: TenantInput): Promise<void> {
  return uow.run(async ({ tenants }) => {
    const updated = await tenants.update(ownerId, id, input);
    if (!updated) throw new DomainError('notFound');
  });
}

export function deleteTenant(uow: UnitOfWork, ownerId: string, id: string): Promise<void> {
  return uow.run(async ({ tenants }) => {
    const tenant = await tenants.find(ownerId, id);
    if (!tenant) throw new DomainError('notFound');
    if (tenant.leaseCount > 0) throw new DomainError('hasLeases');
    await tenants.delete(id);
  });
}
