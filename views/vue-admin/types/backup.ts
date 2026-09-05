export type BackupKind = "database" | "files";

export interface BackupFileInfo {
  name: string;
  kind: BackupKind;
  format: string;
  size: number;
  modifiedAt: string;
}

export interface BackupGroup {
  items: BackupFileInfo[];
  totalFiles: number;
  totalSize: number;
}

export interface BackupOverview {
  databases: BackupGroup;
  files: BackupGroup;
}
