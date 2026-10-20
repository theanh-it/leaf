import type { Context } from "elysia";
import type { Prisma } from ".prisma/client/client";
import type { USER_PUBLIC_SELECT } from "@/helpers/user";

export type ResponseResult<T = any> = {
  status: string;
  message: string;
  result?: T;
};

export type BodyJWT = {
  id: string;
  username: string;
  deviceId?: string | null;
};

export type ContextAuth = Context & {
  user: Prisma.UserGetPayload<{ select: typeof USER_PUBLIC_SELECT }>;
};
