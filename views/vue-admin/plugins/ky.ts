import ky, { HTTPError } from "ky";
import type { BeforeRequestState, Options } from "ky";

import type { ResponseApi } from "@fe-admin/types/api";

export const baseApi = ky.create({
  prefix: import.meta.env.VITE_API_URL,
  timeout: false,
  hooks: {
    beforeRequest: [
      ({ request }: BeforeRequestState) => {
        const token = localStorage.getItem("token");
        if (token) request.headers.set("Authorization", `Bearer ${token}`);
        else request.headers.delete("Authorization");
      },
    ],
  },
});

export const api = {
  get: async <T>(url: string, options?: Options) => {
    const response: ResponseApi<T> = await baseApi.get(url, options).json();

    return response;
  },
  post: async <T>(url: string, options?: Options) => {
    try {
      const response: ResponseApi<T> = await baseApi.post(url, options).json();

      return response;
    } catch (error) {
      throw error instanceof HTTPError ? (error.data ?? error) : error;
    }
  },
  delete: async <T>(url: string, options?: Options) => {
    const response: ResponseApi<T> = await baseApi.delete(url, options).json();

    return response;
  },
  put: async <T>(url: string, options?: Options) => {
    const response: ResponseApi<T> = await baseApi.put(url, options).json();

    return response;
  },
};
