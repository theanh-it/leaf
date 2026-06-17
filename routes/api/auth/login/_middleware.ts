import rateLimit from "@/middlewares/rate-limit";

const loginRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  prefix: "login",
  message: "rateLimit.loginExceeded",
});

export default [loginRateLimit];
