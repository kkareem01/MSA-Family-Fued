# Single container: builds the web bundle and serves everything from one Node process.
FROM node:24-slim

WORKDIR /app

# Install with the lockfile first so dependency layers cache between deploys.
COPY package.json package-lock.json ./
COPY packages/shared/package.json packages/shared/
COPY packages/server/package.json packages/server/
COPY packages/web/package.json packages/web/
RUN npm ci --include=dev

COPY . .
RUN npm run build

ENV NODE_ENV=production \
    PORT=3000 \
    DB_PATH=/data/feud.db \
    TRUST_PROXY=true

# Mount a persistent volume at /data so questions, answers and game state survive redeploys.
VOLUME ["/data"]
EXPOSE 3000

CMD ["npm", "start"]
