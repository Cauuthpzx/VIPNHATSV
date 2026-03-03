<script setup lang="ts">
import { reactive, ref, computed, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { layer } from "@layui/layui-vue";
import { useListPage } from "@/composables/useListPage";
import { useToolbarPermission } from "@/composables/useToolbarPermission";
import { useAuthStore } from "@/stores/auth";
import { PERMISSIONS } from "@/constants/permissions";
import {
  fetchUsers,
  createUser,
  updateUser,
  deleteUser,
  fetchRoles,
  type SystemUser,
  type SystemRole,
} from "@/api/services/system";

const { t } = useI18n();
const authStore = useAuthStore();
const canWrite = authStore.hasPermission(PERMISSIONS.USERS_WRITE);
const canDelete = authStore.hasPermission(PERMISSIONS.USERS_DELETE);

const { defaultToolbar } = useToolbarPermission();
const { dataSource, loading, page, setLoading, bindLoadData } = useListPage<SystemUser>();

const searchKeyword = ref("");

const columns = computed(() => [
  { title: t("systemUsers.username"), key: "username", ellipsisTooltip: true },
  { title: t("systemUsers.name"), key: "name", ellipsisTooltip: true },
  { title: "Email", key: "email", ellipsisTooltip: true },
  { title: t("systemUsers.role"), key: "role", customSlot: "role", width: "150px" },
  { title: t("common.status"), key: "isActive", customSlot: "status", width: "120px" },
  { title: t("systemUsers.createdAt"), key: "createdAt", customSlot: "date", width: "180px" },
  { title: t("common.actions"), key: "action", customSlot: "action", width: "220px", fixed: "right" },
]);

// Roles list for select dropdown
const roles = ref<SystemRole[]>([]);

async function loadRoles() {
  try {
    const res = await fetchRoles();
    roles.value = res.data.data;
  } catch {
    // silent
  }
}

async function loadData() {
  setLoading(true);
  try {
    const res = await fetchUsers({
      page: page.current,
      limit: page.limit,
      search: searchKeyword.value || undefined,
    });
    const data = res.data.data;
    dataSource.value = data.users;
    page.total = data.total;
  } catch {
    layer.msg(t("common.errorLoad"), { icon: 2 });
  } finally {
    setLoading(false);
  }
}

const { handlePageChange, handleSearch } = bindLoadData(loadData);

function handleReset() {
  searchKeyword.value = "";
  page.current = 1;
  loadData();
}

// --- Modal ---
const showModal = ref(false);
const isEdit = ref(false);
const editingId = ref("");
const submitting = ref(false);

const formData = reactive({
  username: "",
  email: "",
  password: "",
  name: "",
  roleId: "",
  isActive: true,
});

function resetForm() {
  formData.username = "";
  formData.email = "";
  formData.password = "";
  formData.name = "";
  formData.roleId = "";
  formData.isActive = true;
}

function openCreate() {
  isEdit.value = false;
  editingId.value = "";
  resetForm();
  showModal.value = true;
}

function openEdit(row: SystemUser) {
  isEdit.value = true;
  editingId.value = row.id;
  formData.username = row.username || "";
  formData.email = row.email || "";
  formData.password = "";
  formData.name = row.name || "";
  formData.roleId = row.roleId;
  formData.isActive = row.isActive;
  showModal.value = true;
}

async function handleSubmit() {
  if (!isEdit.value && !formData.username) {
    layer.msg(t("systemUsers.enterUsername"), { icon: 2 });
    return;
  }
  if (!isEdit.value && (formData.username.length < 4 || !/^[a-zA-Z0-9_]+$/.test(formData.username))) {
    layer.msg(t("systemUsers.usernameRule"), { icon: 2 });
    return;
  }
  if (!isEdit.value && !formData.password) {
    layer.msg(t("systemUsers.enterPassword"), { icon: 2 });
    return;
  }
  if (!isEdit.value && formData.password.length < 8) {
    layer.msg(t("systemUsers.passwordMinLength"), { icon: 2 });
    return;
  }
  if (!formData.name) {
    layer.msg(t("systemUsers.enterName"), { icon: 2 });
    return;
  }
  if (!formData.roleId) {
    layer.msg(t("systemUsers.selectRoleRequired"), { icon: 2 });
    return;
  }

  submitting.value = true;
  try {
    if (isEdit.value) {
      await updateUser(editingId.value, {
        email: formData.email || undefined,
        name: formData.name,
        roleId: formData.roleId,
        isActive: formData.isActive,
      });
      layer.msg(t("systemUsers.updateSuccess"), { icon: 1 });
    } else {
      await createUser({
        username: formData.username,
        email: formData.email || undefined,
        password: formData.password,
        name: formData.name,
        roleId: formData.roleId,
      });
      layer.msg(t("systemUsers.createSuccess"), { icon: 1 });
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

// --- Toggle active ---
async function toggleActive(row: SystemUser) {
  try {
    await updateUser(row.id, { isActive: !row.isActive });
    layer.msg(row.isActive ? t("systemUsers.lockedSuccess") : t("systemUsers.unlockedSuccess"), { icon: 1 });
    loadData();
  } catch {
    layer.msg(t("common.operationFailed"), { icon: 2 });
  }
}

// --- Delete ---
async function handleDelete(row: SystemUser) {
  try {
    await deleteUser(row.id);
    layer.msg(t("systemUsers.deleteSuccess"), { icon: 1 });
    loadData();
  } catch (err: any) {
    const msg = err?.response?.data?.message || t("systemUsers.deleteFailed");
    layer.msg(msg, { icon: 2 });
  }
}

// --- Role helpers ---
const roleColorMap: Record<string, string> = {
  ADMIN: "#ff4d4f",
  MANAGER: "#722ed1",
  VIEWER: "#16baaa",
};

function getRoleColor(type: string) {
  return roleColorMap[type] || "#999";
}

function formatDate(val: string) {
  if (!val) return "—";
  return new Date(val).toLocaleString("vi-VN");
}

onMounted(() => {
  loadRoles();
});
</script>

<template>
  <div>
    <lay-card>
      <lay-field :title="t('systemUsers.title')">
        <div class="search-form-wrap">
          <div class="layui-inline">
            <span class="form-label">{{ t('common.search') }}:</span>
            <lay-input
              v-model="searchKeyword"
              :placeholder="t('systemUsers.searchPlaceholder')"
              @keyup.enter="handleSearch"
            />
          </div>
          <div class="layui-inline">
            <lay-button type="normal" @click="handleSearch">
              <i class="layui-icon layui-icon-search"></i> {{ t('common.search') }}
            </lay-button>
            <lay-button type="primary" @click="handleReset">
              <i class="layui-icon layui-icon-refresh"></i> {{ t('common.reset') }}
            </lay-button>
          </div>
        </div>
      </lay-field>

      <div class="table-container">
        <lay-table
          :page="page"
          :resize="true"
          :columns="columns"
          :loading="loading"
          :default-toolbar="defaultToolbar"
          :data-source="dataSource"
          @change="handlePageChange"
        >
          <template v-slot:toolbar>
            <lay-button v-if="canWrite" type="normal" size="xs" @click="openCreate">
              <i class="layui-icon layui-icon-addition"></i> {{ t('systemUsers.addNew') }}
            </lay-button>
          </template>

          <template #role="{ row }">
            <lay-tag
              :color="getRoleColor(row.role?.type)"
              variant="light"
              size="sm"
              bordered
            >
              {{ row.role?.name || "—" }}
            </lay-tag>
          </template>

          <template #status="{ row }">
            <lay-tag
              :color="row.isActive ? '#16baaa' : '#ff4d4f'"
              variant="light"
              size="sm"
              bordered
            >
              {{ row.isActive ? t('systemUsers.active') : t('systemUsers.locked') }}
            </lay-tag>
          </template>

          <template #date="{ row }">
            {{ formatDate(row.createdAt) }}
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
                :type="row.isActive ? 'warm' : 'normal'"
                @click="toggleActive(row)"
              >
                {{ row.isActive ? t('systemUsers.lock') : t('systemUsers.unlock') }}
              </lay-button>
              <lay-popconfirm
                v-if="canDelete"
                :content="t('systemUsers.confirmDelete')"
                @confirm="handleDelete(row)"
              >
                <lay-button size="xs" type="danger">{{ t('common.delete') }}</lay-button>
              </lay-popconfirm>
            </div>
          </template>
        </lay-table>
      </div>
    </lay-card>

    <!-- Create/Edit Modal -->
    <lay-layer
      v-model="showModal"
      :title="isEdit ? t('systemUsers.editUser') : t('systemUsers.addUser')"
      :area="['500px', 'auto']"
      :shade-close="false"
      :move="true"
    >
      <div style="padding: 20px 30px;">
        <div class="layui-form-item">
          <label class="layui-form-label">{{ t('systemUsers.username') }}</label>
          <div class="layui-input-block">
            <lay-input
              v-model="formData.username"
              :placeholder="t('systemUsers.usernamePlaceholder')"
              :disabled="isEdit"
            />
          </div>
        </div>

        <div v-if="!isEdit" class="layui-form-item">
          <label class="layui-form-label">{{ t('auth.password') }}</label>
          <div class="layui-input-block">
            <lay-input
              v-model="formData.password"
              type="password"
              :placeholder="t('systemUsers.passwordPlaceholder')"
            />
          </div>
        </div>

        <div class="layui-form-item">
          <label class="layui-form-label">Email</label>
          <div class="layui-input-block">
            <lay-input
              v-model="formData.email"
              :placeholder="t('systemUsers.emailOptional')"
            />
          </div>
        </div>

        <div class="layui-form-item">
          <label class="layui-form-label">{{ t('systemUsers.name') }}</label>
          <div class="layui-input-block">
            <lay-input
              v-model="formData.name"
              :placeholder="t('systemUsers.namePlaceholder')"
            />
          </div>
        </div>

        <div class="layui-form-item">
          <label class="layui-form-label">{{ t('systemUsers.role') }}</label>
          <div class="layui-input-block">
            <lay-select v-model="formData.roleId" :placeholder="t('systemUsers.selectRole')">
              <lay-select-option
                v-for="r in roles"
                :key="r.id"
                :value="r.id"
                :label="r.name"
              />
            </lay-select>
          </div>
        </div>

        <div v-if="isEdit" class="layui-form-item">
          <label class="layui-form-label">{{ t('common.status') }}</label>
          <div class="layui-input-block" style="display: flex; align-items: center; min-height: 38px;">
            <lay-switch
              v-model="formData.isActive"
              :onswitch-text="t('systemUsers.active')"
              :unswitch-text="t('systemUsers.locked')"
            />
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
  </div>
</template>

<style scoped>
.action-btns {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}
</style>
