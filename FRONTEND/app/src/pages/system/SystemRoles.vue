<script setup lang="ts">
import { ref, reactive, computed, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { layer } from "@layui/layui-vue";
import { useAuthStore } from "@/stores/auth";
import { PERMISSIONS, PERMISSION_LABEL_KEYS, ALL_PERMISSIONS } from "@/constants/permissions";
import { buildPermissionTreeData, extractPermissions } from "@/constants/permissionTree";
import {
  fetchRoles,
  createRole,
  updateRole,
  deleteRole,
  type SystemRole,
} from "@/api/services/system";

const { t } = useI18n();
const authStore = useAuthStore();
const canWrite = authStore.hasPermission(PERMISSIONS.ROLES_WRITE);
const canDelete = authStore.hasPermission(PERMISSIONS.ROLES_DELETE);

const dataSource = ref<SystemRole[]>([]);
const loading = ref(false);

const columns = computed(() => [
  { title: t("systemRoles.name"), key: "name", ellipsisTooltip: true },
  { title: t("systemRoles.type"), key: "type", customSlot: "type", width: "120px" },
  { title: t("systemRoles.level"), key: "level", width: "100px" },
  { title: t("systemRoles.permissionsCol"), key: "permissions", customSlot: "permissions" },
  { title: t("common.actions"), key: "action", customSlot: "action", width: "250px", fixed: "right" },
]);

async function loadData() {
  if (dataSource.value.length === 0) loading.value = true;
  try {
    const res = await fetchRoles();
    dataSource.value = res.data.data;
  } catch {
    layer.msg(t("common.errorLoad"), { icon: 2 });
  } finally {
    loading.value = false;
  }
}

// --- Role type helpers ---
const typeColorMap: Record<string, string> = {
  ADMIN: "#ff4d4f",
  MANAGER: "#722ed1",
  VIEWER: "#16baaa",
};

const typeOptions = [
  { label: "ADMIN", value: "ADMIN" },
  { label: "MANAGER", value: "MANAGER" },
  { label: "VIEWER", value: "VIEWER" },
];

function getTypeColor(type: string) {
  return typeColorMap[type] || "#999";
}

// --- Permission display ---
const allPermKeys = Object.values(PERMISSIONS);

function getPermissionTags(perms: string[]) {
  if (perms.includes(ALL_PERMISSIONS)) return [{ label: t("systemRoles.allPermissions"), color: "#ff4d4f" }];
  return perms.slice(0, 3).map((p) => ({
    label: PERMISSION_LABEL_KEYS[p] ? t(PERMISSION_LABEL_KEYS[p]) : p,
    color: "#16baaa",
  }));
}

function getPermissionExtra(perms: string[]) {
  if (perms.includes(ALL_PERMISSIONS)) return 0;
  return Math.max(0, perms.length - 3);
}

// --- Create/Edit Modal ---
const showModal = ref(false);
const isEdit = ref(false);
const editingId = ref("");
const submitting = ref(false);

const formData = reactive({
  name: "",
  type: "VIEWER" as string,
  level: 0,
});

function resetForm() {
  formData.name = "";
  formData.type = "VIEWER";
  formData.level = 0;
}

function openCreate() {
  isEdit.value = false;
  editingId.value = "";
  resetForm();
  showModal.value = true;
}

function openEdit(row: SystemRole) {
  isEdit.value = true;
  editingId.value = row.id;
  formData.name = row.name;
  formData.type = row.type;
  formData.level = row.level;
  showModal.value = true;
}

async function handleSubmit() {
  if (!formData.name) {
    layer.msg(t("systemRoles.enterName"), { icon: 2 });
    return;
  }
  if (!formData.type) {
    layer.msg(t("systemRoles.selectTypeRequired"), { icon: 2 });
    return;
  }

  submitting.value = true;
  try {
    if (isEdit.value) {
      await updateRole(editingId.value, {
        name: formData.name,
        type: formData.type,
        level: formData.level,
      });
      layer.msg(t("systemRoles.updateSuccess"), { icon: 1 });
    } else {
      await createRole({
        name: formData.name,
        type: formData.type,
        level: formData.level,
        permissions: [],
      });
      layer.msg(t("systemRoles.createSuccess"), { icon: 1 });
    }
    showModal.value = false;
    loadData();
  } catch (err: any) {
    const msg = err?.response?.data?.message || t("common.operationFailed");
    layer.msg(msg, { icon: 2 });
  } finally {
    submitting.value = false;
  }
}

// --- Permission Modal (LayTree) ---
const showPermModal = ref(false);
const permRoleId = ref("");
const permRoleName = ref("");
const permSubmitting = ref(false);

const permissionTreeData = computed(() => buildPermissionTreeData(t));
const treeCheckedKeys = ref<(string | number)[]>([]);

const isAllChecked = computed(() => {
  const realPerms = extractPermissions(treeCheckedKeys.value);
  return realPerms.length === allPermKeys.length;
});

const isIndeterminate = computed(() => {
  const realPerms = extractPermissions(treeCheckedKeys.value);
  return realPerms.length > 0 && realPerms.length < allPermKeys.length;
});

function openPermissions(row: SystemRole) {
  permRoleId.value = row.id;
  permRoleName.value = row.name;
  treeCheckedKeys.value = row.permissions.includes(ALL_PERMISSIONS)
    ? [...allPermKeys]
    : row.permissions.filter((p) => allPermKeys.includes(p as any));
  showPermModal.value = true;
}

function toggleAllPerms() {
  if (isAllChecked.value) {
    treeCheckedKeys.value = [];
  } else {
    treeCheckedKeys.value = [...allPermKeys];
  }
}

async function savePermissions() {
  permSubmitting.value = true;
  try {
    const perms = extractPermissions(treeCheckedKeys.value);
    await updateRole(permRoleId.value, { permissions: perms });
    layer.msg(t("systemRoles.permissionsUpdateSuccess"), { icon: 1 });
    showPermModal.value = false;
    loadData();
    if (authStore.user?.role?.id === permRoleId.value) {
      authStore.fetchMe();
    }
  } catch (err: any) {
    const msg = err?.response?.data?.message || t("common.operationFailed");
    layer.msg(msg, { icon: 2 });
  } finally {
    permSubmitting.value = false;
  }
}

// --- Delete ---
async function handleDelete(row: SystemRole) {
  try {
    await deleteRole(row.id);
    layer.msg(t("systemRoles.deleteSuccess"), { icon: 1 });
    loadData();
  } catch (err: any) {
    const msg = err?.response?.data?.message || t("systemRoles.deleteFailed");
    layer.msg(msg, { icon: 2 });
  }
}

onMounted(() => loadData());
</script>

<template>
  <div>
    <lay-card>
      <lay-field :title="t('systemRoles.title')">
        <div class="table-container">
          <lay-table
            :resize="true"
            :columns="columns"
            :loading="loading"
            :default-toolbar="true"
            :data-source="dataSource"
          >
            <template v-slot:toolbar>
              <lay-button v-if="canWrite" type="normal" size="xs" @click="openCreate">
                <i class="layui-icon layui-icon-addition"></i> {{ t('systemRoles.addNew') }}
              </lay-button>
            </template>

            <template #type="{ row }">
              <lay-tag
                :color="getTypeColor(row.type)"
                variant="light"
                size="sm"
                bordered
              >
                {{ row.type }}
              </lay-tag>
            </template>

            <template #permissions="{ row }">
              <div class="perm-tags">
                <lay-tag
                  v-for="(tag, i) in getPermissionTags(row.permissions)"
                  :key="i"
                  :color="tag.color"
                  variant="light"
                  size="sm"
                  bordered
                >
                  {{ tag.label }}
                </lay-tag>
                <lay-tag
                  v-if="getPermissionExtra(row.permissions) > 0"
                  color="#999"
                  variant="light"
                  size="sm"
                  bordered
                >
                  +{{ getPermissionExtra(row.permissions) }}
                </lay-tag>
              </div>
            </template>

            <template #action="{ row }">
              <div class="action-btns">
                <lay-button
                  v-if="canWrite"
                  size="xs"
                  type="normal"
                  @click="openEdit(row)"
                >
                  {{ t('common.edit') }}
                </lay-button>
                <lay-button
                  v-if="canWrite"
                  size="xs"
                  type="warm"
                  @click="openPermissions(row)"
                >
                  {{ t('systemRoles.assignPermissions') }}
                </lay-button>
                <lay-popconfirm
                  v-if="canDelete"
                  :content="t('systemRoles.confirmDelete')"
                  @confirm="handleDelete(row)"
                >
                  <lay-button size="xs" type="danger">{{ t('common.delete') }}</lay-button>
                </lay-popconfirm>
              </div>
            </template>
          </lay-table>
        </div>
      </lay-field>
    </lay-card>

    <!-- Create/Edit Modal -->
    <lay-layer
      v-model="showModal"
      :title="isEdit ? t('systemRoles.editRole') : t('systemRoles.addRole')"
      :area="['500px', 'auto']"
      :shade-close="false"
      :move="true"
    >
      <div style="padding: 20px 30px;">
        <div class="layui-form-item">
          <label class="layui-form-label">{{ t('systemRoles.name') }}</label>
          <div class="layui-input-block">
            <lay-input v-model="formData.name" :placeholder="t('systemRoles.rolePlaceholder')" />
          </div>
        </div>

        <div class="layui-form-item">
          <label class="layui-form-label">{{ t('systemRoles.type') }}</label>
          <div class="layui-input-block">
            <lay-select v-model="formData.type" :placeholder="t('systemRoles.selectType')">
              <lay-select-option
                v-for="opt in typeOptions"
                :key="opt.value"
                :value="opt.value"
                :label="opt.label"
              />
            </lay-select>
          </div>
        </div>

        <div class="layui-form-item">
          <label class="layui-form-label">{{ t('systemRoles.level') }}</label>
          <div class="layui-input-block">
            <lay-slider v-model="formData.level" :min="0" :max="100" :step="1" />
          </div>
        </div>

        <div class="layui-form-item" style="text-align: right; margin-bottom: 0;">
          <lay-button @click="showModal = false">{{ t('common.cancel') }}</lay-button>
          <lay-button type="normal" :loading="submitting" @click="handleSubmit">
            {{ isEdit ? t('common.update') : t('common.create') }}
          </lay-button>
        </div>
      </div>
    </lay-layer>

    <!-- Permission Modal -->
    <lay-layer
      v-model="showPermModal"
      :title="t('systemRoles.permissionsTitle', { name: permRoleName })"
      :area="['650px', '580px']"
      :shade-close="false"
      :move="true"
    >
      <div style="padding: 20px 24px;">
        <div class="perm-header">
          <lay-checkbox
            :modelValue="isAllChecked"
            :is-indeterminate="isIndeterminate"
            skin="primary"
            :label="t('systemRoles.allPermissions')"
            @change="toggleAllPerms"
          />
          <span class="perm-counter">
            {{ extractPermissions(treeCheckedKeys).length }}/{{ allPermKeys.length }}
          </span>
        </div>

        <div class="perm-tree-wrapper">
          <lay-tree
            :data="permissionTreeData"
            :show-checkbox="true"
            :show-line="false"
            :collapse-transition="true"
            v-model:checked-keys="treeCheckedKeys"
          >
            <template #title="{ data }">
              <span class="perm-tree-node" :class="{ 'is-group': String(data.id).startsWith('group:') }">
                <i
                  v-if="data.icon"
                  :class="['layui-icon', data.icon]"
                  class="perm-tree-icon"
                ></i>
                <span>{{ data.title }}</span>
                <lay-tag
                  v-if="!String(data.id).startsWith('group:')"
                  color="#eee"
                  size="sm"
                  class="perm-tree-code"
                >
                  {{ data.id }}
                </lay-tag>
              </span>
            </template>
          </lay-tree>
        </div>

        <div style="text-align: right; margin-top: 16px;">
          <lay-button @click="showPermModal = false">{{ t('common.cancel') }}</lay-button>
          <lay-button type="normal" :loading="permSubmitting" @click="savePermissions">
            {{ t('systemRoles.savePermissions') }}
          </lay-button>
        </div>
      </div>
    </lay-layer>
  </div>
</template>

<style scoped>
.perm-tags {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.action-btns {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.perm-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 12px;
  border-bottom: 1px solid #eee;
}

.perm-counter {
  font-size: 13px;
  color: #999;
  font-weight: 600;
}

.perm-tree-wrapper {
  max-height: 400px;
  overflow-y: auto;
  padding: 8px 0;
}

.perm-tree-node {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
}

.perm-tree-node.is-group {
  font-weight: 600;
  font-size: 14px;
}

.perm-tree-icon {
  font-size: 15px;
  color: #16baaa;
}

.perm-tree-code {
  font-size: 11px;
  color: #aaa !important;
  margin-left: 2px;
}
</style>
