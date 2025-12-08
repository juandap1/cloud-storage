FROM node:22-alpine
WORKDIR /app

COPY . .
RUN npm install


CMD ["npx", "quasar", "dev", "--host", "0.0.0.0"]