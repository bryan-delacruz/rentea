'use client';

import { useState, useTransition } from 'react';
import { DollarSign } from 'lucide-react';
import { Button } from '@/ui/atoms/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/ui/atoms/dialog';
import { Input } from '@/ui/atoms/input';
import { Label } from '@/ui/atoms/label';
import { registerPayment } from '@/server/actions';
import { notify } from '@/ui/notify';
import { balanceCents, centsToDecimalString, toCents } from '@/domain/billing';
import { formatMoney } from '@/shared/format';
import { useI18n } from '@/i18n/client';
import type { Currency, Payment } from '@/domain/entities';

export function RegisterPaymentDialog({ payment, currency }: { payment: Payment; currency: Currency }) {
  const { locale, t } = useI18n();
  const pending = balanceCents(toCents(payment.amount), toCents(payment.amountPaid));
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(centsToDecimalString(pending));
  const [saving, startTransition] = useTransition();
  const money = (value: number) => formatMoney(value, currency, locale);

  // Suggest the current pending balance every time the dialog opens.
  const onOpenChange = (next: boolean) => {
    if (next) setAmount(centsToDecimalString(pending));
    setOpen(next);
  };

  const confirm = () =>
    startTransition(async () => {
      if (notify(await registerPayment(payment.id, amount), t, t.payments.registered)) setOpen(false);
    });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button size="icon" variant="ghost" aria-label={t.payments.register} title={t.payments.register}>
          <DollarSign className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t.payments.registerTitle}</DialogTitle>
          <DialogDescription>{t.payments.registerHint}</DialogDescription>
        </DialogHeader>
        <dl className="grid grid-cols-2 gap-2 py-2 text-sm">
          <dt className="text-muted-foreground">{t.payments.total}</dt>
          <dd className="text-right font-medium">{money(payment.amount)}</dd>
          <dt className="text-muted-foreground">{t.payments.paid}</dt>
          <dd className="text-right font-medium text-success">{money(payment.amountPaid)}</dd>
          <dt className="text-muted-foreground">{t.payments.pending}</dt>
          <dd className="text-right font-medium text-destructive">{money(pending / 100)}</dd>
        </dl>
        <div className="space-y-2">
          <Label htmlFor={`amount-${payment.id}`}>{t.payments.amountToPay}</Label>
          <Input
            id={`amount-${payment.id}`}
            type="number"
            min="0.01"
            step="0.01"
            max={pending / 100}
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
            {t.common.cancel}
          </Button>
          <Button onClick={confirm} disabled={saving}>
            {saving ? t.common.saving : t.payments.register}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
