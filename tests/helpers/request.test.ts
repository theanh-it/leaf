/** helpers/request.ts: parse dữ liệu Zod, bỏ field thừa và lỗi input gốc. */
import { test, expect } from "bun:test";
import { z } from "zod";
import { validateData } from "@/helpers/request";

test("validation infers parsed output, strips unknown fields and handles root errors", async () => {
  const schema = z.object({ page: z.coerce.number().default(1) });
  expect(await validateData({ page: "2", role: "admin" }, schema)).toEqual({
    output: { page: 2 },
    errors: null,
  });
  const invalid = await validateData(null, schema);
  expect(invalid.output).toBeNull();
  expect(invalid.errors?._form).toBeDefined();
});
