'use server';

import * as useCases from '@/application/use-cases/properties';
import { parse, propertySchema, propertyUpdateSchema } from '@/application/validation';
import type { ActionResult } from '@/application/result';
import { requireOwner } from '@/infrastructure/auth/clerk';
import { container } from '../container';
import { revalidateProperties } from '../revalidation';
import { ok, run, runValidated } from '../result';

const { uow } = container;

export async function createProperty(formData: FormData): Promise<ActionResult> {
  const ownerId = await requireOwner();
  return runValidated(parse(propertySchema, formData), async (input) => {
    await useCases.createProperty(uow, ownerId, input);
    revalidateProperties();
    return ok();
  });
}

export async function updateProperty(id: string, formData: FormData): Promise<ActionResult> {
  const ownerId = await requireOwner();
  return runValidated(parse(propertyUpdateSchema, formData), async (input) => {
    await useCases.updateProperty(uow, ownerId, id, input);
    revalidateProperties();
    return ok();
  });
}

export async function deleteProperty(id: string): Promise<ActionResult> {
  const ownerId = await requireOwner();
  return run(async () => {
    await useCases.deleteProperty(uow, ownerId, id);
    revalidateProperties();
    return ok();
  });
}
