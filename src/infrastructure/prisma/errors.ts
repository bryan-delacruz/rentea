import { Prisma } from '@prisma/client';
import { DomainError } from '@/domain/errors';

/** Translates the database errors the app expects into domain errors. */
export async function withDomainErrors<T>(work: () => Promise<T>): Promise<T> {
  try {
    return await work();
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // The only unique key a landlord can hit from a form is the tenant's DNI.
      if (error.code === 'P2002') throw new DomainError('duplicateDni');
      if (error.code === 'P2025') throw new DomainError('notFound');
    }
    throw error;
  }
}
