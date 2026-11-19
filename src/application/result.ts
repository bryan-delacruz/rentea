import type { DomainErrorCode } from '@/domain/errors';

/** Outcome of every server action, so the UI can show a translated message. */
export type ActionErrorCode = DomainErrorCode;

export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: ActionErrorCode; fields?: string[] };
