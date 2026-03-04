<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from "vue";
import { useI18n } from "vue-i18n";
import { layer } from "@layui/layui-vue";
import Spreadsheet from "x-data-spreadsheet";
import { useToolbarPermission } from "@/composables/useToolbarPermission";
import { exportOldCustomerExcel } from "@/composables/useOldCustomerExport";
import NoteCustomerDialog from "./NoteCustomerDialog.vue";
import {
  exportOldCustomers,
  fetchOldCustomerSummary,
  uploadOldCustomerFile,
  type OldCustomerItem,
  type OldCustomerSummary,
  type CalendarMonth,
} from "@/api/services/analytics";

const { t } = useI18n();
const { canExport } = useToolbarPermission();

const noteDialogRef = ref<InstanceType<typeof NoteCustomerDialog> | null>(null);
const containerRef = ref<HTMLDivElement | null>(null);
const loading = ref(false);
const uploading = ref(false);
const exporting = ref(false);
const fileInputRef = ref<HTMLInputElement | null>(null);
const summaryData = ref<OldCustomerSummary | null>(null);
const allItems = ref<OldCustomerItem[]>([]);
const calendarMonths = ref<CalendarMonth[]>([]);
const totalCount = ref(0);
const pageLimit = ref(100);
const currentPage = ref(1);

const searchEmployee = ref("");
const searchAgent = ref("");
const searchText = ref("");
const empDropOpen = ref(false);
const agtDropOpen = ref(false);

let spreadsheet: InstanceType<typeof Spreadsheet> | null = null;

const employeeOpts = computed(() =>
  (summaryData.value?.employees || []).map((e: { name: string; count: number }) => ({
    label: `${e.name} (${e.count.toLocaleString()})`,
    value: e.name,
  })),
);
const agentOpts = computed(() =>
  (summaryData.value?.agents || []).map((a: { code: string; count: number }) => ({
    label: `${a.code} (${a.count.toLocaleString()})`,
    value: a.code,
  })),
);
const empDisplay = computed(() => {
  if (!searchEmployee.value) return t("common.all");
  return employeeOpts.value.find((o) => o.value === searchEmployee.value)?.label || searchEmployee.value;
});
const agtDisplay = computed(() => {
  if (!searchAgent.value) return t("common.all");
  return agentOpts.value.find((o) => o.value === searchAgent.value)?.label || searchAgent.value;
});

function pickEmp(val: string) {
  searchEmployee.value = val;
  empDropOpen.value = false;
}
function pickAgt(val: string) {
  searchAgent.value = val;
  agtDropOpen.value = false;
}

const sortedItems = computed(() =>
  [...allItems.value].sort((a, b) => pDate(a.assignedDate || "") - pDate(b.assignedDate || "")),
);
const pagedItems = computed(() => {
  const s = (currentPage.value - 1) * pageLimit.value;
  return sortedItems.value.slice(s, s + pageLimit.value);
});
const totalPages = computed(() => Math.max(1, Math.ceil(totalCount.value / pageLimit.value)));

function pDate(s: string): number {
  if (!s) return 0;
  const m1 = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m1) return new Date(+m1[3], +m1[2] - 1, +m1[1]).getTime();
  const m2 = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (m2) return new Date(+m2[1], +m2[2] - 1, +m2[3]).getTime();
  return 0;
}

function fmtDep(v: number | string | null): string {
  if (v === null || v === undefined || v === "") return "\u2014";
  const n = typeof v === "string" ? parseFloat(v) : v;
  if (isNaN(n)) return "\u2014";
  return n.toLocaleString("en-US");
}

function recent3(months: CalendarMonth[]): CalendarMonth[] {
  const now = new Date();
  const r: CalendarMonth[] = [];
  for (let off = 2; off >= 0; off--) {
    const d = new Date(now.getFullYear(), now.getMonth() - off, 1);
    const lb = `T${d.getMonth() + 1}`;
    const days = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    r.push(months.find((m) => m.label === lb) || { label: lb, days });
  }
  return r;
}

function cRef(row: number, col: number): string {
  let s = "";
  let c = col;
  while (c >= 0) {
    s = String.fromCharCode(65 + (c % 26)) + s;
    c = Math.floor(c / 26) - 1;
  }
  return `${s}${row + 1}`;
}

