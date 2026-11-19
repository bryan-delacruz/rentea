'use server';

import * as useCases from '@/application/use-cases/tenants';
import { parse, tenantSchema } from '@/application/validation';
import type { ActionResult } from '@/application/result';
import { requireOwner } from '@/infrastructure/auth/clerk';
import { container } from '../container';
import { revalidateTenants } from '../revalidation';
import { ok, run, runValidated } from '../result';

const { uow } = container;

export async function createTenant(formData: FormData): Promise<ActionResult> {
  const ownerId = await requireOwner();
  return runValidated(parse(tenantSchema, formData), async (input) => {
    await useCases.createTenant(uow, ownerId, input);
    revalidateTenants();
    return ok();
  });
}

export async function updateTenant(id: string, formData: FormData): Promise<ActionResult> {
  const ownerId = await requireOwner();
  return runValidated(parse(tenantSchema, formData), async (input) => {
    await useCases.updateTenant(uow, ownerId, id, input);
    revalidateTenants();
    return ok();
  });
}

export async function deleteTenant(id: string): Promise<ActionResult> {
  const ownerId = await requireOwner();
  return run(async () => {
    await useCases.deleteTenant(uow, ownerId, id);
    revalidateTenants();
    return ok();
  });
}
