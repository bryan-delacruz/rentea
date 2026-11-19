import { balanceCents, summarizeTransactions, toCents, type ISODate } from '@/domain/billing';
import { DomainError } from '@/domain/errors';
import type { Clock, PaymentRepository, UnitOfWork } from '../ports';

/** Recomputes amountPaid and paidDate from the payment's transactions. */
async function syncTotals(payments: PaymentRepository, paymentId: string): Promise<void> {
  const { paidCents, lastPaidAt } = summarizeTransactions(await payments.listTransactions(paymentId));
  await payments.setTotals(paymentId, paidCents, lastPaidAt);
}

/** Records a full or partial payment; returns the lease it belongs to. */
export function registerPayment(
  uow: UnitOfWork,
  clock: Clock,
  ownerId: string,
  input: { paymentId: string; amount: string; paidAt?: ISODate },
): Promise<{ leaseId: string }> {
  return uow.run(async ({ payments }) => {
    const payment = await payments.find(ownerId, input.paymentId);
    if (!payment) throw new DomainError('notFound');
    if (toCents(input.amount) > balanceCents(payment.amountCents, payment.paidCents)) {
      throw new DomainError('overpayment');
    }
    await payments.addTransaction(payment.id, input.amount, input.paidAt ?? clock.today());
    await syncTotals(payments, payment.id);
    return { leaseId: payment.leaseId };
  });
}

export function deleteTransaction(
  uow: UnitOfWork,
  ownerId: string,
  paymentId: string,
  transactionId: string,
): Promise<{ leaseId: string }> {
  return uow.run(async ({ payments }) => {
    const payment = await payments.find(ownerId, paymentId);
    if (!payment) throw new DomainError('notFound');
    if (!(await payments.deleteTransaction(paymentId, transactionId))) throw new DomainError('notFound');
    await syncTotals(payments, paymentId);
    return { leaseId: payment.leaseId };
  });
}

export function updatePayment(
  uow: UnitOfWork,
  ownerId: string,
  input: { paymentId: string; amount: string; dueDate: ISODate },
): Promise<{ leaseId: string }> {
  return uow.run(async ({ payments }) => {
    const payment = await payments.find(ownerId, input.paymentId);
    if (!payment) throw new DomainError('notFound');
    await payments.update(payment.id, { amount: input.amount, dueDate: input.dueDate });
    return { leaseId: payment.leaseId };
  });
}

export function deletePayment(uow: UnitOfWork, ownerId: string, paymentId: string): Promise<{ leaseId: string }> {
  return uow.run(async ({ payments }) => {
    const payment = await payments.find(ownerId, paymentId);
    if (!payment) throw new DomainError('notFound');
    await payments.delete(payment.id);
    return { leaseId: payment.leaseId };
  });
}
