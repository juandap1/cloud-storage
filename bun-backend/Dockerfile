FROM oven/bun:debian

WORKDIR /app

COPY . .

EXPOSE 6989

RUN bun install
RUN bun add -g nodemon

# Use nodemon with legacy watch (polling) for Docker on Windows compatibility
CMD ["nodemon", "--legacy-watch", "--ext", "ts,js,json", "--exec", "bun run index.ts"]
