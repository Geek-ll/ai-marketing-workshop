// 渠道与语言配置：新增渠道只需在此追加，无需改动模板引擎
export const LANGUAGES = {
  en: 'English (US)',
  ja: '日本語（です・ます調）',
  es: 'Español (Latinoamérica)',
}

export const CHANNELS = {
  amazon: {
    label: 'Amazon 商品详情页',
    spec: `Write an Amazon listing in Markdown with these sections:
**Title** (max 150 characters, put the main keyword and the top benefit first)
**Bullet Points** (exactly 5 bullets; each starts with a short benefit phrase in CAPITAL LETTERS, max 200 characters)
**Description** (80-120 words, clear and trustworthy tone)
**Search Keywords** (5-8 keywords, comma separated)`,
  },
  tiktok: {
    label: 'TikTok 短视频脚本',
    spec: `Write a 15-30 second TikTok video script as a Markdown table with columns:
| Time | Visual | Voice-over | On-screen text |
Rules: the first 3 seconds must be a strong hook; keep voice-over short and conversational;
end with a clear call to action; finish with 3 trending hashtags.`,
  },
  instagram: {
    label: 'Instagram 帖子配文',
    spec: `Write an Instagram caption: 60-100 words, warm lifestyle tone, use 3-5 fitting emojis,
include one question to drive comments and one call to action.
Put 10-15 relevant hashtags on a new line at the end.`,
  },
}