function buildSheet(items: OldCustomerItem[], months: CalendarMonth[]) {
  const sm = recent3(months);
  const fh = ["Ngày", "NV", "Đại lý", "Tài khoản", "Liên hệ", "Nguồn", "Giới thiệu", "Nạp lần đầu"];
  const fc = fh.length;
  let tcc = 0;
  const mo: { label: string; days: number; sc: number }[] = [];
  for (const m of sm) {
    mo.push({ label: m.label, days: m.days, sc: fc + tcc });
    tcc += m.days;
  }
  const tc = fc + tcc;

  const mkB = () => ({
    top: ["thin", "#e0e0e0"],
    bottom: ["thin", "#e0e0e0"],
    left: ["thin", "#e0e0e0"],
    right: ["thin", "#e0e0e0"],
  });
  const mkBL = () => ({
    top: ["thin", "#f0f0f0"],
    bottom: ["thin", "#f0f0f0"],
    left: ["thin", "#f0f0f0"],
    right: ["thin", "#f0f0f0"],
  });

  const sty: any[] = [
    { font: { bold: true }, align: "center", valign: "middle", bgcolor: "#f2f2f2", border: mkB() },
    { font: { bold: false }, align: "left", valign: "middle", bgcolor: "#ffffff", border: mkBL() },
    { font: { bold: false }, align: "right", valign: "middle", bgcolor: "#ffffff", border: mkBL() },
    { font: { bold: false }, align: "center", valign: "middle", bgcolor: "#ffffff", border: mkBL() },
    { font: { bold: false }, align: "center", valign: "middle", bgcolor: "#fafafa", border: mkB() },
    { font: { bold: true }, align: "center", valign: "middle", bgcolor: "#42a5f5", border: mkB() },
    { font: { bold: true }, align: "center", valign: "middle", bgcolor: "#e3f2fd", border: mkB() },
    {
      font: { bold: true, color: "#1565c0" },
      align: "center",
      valign: "middle",
      bgcolor: "#ffffff",
      border: mkBL(),
    },
    { font: { bold: true }, align: "center", valign: "middle", bgcolor: "#ef5350", border: mkB() },
    { font: { bold: true }, align: "center", valign: "middle", bgcolor: "#fce4ec", border: mkB() },
    {
      font: { bold: true, color: "#c62828" },
      align: "center",
      valign: "middle",
      bgcolor: "#ffffff",
      border: mkBL(),
    },
    { font: { bold: true }, align: "center", valign: "middle", bgcolor: "#66bb6a", border: mkB() },
    { font: { bold: true }, align: "center", valign: "middle", bgcolor: "#e8f5e9", border: mkB() },
    {
      font: { bold: true, color: "#2e7d32" },
      align: "center",
      valign: "middle",
      bgcolor: "#ffffff",
      border: mkBL(),
    },
  ];

  const msm: Record<string, { h: number; d: number; c: number }> = {};
  sm.forEach((m, i) => {
    const b = 5 + i * 3;
    msm[m.label] = { h: b, d: b + 1, c: b + 2 };
  });

  const rows: Record<number, any> = {};
  const merges: string[] = [];

  const r0: Record<number, any> = {};
  for (let c = 0; c < fh.length; c++) {
    r0[c] = { text: fh[c], style: 0, merge: [1, 0] };
    merges.push(`${cRef(0, c)}:${cRef(1, c)}`);
  }
  for (const m of mo) {
    const mn = m.label.replace("T", "");
    const hs = msm[m.label]?.h ?? 0;
    if (m.days > 1) {
      r0[m.sc] = { text: `THÁNG ${mn}`, style: hs, merge: [0, m.days - 1] };
      merges.push(`${cRef(0, m.sc)}:${cRef(0, m.sc + m.days - 1)}`);
      for (let d = 1; d < m.days; d++) r0[m.sc + d] = { text: "", style: hs };
    } else {
      r0[m.sc] = { text: `THÁNG ${mn}`, style: hs };
    }
  }
  rows[0] = { cells: r0, height: 30 };

  const r1: Record<number, any> = {};
  for (let c = 0; c < fh.length; c++) r1[c] = { text: "", style: 0 };
  for (const m of mo) {
    const ds = msm[m.label]?.d ?? 0;
    for (let d = 1; d <= m.days; d++) r1[m.sc + d - 1] = { text: String(d), style: ds };
  }
  rows[1] = { cells: r1, height: 25 };

  const dg: { s: number; e: number }[] = [];
  if (items.length > 0) {
    let gs = 0;
    for (let i = 1; i <= items.length; i++) {
      const cur = i < items.length ? items[i].assignedDate || "" : null;
      if (cur !== (items[gs].assignedDate || "")) {
        dg.push({ s: gs, e: i - 1 });
        gs = i;
      }
    }
  }

  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    const ri = i + 2;
    const cells: Record<number, any> = {};
    const g = dg.find((x) => i >= x.s && i <= x.e);
    const gf = g ? i === g.s : true;
    const gsz = g ? g.e - g.s : 0;
    if (gf && gsz > 0) cells[0] = { text: it.assignedDate || "\u2014", style: 4, merge: [gsz, 0] };
    else if (gf) cells[0] = { text: it.assignedDate || "\u2014", style: 4 };
    else cells[0] = { text: "", style: 4 };
    cells[1] = { text: it.employeeName || "\u2014", style: 1 };
    cells[2] = { text: it.agentCode || "\u2014", style: 1 };
    cells[3] = { text: it.username || "\u2014", style: 1 };
    cells[4] = { text: it.contactInfo || "\u2014", style: 1 };
    cells[5] = { text: it.source || "\u2014", style: 1 };
    cells[6] = { text: it.referralAccount || "\u2014", style: 1 };
    cells[7] = { text: fmtDep(it.firstDeposit), style: 2 };
    const os = new Set(it.onlineDays || []);
    for (const m of mo) {
      const cs = msm[m.label]?.c ?? 3;
      for (let d = 1; d <= m.days; d++) {
        const ci = m.sc + d - 1;
        cells[ci] = os.has(`${m.label}-${d}`) ? { text: "\u2713", style: cs } : { text: "", style: 3 };
      }
    }
    rows[ri] = { cells, height: 24 };
  }
  for (const g of dg) {
    if (g.e > g.s) merges.push(`${cRef(g.s + 2, 0)}:${cRef(g.e + 2, 0)}`);
  }

  const cols: Record<number | string, any> = { len: tc };
  [85, 80, 65, 110, 100, 65, 90, 85].forEach((w, i) => {
    cols[i] = { width: w };
  });
  for (let c = fc; c < tc; c++) cols[c] = { width: 28 };
  return {
    name: "Sheet1",
    styles: sty,
    merges,
    rows: { len: items.length + 2, ...rows },
    cols,
    freeze: "I3",
  };
}

