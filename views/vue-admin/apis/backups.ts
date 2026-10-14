import { api, baseApi } from "@fe-admin/plugins/ky";

import type { BackupFileInfo, BackupOverview } from "@fe-admin/types/backup";
import type { RestoreJob } from "@fe-admin/types/backup";
import type { ResponseApi } from "@fe-admin/types/api";

export const list = () => api.get<BackupOverview>("backups");

export const download = (backup: BackupFileInfo) => {
  const kind = encodeURIComponent(backup.kind);
  const name = encodeURIComponent(backup.name);

  return baseApi.get(`backups/${kind}/${name}`).blob();
};

export const restoreStatus = () =>
  api.get<RestoreJob | null>("backups/restore", { cache: "no-store" });

export const restore = (database: File, files: File, requestId: string) => {
  const body = new FormData();
  body.append("database", database);
  body.append("files", files);
  body.append("requestId", requestId);

  // onUploadProgress dùng request stream, không tương thích HTTP/1.x trên Chrome.
  return baseApi
    .post("backups/restore", {
      body,
      retry: 0,
    })
    .json<ResponseApi<RestoreJob>>();
};

export const backupsApi = { download, list, restore, restoreStatus };
