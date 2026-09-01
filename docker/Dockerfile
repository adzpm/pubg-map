FROM node:24.20.0-alpine AS build

WORKDIR /app

COPY web/package.json web/package-lock.json ./

RUN npm ci

COPY web/index.html web/vite.config.js ./
COPY web/src ./src

# only the small public files go into the build: the 12k-tile tree must not be
# duplicated into dist by vite; tiles are copied straight into the runtime image
COPY web/public/favicon.svg web/public/robots.txt ./public/

RUN npm run build

FROM nginxinc/nginx-unprivileged:1.31.4-alpine

LABEL org.opencontainers.image.title="pubg-map" \
      org.opencontainers.image.description="Interactive PUBG maps — static Vue 3 + Leaflet SPA served by nginx" \
      org.opencontainers.image.source="https://github.com/adzpm/pubg-map"

COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=build /app/dist /usr/share/nginx/html
COPY web/public/assets/tiles /usr/share/nginx/html/assets/tiles

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget -q -O /dev/null http://127.0.0.1:8080/healthz || exit 1
