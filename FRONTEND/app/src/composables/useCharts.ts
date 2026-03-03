import { use } from "echarts/core";
import { LineChart, BarChart, PieChart } from "echarts/charts";
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  DataZoomComponent,
} from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";

let registered = false;

export function registerCharts() {
  if (registered) return;
  use([
    LineChart,
    BarChart,
    PieChart,
    TitleComponent,
    TooltipComponent,
    LegendComponent,
    GridComponent,
    DataZoomComponent,
    CanvasRenderer,
  ]);
  registered = true;
}

export function formatMoney(v: number): string {
  if (v >= 1_000_000_000) return (v / 1_000_000_000).toFixed(1) + "B";
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(1) + "M";
  if (v >= 1_000) return (v / 1_000).toFixed(1) + "K";
  return v.toLocaleString("vi-VN");
}

export function shortDate(dateStr: string): string {
  return dateStr.slice(5); // "MM-DD"
}

export function tooltipFormatter(params: any[]): string {
  let s = `<div style="font-size:13px;font-weight:600;margin-bottom:6px">${params[0].name}</div>`;
  for (const p of params) {
    s += `<div style="line-height:22px;padding:2px 0">${p.marker} ${p.seriesName}: <b>${Number(p.value).toLocaleString("vi-VN")}</b></div>`;
  }
  return s;
}

export function yAxisMoneyFormatter(v: number): string {
  if (Math.abs(v) >= 1_000_000_000) return (v / 1_000_000_000).toFixed(0) + "B";
  if (Math.abs(v) >= 1_000_000) return (v / 1_000_000).toFixed(0) + "M";
  if (Math.abs(v) >= 1_000) return (v / 1_000).toFixed(0) + "K";
  return v.toString();
}

// Shared chart colors
export const COLORS = {
  green: "#009688",
  red: "#ff5722",
  blue: "#1e9fff",
  yellow: "#ffb800",
  purple: "#a855f7",
  cyan: "#06b6d4",
  orange: "#f97316",
  pink: "#ec4899",
};

export const PALETTE = [
  "#009688", "#1e9fff", "#ffb800", "#ff5722", "#a855f7",
  "#06b6d4", "#f97316", "#ec4899", "#84cc16", "#6366f1",
  "#14b8a6", "#f43f5e", "#8b5cf6", "#22d3ee", "#f59e0b",
];
