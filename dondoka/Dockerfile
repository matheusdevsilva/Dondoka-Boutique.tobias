FROM node:22-bookworm-slim AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ARG VITE_API_URL=/api
ARG VITE_WHATSAPP=5511949316452
ARG VITE_INSTAGRAM=https://www.instagram.com/dondokaboutique.tobias/

ENV VITE_API_URL=$VITE_API_URL
ENV VITE_WHATSAPP=$VITE_WHATSAPP
ENV VITE_INSTAGRAM=$VITE_INSTAGRAM

RUN npm run build

FROM nginx:1.29-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
