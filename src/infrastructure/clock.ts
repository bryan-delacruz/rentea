import type { Clock } from '@/application/ports';
import { todayISO } from '@/domain/billing';

export const limaClock: Clock = { today: () => todayISO() };
