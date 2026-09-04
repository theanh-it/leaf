import { CronJob } from "cron";

import { backup } from "@/backup";

import { TIME } from "@/constants/cron-job";

export const backupJob = new CronJob(TIME.everyDay, backup);
