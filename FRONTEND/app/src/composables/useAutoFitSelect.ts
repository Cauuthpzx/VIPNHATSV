import { computed, Ref, unref } from "vue";

export interface SelectOption {
  label: string;
  value: string | number;
  [key: string]: any;
}

// Shared offscreen canvas for text measurement (reused across all calls)
let _canvas: HTMLCanvasElement | null = null;

function getCanvasContext(): CanvasRenderingContext2D | null {
  if (!_canvas) {
    _canvas = document.createElement("canvas");
  }
  return _canvas.getContext("2d");
}

/**
 * Measure the pixel width of the longest label in a list of options.
 * Uses Canvas measureText — no DOM elements created/destroyed.
 */
function measureMaxLabelWidth(
  options: SelectOption[],
  font = "14px Helvetica Neue, Helvetica, PingFang SC, Tahoma, Arial, sans-serif"
): number {
  const ctx = getCanvasContext();
  if (!ctx || options.length === 0) return 0;
  ctx.font = font;
  let max = 0;
  for (const opt of options) {
    const w = ctx.measureText(opt.label).width;
    if (w > max) max = w;
  }
  return max;
}

// Padding inside select: left input padding (10) + suffix icon area (30) + border (2) + buffer (8)
const SELECT_PADDING = 50;

/**
 * Returns a computed CSS width string that fits the longest option label.
 *
 * @param options - Reactive or static array of { label, value }
 * @param minWidth - Minimum width in px (default 80)
 * @param maxWidth - Maximum width in px (default 300)
 *
 * Usage:
 *   const { selectWidth } = useAutoFitSelect(myOptions)
 *   <lay-select :style="{ width: selectWidth }">
 */
export function useAutoFitSelect(
  options: Ref<SelectOption[]> | SelectOption[],
  minWidth = 80,
  maxWidth = 300
) {
  const selectWidth = computed(() => {
    const opts = unref(options);
    if (!opts || opts.length === 0) return `${minWidth}px`;
    const textWidth = measureMaxLabelWidth(opts);
    const total = Math.ceil(textWidth + SELECT_PADDING);
    const clamped = Math.max(minWidth, Math.min(total, maxWidth));
    return `${clamped}px`;
  });

  return { selectWidth };
}
