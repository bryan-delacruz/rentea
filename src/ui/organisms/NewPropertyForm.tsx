'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { Button } from '@/ui/atoms/button';
import { PropertyFields } from '@/ui/molecules/PropertyFields';
import { createProperty } from '@/server/actions';
import { notify } from '@/ui/notify';
import { useI18n } from '@/i18n/client';

export function NewPropertyForm() {
  const { t } = useI18n();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const submit = (formData: FormData) =>
    startTransition(async () => {
      if (notify(await createProperty(formData), t, t.properties.created)) router.push('/properties');
    });

  return (
    <form action={submit} className="space-y-6">
      <PropertyFields />
      <div className="flex justify-end gap-4">
        <Button variant="outline" type="button" asChild>
          <Link href="/properties">{t.common.cancel}</Link>
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? t.common.saving : t.properties.create}
        </Button>
      </div>
    </form>
  );
}
