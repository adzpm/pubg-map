FROM node:20-alpine AS build

WORKDIR /app

COPY web/package.json web/package-lock.json* ./

RUN npm ci || npm install

COPY web/index.html web/vite.config.js ./

COPY web/src ./src

RUN npm run build

FROM nginx:1.27-alpine

COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=build /app/dist /usr/share/nginx/html

COPY web/public/assets/tiles /usr/share/nginx/html/assets/tiles
