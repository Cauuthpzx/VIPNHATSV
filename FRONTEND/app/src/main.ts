import Layui from "@layui/layui-vue";
import { createPinia } from "pinia";
import { createApp } from "vue";
import App from "./App.vue";
import { router } from "./router";
import { useAuthStore } from "./stores/auth";
import "./styles/global.css";

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);
app.use(Layui);

// Initialize auth BEFORE mounting so router guard has user data ready
const authStore = useAuthStore(pinia);
authStore.init().catch(() => {
  authStore.initialized = true;
}).finally(() => {
  app.mount("#app");
});
