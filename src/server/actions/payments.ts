'use server';

import * as useCases from '@/application/use-cases/payments';
import { generateMonthlyCharges } from '@/application/use-cases/charges';
import { parse, registerPaymentSchema, updatePaymentSchema } from '@/application/validation';
import type { ActionResult } from '@/application/result';
import { requireOwner } from '@/infrastructure/auth/clerk';
import { container } from '../container';
import { revalidatePayments } from '../revalidation';
import { ok, run, runValidated } from '../result';

const { uow, clock } = container;

export async function registerPayment(paymentId: string, amount: string): Promise<ActionResult> {
  const ownerId = await requireOwner();
  return runValidated(parse(registerPaymentSchema, { paymentId, amount }), async (input) => {
    const { leaseId } = await useCases.registerPayment(uow, clock, ownerId, input);
    revalidatePayments(leaseId);
    return ok();
  });
}

export async function deleteTransaction(paymentId: string, transactionId: string): Promise<ActionResult> {
  const ownerId = await requireOwner();
  return run(async () => {
    const { leaseId } = await useCases.deleteTransaction(uow, ownerId, paymentId, transactionId);
    revalidatePayments(leaseId);
    return ok();
  });
}

export async function updatePayment(
  paymentId: string,
  values: { amount: string; dueDate: string },
): Promise<ActionResult> {
  const ownerId = await requireOwner();
  return runValidated(parse(updatePaymentSchema, { paymentId, ...values }), async (input) => {
    const { leaseId } = await useCases.updatePayment(uow, ownerId, input);
    revalidatePayments(leaseId);
    return ok();
  });
}

export async function deletePayment(paymentId: string): Promise<ActionResult> {
  const ownerId = await requireOwner();
  return run(async () => {
    const { leaseId } = await useCases.deletePayment(uow, ownerId, paymentId);
    revalidatePayments(leaseId);
    return ok();
  });
}

export async function generateMonthlyPayments(): Promise<ActionResult<{ created: number }>> {
  const ownerId = await requireOwner();
  return run(async () => {
    const result = await generateMonthlyCharges(uow, clock, { ownerId });
    revalidatePayments();
    return ok(result);
  });
}
