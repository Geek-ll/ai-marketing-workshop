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
