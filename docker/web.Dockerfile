# syntax=docker/dockerfile:1.7
# Seller web app image: docker build -f docker/web.Dockerfile --build-arg NEXT_PUBLIC_API_URL=https://api.example.dz .
ARG NODE_VERSION=24

FROM node:${NODE_VERSION}-alpine AS build
# Public values are inlined into the browser bundle at build time, never secrets.
ARG NEXT_PUBLIC_API_URL=http://localhost:4000
ENV PNPM_HOME=/pnpm PATH=/pnpm:$PATH TURBO_TELEMETRY_DISABLED=1 NEXT_TELEMETRY_DISABLED=1 \
    NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
RUN corepack enable
WORKDIR /repo
COPY . .
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
RUN pnpm turbo run build --filter=@trackecom/web
# Self-contained folder: .next, public and only production dependencies.
RUN pnpm --filter=@trackecom/web deploy --prod --legacy /out

FROM node:${NODE_VERSION}-alpine AS runtime
ARG RELEASE=dev
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 RELEASE=${RELEASE}
LABEL org.opencontainers.image.source="https://github.com/Samir-Guenchi/track-business" \
      org.opencontainers.image.title="trackecom-web"
RUN apk add --no-cache tini
WORKDIR /app
COPY --from=build --chown=node:node /out .
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget -qO- "http://127.0.0.1:${PORT}/" >/dev/null || exit 1
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "node_modules/next/dist/bin/next", "start", "--port", "3000"]
