export const config = {
  server: {
    port: Number(process.env.PORT) || 5000,
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
  vite: {
    devPort: Number(process.env.VITE_PORT) || 3000,
  },
  ejs: {
    viewsDir: process.env.EJS_VIEWS_DIR || "views/ejs",
    cache: process.env.NODE_ENV === "production",
    minify: process.env.NODE_ENV === "production",
  },
  static: {
    dist: {
      assets: "dist",
      prefix: "/dist",
    },
    public: {
      assets: "public",
      prefix: "/",
    },
  },
  seo: {
    baseUrl: process.env.BASE_URL || "http://localhost:5000",
    siteName: process.env.SITE_NAME || "Leaf App",
    defaultImage: process.env.DEFAULT_OG_IMAGE || "/og-default.jpg",
    locale: process.env.SITE_LOCALE || "vi_VN",
    twitterHandle: process.env.TWITTER_HANDLE || "",
  },
  nodeEnv: process.env.NODE_ENV || "development",
} as const;
