import type { Lease, Payment, Property, Tenant } from '@/domain/entities';
import type { Clock, LeaseDetail, PortfolioReader } from '../ports';

export interface Portfolio {
  properties: Property[];
  tenants: Tenant[];
  leases: Lease[];
  payments: Payment[];
}

/** Everything the dashboard and the payments list need, in one round trip. */
export async function getPortfolio(reader: PortfolioReader, clock: Clock, ownerId: string): Promise<Portfolio> {
  const today = clock.today();
  const [properties, tenants, leases, payments] = await Promise.all([
    reader.listProperties(ownerId),
    reader.listTenants(ownerId),
    reader.listLeases(ownerId, today),
    reader.listPayments(ownerId, today),
  ]);
  return { properties, tenants, leases, payments };
}

export function getLeaseDetail(
  reader: PortfolioReader,
  clock: Clock,
  ownerId: string,
  id: string,
): Promise<LeaseDetail | null> {
  return reader.getLeaseDetail(ownerId, id, clock.today());
}
