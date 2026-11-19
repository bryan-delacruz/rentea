'use client';

import { useState, useTransition } from 'react';
import { Edit, FileDown, MessageCircle, MessageSquareWarning, MoreVertical, Trash } from 'lucide-react';
import { Button } from '@/ui/atoms/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/ui/atoms/dropdown-menu';
import { EditPaymentDialog } from '@/ui/organisms/EditPaymentDialog';
import { RegisterPaymentDialog } from '@/ui/organisms/RegisterPaymentDialog';
import { deletePayment } from '@/server/actions';
import { notify } from '@/ui/notify';
import { downloadReceipt } from '@/infrastructure/documents/receipt';
import { paymentMessage, whatsAppUrl } from '@/infrastructure/messaging/whatsapp';
import { useI18n } from '@/i18n/client';
import type { Currency, Payment } from '@/domain/entities';

/** Every action available on a charge: WhatsApp, receipt, record, edit, delete. */
export function PaymentActions({
  payment,
  currency,
  tenant,
  propertyName,
}: {
  payment: Payment;
  currency: Currency;
  tenant: { name: string; phone: string };
  propertyName: string;
}) {
  const { locale, t } = useI18n();
  const [editOpen, setEditOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const isPaid = payment.status === 'PAID';
  const whatsappLabel = isPaid ? t.payments.whatsappConfirmation : t.payments.whatsappReminder;

  const sendWhatsApp = () => {
    const message = paymentMessage(locale, payment, currency, tenant.name, propertyName);
    window.open(whatsAppUrl(tenant.phone, message), '_blank', 'noopener,noreferrer');
  };

  const remove = () => {
    if (!window.confirm(t.payments.deleteConfirm)) return;
    startTransition(async () => {
      notify(await deletePayment(payment.id), t, t.payments.deleted);
    });
  };

  return (
    <div className="flex justify-end gap-1">
      <Button size="icon" variant="ghost" aria-label={whatsappLabel} title={whatsappLabel} onClick={sendWhatsApp}>
        {isPaid ? (
          <MessageCircle className="h-4 w-4 text-success" />
        ) : (
          <MessageSquareWarning className="h-4 w-4 text-warning" />
        )}
      </Button>

      {payment.amountPaid > 0 && (
        <Button
          size="icon"
          variant="ghost"
          aria-label={t.payments.downloadReceipt}
          title={t.payments.downloadReceipt}
          onClick={() => downloadReceipt(locale, payment, currency, tenant.name, propertyName)}
        >
          <FileDown className="h-4 w-4 text-primary" />
        </Button>
      )}

      {!isPaid && <RegisterPaymentDialog payment={payment} currency={currency} />}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-9 w-9" aria-label={t.common.openMenu} disabled={pending}>
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setEditOpen(true)}>
            <Edit className="mr-2 h-4 w-4" /> {t.common.edit}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={remove} className="text-destructive focus:text-destructive">
            <Trash className="mr-2 h-4 w-4" /> {t.common.delete}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <EditPaymentDialog
        key={`${payment.amount}-${payment.dueDate}`}
        open={editOpen}
        onOpenChange={setEditOpen}
        payment={payment}
        currency={currency}
      />
    </div>
  );
}
