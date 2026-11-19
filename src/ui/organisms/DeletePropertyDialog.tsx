'use client';

import { ConfirmDeleteDialog } from '@/ui/molecules/ConfirmDeleteDialog';
import { deleteProperty } from '@/server/actions';
import { interpolate } from '@/i18n';
import { useI18n } from '@/i18n/client';

export function DeletePropertyDialog({ propertyId, propertyName }: { propertyId: string; propertyName: string }) {
  const { t } = useI18n();
  return (
    <ConfirmDeleteDialog
      title={t.properties.deleteTitle}
      description={interpolate(t.properties.deleteConfirm, { name: propertyName })}
      successMessage={t.properties.deleted}
      label={`${t.common.delete}: ${propertyName}`}
      onConfirm={() => deleteProperty(propertyId)}
    />
  );
}
