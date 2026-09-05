import requiredAdmin from "@be-middlewares/required-admin";
import requiredLogin from "@be-middlewares/required-login";

export default [requiredLogin, requiredAdmin];
