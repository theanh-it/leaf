import path from "path";

const IS_PRODUCTION = process.env.NODE_ENV === "production";

export const config = {
  port: Number(process.env.PORT) || 5000,
  nodeEnv: process.env.NODE_ENV || "development",
  apiUrl: process.env.VITE_API_URL || "http://localhost:5000",
  apiImage:
    process.env.VITE_API_URL_IMAGE || "http://localhost:5000/files/images",
  serve: {
    maxRequestBodySize: 100 * 1024 * 1024 * 1024, // 100GB
    idleTimeout: 255,
  },
  cors: {
    origin: (process.env.CORS_ORIGIN?.split(",") || [
      "http://localhost:3000",
      "http://localhost:5000",
    ]) as string[],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"] as string[],
  },
  blade: {
    viewsDir: process.env.BLADE_VIEWS_DIR
      ? path.resolve(process.env.BLADE_VIEWS_DIR)
      : path.join(process.cwd(), "views/blade"),
    cache: process.env.NODE_ENV === "production",
    minify: process.env.NODE_ENV === "production",
  },
  static: {
    // Public assets có tên ổn định, phục vụ trực tiếp từ source.
    public: {
      assets: "public",
      prefix: "/",
      alwaysStatic: true,
      noCache: false,
      maxAge: IS_PRODUCTION ? 86400 : 0,
    },
    // Vite assets có hash mới sau mỗi lần build.
    dist: {
      assets: "dist/frontend/assets",
      prefix: "/assets",
      alwaysStatic: IS_PRODUCTION,
      noCache: !IS_PRODUCTION,
    },
  },
  routes: [
    {
      dir: "routes/health",
      prefix: "/health",
    },
    {
      dir: "routes/robots",
      prefix: "/robots.txt",
    },
    {
      dir: "routes/sitemap",
      prefix: "/sitemap.xml",
    },
    {
      dir: "routes/api",
      prefix: "/api",
    },
    {
      dir: "routes/ssr",
      prefix: "",
    },
  ],
  vite: {
    devPort: Number(process.env.VITE_PORT) || 3000,
  },
  seo: {
    baseUrl: process.env.BASE_URL || "http://localhost:5000",
    siteName: process.env.SITE_NAME || "Leaf App",
    defaultImage: process.env.DEFAULT_OG_IMAGE || "/og-default.jpg",
    locale: process.env.SITE_LOCALE || "vi_VN",
    twitterHandle: process.env.TWITTER_HANDLE || "",
  },
} as const;
