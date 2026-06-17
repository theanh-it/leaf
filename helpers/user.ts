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

export const isUniqueConstraintError = (error: unknown) => {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
};

export const getUniqueFieldError = (error: unknown) => {
  if (!isUniqueConstraintError(error)) return null;

  const target = (error as Prisma.PrismaClientKnownRequestError).meta?.target;

  if (Array.isArray(target) && target[0]) {
    return String(target[0]);
  }

  return "field";
};
