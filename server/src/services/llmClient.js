import { recordUsage } from './usageLogger.js'

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
async function rawChatCompletion({ model, messages, temperature = 0.7, purpose: optsPurpose, timeoutMs = 90000 }) {
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
    purpose: optsPurpose,
  }
}

/**
 * 统一出口：所有非流式调用都经过这里自动埋点，
 * 业务代码新增任何 AI 功能都不用再关心统计。
 */
export async function chatCompletion(opts) {
  const started = Date.now()
  try {
    const result = await rawChatCompletion(opts)
    recordUsage({
      purpose: opts.purpose,
      model: result.model,
      ...result.usage,
      success: true,
      latencyMs: Date.now() - started,
    })
    return result
  } catch (e) {
    recordUsage({
      purpose: opts.purpose,
      model: opts.model,
      success: false,
      latencyMs: Date.now() - started,
      errorMessage: e.message,
    })
    throw e
  }
}

/**
 * 流式对话（异步生成器）。逐步 yield：
 *   { type: 'delta', text }     增量文本
 *   { type: 'usage', usage }    结束时的 Token 用量
 * signal 用于用户点“停止生成”时同步中断上游请求，避免白跑额度。
 */
async function* rawStreamChat({ model, messages, temperature = 0.8, signal }) {
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

/**
 * 流式调用的统一出口包装。
 * 用户主动“停止生成”会抛 AbortError，这属于正常操作，不计为失败调用。
 */
export async function* streamChat(opts) {
  const started = Date.now()
  let usage = null
  let ok = true
  let errMsg
  try {
    for await (const ev of rawStreamChat(opts)) {
      if (ev.type === 'usage') usage = ev.usage
      yield ev
    }
  } catch (e) {
    if (e.name !== 'AbortError') {
      ok = false
      errMsg = e.message
    }
    throw e
  } finally {
    recordUsage({
      purpose: opts.purpose,
      model: opts.model,
      promptTokens: usage?.promptTokens ?? 0,
      completionTokens: usage?.completionTokens ?? 0,
      success: ok,
      latencyMs: Date.now() - started,
      errorMessage: errMsg,
    })
  }
}
