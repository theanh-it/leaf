import { ref } from "vue";

export const useModal = (originalModal: boolean | string | null = null) => {
  const isOpenModal = ref<boolean | string | null>(originalModal);

  const openModal = (...args: any[]) => {
    if (args.length > 0) {
      isOpenModal.value = args[0];
    } else {
      isOpenModal.value = true;
    }
  };

  const closeModal = () => (isOpenModal.value = null);

  const toggleModal = () => (isOpenModal.value = !isOpenModal.value);

  return { isOpenModal, openModal, closeModal, toggleModal };
};

export const useMultipleModal = () => {
  const modals = ref<{ [key: string]: boolean | string | null }>({});

  const openModalName = (name: string) => (modals.value[name] = true);

  const closeModalName = (name: string) => (modals.value[name] = null);

  const closeAllModals = () => {
    for (const key in modals.value) {
      modals.value[key] = null;
    }
  };

  return {
    modals,
    openModalName,
    closeModalName,
    closeAllModals,
  };
};
