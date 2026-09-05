import { format } from "date-fns";

export const delay = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const formatTime = (
  date: string,
  formatStr: string = "yyyy-MM-dd HH:mm"
) => {
  const utcDate = new Date(date);
  // const day = format(utcDate, "yyyy-MM-dd");
  // const hour = format(utcDate, "HH:mm:ss.SSS");
  // const newDate = `${day}T${hour}Z`;

  // return format(newDate, formatStr);
  return format(utcDate, formatStr);
};

export const paginate = (arr: any[], size = 20) => {
  const numParts = Math.ceil(arr.length / size);
  const parts = [];

  for (let i = 0; i < numParts; i++) {
    const newPart = arr.slice(i * size, (i + 1) * size);
    parts.push(newPart);
  }

  return parts;
};

export const numberFormat = (
  number: number,
  decimals: number = 0,
  dec_point?: string,
  thousands_sep?: string
): string => {
  const n = number;
  const c = isNaN((decimals = Math.abs(decimals || 0))) ? 2 : decimals;
  const d = dec_point === undefined ? "," : dec_point;
  const t = thousands_sep === undefined ? "." : thousands_sep;
  const s = n < 0 ? "-" : "";
  const i = parseInt(Math.abs(n).toFixed(c)) + "";
  const j = i.length > 3 ? i.length % 3 : 0;

  const result =
    s +
    (j ? i.slice(0, j) + t : "") +
    i.slice(j).replace(/(\d{3})(?=\d)/g, "$1" + t) +
    (c
      ? d +
        Math.abs(n - parseFloat(i))
          .toFixed(c)
          .slice(2)
      : "");

  const parts = result.split(",");
  const integer = parts[0] ?? "";
  const decimal = parts[1];
  if (decimal === undefined || !Number(decimal)) return integer;

  return result;
};

export const cloneDeep = (obj: any) => JSON.parse(JSON.stringify(obj));

export const chunkArray = <T>(arr: T[], size: number): T[][] => {
  return arr.reduce((acc: T[][], item: T, index: number) => {
    const chunkIndex = Math.floor(index / size);
    if (!acc[chunkIndex]) {
      acc[chunkIndex] = [];
    }
    acc[chunkIndex].push(item);
    return acc;
  }, [] as T[][]);
};

export const debounce = (func: (...args: any[]) => void, delay: number) => {
  let timeout: any;

  return (...args: any[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), delay);
  };
};
