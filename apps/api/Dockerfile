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

FROM base AS runner
WORKDIR /app
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=dependencies /app/package.json ./package.json
COPY packages ./packages
COPY apps/api ./apps/api
COPY tsconfig.json ./

# Generate Prisma client
RUN cd packages/database && npx prisma generate

EXPOSE 4000

ENV PORT=4000
ENV NODE_ENV=production

HEALTHCHECK --interval=10s --timeout=5s --retries=3 \
  CMD curl -f http://localhost:4000/api/v1/health || exit 1

CMD ["npm", "--workspace=@reviewflow/api", "run", "start"]
