FROM node:22 AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
# 'npm run build' (turbo) builds the dashboard SPA + shared packages.
# 'npm run build:server' compiles src/server.ts → dist/server.js via tsc.
RUN npm run build && npm run build:server
RUN npm prune --omit=dev

FROM node:22-slim AS runner
WORKDIR /app

ENV NODE_ENV=production \
    DROPZONE_ROOT=/data/dropzone \
    PORT=5173

RUN mkdir -p ${DROPZONE_ROOT}

COPY --from=builder /app /app

EXPOSE 5173
VOLUME ["/data/dropzone"]

CMD ["node", "dist/server.js"]
