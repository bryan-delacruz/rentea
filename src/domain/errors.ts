/**
 * Business rule violations. Use cases throw them; the server layer turns them
 * into error codes the UI translates. They carry no user-facing text.
 */
export type DomainErrorCode =
  | 'validation'
  | 'notFound'
  | 'propertyUnavailable'
  | 'hasLeases'
  | 'duplicateDni'
  | 'invalidDates'
  | 'overpayment'
  | 'unknown';

export class DomainError extends Error {
  /** `fields` names the inputs to highlight, when the rule is about specific fields. */
  constructor(
    public readonly code: DomainErrorCode,
    public readonly fields?: string[],
  ) {
    super(code);
    this.name = 'DomainError';
  }
}
