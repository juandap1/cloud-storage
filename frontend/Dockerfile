   # Stage 1: Build the Quasar application
   FROM node:lts-alpine AS build-stage

   WORKDIR /app

   COPY package*.json ./
   RUN npm install

   COPY . .
   RUN quasar build

   # Stage 2: Serve the static assets with Nginx
   FROM nginx:stable-alpine AS production-stage

   COPY --from=build-stage /app/dist/spa /usr/share/nginx/html

   EXPOSE 80

   CMD ["nginx", "-g", "daemon off;"]