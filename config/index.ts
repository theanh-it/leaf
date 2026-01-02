import path from "path";

export const config = {
  port: Number(process.env.PORT) || 5000,
  nodeEnv: process.env.NODE_ENV || "development",
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
    dist: {
      assets: "dist/fe",
      prefix: "/",
    },
    // public: {
    //   assets: "public",
    //   prefix: "/",
    // },
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
