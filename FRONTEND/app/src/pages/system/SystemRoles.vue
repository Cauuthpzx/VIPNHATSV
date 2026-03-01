<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { layer } from "@layui/layui-vue";
import { useAuthStore } from "@/stores/auth";
import { PERMISSIONS, PERMISSION_LABELS, ALL_PERMISSIONS } from "@/constants/permissions";
import {
  fetchRoles,
  createRole,
  updateRole,
  deleteRole,
  type SystemRole,
} from "@/api/services/system";

const authStore = useAuthStore();
const canWrite = authStore.hasPermission(PERMISSIONS.ROLES_WRITE);
const canDelete = authStore.hasPermission(PERMISSIONS.ROLES_DELETE);

const dataSource = ref<SystemRole[]>([]);
const loading = ref(false);

const columns = [
  { title: "Tên", key: "name", ellipsisTooltip: true },
  { title: "Loại", key: "type", customSlot: "type", width: "120px" },
  { title: "Cấp độ", key: "level", width: "100px" },
  { title: "Quyền hạn", key: "permissions", customSlot: "permissions" },
  { title: "Thao tác", key: "action", customSlot: "action", width: "250px", fixed: "right" },
];

async function loadData() {
  if (dataSource.value.length === 0) loading.value = true;
  try {
    const res = await fetchRoles();
    dataSource.value = res.data.data;
  } catch {
    layer.msg("Lỗi tải dữ liệu", { icon: 2 });
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
  if (perms.includes(ALL_PERMISSIONS)) return [{ label: "Toàn quyền", color: "#ff4d4f" }];
  return perms.slice(0, 3).map((p) => ({
    label: PERMISSION_LABELS[p] || p,
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
    layer.msg("Vui lòng nhập tên vai trò", { icon: 2 });
    return;
  }
  if (!formData.type) {
    layer.msg("Vui lòng chọn loại", { icon: 2 });
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
      layer.msg("Cập nhật thành công", { icon: 1 });
    } else {
      await createRole({
        name: formData.name,
        type: formData.type,
        level: formData.level,
        permissions: [],
      });
      layer.msg("Tạo thành công", { icon: 1 });
    }
    showModal.value = false;
    loadData();
  } catch (err: any) {
    const msg = err?.response?.data?.message || "Thao tác thất bại";
    layer.msg(msg, { icon: 2 });
  } finally {
    submitting.value = false;
  }
}

// --- Permission Modal ---
const showPermModal = ref(false);
const permRoleId = ref("");
const permRoleName = ref("");
const selectedPerms = ref<string[]>([]);
const permSubmitting = ref(false);

function openPermissions(row: SystemRole) {
  permRoleId.value = row.id;
  permRoleName.value = row.name;
  // Clone current permissions (exclude "*" for the checkbox grid)
  selectedPerms.value = row.permissions.includes(ALL_PERMISSIONS)
    ? [...allPermKeys]
    : row.permissions.filter((p) => p !== ALL_PERMISSIONS);
  showPermModal.value = true;
}

function togglePerm(perm: string) {
  const idx = selectedPerms.value.indexOf(perm);
  if (idx >= 0) {
    selectedPerms.value.splice(idx, 1);
  } else {
    selectedPerms.value.push(perm);
  }
}

function toggleAllPerms() {
  if (selectedPerms.value.length === allPermKeys.length) {
    selectedPerms.value = [];
  } else {
    selectedPerms.value = [...allPermKeys];
  }
}

async function savePermissions() {
  permSubmitting.value = true;
  try {
    await updateRole(permRoleId.value, { permissions: selectedPerms.value });
    layer.msg("Cập nhật quyền hạn thành công", { icon: 1 });
    showPermModal.value = false;
    loadData();
    // Refresh current user's permissions if editing own role
    if (authStore.user?.role?.id === permRoleId.value) {
      authStore.fetchMe();
    }
  } catch (err: any) {
    const msg = err?.response?.data?.message || "Thao tác thất bại";
    layer.msg(msg, { icon: 2 });
  } finally {
    permSubmitting.value = false;
  }
}

// --- Delete ---
async function handleDelete(row: SystemRole) {
  try {
    await deleteRole(row.id);
    layer.msg("Xóa thành công", { icon: 1 });
    loadData();
  } catch (err: any) {
    const msg = err?.response?.data?.message || "Xóa thất bại";
    layer.msg(msg, { icon: 2 });
  }
}

onMounted(() => loadData());
</script>

<template>
  <div>
    <lay-card>
      <lay-field title="Quản lý vai trò">
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
                <i class="layui-icon layui-icon-addition"></i> Thêm mới
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
                  Sửa
                </lay-button>
                <lay-button
                  v-if="canWrite"
                  size="xs"
                  type="warm"
                  @click="openPermissions(row)"
                >
                  Phân quyền
                </lay-button>
                <lay-popconfirm
                  v-if="canDelete"
                  content="Bạn có chắc muốn xóa vai trò này?"
                  @confirm="handleDelete(row)"
                >
                  <lay-button size="xs" type="danger">Xóa</lay-button>
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
      :title="isEdit ? 'Sửa vai trò' : 'Thêm vai trò'"
      :area="['500px', 'auto']"
      :shade-close="false"
      :move="true"
    >
      <div style="padding: 20px 30px;">
        <div class="layui-form-item">
          <label class="layui-form-label">Tên</label>
          <div class="layui-input-block">
            <lay-input v-model="formData.name" placeholder="Nhập tên vai trò" />
          </div>
        </div>

        <div class="layui-form-item">
          <label class="layui-form-label">Loại</label>
          <div class="layui-input-block">
            <lay-select v-model="formData.type" placeholder="Chọn loại">
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
          <label class="layui-form-label">Cấp độ</label>
          <div class="layui-input-block">
            <lay-slider v-model="formData.level" :min="0" :max="100" :step="1" />
          </div>
        </div>

        <div class="layui-form-item" style="text-align: right; margin-bottom: 0;">
          <lay-button @click="showModal = false">Hủy</lay-button>
          <lay-button type="normal" :loading="submitting" @click="handleSubmit">
            {{ isEdit ? "Cập nhật" : "Tạo mới" }}
          </lay-button>
        </div>
      </div>
    </lay-layer>

    <!-- Permission Modal -->
    <lay-layer
      v-model="showPermModal"
      :title="`Phân quyền — ${permRoleName}`"
      :area="['600px', 'auto']"
      :shade-close="false"
      :move="true"
    >
      <div style="padding: 20px 30px;">
        <div class="perm-header">
          <lay-checkbox
            :modelValue="selectedPerms.length === allPermKeys.length"
            skin="primary"
            label="Chọn tất cả"
            @change="toggleAllPerms"
          />
        </div>
        <div class="perm-grid">
          <div
            v-for="perm in allPermKeys"
            :key="perm"
            class="perm-item"
          >
            <lay-checkbox
              :modelValue="selectedPerms.includes(perm)"
              skin="primary"
              :label="PERMISSION_LABELS[perm] || perm"
              @change="togglePerm(perm)"
            />
            <span class="perm-code">{{ perm }}</span>
          </div>
        </div>

        <div class="layui-form-item" style="text-align: right; margin-bottom: 0; margin-top: 20px;">
          <lay-button @click="showPermModal = false">Hủy</lay-button>
          <lay-button type="normal" :loading="permSubmitting" @click="savePermissions">
            Lưu quyền hạn
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
  padding-bottom: 12px;
  border-bottom: 1px solid #eee;
  margin-bottom: 16px;
}

.perm-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px 24px;
}

.perm-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.perm-code {
  font-size: 12px;
  color: #999;
  margin-left: 24px;
}
</style>
