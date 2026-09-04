import { api } from "@fe-admin/plugins/ky";

import type { Profile } from "@fe-admin/types/profile";

export const getProfile = async () => {
  const response = await api.get<Profile>("auth/profile");

  return response;
};

export const meApi = {
  getProfile,
};
