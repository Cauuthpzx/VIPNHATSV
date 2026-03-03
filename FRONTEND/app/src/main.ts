import Layui from "@layui/layui-vue";
import { createPinia } from "pinia";
import { createApp } from "vue";
import App from "./App.vue";
import { router } from "./router";
import "./styles/global.css";

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);
app.use(Layui);

// Mount ngay lập tức — không chờ auth init
// Auth init sẽ chạy bởi router guard (beforeEach) trước khi vào protected route
app.mount("#app");
