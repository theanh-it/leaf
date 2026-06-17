import type { ResponseResult } from "@/types";
import { RESPONSE_MESSAGE, STATUS_RESPONSE } from "@/constants";

const createResponse = (options: ResponseResult) => {
  const result: ResponseResult = {
    status: options.status,
    message: options.message,
    result: options.result,
  };

  return result;
};

export type InputCreateMessage = {
  message?: string;
  result?: any;
};

export const createSuccessMessage = (options?: InputCreateMessage) => {
  if (!options) {
    return createResponse({
      status: STATUS_RESPONSE.success,
      message: RESPONSE_MESSAGE.success,
    });
  }

  return createResponse({
    status: STATUS_RESPONSE.success,
    message: options.message || RESPONSE_MESSAGE.success,
    result: options.result,
  });
};

export type OptionErrorMessage = {
  status?: string;
  message?: string;
  result?: any;
};

export const createErrorMessage = (options?: OptionErrorMessage) => {
  if (!options) {
    return createResponse({
      status: STATUS_RESPONSE.error,
      message: RESPONSE_MESSAGE.error,
    });
  }

  return createResponse({
    status: options.status || STATUS_RESPONSE.error,
    message: options.message || RESPONSE_MESSAGE.error,
    result: options.result,
  });
};

export const serializeBigInt = (obj: any, isNumber: boolean = true): any => {
  if (typeof obj === "bigint") {
    return isNumber ? Number(obj) : obj.toString(); // Chuyển BigInt thành String
  } else if (Array.isArray(obj)) {
    return obj.map((item) => serializeBigInt(item, isNumber));
  } else if (typeof obj === "object" && obj !== null) {
    return Object.fromEntries(
      Object.entries(obj).map(([key, value]) => [
        key,
        serializeBigInt(value, isNumber),
      ])
    );
  }
  return obj;
};
