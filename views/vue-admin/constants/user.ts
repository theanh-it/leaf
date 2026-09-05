export const USER_TYPE_OPTIONS = [
  { label: "Khách hàng", value: "customer" },
  { label: "Nhân viên", value: "employee" },
  { label: "Quản trị", value: "admin" },
];

export const USER_STATUS_OPTIONS = [
  { label: "Chờ duyệt", value: "pending" },
  { label: "Hoạt động", value: "active" },
  { label: "Ngừng hoạt động", value: "inactive" },
];

export const getUserTypeLabel = (value: string) =>
  USER_TYPE_OPTIONS.find((item) => item.value === value)?.label || value;

export const getUserStatusLabel = (value: string) =>
  USER_STATUS_OPTIONS.find((item) => item.value === value)?.label || value;

export type UserForm = {
  username: string;
  password: string;
  confirmPassword: string;
  fullname: string;
  email: string;
  phone: string;
  address: string;
  type: string;
  status: string;
};

export const createEmptyUserForm = (): UserForm => ({
  username: "",
  password: "",
  confirmPassword: "",
  fullname: "",
  email: "",
  phone: "",
  address: "",
  type: "customer",
  status: "pending",
});
