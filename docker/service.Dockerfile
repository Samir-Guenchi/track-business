# syntax=docker/dockerfile:1.7
# One image recipe for every service: docker build --build-arg SERVICE=identity -f docker/service.Dockerfile .
ARG NODE_VERSION=24

FROM node:${NODE_VERSION}-alpine AS build
ARG SERVICE
ENV PNPM_HOME=/pnpm PATH=/pnpm:$PATH TURBO_TELEMETRY_DISABLED=1
RUN corepack enable
WORKDIR /repo
COPY . .
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
RUN pnpm turbo run build --filter=@trackecom/${SERVICE}
# Self-contained folder: the service's dist + prisma files and only its production dependencies.
RUN pnpm --filter=@trackecom/${SERVICE} deploy --prod --legacy /out

FROM node:${NODE_VERSION}-alpine AS runtime
ARG SERVICE
ARG RELEASE=dev
ENV NODE_ENV=production RELEASE=${RELEASE}
LABEL org.opencontainers.image.source="https://github.com/Samir-Guenchi/track-business" \
      org.opencontainers.image.title="trackecom-${SERVICE}"
RUN apk add --no-cache tini
WORKDIR /app
COPY --from=build --chown=node:node /out .
USER node
EXPOSE 4000-4010
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget -qO- "http://127.0.0.1:${PORT}/health/live" >/dev/null || exit 1
ENTRYPOINT ["/sbin/tini", "--"]
# Migrations run as a one-off with the same image: `node node_modules/prisma/build/index.js migrate deploy`.
CMD ["node", "dist/main.js"]
