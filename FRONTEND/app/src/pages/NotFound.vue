<template>
  <div class="not-found-page">
    <div class="not-found-content">
      <h1 class="not-found-code">404</h1>
      <p class="not-found-text">Trang không tồn tại</p>
      <lay-button type="primary" @click="$router.push('/agent/welcome')">
        Về trang chủ
      </lay-button>
    </div>
  </div>
</template>

<style scoped>
.not-found-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: #f6f6f6;
}

.not-found-content {
  text-align: center;
}

.not-found-code {
  font-size: 96px;
  font-weight: 700;
  color: #999;
  margin: 0;
  line-height: 1;
}

.not-found-text {
  font-size: 18px;
  color: #666;
  margin: 16px 0 32px;
}
</style>
