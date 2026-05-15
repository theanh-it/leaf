import ky from "ky";
import type { BeforeRequestState } from "ky";

import type { ResponseApi } from "@/types/api";

export const baseApi = ky.create({
  prefix: import.meta.env.VITE_API_URL,
  timeout: false,
  headers: {
    Authorization: "Bearer null",
  },
  hooks: {
    beforeRequest: [
      ({ request }: BeforeRequestState) => {
        const token = localStorage.getItem("token");
        request.headers.set("Authorization", `Bearer ${token}`);
      },
    ],
  },
});

export const api = {
  get: async <T>(url: string, options?: any) => {
    const response: ResponseApi<T> = await baseApi.get(url, options).json();

    return response;
  },
  post: async <T>(url: string, options?: any) => {
    try {
      const response: ResponseApi<T> = await baseApi.post(url, options).json();

      return response;
    } catch (error: any) {
      throw error.data;
    }
  },
  delete: async <T>(url: string, options?: any) => {
    const response: ResponseApi<T> = await baseApi.delete(url, options).json();

    return response;
  },
  put: async <T>(url: string, options?: any) => {
    const response: ResponseApi<T> = await baseApi.put(url, options).json();

    return response;
  },
};
