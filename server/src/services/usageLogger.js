import TokenLog from '../models/TokenLog.js'

/**
 * 记录一次大模型调用的用量与成败。
 * 埋点只是旁路统计，写入失败绝不能影响主业务流程，因此这里吞掉异常。
 */
export async function recordUsage(data) {
  try {
    await TokenLog.create(data)
  } catch (e) {
    console.error('[token-log] 写入失败：', e.message)
  }
}
