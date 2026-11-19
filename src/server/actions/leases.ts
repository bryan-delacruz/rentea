'use server';

import * as useCases from '@/application/use-cases/leases';
import { leaseSchema, leaseUpdateSchema, parse, terminateLeaseSchema } from '@/application/validation';
import type { ActionResult } from '@/application/result';
import { requireOwner } from '@/infrastructure/auth/clerk';
import { container } from '../container';
import { revalidateLeases } from '../revalidation';
import { ok, runValidated } from '../result';

const { uow } = container;

export async function createLease(formData: FormData): Promise<ActionResult<{ id: string }>> {
  const ownerId = await requireOwner();
  return runValidated(parse(leaseSchema, formData), async (input) => {
    const lease = await useCases.createLease(uow, ownerId, input);
    revalidateLeases();
    return ok(lease);
  });
}

export async function updateLease(id: string, formData: FormData): Promise<ActionResult> {
  const ownerId = await requireOwner();
  return runValidated(parse(leaseUpdateSchema, formData), async (input) => {
    await useCases.updateLease(uow, ownerId, id, input);
    revalidateLeases();
    return ok();
  });
}

export async function terminateLease(id: string, terminationDate: string): Promise<ActionResult> {
  const ownerId = await requireOwner();
  return runValidated(parse(terminateLeaseSchema, { id, terminationDate }), async (input) => {
    await useCases.terminateLease(uow, ownerId, input.id, input.terminationDate);
    revalidateLeases();
    return ok();
  });
}
