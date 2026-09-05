import { createApp } from "vue";

import App from "@fe-public/app.vue";
import { router } from "@fe-public/plugins/nnn-router";

const app = createApp(App);

app.use(router);
app.mount("#app");
