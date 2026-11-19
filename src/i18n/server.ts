import 'server-only';
import { cookies } from 'next/headers';
import {
  LOCALE_COOKIE,
  defaultLocale,
  getDictionary,
  isLocale,
  type Dictionary,
  type Locale,
} from './index';

/** The saved language, or Spanish until the visitor picks another one. */
export async function getLocale(): Promise<Locale> {
  const saved = (await cookies()).get(LOCALE_COOKIE)?.value;
  return isLocale(saved) ? saved : defaultLocale;
}

export async function getI18n(): Promise<{ locale: Locale; t: Dictionary }> {
  const locale = await getLocale();
  return { locale, t: getDictionary(locale) };
}