function initSpreadsheet() {
  if (!containerRef.value) return;
  containerRef.value.innerHTML = "";
  spreadsheet = new Spreadsheet(containerRef.value, {
    mode: "read",
    showToolbar: false,
    showContextmenu: false,
    showBottomBar: false,
    view: { height: () => containerRef.value!.clientHeight, width: () => containerRef.value!.clientWidth },
    row: { len: 100, height: 24 },
    col: { len: 26, width: 80, indexWidth: 40, minWidth: 28 },
  });
}

function renderSheet() {
  if (!spreadsheet) return;
  spreadsheet.loadData([buildSheet(pagedItems.value, calendarMonths.value)]);
}

async function loadSummary() {
  try {
    const res = await fetchOldCustomerSummary();
    summaryData.value = res.data.data;
    if (res.data.data.calendarMonths?.length) calendarMonths.value = res.data.data.calendarMonths;
  } catch {
    /* silent */
  }
}

function doSearch() {
  loadData();
}
function doReset() {
  searchEmployee.value = "";
  searchAgent.value = "";
  searchText.value = "";
  loadData();
}

async function loadData() {
  loading.value = true;
  const lid = layer.load(0, { shade: true });
  try {
    const res = await exportOldCustomers({
      employee: searchEmployee.value || undefined,
      agentCode: searchAgent.value || undefined,
      search: searchText.value || undefined,
    });
    const d = res.data.data;
    allItems.value = d.items;
    totalCount.value = d.total;
    currentPage.value = 1;
    if (d.calendarMonths?.length) calendarMonths.value = d.calendarMonths;
    await nextTick();
    renderSheet();
  } catch {
    layer.msg(t("common.errorLoad"), { icon: 2 });
  } finally {
    layer.close(lid);
    loading.value = false;
  }
}

async function handleExport() {
  exporting.value = true;
  try {
    await exportOldCustomerExcel({
      employee: searchEmployee.value || undefined,
      agentCode: searchAgent.value || undefined,
      search: searchText.value || undefined,
    });
  } finally {
    exporting.value = false;
  }
}

function triggerUpload() {
  fileInputRef.value?.click();
}
async function handleUpload(ev: Event) {
  const inp = ev.target as HTMLInputElement;
  const file = inp.files?.[0];
  if (!file) return;
  uploading.value = true;
  const lid = layer.load(0, { shade: true });
  try {
    const res = await uploadOldCustomerFile(file);
    const d = res.data.data;
    if (d.calendarMonths?.length) calendarMonths.value = d.calendarMonths;
    layer.msg(
      t("oldCustomers.uploadSuccess", {
        customers: d.insertedRows.toLocaleString(),
        employees: d.employeeNames.length,
      }),
      { icon: 1, time: 3000 },
    );
    loadData();
    loadSummary();
  } catch {
    layer.msg(t("oldCustomers.uploadError"), { icon: 2, time: 2000 });
  } finally {
    layer.close(lid);
    uploading.value = false;
    inp.value = "";
  }
}

