FROM oven/bun:latest

WORKDIR /app

COPY . .

EXPOSE 6989

RUN bun install

CMD ["bun", "index.ts"]
