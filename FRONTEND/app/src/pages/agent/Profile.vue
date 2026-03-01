<script setup lang="ts">
import { useAuthStore } from "@/stores/auth";

const authStore = useAuthStore();
</script>

<template>
  <div>
    <lay-card>
      <div class="profile-info">
        <div class="profile-avatar">
          {{ authStore.user?.name?.charAt(0)?.toUpperCase() || authStore.user?.email?.charAt(0)?.toUpperCase() }}
        </div>
        <div class="profile-details">
          <div class="profile-row">
            <span class="profile-label">Tên:</span>
            <span class="profile-value">{{ authStore.user?.name || "—" }}</span>
          </div>
          <div class="profile-row">
            <span class="profile-label">Email:</span>
            <span class="profile-value">{{ authStore.user?.email || "—" }}</span>
          </div>
          <div class="profile-row">
            <span class="profile-label">Vai trò:</span>
            <span class="profile-value">{{ authStore.user?.role || "—" }}</span>
          </div>
        </div>
      </div>
    </lay-card>
  </div>
</template>

<style scoped>
.profile-info {
  display: flex;
  align-items: flex-start;
  gap: 24px;
  padding: 20px;
}

.profile-avatar {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: #009688;
  color: #fff;
  font-size: 28px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.profile-details {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.profile-row {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
}

.profile-label {
  color: #999;
  min-width: 60px;
}

.profile-value {
  color: #333;
}
</style>
