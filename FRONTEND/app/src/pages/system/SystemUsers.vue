<script setup lang="ts">
import { reactive, ref, onMounted } from "vue";
import { layer } from "@layui/layui-vue";
import { useListPage } from "@/composables/useListPage";
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

const authStore = useAuthStore();
const canWrite = authStore.hasPermission(PERMISSIONS.USERS_WRITE);
const canDelete = authStore.hasPermission(PERMISSIONS.USERS_DELETE);

const { dataSource, loading, page, setLoading, bindLoadData } = useListPage<SystemUser>();

const searchKeyword = ref("");

const columns = [
  { title: "Email", key: "email", ellipsisTooltip: true },
  { title: "Tên", key: "name", ellipsisTooltip: true },
  { title: "Vai trò", key: "role", customSlot: "role", width: "150px" },
  { title: "Trạng thái", key: "isActive", customSlot: "status", width: "120px" },
  { title: "Ngày tạo", key: "createdAt", customSlot: "date", width: "180px" },
  { title: "Thao tác", key: "action", customSlot: "action", width: "220px", fixed: "right" },
];

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
    layer.msg("Lỗi tải dữ liệu", { icon: 2 });
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
  email: "",
  password: "",
  name: "",
  roleId: "",
  isActive: true,
});

function resetForm() {
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
  formData.email = row.email;
  formData.password = "";
  formData.name = row.name || "";
  formData.roleId = row.roleId;
  formData.isActive = row.isActive;
  showModal.value = true;
}

async function handleSubmit() {
  if (!formData.email) {
    layer.msg("Vui lòng nhập email", { icon: 2 });
    return;
  }
  if (!isEdit.value && !formData.password) {
    layer.msg("Vui lòng nhập mật khẩu", { icon: 2 });
    return;
  }
  if (!isEdit.value && formData.password.length < 6) {
    layer.msg("Mật khẩu phải có ít nhất 6 ký tự", { icon: 2 });
    return;
  }
  if (!formData.name) {
    layer.msg("Vui lòng nhập tên", { icon: 2 });
    return;
  }
  if (!formData.roleId) {
    layer.msg("Vui lòng chọn vai trò", { icon: 2 });
    return;
  }

  submitting.value = true;
  try {
    if (isEdit.value) {
      await updateUser(editingId.value, {
        email: formData.email,
        name: formData.name,
        roleId: formData.roleId,
        isActive: formData.isActive,
      });
      layer.msg("Cập nhật thành công", { icon: 1 });
    } else {
      await createUser({
        email: formData.email,
        password: formData.password,
        name: formData.name,
        roleId: formData.roleId,
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

// --- Toggle active ---
async function toggleActive(row: SystemUser) {
  try {
    await updateUser(row.id, { isActive: !row.isActive });
    layer.msg(row.isActive ? "Đã khóa tài khoản" : "Đã mở khóa tài khoản", { icon: 1 });
    loadData();
  } catch {
    layer.msg("Thao tác thất bại", { icon: 2 });
  }
}

// --- Delete ---
async function handleDelete(row: SystemUser) {
  try {
    await deleteUser(row.id);
    layer.msg("Xóa thành công", { icon: 1 });
    loadData();
  } catch (err: any) {
    const msg = err?.response?.data?.message || "Xóa thất bại";
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
      <lay-field title="Quản lý người dùng">
        <div class="search-form-wrap">
          <div class="layui-inline">
            <span class="form-label">Tìm kiếm:</span>
            <lay-input
              v-model="searchKeyword"
              placeholder="Email hoặc tên"
              @keyup.enter="handleSearch"
            />
          </div>
          <div class="layui-inline">
            <lay-button type="normal" @click="handleSearch">
              <i class="layui-icon layui-icon-search"></i> Tìm kiếm
            </lay-button>
            <lay-button type="primary" @click="handleReset">
              <i class="layui-icon layui-icon-refresh"></i> Đặt lại
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
          :default-toolbar="true"
          :data-source="dataSource"
          @change="handlePageChange"
        >
          <template v-slot:toolbar>
            <lay-button v-if="canWrite" type="normal" size="xs" @click="openCreate">
              <i class="layui-icon layui-icon-addition"></i> Thêm mới
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
              {{ row.isActive ? "Hoạt động" : "Đã khóa" }}
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
                Sửa
              </lay-button>
              <lay-button
                v-if="canWrite"
                size="xs"
                :type="row.isActive ? 'warm' : 'normal'"
                @click="toggleActive(row)"
              >
                {{ row.isActive ? "Khóa" : "Mở khóa" }}
              </lay-button>
              <lay-popconfirm
                v-if="canDelete"
                content="Bạn có chắc muốn xóa người dùng này?"
                @confirm="handleDelete(row)"
              >
                <lay-button size="xs" type="danger">Xóa</lay-button>
              </lay-popconfirm>
            </div>
          </template>
        </lay-table>
      </div>
    </lay-card>

    <!-- Create/Edit Modal -->
    <lay-layer
      v-model="showModal"
      :title="isEdit ? 'Sửa người dùng' : 'Thêm người dùng'"
      :area="['500px', 'auto']"
      :shade-close="false"
      :move="true"
    >
      <div style="padding: 20px 30px;">
        <div class="layui-form-item">
          <label class="layui-form-label">Email</label>
          <div class="layui-input-block">
            <lay-input
              v-model="formData.email"
              placeholder="Nhập email"
              :disabled="isEdit"
            />
          </div>
        </div>

        <div v-if="!isEdit" class="layui-form-item">
          <label class="layui-form-label">Mật khẩu</label>
          <div class="layui-input-block">
            <lay-input
              v-model="formData.password"
              type="password"
              placeholder="Nhập mật khẩu (tối thiểu 6 ký tự)"
            />
          </div>
        </div>

        <div class="layui-form-item">
          <label class="layui-form-label">Tên</label>
          <div class="layui-input-block">
            <lay-input
              v-model="formData.name"
              placeholder="Nhập tên người dùng"
            />
          </div>
        </div>

        <div class="layui-form-item">
          <label class="layui-form-label">Vai trò</label>
          <div class="layui-input-block">
            <lay-select v-model="formData.roleId" placeholder="Chọn vai trò">
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
          <label class="layui-form-label">Trạng thái</label>
          <div class="layui-input-block" style="display: flex; align-items: center; min-height: 38px;">
            <lay-switch
              v-model="formData.isActive"
              onswitch-text="Hoạt động"
              unswitch-text="Đã khóa"
            />
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
  </div>
</template>

<style scoped>
.action-btns {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}
</style>
