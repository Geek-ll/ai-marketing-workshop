<script setup>
import { onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useProductStore } from '../stores/product'

const store = useProductStore()
const base = import.meta.env.VITE_API_BASE ?? ''
const imgUrl = (p) => base + p

async function onDelete(p) {
  try {
    await ElMessageBox.confirm(`确定删除商品「${p.name}」吗？`, '提示', { type: 'warning' })
  } catch {
    return
  }
  try {
    await store.remove(p._id)
    ElMessage.success('删除成功')
  } catch (e) {
    ElMessage.error(e.message)
  }
}

defineExpose({ reload: () => store.load() })
onMounted(() => store.load())
</script>

<template>
  <div v-loading="store.loading" style="min-height: 200px">
    <el-empty v-if="!store.loading && !store.list.length" description="还没有商品，先上传一个吧" />
    <div class="waterfall">
      <el-card v-for="p in store.list" :key="p._id" class="item" shadow="hover" :body-style="{ padding: 0 }">
        <div class="thumb">
          <el-image :src="imgUrl(p.images[0])" :preview-src-list="p.images.map(imgUrl)" fit="cover" style="width: 100%" lazy />
          <el-button class="del" type="danger" size="small" @click="onDelete(p)">删除</el-button>
          <el-tag v-if="p.images.length > 1" class="count" size="small" type="info">{{ p.images.length }} 图</el-tag>
        </div>
        <div class="info">
          <h4>{{ p.name }}</h4>
          <el-tag size="small" v-if="p.category">{{ p.category }}</el-tag>
          <el-tag size="small" type="success" v-if="p.audience" style="margin-left: 6px">{{ p.audience }}</el-tag>
          <div class="time">{{ new Date(p.createdAt).toLocaleString() }}</div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<style scoped>
.waterfall {
  column-count: 3;
  column-gap: 16px;
}
.item {
  break-inside: avoid;
  margin-bottom: 16px;
  position: relative;
}
.thumb {
  position: relative;
}
.del {
  position: absolute;
  top: 8px;
  right: 8px;
  opacity: 0;
  transition: opacity 0.2s;
}
.item:hover .del {
  opacity: 1;
}
.count {
  position: absolute;
  left: 8px;
  bottom: 8px;
}
.info {
  padding: 12px;
}
.info h4 {
  margin: 0 0 8px;
}
.time {
  margin-top: 8px;
  color: #999;
  font-size: 12px;
}
@media (max-width: 900px) {
  .waterfall {
    column-count: 2;
  }
}
@media (max-width: 560px) {
  .waterfall {
    column-count: 1;
  }
}
</style>
