export type RestorePhase =
  | "preparing"
  | "validating"
  | "files"
  | "database"
  | "completed";

export interface RestoreJob {
  id: string;
  status: "running" | "success" | "error";
  phase: RestorePhase;
  errorCode?: string;
}
