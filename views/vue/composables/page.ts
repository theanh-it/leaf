import { ref } from "vue";

export const pageInfo = ref<{
  title: string;
  breadcrumbs: {
    label: string;
    to?: string;
  }[];
}>({
  title: "",
  breadcrumbs: [],
});

export const usePageInfo = () => {
  const setPageInfo = (
    title: string,
    breadcrumbs: { label: string; to?: any }[]
  ) => {
    pageInfo.value.title = title;
    pageInfo.value.breadcrumbs = breadcrumbs;
  };

  return {
    pageInfo,
    setPageInfo,
  };
};
