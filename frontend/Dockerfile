   FROM node:lts-alpine AS build-stage

   WORKDIR /app

   COPY . .

   RUN npm install

   RUN npx quasar build

   FROM nginx:stable-alpine AS production-stage

   COPY --from=build-stage /app/dist/spa /usr/share/nginx/html

   EXPOSE 80

   CMD ["nginx", "-g", "daemon off;"]