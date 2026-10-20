import fs from 'fs'
import path from 'path'
import { UPLOAD_DIR } from '../middlewares/upload.js'
import { chatCompletion } from './llmClient.js'

const MIME = { '.jpg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' }

export const VISION_SYSTEM_PROMPT = `你是一名资深跨境电商商品分析专家。请观察用户提供的商品图片，输出商品分析结果。
【输出规则】
1. 只输出一个合法的 JSON 对象，不要输出任何解释文字，不要使用 Markdown 代码块；
2. JSON 必须且只能包含以下三个字段，字段值均为字符串数组：
   - "visual_elements"：商品外观特征（颜色、材质、形状、风格、包装等），3 到 6 条；
   - "core_selling_points"：面向海外消费者的核心卖点（功能与利益点），3 到 5 条；
   - "scene_suggestions"：适合展示该商品的海外生活场景，3 条；每条需包含具体的时间、地点与画面细节（光线、环境物件），便于后续直接用于生图；
3. 每条内容不超过 30 个汉字；
4. 只描述图片中能看到或能合理推断的内容，禁止编造具体参数、认证、销量、价格；
5. 如果图片无法识别为商品，三个字段都返回空数组。
【输出示例】
{"visual_elements":["哑光黑色外壳","圆角矩形"],"core_selling_points":["便携轻巧","简约百搭"],"scene_suggestions":["清晨的咖啡馆窗边，阳光洒在木桌上"]}`

// 把本地图片转成 data URL（只取文件名，防止路径穿越）
function toDataUrl(relPath) {
  const file = path.join(UPLOAD_DIR, path.basename(relPath))
  const mime = MIME[path.extname(file).toLowerCase()] || 'image/png'
  return `data:${mime};base64,${fs.readFileSync(file).toString('base64')}`
}

// 容错解析：去掉 ```json 围栏，截取第一个 { 到最后一个 }
export function extractJson(text) {
  const cleaned = String(text).replace(/```json|```/gi, '').trim()
  const start = cleaned.indexOf('{')
  const end = cleaned.lastIndexOf('}')
  if (start < 0 || end < start) throw new Error('模型输出中没有 JSON')
  return JSON.parse(cleaned.slice(start, end + 1))
}

const toArr = (v) => (Array.isArray(v) ? v.map(String).filter(Boolean) : [])

export async function analyzeProduct(product) {
  // 识图按图片大小计费，只取前 3 张
  const imgs = product.images.slice(0, 3).map((p) => ({
    type: 'image_url',
    image_url: { url: toDataUrl(p) },
  }))
  const userText = `商品名称：${product.name}；品类：${product.category || '未填写'}；目标受众：${
    product.audience || '未填写'
  }。请分析这件商品。`

  for (let attempt = 1; attempt <= 2; attempt++) {
    // 解析失败最多重试 1 次
    const { content, usage } = await chatCompletion({
      model: process.env.VISION_MODEL || 'qwen-vl-max',
      messages: [
        { role: 'system', content: VISION_SYSTEM_PROMPT },
        { role: 'user', content: [...imgs, { type: 'text', text: userText }] },
      ],
      temperature: 0.2, // 结构化输出用低温度
      purpose: 'vision',
    })
    console.log(`[vision] 第 ${attempt} 次原始输出：`, content.slice(0, 200), usage)
    try {
      const json = extractJson(content)
      return {
        visual_elements: toArr(json.visual_elements),
        core_selling_points: toArr(json.core_selling_points),
        scene_suggestions: toArr(json.scene_suggestions),
      }
    } catch (e) {
      if (attempt === 2) {
        const err = new Error('大模型返回格式异常，请重试')
        err.status = 502
        err.code = 5002
        throw err
      }
    }
  }
}
