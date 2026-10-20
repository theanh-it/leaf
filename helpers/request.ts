import { z } from "zod";
import type { Context } from "elysia";

export const validateData = async <S extends z.ZodType>(
  data: unknown,
  schema: S
): Promise<
  | { output: z.output<S>; errors: null }
  | { output: null; errors: Record<string, string> }
> => {
  const result = await schema.safeParseAsync(data);
  if (result.success) return { output: result.data, errors: null };

  return {
    output: null,
    errors: Object.fromEntries(
      result.error.issues.map(({ path, message }) => [
        String(path[0] ?? "_form"),
        message,
      ])
    ),
  };
};

const FILE_TYPE = {
  file: "File",
  fileArray: "File[]",
  empty: "Empty",
  string: "String",
  number: "Number",
  object: "Object",
  array: "Array",
};

const getType = (value: unknown) => {
  if (value instanceof File && value.name) {
    return FILE_TYPE.file;
  }

  if (value instanceof File && !value.name) {
    return FILE_TYPE.empty;
  }

  if (Array.isArray(value) && value.every((v) => v instanceof File)) {
    return FILE_TYPE.fileArray;
  }

  return FILE_TYPE.empty;
};

export const getFilesFromBody = (
  body: { [name: string]: any } = {},
  name: string
) => {
  const type = getType(body[name]);

  switch (type) {
    case FILE_TYPE.empty:
      return [];
    case FILE_TYPE.file:
      return [body[name] as File];
    default:
      return body[name] as File[];
  }
};

export const getToken = (context: Context) => {
  const header = context.request.headers.get("authorization") ?? "";
  return /^Bearer\s+(\S+)$/i.exec(header)?.[1] ?? "";
};
