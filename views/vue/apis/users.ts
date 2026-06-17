import ky from "ky";

import { api } from "@fe-plugins/ky";

import type { UserForm } from "@fe-constants/user";
import type { User } from "@fe-types/user";

type UserPayload = Omit<UserForm, "confirmPassword"> & {
  password?: string;
};

const parseApiError = async (error: unknown) => {
  if (error instanceof ky.HTTPError) {
    throw await error.response.json();
  }

  throw error;
};

const toPayload = (form: UserForm, isEdit = false) => {
  const payload: UserPayload = {
    username: form.username,
    fullname: form.fullname,
    email: form.email,
    phone: form.phone,
    address: form.address,
    type: form.type,
    status: form.status,
  };

  if (form.password) {
    payload.password = form.password;
  } else if (!isEdit) {
    payload.password = "";
  }

  return payload;
};

export const list = () => api.get<User[]>("users");

export const getById = (id: string) => api.get<User>(`users/${id}`);

export const create = (form: UserForm) =>
  api.post<User>("users", { json: toPayload(form) });

export const update = async (id: string, form: UserForm) => {
  try {
    return await api.put<User>(`users/${id}`, { json: toPayload(form, true) });
  } catch (error) {
    throw await parseApiError(error);
  }
};

export const remove = async (id: string) => {
  try {
    return await api.delete<{ id: string }>(`users/${id}`);
  } catch (error) {
    throw await parseApiError(error);
  }
};

export const usersApi = {
  list,
  getById,
  create,
  update,
  remove,
};
