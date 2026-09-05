import { ref } from "vue";

export const useLoading = (originalLoading: boolean = false) => {
  const isLoading = ref<boolean>(originalLoading);

  const showLoading = () => (isLoading.value = true);
  const hiddenLoading = () => (isLoading.value = false);

  return { isLoading, showLoading, hiddenLoading };
};
