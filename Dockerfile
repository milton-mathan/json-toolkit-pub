# Production Dockerfile for JSON Toolkit
# Multi-stage build: Build stage + Production stage

# Stage 1: Build stage
FROM node:22-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (including dev dependencies for build)
RUN npm ci --only=production=false --legacy-peer-deps

# Copy source code
COPY . .

# Build the application for production (skip TypeScript checks for Docker build)
RUN npm run build:prod --legacy-peer-deps

# Stage 2: Production stage
FROM nginx:alpine AS production

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx configuration
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

# Create non-root user for security
#RUN addgroup -g 1001 -S nginx && \
 #   adduser -S nginx -u 1001 -G nginx

# Setup nginx directories for root user operation (simpler approach)
RUN chown -R nginx:nginx /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:80 || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]