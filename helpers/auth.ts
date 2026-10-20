import * as jwt from "jsonwebtoken";
import { z } from "zod";

import { JWT_EXPIRES_IN } from "@/constants";

import type { BodyJWT } from "@/types";

const tokenSchema = z.object({
  id: z.uuid(),
  username: z.string().min(1).max(255),
  deviceId: z.string().max(255).nullable().optional(),
});

export const signJWT = async (payload: BodyJWT, remember: boolean = false) => {
  const expiresIn = remember ? JWT_EXPIRES_IN.oneWeek : JWT_EXPIRES_IN.oneDay;
  const jwtSecret = getJwtSecret();

  const token = jwt.sign(tokenSchema.parse(payload), jwtSecret, {
    expiresIn,
    algorithm: "HS256",
  });

  return token;
};

export const verifyToken = async (token: string): Promise<BodyJWT> => {
  const decoded = jwt.verify(token, getJwtSecret(), { algorithms: ["HS256"] });
  return tokenSchema.parse(decoded);
};

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret?.trim()) throw new Error("JWT_SECRET is required");
  return secret;
}
