// 极端营销词、绝对化用语、医疗功效类词汇（文档基础 + 自行扩充，覆盖中英文）
const BANNED = [
  // —— 文档原有 ——
  /最(好|佳|强|低|高|大|优|先进)/g, /第一/g, /顶级|极致|史上|万能/g, /100%|百分之百/g,
  /根治|治愈|包治|药效|永久/g, /国家级|唯一/g,
  /\b(best in the world|no\.?\s?1|guaranteed|miracle|cure[sd]?|risk[- ]free)\b/gi,
  // —— 自行扩充：中文绝对化 / 虚假承诺 ——
  /销量第[一1]/g, /全网(最低|最高)/g, /绝无仅有|无可比拟|独一无二|举世无双/g,
  /之王|冠军|极品|完美|绝对/g, /免费送|无效退款|假一赔十/g,
  /纯天然无副作用|无任何副作用|零副作用/g, /神(器|药|效)|秘方|祖传/g,
  // —— 自行扩充：中文医疗功效 ——
  /消炎|杀菌|灭菌|抗菌|抑菌/g, /减肥|瘦身|燃脂|降血压|降血糖|降血脂|抗癌/g,
  // —— 自行扩充：英文夸大 / 虚假认证 / 医疗暗示 ——
  /\b(world'?s best|the\s+best|cheapest|#1|perfect|absolutely)\b/gi,
  /\b(instant(ly)?\s+(work|result|effect)s?|lose weight fast|weight[- ]loss (pill|guarantee))\b/gi,
  /\b(fda approved|clinically proven|doctor recommended|medical(ly) (proven|certified))\b/gi,
  /\b(anti[- ]aging|detox|skin whitening|side[- ]effect free|no side effects)\b/gi,
]

export function findViolations(text = '') {
  const hits = new Set()
  for (const re of BANNED) {
    re.lastIndex = 0 // 重置 lastIndex，避免 g 标志复用同一正则时漏检
    const m = text.match(re)
    if (m) m.forEach((w) => hits.add(w))
  }
  return [...hits]
}

export function maskViolations(text = '') {
  return BANNED.reduce((t, re) => t.replace(re, (w) => '*'.repeat(w.length)), text)
}

// 输入拦截：用户自己填写的补充要求里出现违规词，直接拒绝
export function inputGuard(fields = ['extra']) {
  return (req, res, next) => {
    for (const f of fields) {
      const hits = findViolations(req.body?.[f] || '')
      if (hits.length) {
        return res.status(400).json({ code: 4003, message: `补充要求包含敏感或极端营销词：${hits.join('、')}` })
      }
    }
    next()
  }
}
