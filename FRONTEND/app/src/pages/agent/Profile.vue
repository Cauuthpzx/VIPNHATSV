<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import { layer } from "@layui/layui-vue";
import { useAuthStore } from "@/stores/auth";
import {
  updateProfile,
  changeSystemPassword,
  logoutAllDevices,
  fetchActiveSessions,
  revokeSession,
  type SessionItem,
} from "@/api/services/proxy";

const { t } = useI18n();

const router = useRouter();
const authStore = useAuthStore();

// ─── Profile edit ────────────────────────────────────────────────────────────
const editing = ref(false);
const editName = ref("");
const saving = ref(false);

const avatarLetter = computed(() => {
  const name = authStore.user?.name || authStore.user?.username || "?";
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
    layer.msg(t("profile.nameEmpty"), { icon: 2 });
    return;
  }
  saving.value = true;
  try {
    const res = await updateProfile({ name });
    if (res.data.success) {
      if (authStore.user) authStore.user.name = name;
      editing.value = false;
      layer.msg(t("profile.nameUpdateSuccess"), { icon: 1 });
    }
  } catch {
    layer.msg(t("profile.nameUpdateFailed"), { icon: 2 });
  } finally {
    saving.value = false;
  }
}

// ─── Last login info ─────────────────────────────────────────────────────────
const lastLoginAt = computed(() => {
  const u = authStore.user as any;
  if (!u?.lastLoginAt) return null;
  return new Date(u.lastLoginAt).toLocaleString("vi-VN");
});

const lastLoginIp = computed(() => {
  const u = authStore.user as any;
  return u?.lastLoginIp || null;
});

// ─── Quick actions ───────────────────────────────────────────────────────────
const quickActions = computed(() => [
  {
    title: t("profile.changeAgentPassword"),
    desc: t("profile.changeAgentPasswordDesc"),
    icon: "layui-icon-password",
    color: "#16baaa",
    path: "/agent/edit-password",
  },
]);

// ─── Đổi mật khẩu hệ thống MAXHUB ──────────────────────────────────────
const sysForm = ref({ oldPassword: "", newPassword: "", confirmPassword: "" });
const sysSubmitting = ref(false);

async function handleSysPasswordChange() {
  if (!sysForm.value.oldPassword) {
    layer.msg(t("password.enterOld"), { icon: 2 });
    return;
  }
  if (!sysForm.value.newPassword) {
    layer.msg(t("password.enterNew"), { icon: 2 });
    return;
  }
  if (sysForm.value.newPassword !== sysForm.value.confirmPassword) {
    layer.msg(t("password.mismatch"), { icon: 2 });
    return;
  }
  sysSubmitting.value = true;
  try {
    await changeSystemPassword({
      oldPassword: sysForm.value.oldPassword,
      newPassword: sysForm.value.newPassword,
    });
    layer.msg(t("profile.changePasswordSuccessLogout"), { icon: 1 });
    setTimeout(() => {
      authStore.logout();
      router.push("/login");
    }, 1500);
  } catch (err: any) {
    const msg = err?.response?.data?.message || t("common.operationFailed");
    layer.msg(msg, { icon: 2 });
  } finally {
    sysSubmitting.value = false;
  }
}

// ─── Logout all devices ──────────────────────────────────────────────────────
const logoutAllLoading = ref(false);

async function handleLogoutAll() {
  layer.confirm(t("profile.logoutAllConfirm"), {
    btn: [
      { text: t("common.confirm"), callback: async (id: string) => {
        layer.close(id);
        logoutAllLoading.value = true;
        try {
          await logoutAllDevices();
          layer.msg(t("profile.logoutAllSuccess"), { icon: 1 });
          setTimeout(() => {
            authStore.logout();
            router.push("/login");
          }, 1000);
        } catch {
          layer.msg(t("common.operationFailed"), { icon: 2 });
        } finally {
          logoutAllLoading.value = false;
        }
      }},
      { text: t("common.cancel"), callback: (id: string) => { layer.close(id); } },
    ],
  });
}

