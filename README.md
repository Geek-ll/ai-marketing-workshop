# AI 出海营销工坊（ai-marketing-workshop）

上传商品图 → AI 识别卖点 → 多语言多渠道文案（SSE 流式）→ AI 场景主图 → ZIP 营销包 → Token 审计看板。

## 技术栈

| 层 | 技术 |
|---|---|
| 前端 | Vue 3、Vite、Element Plus、Pinia、ECharts |
| 后端 | Node.js 20、Express、Mongoose、Multer |
| 数据库 | MongoDB |
| AI | 通义千问 Qwen-VL / Qwen-Plus、通义万相（阿里云百炼） |
| 部署 | Docker、Docker Compose、Nginx |

## 目录结构

```
ai-marketing-workshop/
├─ client/                  # 前端 Vue 3
│  └─ src/{api,components,views,stores}
├─ server/                  # 后端 Express
│  ├─ src/{config,routes,controllers,services,models,middlewares}
│  └─ uploads/              # 上传与生成的图片（不进 Git）
├─ .gitignore
└─ README.md
```

## 本地开发

1. 启动 MongoDB（本机服务或 `docker run -d --name mongo -p 27017:27017 -v mongo-data:/data/db mongo:7`）
2. 后端：`cd server && npm install && npm run dev`（默认 http://localhost:3000）
3. 前端：`cd client && npm install && npm run dev`（默认 http://localhost:5173）
4. 复制 `server/.env.example` 为 `server/.env`，按需填入 `DASHSCOPE_API_KEY`

## 接口约定

统一响应格式 `{ code, message, data }`，`code = 0` 表示成功。健康检查：`GET /api/health`。
