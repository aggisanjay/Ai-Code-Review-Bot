FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat curl

FROM base AS dependencies
WORKDIR /app
COPY package*.json ./
COPY apps/api/package*.json ./apps/api/
COPY apps/worker/package*.json ./apps/worker/
COPY apps/web/package*.json ./apps/web/
COPY packages/ai-review/package*.json ./packages/ai-review/
COPY packages/database/package*.json ./packages/database/
COPY packages/github-client/package*.json ./packages/github-client/
COPY packages/shared/package*.json ./packages/shared/

RUN npm install

FROM base AS builder
WORKDIR /app
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=dependencies /app/package.json ./package.json
COPY packages ./packages
COPY apps/web ./apps/web
COPY tsconfig.json ./

ARG NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm --workspace=@reviewflow/web run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/web ./apps/web

EXPOSE 3000

HEALTHCHECK --interval=15s --timeout=5s --retries=3 \
  CMD curl -f http://localhost:3000 || exit 1

CMD ["npm", "--workspace=@reviewflow/web", "run", "start"]
