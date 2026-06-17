import { api } from "@fe-plugins/ky";

import type { Profile } from "@fe-types/profile";

export const getProfile = async () => {
  const response = await api.get<Profile>("auth/profile");

  return response;
};

export const meApi = {
  getProfile,
};
