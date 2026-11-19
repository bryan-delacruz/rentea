'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { Button } from '@/ui/atoms/button';
import { TenantFields } from '@/ui/molecules/TenantFields';
import { createTenant } from '@/server/actions';
import { notify } from '@/ui/notify';
import { useI18n } from '@/i18n/client';

export function NewTenantForm() {
  const { t } = useI18n();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const submit = (formData: FormData) =>
    startTransition(async () => {
      if (notify(await createTenant(formData), t, t.tenants.created)) router.push('/tenants');
    });

  return (
    <form action={submit} className="space-y-6">
      <TenantFields />
      <div className="flex justify-end gap-4">
        <Button variant="outline" type="button" asChild>
          <Link href="/tenants">{t.common.cancel}</Link>
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? t.common.saving : t.tenants.create}
        </Button>
      </div>
    </form>
  );
}
