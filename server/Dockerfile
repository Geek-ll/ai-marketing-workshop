FROM node:20-alpine
WORKDIR /app

# 先拷贝依赖清单再安装，利用 Docker 层缓存，代码变化时不必重装依赖
COPY package*.json ./
RUN npm ci --omit=dev

COPY src ./src
RUN mkdir -p uploads

ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "src/app.js"]
