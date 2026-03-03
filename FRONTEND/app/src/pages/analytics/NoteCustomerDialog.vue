<script setup lang="ts">
import { ref, computed } from "vue";
import { useI18n } from "vue-i18n";
import { layer } from "@layui/layui-vue";
import { parseNoteText, normalizeDeposit, type ParsedCustomer } from "@/composables/useNoteParser";
import { addNoteCustomers } from "@/api/services/analytics";

const { t } = useI18n();

const emit = defineEmits<{
  (e: "added"): void;
}>();

const visible = ref(false);
const rawText = ref("");
const parsedList = ref<ParsedCustomer[]>([]);
const submitting = ref(false);

function open() {
  visible.value = true;
  rawText.value = "";
  parsedList.value = [];
}

function close() {
  visible.value = false;
  rawText.value = "";
  parsedList.value = [];
}

function handleParse() {
  if (!rawText.value.trim()) {
    layer.msg(t("noteCustomer.emptyInput"), { icon: 0 });
    return;
  }
  const results = parseNoteText(rawText.value);
  if (results.length === 0) {
    layer.msg(t("noteCustomer.parseError"), { icon: 2 });
    return;
  }
  parsedList.value.push(...results);
  layer.msg(t("noteCustomer.parseSuccess", { count: results.length }), { icon: 1, time: 2000 });
}

function addManualRow() {
  const today = new Date().toISOString().slice(0, 10);
  parsedList.value.push({
    assignedDate: today,
    employeeName: "",
    agentCode: "",
    username: "",
    contactInfo: "",
    source: "VIA",
    referralAccount: "",
    firstDeposit: null,
  });
}

/** Deposit input: lưu raw string, convert khi submit */
const depositInputs = ref<Record<number, string>>({});

function getDepositDisplay(item: ParsedCustomer, idx: number): string {
  if (idx in depositInputs.value) return depositInputs.value[idx];
  if (item.firstDeposit === null) return "";
  return item.firstDeposit.toLocaleString("vi-VN");
}

function onDepositInput(idx: number, val: string) {
  depositInputs.value[idx] = val;
  const normalized = normalizeDeposit(val);
  parsedList.value[idx].firstDeposit = normalized;
}

function removeRow(index: number) {
  parsedList.value.splice(index, 1);
  delete depositInputs.value[index];
}

function clearAll() {
  parsedList.value = [];
  depositInputs.value = {};
}

const hasData = computed(() => parsedList.value.length > 0);

function fmtDeposit(v: number | null): string {
  if (v === null || v === undefined) return "—";
  return v.toLocaleString("vi-VN");
}

async function handleSubmit() {
  if (parsedList.value.length === 0) {
    layer.msg(t("noteCustomer.noData"), { icon: 0 });
    return;
  }

  // Validate: mỗi row phải có username
  const invalid = parsedList.value.findIndex((r) => !r.username.trim());
  if (invalid >= 0) {
    layer.msg(t("noteCustomer.missingUsername", { row: invalid + 1 }), { icon: 0 });
    return;
  }

  submitting.value = true;
  const loadingId = layer.load(0, { shade: true });
  try {
    const res = await addNoteCustomers(parsedList.value);
    const d = res.data.data;
    layer.msg(t("noteCustomer.addSuccess", { inserted: d.insertedCount, skipped: d.skippedCount }), {
      icon: 1,
      time: 3000,
    });
    close();
    emit("added");
  } catch {
    layer.msg(t("noteCustomer.addError"), { icon: 2 });
  } finally {
    layer.close(loadingId);
    submitting.value = false;
  }
}

defineExpose({ open });
</script>

