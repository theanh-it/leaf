export type ResponseApi<T> = {
  status: string;
  message: string;
  result: T | any;
};

export type Pagination = {
  page: number;
  limit: number;
  totalRecords: number;
  totalPages: number;
};

export type PaginatedResponse<T> = {
  items: T[];
  pagination: Pagination;
};
