import type { Context } from "elysia";
import { z } from "zod";
import type { Prisma } from ".prisma/client/client";

import { prisma } from "@/database";
import { USER_PUBLIC_SELECT, USER_TYPES, USER_STATUSES } from "@/helpers/user";
import { validateData } from "@/helpers/request";
import { createErrorMessage, createSuccessMessage } from "@/helpers/response";

const querySchema = z.object({
  page: z.coerce.number().int().min(1).max(2147483647).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(255).default(""),
  type: z.enum(USER_TYPES).optional(),
  status: z.enum(USER_STATUSES).optional(),
});

export default async (ctx: Context) => {
  const validation = await validateData(ctx.query, querySchema);
  if (validation.errors) {
    return ctx.status(
      422,
      createErrorMessage({
        status: "validation_error",
        message: "validation.error",
        result: validation.errors,
      })
    );
  }
  const query = validation.output;
  const where: Prisma.UserWhereInput = {
    type: query.type,
    status: query.status,
    ...(query.search
      ? {
          OR: ["username", "fullname", "email", "phone"].map((field) => ({
            [field]: { contains: query.search, mode: "insensitive" },
          })),
        }
      : {}),
  };
  const totalRecords = await prisma.user.count({ where });
  const totalPages = Math.max(1, Math.ceil(totalRecords / query.limit));
  const page = Math.min(query.page, totalPages);
  const users = await prisma.user.findMany({
    where,
    select: USER_PUBLIC_SELECT,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    skip: (page - 1) * query.limit,
    take: query.limit,
  });

  return ctx.status(
    200,
    createSuccessMessage({
      message: "Lấy danh sách người dùng thành công",
      result: {
        items: users,
        pagination: { page, limit: query.limit, totalRecords, totalPages },
      },
    })
  );
};
