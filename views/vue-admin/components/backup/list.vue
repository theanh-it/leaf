<script setup lang="ts">
import ColApp from "@fe-admin/components/app/table/col.vue";
import ColAction from "@fe-admin/components/app/table/col-action.vue";
import TableApp from "@fe-admin/components/app/table.vue";
import ButtonApp from "@fe-admin/components/app/button.vue";

import type { BackupFileInfo } from "@fe-admin/types/backup";

defineProps<{
  items: BackupFileInfo[];
  downloadingKey?: string | null;
}>();

const emit = defineEmits<{
  (event: "download", backup: BackupFileInfo): void;
}>();

const headers = [
  "Tên file",
  "Định dạng",
  "Dung lượng",
  "Cập nhật lúc",
  "Thao tác",
];

const getBackupKey = (backup: BackupFileInfo): string => {
  return `${backup.kind}:${backup.name}`;
};

const formatFileSize = (bytes: number): string => {
  if (bytes <= 0) return "0 B";

  const units = ["B", "KB", "MB", "GB", "TB"];
  const unitIndex = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1
  );
  const value = bytes / 1024 ** unitIndex;

  return `${new Intl.NumberFormat("vi-VN", {
    maximumFractionDigits: unitIndex === 0 ? 0 : 2,
  }).format(value)} ${units[unitIndex]}`;
};
</script>

<template>
  <div class="backup-list">
    <TableApp
      v-if="items.length"
      :headers="headers"
      :rows="items"
      hidden-border
      hidden-radius
    >
      <template #row="{ row }">
        <ColApp :value="row.name" />
        <ColApp :value="row.format.toUpperCase()" />
        <ColApp :value="formatFileSize(row.size)" />
        <ColApp type="date" :value="row.modifiedAt" />
        <ColAction>
          <ButtonApp
            size="sm"
            color="primary"
            :icon="downloadingKey === getBackupKey(row) ? 'rotate' : 'download'"
            :label="
              downloadingKey === getBackupKey(row) ? 'Đang tải...' : 'Tải xuống'
            "
            :disabled="downloadingKey !== null"
            @click="emit('download', row)"
          />
        </ColAction>
      </template>
    </TableApp>

    <div v-else class="empty">
      <fa-icon icon="box-open" />
      <p class="message">Chưa có bản backup nào.</p>
    </div>
  </div>
</template>

<style scoped lang="scss">
.backup-list {
  width: 100%;

  > .empty {
    min-height: 240px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: $space-sm;
    color: $color-text-muted;
  }

  > .empty > svg {
    font-size: 36px;
    opacity: 0.6;
  }

  > .empty > .message {
    margin: 0;
    font-size: $font-size-md;
  }
}
</style>
