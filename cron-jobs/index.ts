import { backupJob } from "@/cron-jobs/backup";
console.log("cron-job: start");
[backupJob].every((item) => item.start());
