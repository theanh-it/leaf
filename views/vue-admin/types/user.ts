export type User = {
  id: string;
  username: string;
  fullname: string | null;
  avatar: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  type: string;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export type UserList = {
  items: User[];
  pagination: {
    page: number;
    limit: number;
    totalRecords: number;
    totalPages: number;
  };
};

export type UserListQuery = {
  page?: number;
  limit?: number;
  search?: string;
  type?: string;
  status?: string;
};
