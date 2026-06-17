import { api } from "@fe-plugins/ky";

type LoginBody = {
  username: string;
  password: string;
};

type LoginResponse = {
  token: string;
  user: {
    id: string;
    username: string;
    deviceId: string;
  };
};

export const login = async (data: LoginBody) => {
  const options = { json: data };

  const response = await api.post<LoginResponse>("auth/login", options);

  return response;
};

type RegisterBody = {
  username: string;
  password: string;
  fullname: string;
};

type RegisterResponse = {
  id: string;
  username: string;
  fullname: string;
};

export const register = async (data: RegisterBody) => {
  const options = { json: data };

  const response = await api.post<RegisterResponse>("auth/register", options);

  return response;
};

export const authApi = {
  login,
  register,
};
