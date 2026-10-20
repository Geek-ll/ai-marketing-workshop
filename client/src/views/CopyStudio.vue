<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useProductStore } from '../stores/product'
import { fetchAssets, deleteAsset } from '../api/asset'
import { useCopyStream } from '../utils/useCopyStream'
import MarkdownView from '../components/MarkdownView.vue'

const store = useProductStore()
onMounted(() => store.load())

const form = ref({ productId: '', language: 'en', channel: 'amazon', extra: '' })
// 下拉里只列出已做过 AI 识别的商品（文案依赖卖点）
const ready = computed(() => store.list.filter((p) => p.aiAnalysis?.core_selling_points?.length))

// 流式生成：text / streaming / error / result 由组合式函数统一管理
const { text, streaming, error, result, start, stop } = useCopyStream()

// 历史列表与抽屉标题里显示语言 / 渠道的可读名称（对齐原型）
const LANG_LABEL = { en: 'English', ja: '日本語', es: 'Español' }
const CH_LABEL = { amazon: 'Amazon', tiktok: 'TikTok', instagram: 'Instagram' }

// 生成状态提示：生成中… / 已完成并保存 / 已停止（未保存）
const status = ref('')
let manualStop = false

function run() {
  if (!form.value.productId) return ElMessage.warning('请先选择商品')
  manualStop = false
  status.value = '生成中…'
  start(form.value)
}

function onStop() {
  manualStop = true
  stop()
}

// 历史文案
const assets = ref([])
const viewing = ref(null)

async function loadAssets() {
  assets.value = (await fetchAssets({ type: 'copy' })).data
}

async function copyText(row) {
  // 复制时去掉 Markdown 加粗符号，拿到的就是可直接粘贴的纯文案（对齐原型）
  await navigator.clipboard.writeText(row.content.replace(/\*\*/g, ''))
  ElMessage.success('已复制到剪贴板')
}

async function remove(row) {
  await deleteAsset(row._id)
  ElMessage.success('已删除')
  loadAssets()
}

// 生成完毕（done 事件解析完成）后刷新历史列表
watch(result, (r) => {
  if (r) {
    status.value = '已完成并保存'
    loadAssets()
  }
})

// 流式结束但没有 done 结果：要么手动停止，要么出错
watch(streaming, (s) => {
  if (!s && !result.value && !error.value) status.value = manualStop ? '已停止（未保存）' : ''
})
watch(error, (e) => {
  if (e) status.value = ''
})

onMounted(loadAssets)
</script>

<template>
  <el-row :gutter="20">
    <el-col :span="9">
      <el-card header="生成设置">
        <el-form label-width="80px">
          <el-form-item label="商品">
            <el-select v-model="form.productId" placeholder="选择已识别的商品" style="width: 100%">
              <el-option v-if="!ready.length" value="" label="暂无，请先去资产中心识别" disabled />
              <el-option v-for="p in ready" :key="p._id" :label="p.name" :value="p._id" />
            </el-select>
          </el-form-item>
          <el-form-item label="目标语言">
            <el-radio-group v-model="form.language" :disabled="streaming">
              <el-radio-button value="en">English</el-radio-button>
              <el-radio-button value="ja">日本語</el-radio-button>
              <el-radio-button value="es">Español</el-radio-button>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="发布渠道">
            <el-radio-group v-model="form.channel" :disabled="streaming">
              <el-radio-button value="amazon">Amazon</el-radio-button>
              <el-radio-button value="tiktok">TikTok</el-radio-button>
              <el-radio-button value="instagram">Instagram</el-radio-button>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="补充要求">
            <el-input v-model="form.extra" type="textarea" :rows="3" placeholder="例如：强调适合送礼" />
          </el-form-item>
          <el-button v-if="!streaming" type="primary" @click="run">生成文案</el-button>
          <el-button v-else type="danger" @click="onStop">停止生成</el-button>
        </el-form>
      </el-card>
    </el-col>
    <el-col :span="15">
      <el-card style="min-height: 320px">
        <template #header>
          生成结果
          <el-tag v-if="status" size="small" type="info" style="margin-left: 8px">{{ status }}</el-tag>
        </template>
        <el-alert v-if="error" type="error" show-icon :closable="false" :title="error" style="margin-bottom: 12px" />
        <el-alert
          v-if="result?.warnings?.length"
          type="warning"
          show-icon
          :closable="false"
          :title="'已遮蔽敏感词：' + result.warnings.join('、')"
          style="margin-bottom: 12px"
        />
        <MarkdownView :source="text || '这里实时显示生成的文案'" :streaming="streaming" />
      </el-card>
    </el-col>
  </el-row>

  <el-card header="历史文案" style="margin-top: 20px">
    <el-table :data="assets" empty-text="暂无文案">
      <el-table-column label="商品" min-width="140">
        <template #default="{ row }">{{ row.productId?.name }}</template>
      </el-table-column>
      <el-table-column prop="language" label="语言" width="90">
        <template #default="{ row }">{{ LANG_LABEL[row.language] || row.language }}</template>
      </el-table-column>
      <el-table-column prop="channel" label="渠道" width="110">
        <template #default="{ row }">{{ CH_LABEL[row.channel] || row.channel }}</template>
      </el-table-column>
      <el-table-column label="生成时间" width="170">
        <template #default="{ row }">{{ new Date(row.createdAt).toLocaleString() }}</template>
      </el-table-column>
      <el-table-column label="操作" width="200">
        <template #default="{ row }">
          <el-button link type="primary" @click="viewing = row">查看</el-button>
          <el-button link type="primary" @click="copyText(row)">复制</el-button>
          <el-popconfirm title="确定删除？" @confirm="remove(row)">
            <template #reference><el-button link type="danger">删除</el-button></template>
          </el-popconfirm>
        </template>
      </el-table-column>
    </el-table>
  </el-card>

  <el-drawer
    :model-value="!!viewing"
    :title="viewing ? `${viewing.productId?.name || ''} · ${LANG_LABEL[viewing.language] || viewing.language} · ${CH_LABEL[viewing.channel] || viewing.channel}` : '文案详情'"
    size="45%"
    @close="viewing = null"
  >
    <MarkdownView :source="viewing?.content" />
  </el-drawer>
</template>
