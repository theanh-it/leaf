<script setup lang="ts">
import { computed, onMounted, ref } from "vue";

import AdminCard from "@fe-admin/components/app/admin-card.vue";
import ButtonApp from "@fe-admin/components/app/button.vue";
import TabApp from "@fe-admin/components/app/tab.vue";
import BackupList from "@fe-admin/components/backup/list.vue";
import AdminPage from "@fe-admin/components/page/admin.vue";

import { backupsApi } from "@fe-admin/apis/backups";
import { useNotification } from "@fe-admin/composables/notification";

import type { BackupFileInfo, BackupOverview } from "@fe-admin/types/backup";

type BackupTab = "database" | "files";

const EMPTY_BACKUPS: BackupOverview = {
  databases: { items: [], totalFiles: 0, totalSize: 0 },
  files: { items: [], totalFiles: 0, totalSize: 0 },
};

const { notifyError } = useNotification();

const activeTab = ref<BackupTab>("database");
const downloadingKey = ref<string | null>(null);
const isLoading = ref(true);
const backups = ref<BackupOverview>(EMPTY_BACKUPS);

const tabs = computed(() => [
  {
    icon: "database",
    label: `Database (${backups.value.databases.totalFiles})`,
    key: "database",
  },
  {
    icon: "folder-open",
    label: `Files (${backups.value.files.totalFiles})`,
    key: "files",
  },
]);

const fetchBackups = async () => {
  isLoading.value = true;

  try {
    const response = await backupsApi.list();
    backups.value = response.result || EMPTY_BACKUPS;
  } catch {
    notifyError("Không thể tải danh sách backup");
  } finally {
    isLoading.value = false;
  }
};

const handleDownload = async (backup: BackupFileInfo) => {
  if (downloadingKey.value) return;

  downloadingKey.value = `${backup.kind}:${backup.name}`;

  try {
    const blob = await backupsApi.download(backup);
    downloadBlob(blob, backup.name);
  } catch {
    notifyError("Không thể tải file backup");
  } finally {
    downloadingKey.value = null;
  }
};

onMounted(fetchBackups);

const downloadBlob = (blob: Blob, name: string): void => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = name;
  link.click();

  setTimeout(() => URL.revokeObjectURL(url), 1_000);
};
</script>

<template>
  <AdminPage
    title="Backup"
    :breadcrumbs="[{ label: 'Trang chủ', to: '/admin' }, { label: 'Backup' }]"
  >
    <AdminCard :loading="isLoading" title="Quản lý backup" :show-add="false">
      <template #toolbar>
        <div class="backup-toolbar">
          <p class="description">
            Dữ liệu được đọc trực tiếp từ thư mục backup trên máy chủ.
          </p>
          <ButtonApp
            size="sm"
            color="primary"
            icon="rotate"
            label="Làm mới"
            :disabled="isLoading"
            @click="fetchBackups"
          />
        </div>
      </template>

      <TabApp v-model="activeTab" :tabs="tabs">
        <template #database>
          <BackupList
            :items="backups.databases.items"
            :downloading-key="downloadingKey"
            @download="handleDownload"
          />
        </template>
        <template #files>
          <BackupList
            :items="backups.files.items"
            :downloading-key="downloadingKey"
            @download="handleDownload"
          />
        </template>
      </TabApp>
    </AdminCard>
  </AdminPage>
</template>

<style scoped lang="scss">
.backup-toolbar {
  padding: $space-sm $space-md;
  border-top: 1px solid $color-border;
  border-bottom: 1px solid $color-border;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: $space-md;

  > .description {
    margin: 0;
    color: $color-text-muted;
    font-size: $font-size-sm;
  }
}

@media (max-width: 640px) {
  .backup-toolbar {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
