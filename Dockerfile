# 開発用Dockerfile。next dev(Turbopack)をコンテナ内で動かす。
# 本番デプロイ用のマルチステージビルドは、実際にVercel以外へデプロイする段階で別途用意する。
FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]
