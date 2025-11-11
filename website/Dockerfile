# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Accept build arguments
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

# Copy package files
COPY package*.json ./

# Install dependencies (including dev dependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine

# Install envsubst for environment variable substitution
RUN apk add --no-cache gettext

# Copy nginx configuration template
COPY nginx.conf /etc/nginx/nginx.conf.template

# Copy built application from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Set default port
ENV PORT=8764

# Substitute environment variables and start nginx
CMD ["/bin/sh", "-c", "envsubst '${PORT}' < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf && nginx -g 'daemon off;'"]