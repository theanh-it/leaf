import { z } from "zod";
import type { Context } from "elysia";

export const validateData = async <T>(
  data: object = {},
  schema: z.Schema
): Promise<{ output: T; errors: { [key: string]: string } | null }> => {
  try {
    const result = (await schema.parseAsync(data)) as T;

    return { output: result, errors: null };
  } catch (error: any) {
    if (!error.issues) throw error;

    const errors = error.issues.reduce(
      (result: any, { path = [], message = "" }) => {
        const [key] = path;

        result[key] = message;

        return result;
      },
      {}
    );

    return {
      output: null as T,
      errors,
    };
  }
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
  const token = context.request.headers.get("authorization") || "";
  const [_, tokenValue] = token.split(" ");

  return tokenValue || "";
};
