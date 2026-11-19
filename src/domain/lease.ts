import type { ISODate } from './billing';
import type { PropertyType } from './entities';

/** Amounts are decimal strings ("650.00"), the format the database stores. */
export interface UtilityCostInput {
  waterCost?: string;
  electricityCost?: string;
  gasCost?: string;
}

export interface UtilityCostValues {
  waterCost: string | null;
  electricityCost: string | null;
  gasCost: string | null;
}

/** Only commercial units track water, electricity and gas; rooms store none. */
export function utilityCostsFor(propertyType: PropertyType, input: UtilityCostInput): UtilityCostValues {
  if (propertyType !== 'COMMERCIAL') return { waterCost: null, electricityCost: null, gasCost: null };
  return {
    waterCost: input.waterCost ?? '0',
    electricityCost: input.electricityCost ?? '0',
    gasCost: input.gasCost ?? '0',
  };
}

/** A lease must end after it starts. ISO dates compare correctly as strings. */
export function hasValidTerm(startDate: ISODate, endDate: ISODate): boolean {
  return endDate > startDate;
}

/** A lease can't be terminated before it started. */
export function canTerminateOn(startDate: ISODate, terminationDate: ISODate): boolean {
  return terminationDate >= startDate;
}
