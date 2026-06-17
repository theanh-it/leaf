import type { Context } from "elysia";

import { prisma } from "@/database";
import { createSuccessMessage } from "@/helpers/response";

import type { BodyJWT } from "@/types";

export default async (context: Context & { user: BodyJWT }) => {
  const user = context.user;

  const profile = await prisma.user.findFirst({
    where: {
      id: user.id,
    },
  });

  return createSuccessMessage({
    message: "Profile fetched successfully",
    result: profile,
  });
};
