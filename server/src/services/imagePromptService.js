import { chatCompletion } from './llmClient.js'

const CJK = /[\u4e00-\u9fa5]/

const SYSTEM = `You are a professional e-commerce photography art director and an AI image prompt engineer.
Turn the product information and scene idea into ONE English prompt for a text-to-image model.
Rules:
1. Output ONLY the prompt text. No quotes, no explanation, 60-110 words.
2. Cover these elements in order: subject (the product as the clear hero), scene and environment,
lighting (e.g. soft golden-hour sunlight, rim light), composition (e.g. rule of thirds, shallow depth of field,
45-degree angle), camera and lens (e.g. 85mm, f/1.8), style and quality
(commercial product photography, photorealistic, high detail).
3. Place the scene in an overseas lifestyle context that fits the target audience.
4. Keep the product's real colors and shape according to the appearance description.
5. Do NOT include any text, logo, watermark, or close-up human faces.
6. Write everything in English: translate the Chinese product name and the Chinese scene idea into
natural English. The prompt must contain no Chinese characters.`

/**
 * 把中文场景建议扩写成一条专业的英文生图提示词。
 * 生图按张计费且较慢，提示词质量直接决定出图效果，因此这里用 LLM 兜住光影/构图/镜头要素。
 */
export async function expandImagePrompt({ product, scene }) {
  const a = product.aiAnalysis || {}
  const user = `Product: ${product.name}
Category: ${product.category || 'N/A'}
Target audience: ${product.audience || 'General consumers'}
Appearance: ${(a.visual_elements || []).join('; ')}
Selling points: ${(a.core_selling_points || []).join('; ')}
Scene idea (Chinese): ${scene}`

  const { content } = await chatCompletion({
    model: process.env.TEXT_MODEL || 'qwen-plus',
    messages: [
      { role: 'system', content: SYSTEM },
      { role: 'user', content: user },
    ],
    temperature: 0.7,
    purpose: 'prompt',
  })

  let prompt = content.trim().replace(/^["']|["']$/g, '')
  // 模型偶尔会把中文商品名原样带进提示词，这里再翻一次，保证输出 100% 英文
  if (CJK.test(prompt)) {
    const { content: fixed } = await chatCompletion({
      model: process.env.TEXT_MODEL || 'qwen-plus',
      messages: [
        {
          role: 'system',
          content:
            'Translate the following e-commerce image prompt into English. Keep every visual detail, use natural phrasing for a text-to-image model, and output ONLY the English prompt with no Chinese characters and no explanation.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.3,
      purpose: 'prompt-fix',
    })
    prompt = fixed.trim().replace(/^["']|["']$/g, '')
  }

  console.log('[image-prompt] 场景：', scene)
  console.log('[image-prompt] 扩写后的提示词：', prompt)
  return prompt
}
