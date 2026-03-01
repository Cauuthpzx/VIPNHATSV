import { onMounted, nextTick, watch, type Ref } from "vue";

interface SliderOptions {
  /** CSS selector của container */
  containerSelector: string;
  /** CSS selector của item bên trong container */
  itemSelector: string;
  /** Hướng: vertical (sidebar) hoặc horizontal (tabs) */
  direction?: "vertical" | "horizontal";
  /** Ref để watch và re-setup khi DOM thay đổi */
  watchSource?: Ref<unknown>;
}

function setupSlider(options: SliderOptions) {
  const container = document.querySelector(options.containerSelector);
  if (!container) return;

  const isVertical = options.direction !== "horizontal";

  function handleMouseDirection(e: Event) {
    const me = e as MouseEvent;
    const el = me.target as HTMLElement;
    const target = el.closest?.(options.itemSelector) as HTMLElement | null;
    if (!target) return;

    const rect = target.getBoundingClientRect();

    if (isVertical) {
      const fromTop = me.clientY < rect.top + rect.height / 2;
      target.style.setProperty("--bar-origin", fromTop ? "top" : "bottom");
    } else {
      const fromLeft = me.clientX < rect.left + rect.width / 2;
      target.style.setProperty("--bar-origin", fromLeft ? "left" : "right");
    }
  }

  container.addEventListener("mouseenter", handleMouseDirection, true);
  container.addEventListener("mouseover", handleMouseDirection, true);
}

/**
 * Thanh trượt indicator cho sidebar menu (dọc).
 */
export function useSidebarSlider(
  openKeys?: Ref<string[]>,
  containerSelector = ".layui-side-menu"
) {
  const opts: SliderOptions = {
    containerSelector,
    itemSelector: ".layui-nav-item > a",
    direction: "vertical",
  };

  onMounted(() => nextTick(() => setupSlider(opts)));

  if (openKeys) {
    watch(openKeys, () => nextTick(() => setupSlider(opts)));
  }
}

/**
 * Thanh trượt indicator cho tabs (ngang).
 */
export function useTabsSlider(containerSelector = ".layadmin-pagetabs") {
  const opts: SliderOptions = {
    containerSelector,
    itemSelector: ".layui-tab-title li",
    direction: "horizontal",
  };

  onMounted(() => nextTick(() => setupSlider(opts)));
}
