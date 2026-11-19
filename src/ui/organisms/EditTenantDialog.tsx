'use client';

import { useState, useTransition } from 'react';
import { Pencil } from 'lucide-react';
import { Button } from '@/ui/atoms/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/ui/atoms/dialog';
import { TenantFields } from '@/ui/molecules/TenantFields';
import { updateTenant } from '@/server/actions';
import { notify } from '@/ui/notify';
import { useI18n } from '@/i18n/client';
import type { Tenant } from '@/domain/entities';

export function EditTenantDialog({ tenant }: { tenant: Tenant }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const submit = (formData: FormData) =>
    startTransition(async () => {
      if (notify(await updateTenant(tenant.id, formData), t, t.tenants.updated)) setOpen(false);
    });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="icon" variant="ghost" aria-label={`${t.common.edit}: ${tenant.name}`}>
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>{t.tenants.editTitle}</DialogTitle>
        </DialogHeader>
        <form action={submit} className="grid gap-6 py-2">
          <TenantFields tenant={tenant} />
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
