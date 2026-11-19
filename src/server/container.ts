import 'server-only';
import type { Clock, PortfolioReader, UnitOfWork } from '@/application/ports';
import { limaClock } from '@/infrastructure/clock';
import { prismaPortfolioReader } from '@/infrastructure/prisma/reader';
import { prismaUnitOfWork } from '@/infrastructure/prisma/repositories';

/**
 * The one place that picks concrete implementations for the application's
 * ports. Swapping the database or the clock (in tests) only changes this file.
 */
export const container: { uow: UnitOfWork; reader: PortfolioReader; clock: Clock } = {
  uow: prismaUnitOfWork,
  reader: prismaPortfolioReader,
  clock: limaClock,
};
