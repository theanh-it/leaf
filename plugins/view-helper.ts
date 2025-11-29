/**
 * View Helper Plugin
 * Inject view() function vào context giống Laravel
 */

import type { Elysia } from "elysia";
import { view as viewHelper } from "@be-helpers/view";

export const viewHelperPlugin = () => {
  return (app: Elysia) => {
    return app.derive((ctx) => {
      return {
        view: (template: string, data?: Record<string, any>) => {
          return viewHelper(ctx as any, template, data);
        },
      };
    });
  };
};