function noteAdded() {
  loadData();
  loadSummary();
}

function goPage(p: number) {
  if (p < 1 || p > totalPages.value) return;
  currentPage.value = p;
  nextTick(() => renderSheet());
}
function onLimitChange(ev: Event) {
  pageLimit.value = Number((ev.target as HTMLSelectElement).value);
  currentPage.value = 1;
  nextTick(() => renderSheet());
}

function closeDropdowns(ev: MouseEvent) {
  if (!(ev.target as HTMLElement).closest(".oc-sel")) {
    empDropOpen.value = false;
    agtDropOpen.value = false;
  }
}

onMounted(() => {
  document.addEventListener("click", closeDropdowns);
  nextTick(() => {
    initSpreadsheet();
    loadData();
    loadSummary();
  });
});
onBeforeUnmount(() => {
  document.removeEventListener("click", closeDropdowns);
  spreadsheet = null;
});
</script>

<template>
  <div class="oc-page">
    <!-- Toolbar: HTML thuần -->
    <div class="oc-bar">
      <div class="oc-row">
        <div class="oc-f">
          <label>{{ t("oldCustomers.filterEmployee") }}</label>
          <div class="oc-sel" @click.stop="empDropOpen = !empDropOpen">
            <div class="oc-sel-box">
              <span class="oc-sel-txt">{{ empDisplay }}</span>
              <span v-if="searchEmployee" class="oc-x" @click.stop="pickEmp('')">&times;</span>
              <span v-else class="oc-caret">&#9662;</span>
            </div>
            <ul v-if="empDropOpen" class="oc-dd">
              <li :class="{ on: !searchEmployee }" @click.stop="pickEmp('')">
                {{ t("common.all") }}
              </li>
              <li
                v-for="o in employeeOpts"
                :key="o.value"
                :class="{ on: searchEmployee === o.value }"
                @click.stop="pickEmp(o.value)"
              >
                {{ o.label }}
              </li>
            </ul>
          </div>
        </div>
        <div class="oc-f">
          <label>{{ t("oldCustomers.filterAgent") }}</label>
          <div class="oc-sel" @click.stop="agtDropOpen = !agtDropOpen">
            <div class="oc-sel-box">
              <span class="oc-sel-txt">{{ agtDisplay }}</span>
              <span v-if="searchAgent" class="oc-x" @click.stop="pickAgt('')">&times;</span>
              <span v-else class="oc-caret">&#9662;</span>
            </div>
            <ul v-if="agtDropOpen" class="oc-dd">
              <li :class="{ on: !searchAgent }" @click.stop="pickAgt('')">
                {{ t("common.all") }}
              </li>
              <li
                v-for="o in agentOpts"
                :key="o.value"
                :class="{ on: searchAgent === o.value }"
                @click.stop="pickAgt(o.value)"
              >
                {{ o.label }}
              </li>
            </ul>
          </div>
        </div>
        <div class="oc-f">
          <label>{{ t("oldCustomers.colUsername") }}</label>
          <input
            v-model="searchText"
            class="oc-inp"
            :placeholder="t('oldCustomers.searchPlaceholder')"
            @keyup.enter="doSearch"
          />
        </div>
        <div class="oc-acts">
          <button class="ob" @click="doSearch">
            {{ t("common.search") }}
          </button>
          <button class="ob ob-p" @click="doReset">
            {{ t("common.reset") }}
          </button>
          <template v-if="canExport">
            <button class="ob" :disabled="uploading" @click="triggerUpload">
              {{ t("oldCustomers.upload") }}
            </button>
            <button class="ob ob-e" :disabled="exporting || allItems.length === 0" @click="handleExport">
              {{ t("oldCustomers.exportXlsx") }}
            </button>
            <button class="ob ob-p" @click="noteDialogRef?.open()">
              {{ t("noteCustomer.btn") }}
            </button>
            <input
              ref="fileInputRef"
              type="file"
              accept=".xlsx,.xls"
              style="display: none"
              @change="handleUpload"
            />
          </template>
        </div>
      </div>
    </div>

    <!-- Spreadsheet -->
    <div ref="containerRef" class="oc-sheet" />

    <!-- Pagination: HTML thuần -->
    <div class="oc-pg">
      <span class="oc-pg-t">{{ totalCount.toLocaleString() }} dòng</span>
      <button class="opb" :disabled="currentPage <= 1" @click="goPage(currentPage - 1)">&lsaquo;</button>
      <span class="oc-pg-n">{{ currentPage }}/{{ totalPages }}</span>
      <button class="opb" :disabled="currentPage >= totalPages" @click="goPage(currentPage + 1)">
        &rsaquo;
      </button>
      <select class="oc-pg-s" :value="pageLimit" @change="onLimitChange">
        <option :value="50">50</option>
        <option :value="100">100</option>
        <option :value="200">200</option>
        <option :value="500">500</option>
        <option :value="1000">1000</option>
      </select>
    </div>

    <NoteCustomerDialog ref="noteDialogRef" @added="noteAdded" />
  </div>
