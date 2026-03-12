# build stage
FROM node:lts-alpine AS node-builder

ARG VITE_AUTH0_CLIENT_ID
ARG VITE_AUTH0_DOMAIN

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 1: Build Caddy with the JWT plugin
FROM caddy:builder AS caddy-builder
RUN xcaddy build --with github.com/ggicci/caddy-jwt

# Stage 2: Serve using the official base image
FROM caddy:alpine
COPY --from=cadedy-builder /usr/bin/caddy /usr/bin/caddy

# Stage 3: Production image
FROM caddy:alpine AS production-stage
COPY --from=caddy-builder /usr/bin/caddy /usr/bin/caddy

COPY --from=node-builder /app/dist /var/www/html

EXPOSE 80
EXPOSE 443
EXPOSE 443/udp
