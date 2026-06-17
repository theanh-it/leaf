import {
  required,
  helpers,
  email,
  minLength,
  maxLength,
  sameAs,
} from "@vuelidate/validators";

export const requiredRule = (name: string) => {
  return {
    required: helpers.withMessage(() => `Trường ${name} là bắt buộc`, required),
  };
};

export const emailRule = () => {
  return {
    required: helpers.withMessage(() => `Trường email là bắt buộc`, required),
    email: helpers.withMessage(() => `Trường email không hợp lệ`, email),
  };
};

export type SameAsRuleOptions = {
  name: string;
  value: any;
};

export const sameAsRule = (options: SameAsRuleOptions) => {
  const { name, value } = options;

  return {
    required: helpers.withMessage(() => `Trường ${name} là bắt buộc`, required),
    sameAs: helpers.withMessage(
      () => `Trường ${name} phải trùng với trường ${value}`,
      sameAs(value)
    ),
  };
};

export type FieldRuleOptions = {
  name: string;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
};

export const fieldRule = (options: FieldRuleOptions) => {
  const result = {};

  if (options.required) {
    Object.assign(result, {
      required: helpers.withMessage(
        () => `Trường ${options.name} là bắt buộc`,
        required
      ),
    });
  }

  if (options.minLength) {
    Object.assign(result, {
      minLength: helpers.withMessage(
        () =>
          `Trường ${options.name} phải có ít nhất ${options.minLength} ký tự`,
        minLength(options.minLength)
      ),
    });
  }

  if (options.maxLength) {
    Object.assign(result, {
      maxLength: helpers.withMessage(
        () => `Trường ${options.name} tối đa ${options.maxLength} ký tự`,
        maxLength(options.maxLength)
      ),
    });
  }

  return result;
};

export const customRule = (
  action: (value: any) => boolean,
  message: string
) => {
  return {
    custom: helpers.withMessage(() => message, action),
  };
};
