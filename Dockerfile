FROM node:20 AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build && npm run dashboard:build
RUN npm prune --omit=dev

FROM node:20-slim AS runner
WORKDIR /app

ENV NODE_ENV=production \
    DROPZONE_ROOT=/data/dropzone \
    PORT=5173

RUN mkdir -p ${DROPZONE_ROOT}

COPY --from=builder /app /app

EXPOSE 5173
VOLUME ["/data/dropzone"]

CMD ["node", "dist/server.js"]
