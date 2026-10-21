<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { ElMessage } from 'element-plus'
import { useProductStore } from '../stores/product'
import { generateImage, getImageTask } from '../api/image'
import { fetchAssets } from '../api/asset'

// active 由 App.vue 传入：切走标签时停止轮询，切回来且任务未结束时继续
const props = defineProps({ active: { type: Boolean, default: true } })
const base = import.meta.env.VITE_API_BASE ?? ''
const store = useProductStore()
const productId = ref('')
const sceneIndex = ref(0)
const generating = ref(false)
const current = ref(null) // { prompt, scene, imageUrl }
const gallery = ref([])
const currentAssetId = ref('')

// 只有带场景建议的商品才能生图
const ready = computed(() => store.list.filter((p) => p.aiAnalysis?.scene_suggestions?.length))
const product = computed(() => store.list.find((p) => p._id === productId.value))

let timer = null
let tries = 0
let busy = false // 防止上一次请求没回来又发下一次

function stopPolling() {
  clearInterval(timer)
  timer = null
  busy = false
}

function startPolling(assetId) {
  // 已经切走标签就不再起轮询，切回来时由 active 的 watch 恢复
  if (!props.active) return
  stopPolling()
  tries = 0
  timer = setInterval(async () => {
    if (busy) return
    busy = true
    tries++
    try {
      const { data } = await getImageTask(assetId)
      if (data.status === 'done') {
        stopPolling()
        generating.value = false
        current.value.imageUrl = base + data.imageUrl
        ElMessage.success('场景图生成完成')
        loadGallery()
      } else if (data.status === 'failed') {
        stopPolling()
        generating.value = false
        ElMessage.error(data.message || '生成失败')
      } else if (tries >= 40) {
        // 3 秒 × 40 = 2 分钟
        stopPolling()
        generating.value = false
        ElMessage.warning('等待超时，请稍后在“已生成场景图”中查看')
      }
    } catch (e) {
      stopPolling()
      generating.value = false
      ElMessage.error(e.message)
    } finally {
      busy = false
    }
  }, 3000)
}

async function run() {
  if (!productId.value) return ElMessage.warning('请先选择商品')
  generating.value = true
  current.value = null
  try {
    const { data } = await generateImage({ productId: productId.value, sceneIndex: sceneIndex.value })
    current.value = { prompt: data.prompt, scene: data.scene, imageUrl: '' }
    currentAssetId.value = data.assetId
    startPolling(data.assetId)
  } catch (e) {
    generating.value = false
    ElMessage.error(e.message)
  }
}

async function loadGallery() {
  const list = (await fetchAssets({ type: 'image' })).data
  gallery.value = list.filter((a) => a.status === 'done')
}

onMounted(() => {
  store.load()
  loadGallery()
})
// 切走标签停止轮询，避免后台一直打后端；切回来时若任务未结束则继续
watch(
  () => props.active,
  (v) => {
    if (!v) stopPolling()
    else if (generating.value && currentAssetId.value) startPolling(currentAssetId.value)
  }
)
// 离开页面必须清除定时器，否则还会不停请求后端
onBeforeUnmount(stopPolling)
</script>

<template>
  <el-row :gutter="20">
    <el-col :span="9">
      <el-card header="场景图设置">
        <el-form label-width="80px">
          <el-form-item label="商品">
            <el-select
              v-model="productId"
              placeholder="选择已识别的商品"
              style="width: 100%"
              @change="sceneIndex = 0"
            >
              <el-option v-if="!ready.length" value="" label="暂无，请先去资产中心识别" disabled />
              <el-option v-for="p in ready" :key="p._id" :label="p.name" :value="p._id" />
            </el-select>
          </el-form-item>
          <el-form-item label="场景" v-if="product">
            <el-radio-group v-model="sceneIndex" style="display: flex; flex-direction: column; align-items: flex-start">
              <el-radio v-for="(s, i) in product.aiAnalysis.scene_suggestions" :key="i" :value="i">{{ s }}</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-button type="primary" :loading="generating" @click="run">生成场景主图</el-button>
        </el-form>
      </el-card>
    </el-col>
    <el-col :span="15">
      <el-card header="生成结果">
        <el-skeleton v-if="generating" animated>
          <template #template>
            <el-skeleton-item variant="image" style="width: 100%; height: 360px" />
            <el-skeleton-item variant="text" style="margin-top: 12px; width: 60%" />
          </template>
        </el-skeleton>
        <template v-else-if="current?.imageUrl">
          <el-image
            :src="current.imageUrl"
            :preview-src-list="[current.imageUrl]"
            fit="contain"
            style="width: 100%; max-height: 480px"
          />
        </template>
        <el-empty v-else description="选择商品与场景后点击生成" />
        <el-collapse v-if="current?.prompt" style="margin-top: 12px">
          <el-collapse-item title="查看 AI 扩写的英文提示词">
            <p style="margin: 0; line-height: 1.7">{{ current.prompt }}</p>
          </el-collapse-item>
        </el-collapse>
      </el-card>
    </el-col>
  </el-row>

  <el-card header="已生成场景图" style="margin-top: 20px">
    <el-empty v-if="!gallery.length" description="暂无" />
    <el-space wrap>
      <el-image
        v-for="g in gallery"
        :key="g._id"
        :src="base + g.imageUrl"
        :preview-src-list="gallery.map((x) => base + x.imageUrl)"
        fit="cover"
        style="width: 160px; height: 160px; border-radius: 6px"
      />
    </el-space>
  </el-card>
</template>
