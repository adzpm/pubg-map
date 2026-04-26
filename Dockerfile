FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY index.html app.js style.css /usr/share/nginx/html/
COPY assets/tiles /usr/share/nginx/html/assets/tiles
