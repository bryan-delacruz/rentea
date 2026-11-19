import { generateMonthlyCharges } from '@/application/use-cases/charges';
import { isAuthorizedCron } from '@/infrastructure/cron';
import { container } from '@/server/container';

/** Daily: creates this month's charge for every active lease. Idempotent. */
export async function GET(request: Request) {
  if (!isAuthorizedCron(request)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const result = await generateMonthlyCharges(container.uow, container.clock);
  return Response.json(result);
}
