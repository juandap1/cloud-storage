FROM node:lts-alpine AS build-stage

WORKDIR /app

COPY . .

RUN npm install

RUN npx quasar build

FROM nginx:stable-alpine AS production-stage

RUN rm -rf /etc/nginx/conf.d/default.conf

COPY --from=build-stage /app/dist/spa /usr/share/nginx/html

COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 3141

CMD ["nginx", "-g", "daemon off;"]