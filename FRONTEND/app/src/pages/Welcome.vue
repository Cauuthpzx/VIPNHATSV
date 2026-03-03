<script setup lang="ts">
import { ref } from "vue";
import { useI18n } from "vue-i18n";

const { t } = useI18n();

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
    <lay-quote>{{ t('welcome.greeting') }}</lay-quote>

    <lay-row :space="15">
      <lay-col :md="14">
        <lay-card>
          <div class="section-title">{{ t('welcome.basicInfo') }}</div>
          <lay-line theme="green" />
          <div class="info-row">
            {{ t('welcome.lastLoginTime') }}{{ info.lastLoginTime }}，{{ t('welcome.lastLoginIp') }}
          </div>
          <div class="info-row">{{ info.lastLoginIp }}</div>
          <br />
          <div class="info-row">
            {{ t('welcome.currentLoginTime') }}{{ info.currentLoginTime }}，{{ t('welcome.currentLoginIp') }}
          </div>
          <div class="info-row">{{ info.currentLoginIp }}</div>
        </lay-card>
      </lay-col>
      <lay-col :md="10">
        <lay-card>
          <div class="section-title">{{ t('welcome.fundOverview') }}</div>
          <lay-line theme="green" />
          <div class="info-row">{{ t('welcome.agentWallet') }}{{ info.agentBalance }}</div>
          <div class="info-row">{{ t('welcome.frozenAmount') }}{{ info.frozenAmount }}</div>
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
