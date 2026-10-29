FROM node:25-bookworm-slim AS dependencies
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:25-bookworm-slim AS production-dependencies
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

FROM node:25-bookworm-slim AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .
RUN mkdir -p public && npm run build

FROM node:25-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 \
    PORT=3000

RUN groupadd --system --gid 1001 nodejs \
    && useradd --system --uid 1001 --gid nodejs nextjs \
    && mkdir -p /data \
    && chown nextjs:nodejs /data

COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=production-dependencies /app/node_modules ./node_modules
COPY --chown=nextjs:nodejs package.json ./package.json
COPY --chown=nextjs:nodejs scripts/invitations.mjs ./scripts/invitations.mjs
COPY --chown=nextjs:nodejs src ./src
COPY --chown=nextjs:nodejs data/catalog ./data/catalog
RUN test -s /app/data/catalog/published/catalog.v1.json
RUN node --conditions=react-server --input-type=module -e 'import {readPublishedMatchingCatalog} from "./src/server/matching/catalog-adapter.ts"; if (!readPublishedMatchingCatalog("2026-10-17").programs.length) process.exit(1)'
COPY scripts/docker-entrypoint.sh /usr/local/bin/prototype-entrypoint
RUN chmod 0755 /usr/local/bin/prototype-entrypoint

EXPOSE 3000
ENTRYPOINT ["prototype-entrypoint"]
CMD ["node", "server.js"]
