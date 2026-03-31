# Server Dockerfile
FROM node:20-alpine AS base
WORKDIR /usr/src/app

COPY package.json package-lock.json* ./
RUN npm install --production

COPY . .

ENV NODE_ENV=production
EXPOSE 5000
CMD ["node", "server.js"]
