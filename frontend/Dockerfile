FROM node:lts-alpine AS build-stage

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json first to take advantage of Docker layer caching
# This means npm install only runs if dependencies change, speeding up subsequent builds.
COPY package*.json ./
RUN npm install

# Copy all other source files
COPY . .

# Run the Quasar production build command
# The output will be placed in /app/dist/spa (or similar, depending on your quasar.config.js settings)
RUN quasar build

# ============================================
# STAGE 2: SERVE with Nginx
# This stage uses a tiny Nginx image to serve the built static files securely and efficiently.
# ============================================
# Use a lean Nginx image
FROM nginxinc/nginx-unprivileged:alpine AS production-stage

# Remove the default Nginx index files
RUN rm -rf /usr/share/nginx/html/*

# Copy the built production files from the build-stage artifact
# NOTE: The path '/app/dist/spa' is the default for a Quasar SPA build. 
# If you are using a different mode (like PWA or a custom path), adjust this source path.
COPY --from=build-stage /app/dist/spa /usr/share/nginx/html

# Expose the standard HTTP port for the container. 
# Nginx Proxy Manager (NPM) will connect to this port.
EXPOSE 80

# Command to start Nginx, preventing it from running as a detached daemon
CMD ["nginx", "-g", "daemon off;"]