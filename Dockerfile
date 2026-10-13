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

FROM node:22-alpine AS admin-builder

WORKDIR /app/admin-floreria/client

ARG VITE_API_URL=/api
ARG VITE_BACKEND_URL=/api
ARG VITE_URL_IMG=
ARG VITE_BASE_PATH=/admin/
ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_BACKEND_URL=${VITE_BACKEND_URL}
ENV VITE_URL_IMG=${VITE_URL_IMG}
ENV VITE_BASE_PATH=${VITE_BASE_PATH}

COPY admin-floreria/client/package*.json ./
RUN npm ci
RUN ln -s /app/admin-floreria/client/node_modules /app/node_modules
COPY admin-floreria/client/ ./
COPY shared/ /app/shared/
RUN npm run build

FROM node:22-alpine AS api-builder

WORKDIR /app/admin-floreria/api
COPY admin-floreria/api/package*.json ./
COPY admin-floreria/api/prisma ./prisma
RUN npm ci --omit=dev && npx prisma generate
COPY admin-floreria/api/src ./src
COPY admin-floreria/api/create-admin.js ./create-admin.js

FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080
ENV EMBEDDED_API=true

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=builder /app/dist ./dist
COPY --from=admin-builder /app/admin-floreria/client/dist ./dist/public/admin
COPY --from=api-builder /app/admin-floreria/api ./admin-floreria/api
COPY script/start-production.cjs ./script/start-production.cjs
RUN mkdir -p admin-floreria/api/logs admin-floreria/api/uploads && chown -R node:node admin-floreria/api/logs admin-floreria/api/uploads

USER node

EXPOSE 8080

CMD ["node", "script/start-production.cjs"]
