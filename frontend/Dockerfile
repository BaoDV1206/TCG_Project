# ---------- Cài thư viện ----------
FROM node:22-bookworm-slim AS deps
WORKDIR /src
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

# ---------- Build Next.js ----------
FROM node:22-bookworm-slim AS build
WORKDIR /src
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /src/node_modules ./node_modules
COPY . .
RUN npm run build

# ---------- Chạy (chỉ chứa bản build gọn "standalone") ----------
FROM node:22-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 \
    PORT=3000 \
    TZ=Asia/Ho_Chi_Minh
RUN groupadd --system app && useradd --system --gid app app
COPY --from=build --chown=app:app /src/.next/standalone ./
COPY --from=build --chown=app:app /src/.next/static ./.next/static
COPY --from=build --chown=app:app /src/public ./public
USER app
EXPOSE 3000
CMD ["node", "server.js"]
