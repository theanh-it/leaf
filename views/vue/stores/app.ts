import { ref } from "vue";
import { defineStore } from "pinia";

export const useAppStore = defineStore("app", () => {
  const count = ref(0);

  return {
    count,
  };
});
