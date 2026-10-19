<script setup>
import { ref, onMounted } from 'vue'
import { getHealth } from './api/health'

const status = ref('检测中...')

onMounted(async () => {
  try {
    const res = await getHealth()
    console.log('[health] 后端响应：', res)
    status.value = '后端连接成功：' + res.data.time
  } catch (e) {
    console.error('[health] 请求失败：', e.message)
    status.value = '后端连接失败：' + e.message
  }
})
</script>

<template>
  <el-card style="max-width: 560px; margin: 60px auto">
    <h2>AI 出海营销工坊</h2>
    <el-tag :type="status.includes('成功') ? 'success' : 'info'">{{ status }}</el-tag>
  </el-card>
</template>
