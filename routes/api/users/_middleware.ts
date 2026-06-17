import requiredAdmin from "@/middlewares/required-admin";
import requiredLogin from "@/middlewares/required-login";

export default [requiredLogin, requiredAdmin];
