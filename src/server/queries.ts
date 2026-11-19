import 'server-only';
import * as portfolio from '@/application/use-cases/portfolio';
import { requireOwner } from '@/infrastructure/auth/clerk';
import { container } from './container';

/**
 * Read side for Server Components. Each query resolves the signed-in owner and
 * only returns that owner's data, as client-safe entities.
 */

const { reader, clock } = container;

export async function getPortfolio() {
  return portfolio.getPortfolio(reader, clock, await requireOwner());
}

export async function getLeaseDetail(id: string) {
  return portfolio.getLeaseDetail(reader, clock, await requireOwner(), id);
}

export async function listProperties() {
  return reader.listProperties(await requireOwner());
}

export async function listTenants() {
  return reader.listTenants(await requireOwner());
}

export async function listLeases() {
  return reader.listLeases(await requireOwner(), clock.today());
}
