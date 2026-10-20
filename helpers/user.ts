import { Prisma } from ".prisma/client/client";

export const USER_TYPES = ["customer", "employee", "admin"] as const;
export const USER_STATUSES = ["pending", "active", "inactive"] as const;

export type UserType = (typeof USER_TYPES)[number];
export type UserStatus = (typeof USER_STATUSES)[number];

export const USER_PUBLIC_SELECT = {
  id: true,
  username: true,
  fullname: true,
  avatar: true,
  email: true,
  phone: true,
  address: true,
  type: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} as const;

export const emptyToNull = (value?: string | null) => {
  if (value === undefined || value === null) return null;

  const trimmed = value.trim();

  return trimmed || null;
};

export const isUniqueConstraintError = (
  error: unknown
): error is Prisma.PrismaClientKnownRequestError => {
  return (
    (error instanceof Prisma.PrismaClientKnownRequestError ||
      (isRecord(error) &&
        error.name === "PrismaClientKnownRequestError" &&
        typeof error.clientVersion === "string")) &&
    error.code === "P2002"
  );
};

export const getUniqueFieldError = (error: unknown) => {
  if (!isUniqueConstraintError(error)) return null;

  const meta = error.meta;
  const adapterError = meta?.driverAdapterError;
  const cause = isRecord(adapterError) ? adapterError.cause : undefined;
  const constraint = isRecord(cause) ? cause.constraint : undefined;
  const fields =
    meta?.target ?? (isRecord(constraint) ? constraint.fields : undefined);
  if (!Array.isArray(fields)) return null;

  return (
    (["username", "email", "phone"] as const).find((field) =>
      fields.includes(field)
    ) ?? null
  );
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
