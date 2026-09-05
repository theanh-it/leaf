import { listBackups } from "@be-helpers/backup";
import { createSuccessMessage } from "@be-helpers/response";

export default async () => {
  const backups = await listBackups();

  return createSuccessMessage({
    message: "backups.listSuccess",
    result: backups,
  });
};
