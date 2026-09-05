import { type Ref, ref, computed } from "vue";
import { useVuelidate } from "@vuelidate/core";

import { API_ERROR_MESSAGE } from "@fe-admin/constants/api-message";

type InputForm = {
  [name: string]: any;
};

const getFirstErrorMessage = (field: any) => {
  if (!field.$error) return "";

  const [first] = field.$errors;

  return first.$message.toString();
};

export const useValidate = (inputForm: Ref<InputForm>, rules: Ref<any>) => {
  const keys = Object.keys(inputForm.value);
  const v$ = useVuelidate(rules, inputForm);

  const apiErrors = ref<{ [name: string]: string }>({});
  const isApiErrors = computed(() => {
    return Object.keys(apiErrors.value).length > 0;
  });

  const setApiErrors = (errors: { [name: string]: string }) => {
    apiErrors.value = {};

    for (const key in errors) {
      const code = errors[key] as string;
      const message = API_ERROR_MESSAGE[code] || code;

      apiErrors.value[key] = message;
    }
  };

  const errors = computed(() => {
    const isError = v$.value.$error;

    let result: { [name: string]: string } = {};

    keys.forEach((key) => {
      result[key] = "";
    });

    type Key = keyof typeof result;

    if (!isError && !isApiErrors.value) {
      return result;
    } else if (isApiErrors.value) {
      return apiErrors.value;
    }

    for (const key in result) {
      const field = v$.value[key];

      if (field) {
        result[key as Key] = getFirstErrorMessage(field);
      }
    }

    return result;
  });

  return { v$, errors, setApiErrors };
};