</template>

<style scoped>
.oc-page {
  height: calc(100vh - 130px);
  display: flex;
  flex-direction: column;
}

.oc-bar {
  flex-shrink: 0;
  padding: 10px 12px;
  border-bottom: 1px solid #e8e8e8;
  background: #fafafa;
}
.oc-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
}
.oc-f {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}
.oc-f label {
  font-size: 13px;
  color: #666;
  white-space: nowrap;
}
.oc-sel {
  position: relative;
  min-width: 150px;
  cursor: pointer;
  user-select: none;
}
.oc-sel-box {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 32px;
  padding: 0 8px;
  border: 1px solid #d2d2d2;
  border-radius: 4px;
  background: #fff;
  font-size: 13px;
  gap: 4px;
}
.oc-sel-box:hover {
  border-color: #009688;
}
.oc-sel-txt {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}
.oc-caret {
  font-size: 10px;
  color: #999;
}
.oc-x {
  font-size: 16px;
  color: #999;
  line-height: 1;
  flex-shrink: 0;
}
.oc-x:hover {
  color: #333;
}
.oc-dd {
  position: absolute;
  top: 34px;
  left: 0;
  right: 0;
  max-height: 240px;
  overflow-y: auto;
  background: #fff;
  border: 1px solid #d2d2d2;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
  z-index: 1000;
  list-style: none;
  margin: 0;
  padding: 4px 0;
}
.oc-dd li {
  padding: 6px 10px;
  font-size: 13px;
  cursor: pointer;
  white-space: nowrap;
}
.oc-dd li:hover {
  background: #f2f2f2;
}
.oc-dd li.on {
  color: #009688;
  font-weight: 600;
}
.oc-inp {
  height: 32px;
  padding: 0 8px;
  border: 1px solid #d2d2d2;
  border-radius: 4px;
  font-size: 13px;
  min-width: 160px;
  outline: none;
  background: #fff;
}
.oc-inp:hover,
.oc-inp:focus {
  border-color: #009688;
}
.oc-acts {
  display: flex;
  gap: 5px;
  flex-wrap: wrap;
}
.ob {
  height: 32px;
  padding: 0 14px;
  border: 1px solid #d2d2d2;
  border-radius: 4px;
  background: #fff;
  font-size: 13px;
  cursor: pointer;
  white-space: nowrap;
}
.ob:hover {
  border-color: #009688;
  color: #009688;
}
.ob:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.ob-e {
  background: #1976d2;
  color: #fff;
  border-color: #1976d2;
}
.ob-e:hover {
  background: #1565c0;
  border-color: #1565c0;
  color: #fff;
}
.ob-p {
  background: #009688;
  color: #fff;
  border-color: #009688;
}
.ob-p:hover {
  background: #00897b;
  border-color: #00897b;
  color: #fff;
}

.oc-sheet {
  flex: 1;
  min-height: 300px;
  overflow: hidden;
}

.oc-pg {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border-top: 1px solid #e8e8e8;
  background: #fafafa;
  font-size: 13px;
}
.oc-pg-t {
  color: #666;
}
.opb {
  width: 28px;
  height: 28px;
  border: 1px solid #d2d2d2;
  border-radius: 4px;
  background: #fff;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.opb:hover:not(:disabled) {
  border-color: #009688;
  color: #009688;
}
.opb:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.oc-pg-n {
  font-size: 13px;
  color: #333;
  min-width: 50px;
  text-align: center;
}
.oc-pg-s {
  height: 28px;
  border: 1px solid #d2d2d2;
  border-radius: 4px;
  font-size: 13px;
  padding: 0 4px;
  background: #fff;
  cursor: pointer;
  outline: none;
}
.oc-pg-s:hover {
  border-color: #009688;
}
</style>
