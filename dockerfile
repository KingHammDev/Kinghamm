# 使用 Node.js 作為基礎映像
FROM node:20-alpine

# 設定工作目錄
WORKDIR /app

# 複製 package.json 和 package-lock.json
COPY package*.json ./

# 安裝依賴
RUN npm ci

# 複製專案檔案
COPY . .

# 建立 Prisma 客戶端
RUN npx prisma generate

# 建立應用程式
RUN npm run build

# 暴露連接埠
EXPOSE 3000

# 啟動應用程式
CMD ["npm", "start"]