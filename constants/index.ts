export const JWT_EXPIRES_IN = {
  oneDay: "1d",
  oneWeek: "7d",
  oneMonth: "30d",
  oneYear: "365d",
} as const;

export const STATUS = {
  active: 1,
  inactive: 0,
};

export const IMAGE_WIDTH = 1280 as const;

export const STATUS_RESPONSE = {
  success: "success",
  validationError: "validation_error",
  error: "error",
} as const;

export const RESPONSE_MESSAGE = {
  success: "Success",
  error: "Error",
  notFound: "Not found",
  badRequest: "Bad request",
  unauthorized: "Unauthorized",
  forbidden: "Forbidden",
  internalServerError: "Internal server error",
  notImplemented: "Not implemented",
};
