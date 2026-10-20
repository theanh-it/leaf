import rateLimit from "@/middlewares/rate-limit";

export default [
  rateLimit({
    windowMs: 60_000,
    max: 5,
    prefix: "register",
    message: "rateLimit.registerExceeded",
  }),
];
