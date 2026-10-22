FROM node:24-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG VITE_AUTH0_DOMAIN
ARG VITE_AUTH0_CLIENT_ID
ARG VITE_AUTH0_CALLBACK_URL
RUN npm run build

FROM caddy:builder AS caddy-builder
RUN xcaddy build --with github.com/ggicci/caddy-jwt

FROM caddy:alpine
COPY --from=caddy-builder /usr/bin/caddy /usr/bin/caddy
COPY --from=build /app/build/client /var/www/html
COPY config/Caddyfile /etc/caddy/Caddyfile
EXPOSE 80 443 443/udp
