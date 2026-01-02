// Import SCSS main file (variables và mixins đã được auto-inject)
import "@fe/styles/main.scss";

import { createApp } from "vue";
import App from "@fe/app.vue";
import router from "@fe/routes";
import { createPinia } from "pinia";

const pinia = createPinia();

createApp(App).use(router).use(pinia).mount("#app");
