import type { Context } from "elysia";

import { verifyToken } from "@/helpers/auth";
import { getToken } from "@/helpers/request";
import type { BodyJWT } from "@/types";

export default async (context: Context) => {
  try {
    const token = getToken(context);

    const decoded = await verifyToken(token);
    const user = decoded as BodyJWT;

    Object.assign(context, { user });
  } catch (error) {
    const user: BodyJWT = {
      id: "",
      username: "",
      deviceId: "",
    };

    Object.assign(context, { user });
  }
};
