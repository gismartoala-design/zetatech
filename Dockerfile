FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY client ./client
COPY server ./server
COPY shared ./shared
COPY script ./script
COPY components.json ./components.json
COPY postcss.config.js ./postcss.config.js
COPY tsconfig.json ./tsconfig.json
COPY vite.config.ts ./vite.config.ts
COPY vite-plugin-meta-images.ts ./vite-plugin-meta-images.ts

RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=builder /app/dist ./dist

USER node

EXPOSE 8080

CMD ["node", "dist/index.cjs"]
