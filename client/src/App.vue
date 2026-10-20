<script setup>
import { ref } from 'vue'
import UploadPanel from './components/UploadPanel.vue'
import ProductList from './components/ProductList.vue'
import CopyStudio from './views/CopyStudio.vue'

const tab = ref('assets')
const listRef = ref()
</script>

<template>
  <div style="max-width: 1200px; margin: 0 auto; padding: 24px">
    <el-tabs v-model="tab" type="border-card">
      <el-tab-pane label="资产中心" name="assets" lazy>
        <el-container>
          <el-aside width="380px" style="padding-right: 20px">
            <UploadPanel @created="listRef.reload()" />
          </el-aside>
          <el-main style="padding: 0">
            <ProductList ref="listRef" />
          </el-main>
        </el-container>
      </el-tab-pane>
      <el-tab-pane label="文案工坊" name="copy" lazy>
        <CopyStudio />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>
