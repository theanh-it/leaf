import type { Context } from "elysia";

import { prisma } from "@/database";
import { verifyToken } from "@/helpers/auth";
import { getToken } from "@/helpers/request";
import { USER_PUBLIC_SELECT } from "@/helpers/user";
import type { BodyJWT } from "@/types";

export default async (context: Context) => {
  Object.assign(context, { user: null });
  const token = getToken(context);
  if (!token) return;

  let decoded: BodyJWT;
  try {
    decoded = await verifyToken(token);
  } catch {
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: decoded.id },
    select: USER_PUBLIC_SELECT,
  });
  if (user?.status === "active") Object.assign(context, { user });
};
