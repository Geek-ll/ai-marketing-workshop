<script setup>
import { computed } from 'vue'
import { marked } from 'marked'
import DOMPurify from 'dompurify'

// streaming 为 true 时给容器加 typing 类，靠 CSS 伪元素实现闪烁光标
const props = defineProps({ source: String, streaming: Boolean })

// 模型输出可能夹带脚本，必须用 DOMPurify 净化后再 v-html
const html = computed(() => DOMPurify.sanitize(marked.parse(props.source || '')))
</script>

<template>
  <div class="md" :class="{ typing: streaming }" v-html="html"></div>
</template>

<style>
.md {
  line-height: 1.75;
  word-break: break-word;
}
.md table {
  border-collapse: collapse;
  margin: 8px 0;
}
.md th,
.md td {
  border: 1px solid #dcdfe6;
  padding: 6px 10px;
}
.md th {
  background: #f5f7fa;
}
.md.typing > :last-child::after {
  /* 光标闪烁效果 */
  content: '▍';
  margin-left: 2px;
  color: #409eff;
  animation: blink 1s steps(2) infinite;
}
@keyframes blink {
  50% {
    opacity: 0;
  }
}
</style>
