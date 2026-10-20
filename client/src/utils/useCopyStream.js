import { ref } from 'vue'

const BASE = import.meta.env.VITE_API_BASE ?? ''

/**
 * 用 fetch + ReadableStream 读取 POST 的 SSE 流式响应。
 * EventSource 只支持 GET、带不了 JSON 请求体，所以这里必须用 fetch。
 */
export function useCopyStream() {
  const text = ref('')
  const streaming = ref(false)
  const error = ref('')
  const result = ref(null) // done 事件携带的数据：assetId、warnings
  let controller = null

  // 解析一条 SSE 消息（以空行分隔的一个块）
  function handleBlock(block) {
    let event = 'message'
    let data = ''
    for (const line of block.split('\n')) {
      if (line.startsWith('event:')) event = line.slice(6).trim()
      else if (line.startsWith('data:')) data += line.slice(5).trim()
    }
    if (!data) return
    const json = JSON.parse(data)
    if (event === 'delta') text.value += json.text
    else if (event === 'done') {
      text.value = json.content
      result.value = json
    } else if (event === 'error') error.value = json.message
  }

  async function start(body) {
    text.value = ''
    error.value = ''
    result.value = null
    streaming.value = true
    controller = new AbortController()
    try {
      const res = await fetch(`${BASE}/api/copy/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      })
      if (!res.ok) {
        // 校验失败时后端返回的是普通 JSON，而不是 SSE
        const j = await res.json().catch(() => ({}))
        throw new Error(j.message || `请求失败（${res.status}）`)
      }
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buf = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buf += decoder.decode(value, { stream: true })
        const blocks = buf.split('\n\n')
        buf = blocks.pop() // 末尾不完整的块留到下一轮
        blocks.forEach(handleBlock)
      }
    } catch (e) {
      // 用户主动点“停止生成”属于正常中断，不当成错误提示
      if (e.name !== 'AbortError') error.value = e.message
    } finally {
      streaming.value = false
      controller = null
    }
  }

  const stop = () => controller?.abort()

  return { text, streaming, error, result, start, stop }
}
