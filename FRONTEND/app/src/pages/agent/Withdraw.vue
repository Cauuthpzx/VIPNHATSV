<script setup lang="ts">
</script>

<template>
  <div>
    <lay-card>
      <template #header>
        Rút tiền
      </template>
      <div style="padding: 10px 15px;">
        <p>Số dư hiện tại: <b>0.0000</b></p>
        <p style="margin-top: 15px;">
          Vui lòng đi tới danh sách ngân hàng, sau khi thêm tài khoản ngân hàng quý khách mới có thể thực hiện rút tiền
        </p>
        <p style="margin-top: 15px;">
          <router-link to="/agent/bank-list" style="color: #1e9fff; text-decoration: none;"><b>Đi tới trang</b></router-link>
        </p>
      </div>
    </lay-card>
  </div>
</template>