// ─── Active sessions ─────────────────────────────────────────────────────────
const sessions = ref<SessionItem[]>([]);
const sessionsLoading = ref(false);

async function loadSessions() {
  sessionsLoading.value = true;
  try {
    const res = await fetchActiveSessions();
    if (res.data.success) {
      sessions.value = res.data.data;
    }
  } catch {
    // ignore
  } finally {
    sessionsLoading.value = false;
  }
}

async function handleRevokeSession(id: string) {
  try {
    await revokeSession(id);
    sessions.value = sessions.value.filter((s) => s.id !== id);
    layer.msg(t("profile.sessionRevoked"), { icon: 1 });
  } catch {
    layer.msg(t("common.operationFailed"), { icon: 2 });
  }
}

function parseUA(ua: string | null): string {
  if (!ua) return t("common.unknown");
  if (ua.includes("Chrome")) return "Chrome";
  if (ua.includes("Firefox")) return "Firefox";
  if (ua.includes("Safari")) return "Safari";
  if (ua.includes("Edge")) return "Edge";
  return ua.slice(0, 30) + "...";
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("vi-VN");
}

onMounted(() => {
  loadSessions();
});
</script>

<template>
  <div class="profile-page">
    <lay-row :space="16">
      <!-- Profile card -->
      <lay-col :md="8" :xs="24">
        <lay-card>
          <template #title>
            <lay-icon type="layui-icon-username" style="margin-right: 6px" />
            {{ t("profile.accountInfo") }}
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
                :placeholder="t('profile.editNamePlaceholder')"
                size="sm"
                style="width: 180px"
                @keyup.enter="saveName"
              />
              <lay-button type="normal" size="xs" :loading="saving" @click="saveName">{{ t("common.save") }}</lay-button>
              <lay-button size="xs" @click="cancelEdit">{{ t("common.cancel") }}</lay-button>
            </div>

            <lay-tag type="normal" color="#16baaa" style="margin-top: 8px">
              {{ authStore.user?.role?.name || "—" }}
            </lay-tag>

            <lay-line />

            <div class="profile-detail">
              <div class="detail-row">
                <span class="detail-label">{{ t("profile.account") }}</span>
                <span class="detail-value" style="font-weight: 600">{{ authStore.user?.username || "—" }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">{{ t("profile.email") }}</span>
                <span class="detail-value">{{ authStore.user?.email || t("profile.emailNotSet") }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">User ID</span>
                <span class="detail-value detail-id">{{ authStore.user?.id || "—" }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">{{ t("profile.status") }}</span>
                <lay-tag type="normal" color="#16baaa" size="sm">{{ t("common.online") }}</lay-tag>
              </div>
              <div class="detail-row" v-if="lastLoginAt">
                <span class="detail-label">{{ t("profile.lastLogin") }}</span>
                <span class="detail-value">{{ lastLoginAt }}</span>
              </div>
              <div class="detail-row" v-if="lastLoginIp">
                <span class="detail-label">{{ t("profile.loginIp") }}</span>
                <span class="detail-value detail-id">{{ lastLoginIp }}</span>
              </div>
            </div>
          </div>
        </lay-card>
      </lay-col>

      <!-- Right panel -->
      <lay-col :md="16" :xs="24">
        <!-- Quick actions (upstream agent) -->
        <lay-card>
          <template #title>
            <lay-icon type="layui-icon-set" style="margin-right: 6px" />
            {{ t("profile.agentSettings") }}
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

        <!-- Đổi mật khẩu hệ thống MAXHUB -->
        <lay-card style="margin-top: 16px">
          <template #title>
            <lay-icon type="layui-icon-shield" style="margin-right: 6px; color: #722ed1" />
            {{ t("profile.changeSystemPassword") }}
          </template>
          <div class="sys-pw-form">
            <div class="sys-pw-row">
              <lay-icon type="layui-icon-password" :size="18" class="sys-pw-icon" />
              <lay-input v-model="sysForm.oldPassword" type="password" :placeholder="t('profile.currentPasswordPlaceholder')" />
            </div>
            <div class="sys-pw-row">
              <lay-icon type="layui-icon-key" :size="18" class="sys-pw-icon" />
              <lay-input v-model="sysForm.newPassword" type="password" :placeholder="t('profile.newPasswordPlaceholder')" />
            </div>
            <div class="sys-pw-row">
              <lay-icon type="layui-icon-ok-circle" :size="18" class="sys-pw-icon" />
              <lay-input v-model="sysForm.confirmPassword" type="password" :placeholder="t('profile.confirmPasswordPlaceholder')" />
            </div>
            <div class="sys-pw-actions">
              <lay-button type="normal" :loading="sysSubmitting" @click="handleSysPasswordChange">{{ t("profile.agree") }}</lay-button>
              <lay-button @click="Object.assign(sysForm, { oldPassword: '', newPassword: '', confirmPassword: '' })">{{ t("profile.cancelBtn") }}</lay-button>
            </div>
          </div>
        </lay-card>

        <!-- Active sessions -->
        <lay-card style="margin-top: 16px">
          <template #title>
            <lay-icon type="layui-icon-cellphone" style="margin-right: 6px" />
            {{ t("profile.activeSessions") }}
            <lay-button
              size="xs"
              style="margin-left: 12px"
              @click="loadSessions"
              :loading="sessionsLoading"
            >{{ t("profile.refreshBtn") }}</lay-button>
          </template>
          <div class="sessions-list">
            <div v-if="sessionsLoading && !sessions.length" style="padding: 20px; text-align: center; color: #999;">
              {{ t("common.loading") }}
            </div>
            <div v-else-if="!sessions.length" style="padding: 20px; text-align: center; color: #999;">
              {{ t("profile.noSessions") }}
            </div>
            <div
              v-for="session in sessions"
              :key="session.id"
              class="session-item"
            >
              <div class="session-info">
                <div class="session-browser">{{ parseUA(session.userAgent) }}</div>
                <div class="session-meta">
                  <span v-if="session.ipAddress">IP: {{ session.ipAddress }}</span>
                  <span>{{ formatDate(session.createdAt) }}</span>
                </div>
              </div>
              <lay-button size="xs" type="warm" @click="handleRevokeSession(session.id)">{{ t("profile.revokeSession") }}</lay-button>
            </div>
          </div>
        </lay-card>

        <!-- Logout all -->
        <lay-card style="margin-top: 16px">
          <template #title>
            <lay-icon type="layui-icon-auz" style="margin-right: 6px" />
            {{ t("profile.security") }}
          </template>
          <div style="padding: 12px 0;">
            <div class="security-row">
              <div>
                <div class="security-title">{{ t("profile.logoutAllDevices") }}</div>
                <div class="security-desc">{{ t("profile.logoutAllDesc") }}</div>
              </div>
              <lay-button type="danger" :loading="logoutAllLoading" @click="handleLogoutAll">{{ t("profile.logoutAllBtn") }}</lay-button>
            </div>
          </div>
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

/* Sessions */
.sessions-list {
  max-height: 300px;
  overflow-y: auto;
}

.session-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid #f5f5f5;
}
.session-item:last-child {
  border: none;
}

.session-browser {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.session-meta {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #999;
  margin-top: 2px;
}

/* Sys password form */
.sys-pw-form {
  padding: 8px 0;
}

.sys-pw-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.sys-pw-icon {
  color: #722ed1;
  flex-shrink: 0;
}

.sys-pw-actions {
  display: flex;
  gap: 8px;
  margin-top: 16px;
  padding-left: 28px;
}

/* Security */
.security-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.security-title {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.security-desc {
  font-size: 12px;
  color: #999;
  margin-top: 2px;
}
</style>
