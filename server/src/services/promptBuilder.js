import { LANGUAGES, CHANNELS } from '../config/channels.js'

// 把「商品卖点 + 目标语言 + 发布渠道」拼装成大模型 messages
export function buildCopyMessages({ product, language, channel, extra = '' }) {
  const lang = LANGUAGES[language]
  const ch = CHANNELS[channel]
  if (!lang) throw Object.assign(new Error('不支持的目标语言'), { status: 400, code: 4001 })
  if (!ch) throw Object.assign(new Error('不支持的发布渠道'), { status: 400, code: 4001 })

  const a = product.aiAnalysis || {}

  const system = `You are a senior cross-border e-commerce copywriter.
Write the final copy ONLY in ${lang}. Do not add any explanation outside the copy.
Hard rules:
- Use only the facts provided. Never invent specifications, certifications, prices or statistics.
- Avoid absolute or exaggerated claims such as "best", "No.1", "100% guaranteed", "miracle", "cure".
- Keep the tone natural for local consumers, not a literal translation.
Channel requirements:
${ch.spec}`

  const user = `Product name: ${product.name}
Category: ${product.category || 'N/A'}
Target audience: ${product.audience || 'General consumers'}
Appearance: ${(a.visual_elements || []).join('; ') || 'N/A'}
Key selling points: ${(a.core_selling_points || []).join('; ') || 'N/A'}
${extra ? 'Extra requirements: ' + extra : ''}
Please write the ${ch.label} copy now.`

  return [
    { role: 'system', content: system },
    { role: 'user', content: user },
  ]
}
