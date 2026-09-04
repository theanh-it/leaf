export const TIME = {
  everySecond: "* * * * * *",
  everyMinute: "* * * * *",
  every15m: "*/15 * * * *",
  every1h: "0 * * * *",
  everyDay: "0 0 * * *",
  everyWeek: "0 0 * * 1",
  everyMonth: "0 0 1 * *",
  everyYear: "0 0 1 1 *",
} as const;
