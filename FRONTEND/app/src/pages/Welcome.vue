<script setup lang="ts">
import { ref } from "vue";

const info = ref({
  lastLoginTime: "2026-03-01 01:33:06",
  lastLoginIp: "2405:4802:9a5:f774:4dda:5c28:d457:3147",
  currentLoginTime: "2026-03-01 02:44:56",
  currentLoginIp: "2405:4802:9a5:f774:4dda:5c28:d457:3147",
  agentBalance: "0.0000",
  frozenAmount: "0.0000",
});
</script>

<template>
  <div class="welcome-page">
    <lay-quote>hào mừng bạn đăng nhập hệ thống quản lí</lay-quote>

    <lay-row :space="15">
      <lay-col :md="14">
        <lay-card>
          <div class="section-title">Thông tin cơ bản</div>
          <lay-line theme="green" />
          <div class="info-row">
            Thời gian lần đăng nhập trước：{{ info.lastLoginTime }}，IP lần đăng nhập trước：
          </div>
          <div class="info-row">{{ info.lastLoginIp }}</div>
          <br />
          <div class="info-row">
            Thời gian lần đăng nhập này：{{ info.currentLoginTime }}，IP lần đăng nhập này：
          </div>
          <div class="info-row">{{ info.currentLoginIp }}</div>
        </lay-card>
      </lay-col>
      <lay-col :md="10">
        <lay-card>
          <div class="section-title">Tổng quan quỹ tiền</div>
          <lay-line theme="green" />
          <div class="info-row">Ví tiền đại lý：{{ info.agentBalance }}</div>
          <div class="info-row">Số tiền đóng băng：{{ info.frozenAmount }}</div>
        </lay-card>
      </lay-col>
    </lay-row>
  </div>
</template>

<style scoped>
.welcome-page {
  padding: 0;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 10px;
}

.info-row {
  font-size: 14px;
  color: #666;
  line-height: 2;
}
</style>
