declare module "elysia" {
  interface Context {
    render: (template: string, data?: Record<string, any>) => Promise<string>;
    vite?: {
      main: string;
      css: string;
    };
  }
}

