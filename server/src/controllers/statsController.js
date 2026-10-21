import TokenLog from '../models/TokenLog.js'

const DAY = 24 * 3600 * 1000
const fmt = (d) => d.toLocaleDateString('sv-SE', { timeZone: 'Asia/Shanghai' }) // 输出 YYYY-MM-DD

export async function overview(req, res, next) {
  try {
    const days = Math.min(parseInt(req.query.days) || 7, 30)
    const today = new Date(fmt(new Date()) + 'T00:00:00+08:00')
    const since = new Date(today.getTime() - (days - 1) * DAY)
    const labels = Array.from({ length: days }, (_, i) => fmt(new Date(since.getTime() + i * DAY)))
    const match = { $match: { createdAt: { $gte: since } } }

    const [daily, outcome, byPurpose, demoCount] = await Promise.all([
      TokenLog.aggregate([
        match,
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: 'Asia/Shanghai' } },
            promptTokens: { $sum: '$promptTokens' },
            completionTokens: { $sum: '$completionTokens' },
            calls: { $sum: 1 },
          },
        },
      ]),
      TokenLog.aggregate([match, { $group: { _id: '$success', count: { $sum: 1 } } }]),
      TokenLog.aggregate([
        match,
        {
          $group: {
            _id: '$purpose',
            calls: { $sum: 1 },
            tokens: { $sum: { $add: ['$promptTokens', '$completionTokens'] } },
          },
        },
      ]),
      TokenLog.countDocuments({ createdAt: { $gte: since }, demo: true }),
    ])

    // 没有数据的日期补 0，折线图才不会断
    const map = Object.fromEntries(daily.map((d) => [d._id, d]))
    const series = labels.map((date) => ({
      date,
      promptTokens: map[date]?.promptTokens ?? 0,
      completionTokens: map[date]?.completionTokens ?? 0,
      calls: map[date]?.calls ?? 0,
    }))

    const success = outcome.find((o) => o._id === true)?.count ?? 0
    const failed = outcome.find((o) => o._id === false)?.count ?? 0
    const totalTokens = series.reduce((s, d) => s + d.promptTokens + d.completionTokens, 0)

    res.json({
      code: 0,
      message: 'ok',
      data: {
        series,
        success,
        failed,
        byPurpose,
        totalTokens,
        totalCalls: success + failed,
        successRate: success + failed ? +((success / (success + failed)) * 100).toFixed(1) : 0,
        hasDemo: demoCount > 0,
      },
    })
  } catch (e) {
    next(e)
  }
}
