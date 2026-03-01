import Layui from "@layui/layui-vue";
import { createPinia } from "pinia";
import { createApp } from "vue";
import App from "./App.vue";
import { router } from "./router";
import "./styles/global.css";

const app = createApp(App);

app.use(createPinia());
app.use(router);
app.use(Layui);

app.mount("#app");
