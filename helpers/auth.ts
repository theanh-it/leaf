import * as jwt from "jsonwebtoken";

import { JWT_EXPIRES_IN } from "@/constants";

import type { BodyJWT } from "@/types";

export const signJWT = async (payload: BodyJWT, remember: boolean = false) => {
  const expiresIn = remember ? JWT_EXPIRES_IN.oneWeek : JWT_EXPIRES_IN.oneDay;
  const jwtSecret = process.env.JWT_SECRET as string;

  const token = jwt.sign(payload, jwtSecret, { expiresIn });

  return token;
};

export const verifyToken = (token: string) => {
  return new Promise((resolve, reject) => {
    const jwtSecret = process.env.JWT_SECRET as string;

    jwt.verify(token, jwtSecret, (error, decoded) => {
      if (error) {
        return reject(error);
      }

      return resolve(decoded);
    });
  });
};
