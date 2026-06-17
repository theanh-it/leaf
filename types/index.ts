import type { Context } from "elysia";

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
  user: BodyJWT;
};