<template>
  <lay-layer
    v-model="visible"
    :title="t('noteCustomer.title')"
    :area="['95vw', '90vh']"
    :shade-close="false"
    :move="true"
  >
    <div class="note-dialog">
      <!-- Left: textarea -->
      <div class="note-left">
        <div class="note-left-header">
          <span>{{ t("noteCustomer.pasteLabel") }}</span>
        </div>
        <textarea v-model="rawText" class="note-textarea" :placeholder="t('noteCustomer.pastePlaceholder')" />
        <div class="note-left-footer">
          <lay-button type="normal" size="sm" @click="handleParse">
            <i class="layui-icon layui-icon-right" /> {{ t("noteCustomer.parseBtn") }}
          </lay-button>
        </div>
      </div>

      <!-- Right: preview table -->
      <div class="note-right">
        <div class="note-right-header">
          <span
            >{{ t("noteCustomer.previewLabel") }}
            <template v-if="hasData"> ({{ parsedList.length }})</template>
          </span>
          <div class="note-right-actions">
            <lay-button size="xs" type="primary" @click="addManualRow">
              <i class="layui-icon layui-icon-addition" /> {{ t("noteCustomer.addRow") }}
            </lay-button>
            <lay-button v-if="hasData" size="xs" @click="clearAll">
              {{ t("noteCustomer.clearAll") }}
            </lay-button>
          </div>
        </div>
        <div class="note-table-wrap">
          <table v-if="hasData" class="note-table">
            <thead>
              <tr>
                <th>#</th>
                <th>{{ t("oldCustomers.colDate") }}</th>
                <th>{{ t("oldCustomers.colEmployee") }}</th>
                <th>{{ t("oldCustomers.colAgent") }}</th>
                <th>{{ t("oldCustomers.colUsername") }}</th>
                <th>{{ t("oldCustomers.colContact") }}</th>
                <th>{{ t("oldCustomers.colSource") }}</th>
                <th>{{ t("oldCustomers.colFirstDeposit") }}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, idx) in parsedList" :key="idx">
                <td class="center">
                  {{ idx + 1 }}
                </td>
                <td>
                  <input v-model="item.assignedDate" class="cell-input cell-date" placeholder="YYYY-MM-DD" />
                </td>
                <td>
                  <input v-model="item.employeeName" class="cell-input" />
                </td>
                <td>
                  <input v-model="item.agentCode" class="cell-input cell-sm" />
                </td>
                <td>
                  <input v-model="item.username" class="cell-input cell-user" placeholder="username" />
                </td>
                <td>
                  <input v-model="item.contactInfo" class="cell-input" />
                </td>
                <td>
                  <input v-model="item.source" class="cell-input cell-sm" />
                </td>
                <td class="right">
                  <input
                    :value="getDepositDisplay(item, idx)"
                    class="cell-input cell-deposit"
                    placeholder="100k"
                    @input="onDepositInput(idx, ($event.target as HTMLInputElement).value)"
                  />
                </td>
                <td class="center">
                  <i class="layui-icon layui-icon-close note-remove-btn" @click="removeRow(idx)" />
                </td>
              </tr>
            </tbody>
          </table>
          <div v-else class="note-empty">
            {{ t("noteCustomer.emptyPreview") }}
          </div>
        </div>

        <!-- Footer buttons -->
        <div class="note-footer">
          <lay-button @click="close">
            {{ t("common.cancel") }}
          </lay-button>
          <lay-button type="normal" :loading="submitting" :disabled="!hasData" @click="handleSubmit">
            {{ t("noteCustomer.addBtn") }}
          </lay-button>
        </div>
      </div>
    </div>
  </lay-layer>
</template>

<style scoped>
.note-dialog {
  display: flex;
  height: 100%;
  gap: 12px;
  padding: 12px;
}
.note-left {
  width: 30%;
  min-width: 220px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.note-left-header,
.note-right-header {
  font-weight: 600;
  font-size: 13px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.note-right-actions {
  display: flex;
  gap: 4px;
}
.note-textarea {
  flex: 1;
  resize: none;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  padding: 8px;
  font-size: 12px;
  font-family: monospace;
  line-height: 1.5;
}
.note-textarea:focus {
  outline: none;
  border-color: #1e9fff;
}
.note-left-footer {
  display: flex;
  justify-content: flex-end;
}
.note-right {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}
.note-table-wrap {
  flex: 1;
  overflow: auto;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
}
.note-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}
.note-table th {
  background: #f5f5f5;
  padding: 6px 8px;
  text-align: left;
  border-bottom: 1px solid #e0e0e0;
  white-space: nowrap;
  position: sticky;
  top: 0;
  z-index: 1;
}
.note-table td {
  padding: 3px 4px;
  border-bottom: 1px solid #f0f0f0;
  white-space: nowrap;
}
.note-table tr:hover {
  background: #f9f9f9;
}
.center {
  text-align: center;
}
.right {
  text-align: right;
}
.cell-input {
  border: 1px solid #e8e8e8;
  background: transparent;
  padding: 2px 4px;
  font-size: 12px;
  width: 80px;
  border-radius: 3px;
}
.cell-input:hover,
.cell-input:focus {
  border-color: #1e9fff;
  background: #fff;
  outline: none;
}
.cell-date {
  width: 90px;
}
.cell-sm {
  width: 70px;
}
.cell-user {
  width: 100px;
}
.cell-deposit {
  width: 70px;
  text-align: right;
}
.note-remove-btn {
  cursor: pointer;
  color: #999;
  font-size: 14px;
}
.note-remove-btn:hover {
  color: #ff5722;
}
.note-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #999;
  font-size: 13px;
}
.note-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  flex-shrink: 0;
}
</style>
