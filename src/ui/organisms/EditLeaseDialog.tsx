'use client';

import { useState, useTransition } from 'react';
import { Pencil } from 'lucide-react';
import { Button } from '@/ui/atoms/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/ui/atoms/dialog';
import { LeaseTermsFields } from '@/ui/molecules/LeaseTermsFields';
import { updateLease } from '@/server/actions';
import { notify } from '@/ui/notify';
import { useI18n } from '@/i18n/client';
import type { Lease, Property } from '@/domain/entities';

export function EditLeaseDialog({ lease, property }: { lease: Lease; property?: Property }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const submit = (formData: FormData) =>
    startTransition(async () => {
      if (notify(await updateLease(lease.id, formData), t, t.leases.updated)) setOpen(false);
    });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="icon" variant="ghost" aria-label={t.leases.editTitle}>
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{t.leases.editTitle}</DialogTitle>
        </DialogHeader>
        <form action={submit} className="grid gap-6 py-2">
          <LeaseTermsFields lease={lease} isCommercial={property?.type === 'COMMERCIAL'} />
          <div className="flex justify-end">
            <Button type="submit" disabled={pending}>
              {pending ? t.common.saving : t.common.save}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
