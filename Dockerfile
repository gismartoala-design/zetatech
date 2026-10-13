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

FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=builder /app/dist ./dist
COPY --from=admin-builder /app/admin-floreria/client/dist ./dist/public/admin

USER node

EXPOSE 8080

CMD ["node", "dist/index.cjs"]
