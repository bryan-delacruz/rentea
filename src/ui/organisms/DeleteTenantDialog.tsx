'use client';

import { ConfirmDeleteDialog } from '@/ui/molecules/ConfirmDeleteDialog';
import { deleteTenant } from '@/server/actions';
import { interpolate } from '@/i18n';
import { useI18n } from '@/i18n/client';

export function DeleteTenantDialog({ tenantId, tenantName }: { tenantId: string; tenantName: string }) {
  const { t } = useI18n();
  return (
    <ConfirmDeleteDialog
      title={t.tenants.deleteTitle}
      description={interpolate(t.tenants.deleteConfirm, { name: tenantName })}
      successMessage={t.tenants.deleted}
      label={`${t.common.delete}: ${tenantName}`}
      onConfirm={() => deleteTenant(tenantId)}
    />
  );
}
