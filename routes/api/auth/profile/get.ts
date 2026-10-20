import { createSuccessMessage } from "@/helpers/response";
import type { ContextAuth } from "@/types";

export default async (context: ContextAuth) => {
  // requiredLogin đã tải user bằng USER_PUBLIC_SELECT.
  return createSuccessMessage({
    message: "Profile fetched successfully",
    result: context.user,
  });
};
