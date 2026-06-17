import { ref, type Component } from "vue";

export type ConfirmOptions = {
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  component?: Component;
};

// Global state cho confirm dialog - chỉ tạo 1 lần
const isOpen = ref(false);
const currentOptions = ref<ConfirmOptions>({});
const resolveCallback = ref<((value: boolean) => void) | null>(null);

const useConfirm = () => {
  const openConfirm = (options: ConfirmOptions = {}): Promise<boolean> => {
    return new Promise((resolve) => {
      currentOptions.value = {
        title: options.title || "Xác nhận",
        message: options.message || "Bạn có chắc chắn muốn thực hiện?",
        confirmText: options.confirmText || "Xác nhận",
        cancelText: options.cancelText || "Hủy",
        component: options.component,
      };
      resolveCallback.value = resolve;
      isOpen.value = true;
    });
  };

  const closeConfirm = (result: boolean) => {
    isOpen.value = false;
    if (resolveCallback.value) {
      resolveCallback.value(result);
      resolveCallback.value = null;
    }
  };

  const onConfirm = () => closeConfirm(true);
  const onCancel = () => closeConfirm(false);

  return {
    openConfirm,
    // Expose state để component global sử dụng
    isOpen,
    currentOptions,
    onConfirm,
    onCancel,
  };
};

export { useConfirm };
