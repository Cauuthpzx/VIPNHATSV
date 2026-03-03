<script setup lang="ts">
import { useI18n } from "vue-i18n";

const { t } = useI18n();
</script>

<template>
  <div>
    <lay-card>
      <template #header>
        {{ t('withdrawPage.title') }}
      </template>
      <div style="padding: 10px 15px;">
        <p>{{ t('withdrawPage.currentBalance') }} <b>0.0000</b></p>
        <p style="margin-top: 15px;">
          {{ t('withdrawPage.instruction') }}
        </p>
        <p style="margin-top: 15px;">
          <router-link to="/agent/bank-list" style="color: #1e9fff; text-decoration: none;"><b>{{ t('withdrawPage.goToPage') }}</b></router-link>
        </p>
      </div>
    </lay-card>
  </div>
</template>
