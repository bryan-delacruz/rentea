import { dueDateForMonth, isBillableInMonth, type ISODate } from '@/domain/billing';
import type { Clock, UnitOfWork } from '../ports';

/**
 * Creates this month's charge for every billable lease. Safe to run any number
 * of times: charges that already exist are skipped.
 * Used by the landlord's button (one owner) and by the daily cron (everyone).
 */
export function generateMonthlyCharges(
  uow: UnitOfWork,
  clock: Clock,
  options: { ownerId?: string; month?: ISODate } = {},
): Promise<{ created: number }> {
  const dueDate = dueDateForMonth(options.month ?? clock.today());

  return uow.run(async ({ leases, payments }) => {
    const billable = (await leases.listActive(options.ownerId)).filter((lease) =>
      isBillableInMonth(lease, dueDate),
    );
    if (billable.length === 0) return { created: 0 };

    const created = await payments.createCharges(
      billable.map((lease) => ({
        ownerId: lease.ownerId,
        leaseId: lease.id,
        dueDate,
        amount: lease.monthlyRent,
      })),
    );
    return { created };
  });
}
