# 使用 Node.js 作為基礎映像
FROM node:20-alpine

# 設定工作目錄
WORKDIR /app

# 複製專案檔案
COPY . .

RUN npm install

RUN npm run update

RUN npm run init

# 建立應用程式
RUN npm run build

# 暴露連接埠
EXPOSE 3000

# 啟動應用程式
CMD ["npm", "run", "start"]