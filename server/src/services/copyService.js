import { chatCompletion } from './llmClient.js'
import { buildCopyMessages } from './promptBuilder.js'
import { findViolations, maskViolations } from '../middlewares/compliance.js'

export async function generateCopy({ product, language, channel, extra }) {
  const messages = buildCopyMessages({ product, language, channel, extra })

  const { content, usage } = await chatCompletion({
    model: process.env.TEXT_MODEL || 'qwen-plus',
    messages,
    temperature: 0.8,
    purpose: 'copy',
  })

  const warnings = findViolations(content) // 输出层检测
  return { content: maskViolations(content), warnings, usage }
}
