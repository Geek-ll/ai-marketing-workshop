<script setup>
import { ref } from 'vue'
import UploadPanel from './components/UploadPanel.vue'
import ProductList from './components/ProductList.vue'
import CopyStudio from './views/CopyStudio.vue'
import SceneStudio from './views/SceneStudio.vue'

const tab = ref('assets')
const listRef = ref()
</script>

<template>
  <div style="max-width: 1200px; margin: 0 auto; padding: 20px 24px 24px">
    <header class="brand">
      <span class="logo">✦</span>
      <span class="title">AI 出海营销工坊</span>
    </header>
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
      <el-tab-pane label="场景生图" name="scene" lazy>
        <SceneStudio :active="tab === 'scene'" />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<style scoped>
.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
}
.logo {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  background: linear-gradient(135deg, #2f6fed, #7a5cf0);
  color: #fff;
  display: grid;
  place-items: center;
  font-size: 16px;
}
.title {
  font-weight: 700;
  font-size: 18px;
}
</style>
