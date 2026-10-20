const BASE = process.env.LLM_BASE_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1'

export class LLMError extends Error {
  constructor(message, status = 502) {
    super(message)
    this.status = status
    this.code = 5002
  }
}

/**
 * 非流式对话。返回 { content, usage, model }
 * purpose 用于标记调用用途（vision / copy / prompt），作业 8 用来做统计
 */
export async function chatCompletion({
  model,
  messages,
  temperature = 0.7,
  purpose = 'chat',
  timeoutMs = 90000,
}) {
  const key = process.env.DASHSCOPE_API_KEY
  // 错误信息里只说明“未配置”，绝不拼接 Key 本身
  if (!key) throw new LLMError('服务器未配置 DASHSCOPE_API_KEY', 500)

  const res = await fetch(`${BASE}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({ model, messages, temperature }),
    signal: AbortSignal.timeout(timeoutMs),
  }).catch((e) => {
    throw new LLMError('大模型请求失败：' + e.message)
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    // 只透出上游的 error.message，不打印请求头，避免泄露 Key
    throw new LLMError(`大模型返回 ${res.status}：${data.error?.message || '未知错误'}`)
  }

  return {
    content: data.choices?.[0]?.message?.content ?? '',
    usage: {
      promptTokens: data.usage?.prompt_tokens ?? 0,
      completionTokens: data.usage?.completion_tokens ?? 0,
    },
    model: data.model || model,
    purpose,
  }
}

/**
 * 流式对话（异步生成器）。逐步 yield：
 *   { type: 'delta', text }     增量文本
 *   { type: 'usage', usage }    结束时的 Token 用量
 * signal 用于用户点“停止生成”时同步中断上游请求，避免白跑额度。
 */
export async function* streamChat({ model, messages, temperature = 0.8, purpose = 'chat', signal }) {
  const key = process.env.DASHSCOPE_API_KEY
  if (!key) throw new LLMError('服务器未配置 DASHSCOPE_API_KEY', 500)

  const res = await fetch(`${BASE}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      stream: true,
      stream_options: { include_usage: true }, // 让最后一个数据块带上 usage
    }),
    signal,
  }).catch((e) => {
    throw new LLMError('大模型请求失败：' + e.message)
  })

  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new LLMError(`大模型返回 ${res.status}：${data.error?.message || '未知错误'}`)
  }

  const decoder = new TextDecoder()
  let buf = ''
  for await (const chunk of res.body) {
    buf += decoder.decode(chunk, { stream: true })
    const lines = buf.split('\n')
    buf = lines.pop() // 最后一行可能不完整，留到下一轮
    for (const line of lines) {
      const t = line.trim()
      if (!t.startsWith('data:')) continue
      const payload = t.slice(5).trim()
      if (payload === '[DONE]') return
      let json
      try {
        json = JSON.parse(payload)
      } catch {
        continue
      }
      const text = json.choices?.[0]?.delta?.content
      if (text) yield { type: 'delta', text }
      if (json.usage) {
        yield {
          type: 'usage',
          usage: {
            promptTokens: json.usage.prompt_tokens ?? 0,
            completionTokens: json.usage.completion_tokens ?? 0,
          },
        }
      }
    }
  }
}
