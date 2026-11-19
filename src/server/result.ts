import 'server-only';
import { DomainError } from '@/domain/errors';
import type { ActionErrorCode, ActionResult } from '@/application/result';
import type { ParseResult } from '@/application/validation';

export const ok = <T = undefined>(data?: T): ActionResult<T> => ({ ok: true, data: data as T });

export const fail = (error: ActionErrorCode, fields?: string[]): ActionResult<never> => ({
  ok: false,
  error,
  fields,
});

/**
 * Runs a use case and turns expected failures into translated error codes.
 * Unexpected errors are logged and reported as `unknown` without leaking details.
 */
export async function run<T>(work: () => Promise<ActionResult<T>>): Promise<ActionResult<T>> {
  try {
    return await work();
  } catch (error) {
    if (error instanceof DomainError) return fail(error.code, error.fields);
    console.error('[action] unexpected error', error);
    return fail('unknown');
  }
}

/** Shorthand for actions: validate, then run the use case only on valid input. */
export async function runValidated<I, T>(
  input: ParseResult<I>,
  work: (data: I) => Promise<ActionResult<T>>,
): Promise<ActionResult<T>> {
  if (!input.ok) return fail('validation', input.fields);
  const data = input.data;
  return run(() => work(data));
}
