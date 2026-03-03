import Layui from "@layui/layui-vue";
import { createPinia } from "pinia";
import { createApp } from "vue";
import App from "./App.vue";
import { router } from "./router";
// Import i18n side-effect: merges app translations into Layui's i18n instance.
// Layui already calls app.use(i18n) internally, so we do NOT call app.use(i18n) again.
import "./i18n";
import "./styles/global.css";

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);
app.use(Layui);

// Mount ngay lập tức — không chờ auth init
// Auth init sẽ chạy bởi router guard (beforeEach) trước khi vào protected route
app.mount("#app");
