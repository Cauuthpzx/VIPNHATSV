<script setup lang="ts">
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { layer } from "@layui/layui-vue";
import { useAuthStore } from "@/stores/auth";
import { updateProfile } from "@/api/services/proxy";

const router = useRouter();
const authStore = useAuthStore();

const editing = ref(false);
const editName = ref("");
const saving = ref(false);

const avatarLetter = computed(() => {
  const name = authStore.user?.name || authStore.user?.email || "?";
  return name.charAt(0).toUpperCase();
});

function startEdit() {
  editName.value = authStore.user?.name || "";
  editing.value = true;
}

function cancelEdit() {
  editing.value = false;
}

async function saveName() {
  const name = editName.value.trim();
  if (!name) {
    layer.msg("Tên không được để trống", { icon: 2 });
    return;
  }
  saving.value = true;
  try {
    const res = await updateProfile({ name });
    if (res.data.success) {
      if (authStore.user) authStore.user.name = name;
      editing.value = false;
      layer.msg("Cập nhật tên thành công", { icon: 1 });
    }
  } catch {
    layer.msg("Cập nhật thất bại, vui lòng thử lại", { icon: 2 });
  } finally {
    saving.value = false;
  }
}

const quickActions = [
  {
    title: "Đổi mật khẩu đăng nhập",
    desc: "Thay đổi mật khẩu đăng nhập hiện tại",
    icon: "layui-icon-password",
    color: "#16baaa",
    path: "/agent/edit-password",
  },
  {
    title: "Đổi mật khẩu giao dịch",
    desc: "Thiết lập hoặc thay đổi mật khẩu giao dịch",
    icon: "layui-icon-shield",
    color: "#722ed1",
    path: "/agent/edit-fund-password",
  },
];
</script>

<template>
  <div class="profile-page">
    <lay-row :space="16">
      <!-- Profile card -->
      <lay-col :md="8" :xs="24">
        <lay-card>
          <template #title>
            <lay-icon type="layui-icon-username" style="margin-right: 6px" />
            Thông tin tài khoản
          </template>
          <div class="profile-card">
            <div class="profile-avatar">{{ avatarLetter }}</div>

            <div class="profile-name-row" v-if="!editing">
              <span class="profile-name">{{ authStore.user?.name || "—" }}</span>
              <lay-icon
                type="layui-icon-edit"
                class="profile-edit-icon"
                @click="startEdit"
              />
            </div>
            <div class="profile-name-edit" v-else>
              <lay-input
                v-model="editName"
                placeholder="Nhập tên mới"
                size="sm"
                style="width: 180px"
                @keyup.enter="saveName"
              />
              <lay-button type="normal" size="xs" :loading="saving" @click="saveName">Lưu</lay-button>
              <lay-button size="xs" @click="cancelEdit">Hủy</lay-button>
            </div>

            <lay-tag type="normal" color="#16baaa" style="margin-top: 8px">
              {{ authStore.user?.role || "—" }}
            </lay-tag>

            <lay-line />

            <div class="profile-detail">
              <div class="detail-row">
                <span class="detail-label">Email</span>
                <span class="detail-value">{{ authStore.user?.email || "—" }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">User ID</span>
                <span class="detail-value detail-id">{{ authStore.user?.id || "—" }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Trạng thái</span>
                <lay-tag type="normal" color="#16baaa" size="sm">Online</lay-tag>
              </div>
            </div>
          </div>
        </lay-card>
      </lay-col>

      <!-- Quick actions -->
      <lay-col :md="16" :xs="24">
        <lay-card>
          <template #title>
            <lay-icon type="layui-icon-set" style="margin-right: 6px" />
            Cài đặt tài khoản
          </template>
          <lay-row :space="12">
            <lay-col :md="12" :xs="24" v-for="action in quickActions" :key="action.path">
              <div class="quick-action" @click="router.push(action.path)">
                <div class="quick-action-icon" :style="{ background: action.color + '15', color: action.color }">
                  <lay-icon :type="action.icon" :size="24" />
                </div>
                <div>
                  <div class="quick-action-title">{{ action.title }}</div>
                  <div class="quick-action-desc">{{ action.desc }}</div>
                </div>
                <lay-icon type="layui-icon-right" class="quick-action-arrow" />
              </div>
            </lay-col>
          </lay-row>
        </lay-card>
      </lay-col>
    </lay-row>
  </div>
</template>

<style scoped>
.profile-page {
  padding: 0;
}

.profile-card {
  text-align: center;
  padding: 20px 16px;
}

.profile-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: #009688;
  color: #fff;
  font-size: 36px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 12px;
}

.profile-name-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.profile-name {
  font-size: 20px;
  font-weight: 600;
  color: #333;
}

.profile-edit-icon {
  cursor: pointer;
  color: #999;
  font-size: 16px;
  transition: color 0.2s;
}
.profile-edit-icon:hover {
  color: #009688;
}

.profile-name-edit {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.profile-detail {
  text-align: left;
  margin-top: 4px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #f5f5f5;
}
.detail-row:last-child {
  border: none;
}

.detail-label {
  font-size: 13px;
  color: #999;
}

.detail-value {
  font-size: 13px;
  color: #333;
  font-weight: 500;
}

.detail-id {
  font-family: monospace;
  font-size: 12px;
  color: #666;
}

.quick-action {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px 16px;
  border-radius: 8px;
  border: 1px solid #f0f0f0;
  cursor: pointer;
  transition: all 0.2s;
}
.quick-action:hover {
  border-color: #16baaa;
  background: rgba(22, 186, 170, 0.04);
}

.quick-action-icon {
  width: 48px;
  height: 48px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.quick-action-title {
  font-size: 15px;
  font-weight: 500;
  color: #333;
}

.quick-action-desc {
  font-size: 12px;
  color: #999;
  margin-top: 3px;
}

.quick-action-arrow {
  margin-left: auto;
  color: #ccc;
  font-size: 16px;
}
</style>
