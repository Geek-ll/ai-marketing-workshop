<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import * as echarts from 'echarts'
import { ElMessage } from 'element-plus'
import { getOverview } from '../api/stats'

const data = ref(null)
const days = ref(7)
const lineEl = ref()
const pieEl = ref()
let line, pie

// 后端返回的是 purpose 枚举值，页面展示成中文
const PURPOSE_LABEL = {
  vision: 'AI 识图（vision）',
  copy: '文案生成（copy）',
  prompt: '提示词扩写（prompt）',
  image: '场景生图（image）',
  chat: '对话（chat）',
}

function render() {
  const d = data.value
  line ||= echarts.init(lineEl.value)
  pie ||= echarts.init(pieEl.value)
  line.setOption({
    title: { text: '每日 Token 消耗走势', left: 'center' },
    tooltip: { trigger: 'axis' },
    legend: { bottom: 0, data: ['Prompt Tokens', 'Completion Tokens'] },
    grid: { left: 50, right: 24, top: 56, bottom: 48 },
    xAxis: { type: 'category', data: d.series.map((s) => s.date.slice(5)) },
    yAxis: { type: 'value', name: 'Tokens' },
    series: [
      {
        name: 'Prompt Tokens',
        type: 'line',
        smooth: true,
        data: d.series.map((s) => s.promptTokens),
        itemStyle: { color: '#409eff' },
      },
      {
        name: 'Completion Tokens',
        type: 'line',
        smooth: true,
        data: d.series.map((s) => s.completionTokens),
        itemStyle: { color: '#e6a23c' },
      },
    ],
  })
  pie.setOption({
    title: { text: 'API 调用成功率', left: 'center' },
    tooltip: { trigger: 'item', formatter: '{b}：{c} 次（{d}%）' },
    legend: { bottom: 0 },
    series: [
      {
        type: 'pie',
        radius: ['40%', '65%'],
        center: ['50%', '48%'],
        data: [
          { name: '成功', value: d.success, itemStyle: { color: '#67c23a' } },
          { name: '失败', value: d.failed, itemStyle: { color: '#f56c6c' } },
        ],
      },
    ],
  })
}

async function load() {
  try {
    data.value = (await getOverview(days.value)).data
    await nextTick()
    render()
  } catch (e) {
    ElMessage.error(e.message)
  }
}

const onResize = () => {
  line?.resize()
  pie?.resize()
}

onMounted(() => {
  load()
  window.addEventListener('resize', onResize)
})
onBeforeUnmount(() => {
  window.removeEventListener('resize', onResize)
  line?.dispose()
  pie?.dispose()
})
</script>

<template>
  <div v-if="data">
    <el-alert
      v-if="data.hasDemo"
      type="warning"
      show-icon
      :closable="false"
      title="当前统计包含演示数据（非真实调用）"
      style="margin-bottom: 16px"
    />
    <el-row :gutter="16" style="margin-bottom: 16px">
      <el-col :span="8"
        ><el-card><el-statistic title="近期 Token 消耗" :value="data.totalTokens" /></el-card
      ></el-col>
      <el-col :span="8"
        ><el-card><el-statistic title="API 调用次数" :value="data.totalCalls" /></el-card
      ></el-col>
      <el-col :span="8"
        ><el-card><el-statistic title="成功率" :value="data.successRate" :precision="1" suffix="%" /></el-card
      ></el-col>
    </el-row>
    <el-row :gutter="16">
      <el-col :span="14"><el-card><div ref="lineEl" style="height: 340px"></div></el-card></el-col>
      <el-col :span="10"><el-card><div ref="pieEl" style="height: 340px"></div></el-card></el-col>
    </el-row>
    <el-card header="各功能消耗明细" style="margin-top: 16px">
      <el-table :data="data.byPurpose">
        <el-table-column label="功能">
          <template #default="{ row }">{{ PURPOSE_LABEL[row._id] || row._id }}</template>
        </el-table-column>
        <el-table-column prop="calls" label="调用次数" />
        <el-table-column prop="tokens" label="Token 总量" />
      </el-table>
    </el-card>
  </div>
  <el-skeleton v-else animated :rows="8" />
</template>
