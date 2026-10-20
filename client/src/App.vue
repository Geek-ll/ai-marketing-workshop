<script setup>
import { ref } from 'vue'
import UploadPanel from './components/UploadPanel.vue'
import ProductList from './components/ProductList.vue'

const listRef = ref()
</script>

<template>
  <el-container style="max-width: 1200px; margin: 0 auto; padding: 24px">
    <el-header height="auto" style="padding: 0 0 16px">
      <h2 style="margin: 0">素材管理中心 · 商品图片上传</h2>
      <p style="color: #909399; margin: 8px 0 0">左侧上传商品图片与信息，右侧以瀑布流展示已入库的商品素材</p>
    </el-header>
    <el-container>
      <el-aside width="380px" style="padding-right: 20px">
        <UploadPanel @created="listRef.reload()" />
      </el-aside>
      <el-main style="padding: 0">
        <ProductList ref="listRef" />
      </el-main>
    </el-container>
  </el-container>
</template>
