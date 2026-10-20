<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useProductStore } from '../stores/product'
import { generateCopy } from '../api/copy'

const store = useProductStore()
onMounted(() => store.load())

const form = ref({ productId: '', language: 'en', channel: 'amazon', extra: '' })
const result = ref(null)
const loading = ref(false)
// 下拉里只列出已做过 AI 识别的商品（文案依赖卖点）
const ready = computed(() => store.list.filter((p) => p.aiAnalysis?.core_selling_points?.length))

async function run() {
  if (!form.value.productId) return ElMessage.warning('请先选择商品')
  loading.value = true
  result.value = null
  try {
    result.value = (await generateCopy(form.value)).data
  } catch (e) {
    ElMessage.error(e.message)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <el-row :gutter="20">
    <el-col :span="9">
      <el-card header="生成设置">
        <el-form label-width="80px">
          <el-form-item label="商品">
            <el-select v-model="form.productId" placeholder="选择已识别的商品" style="width: 100%">
              <el-option v-for="p in ready" :key="p._id" :label="p.name" :value="p._id" />
            </el-select>
          </el-form-item>
          <el-form-item label="目标语言">
            <el-radio-group v-model="form.language">
              <el-radio-button value="en">English</el-radio-button>
              <el-radio-button value="ja">日本語</el-radio-button>
              <el-radio-button value="es">Español</el-radio-button>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="发布渠道">
            <el-radio-group v-model="form.channel">
              <el-radio-button value="amazon">Amazon</el-radio-button>
              <el-radio-button value="tiktok">TikTok</el-radio-button>
              <el-radio-button value="instagram">Instagram</el-radio-button>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="补充要求"><el-input v-model="form.extra" type="textarea" :rows="3" /></el-form-item>
          <el-button type="primary" :loading="loading" @click="run">生成文案</el-button>
        </el-form>
      </el-card>
    </el-col>
    <el-col :span="15">
      <el-card header="生成结果" v-loading="loading" style="min-height: 320px">
        <el-alert
          v-if="result?.warnings?.length"
          type="warning"
          show-icon
          :closable="false"
          :title="'已遮蔽敏感词：' + result.warnings.join('、')"
          style="margin-bottom: 12px"
        />
        <pre class="out">{{ result?.content || '这里显示生成的文案' }}</pre>
      </el-card>
    </el-col>
  </el-row>
</template>

<style scoped>
.out {
  white-space: pre-wrap;
  word-break: break-word;
  font-family: inherit;
  line-height: 1.7;
  margin: 0;
}
</style>
