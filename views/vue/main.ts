import "@fe/styles/common.scss";

import { createApp } from "vue";
import VWave from "v-wave";
import Notifications from "@kyvg/vue3-notification";

import { router } from "@fe-plugins/nnn-router";
import pinia from "@fe-plugins/pinia";
import { FontAwesomeIcon } from "@fe-plugins/font-awesome";

import App from "@fe/app.vue";

const app = createApp(App);

app.use(router);
app.use(pinia);
app.use(Notifications);
app.use(VWave, {
  // color: "red",
  initialOpacity: 0.2,
  easing: "ease-in",
  duration: 0.4,
});

app.component("fa-icon", FontAwesomeIcon);

app.mount("#app");
