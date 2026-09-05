import { api, baseApi } from "@fe-admin/plugins/ky";

import type { BackupFileInfo, BackupOverview } from "@fe-admin/types/backup";

export const list = () => api.get<BackupOverview>("backups");

export const download = (backup: BackupFileInfo) => {
  const kind = encodeURIComponent(backup.kind);
  const name = encodeURIComponent(backup.name);

  return baseApi.get(`backups/${kind}/${name}`).blob();
};

export const backupsApi = { download, list };
