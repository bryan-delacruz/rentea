'use client';

import { formatDate, formatMoney } from '@/shared/format';
import { useI18n } from '@/i18n/client';
import type { Currency, ISODate } from '@/domain/entities';

/** Money and dates formatted for the active language. */
export function Money({ amount, currency }: { amount: number; currency: Currency }) {
  const { locale } = useI18n();
  return <>{formatMoney(amount, currency, locale)}</>;
}

export function DateText({ date }: { date: ISODate | null }) {
  const { locale } = useI18n();
  return <>{date ? formatDate(date, locale) : '—'}</>;
}
