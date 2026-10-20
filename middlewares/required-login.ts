import type { Context } from "elysia";

import { prisma } from "@/database";
import { createErrorMessage } from "@/helpers/response";
import { verifyToken } from "@/helpers/auth";
import { getToken } from "@/helpers/request";
import { USER_PUBLIC_SELECT } from "@/helpers/user";
import type { BodyJWT } from "@/types";

export default async (context: Context) => {
  const token = getToken(context);
  if (!token) return unauthorized(context, "auth.requiredToken");

  let decoded: BodyJWT;
  try {
    decoded = await verifyToken(token);
  } catch {
    return unauthorized(context, "auth.invalidToken");
  }

  // Đọc quyền hiện tại, không tin role/status hoặc username trong JWT cũ.
  const user = await prisma.user.findUnique({
    where: { id: decoded.id },
    select: USER_PUBLIC_SELECT,
  });
  if (!user || user.status !== "active") {
    return unauthorized(context, "auth.accountUnavailable");
  }

  Object.assign(context, { user });
};

function unauthorized(context: Context, message: string) {
  return context.status(
    401,
    createErrorMessage({ message, result: { token: message } })
  );
}
