import { notify } from "@kyvg/vue3-notification";

export const useNotification = () => {
  const notifySuccess = (message: string) => {
    notify({
      title: "Thành công",
      text: message,
      type: "success",
    });
  };

  const notifyError = (message: string) => {
    notify({
      title: "Có lỗi xảy ra",
      text: message,
      type: "error",
    });
  };

  return {
    notifySuccess,
    notifyError,
  };
};
