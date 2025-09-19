# 🐳 Docker Setup Guide for JSON Toolkit

A comprehensive guide to run JSON Toolkit using Docker in both development and production environments.

## 📋 Prerequisites

- **Docker Desktop** installed and running
- **Git** (for cloning the repository)
- **4GB RAM** available for Docker containers
- **Ports 3000 & 8080** available on your machine

## 🚀 Quick Start

### Option 1: Development Environment (Recommended for Development)
```bash
# Clone the repository
git clone https://github.com/your-username/json-toolkit.git
cd json-toolkit

# Start development environment with hot reload
npm run docker:dev

# Access the application
open http://localhost:3000
```

### Option 2: Production Environment (Optimized Build)
```bash
# Clone the repository  
git clone https://github.com/your-username/json-toolkit.git
cd json-toolkit

# Start production environment
npm run docker:prod

# Access the application
open http://localhost:8080
```

## 🛠️ Detailed Setup Instructions

### Development Environment

**Features:**
- ✅ Hot reload - changes reflect immediately
- ✅ Debug mode with source maps
- ✅ Development tools enabled
- ✅ Volume mounting for live code editing

**Commands:**
```bash
# Start development server (foreground)
npm run docker:dev

# Start development server (background)
npm run docker:dev:detached

# Force rebuild and start
npm run docker:dev:build

# View logs (if running detached)
docker-compose logs -f json-toolkit-dev

# Stop the development environment
docker-compose down
```

**Access Points:**
- **Application**: http://localhost:3000
- **Hot Reload**: Enabled - edit files in `src/` to see changes
- **Container Name**: `json-toolkit-dev`

### Production Environment

**Features:**
- ✅ Nginx web server for optimized delivery
- ✅ Compressed and minified assets
- ✅ Production security headers
- ✅ Health checks and monitoring
- ✅ Small image size (~50MB)

**Commands:**
```bash
# Start production server (foreground)
npm run docker:prod

# Start production server (background)
npm run docker:prod:detached

# View logs (if running detached)
docker-compose -f docker-compose.prod.yml logs -f json-toolkit-prod

# Stop the production environment
docker-compose -f docker-compose.prod.yml down
```

**Access Points:**
- **Application**: http://localhost:8080
- **Health Check**: http://localhost:8080/health
- **Container Name**: `json-toolkit-prod`

## 🔧 Manual Docker Commands

If you prefer manual control over automated scripts:

### Development Environment
```bash
# Build development image
docker build -f Dockerfile.dev -t json-toolkit:dev .

# Run development container
docker run -d \
  --name json-toolkit-dev \
  -p 3000:5173 \
  -v $(pwd)/src:/app/src:ro \
  -v $(pwd)/public:/app/public:ro \
  json-toolkit:dev

# View logs
docker logs -f json-toolkit-dev

# Stop and remove
docker stop json-toolkit-dev
docker rm json-toolkit-dev
```

### Production Environment
```bash
# Build production image
docker build -t json-toolkit:prod .

# Run production container
docker run -d \
  --name json-toolkit-prod \
  -p 8080:80 \
  json-toolkit:prod

# View logs
docker logs -f json-toolkit-prod

# Stop and remove
docker stop json-toolkit-prod
docker rm json-toolkit-prod
```

## 🧹 Cleanup Commands

### Stop All Containers
```bash
# Stop both dev and prod environments
npm run docker:clean
```

### Complete Cleanup (⚠️ Removes Everything)
```bash
# Remove all containers, images, volumes, and networks
npm run docker:clean:all

# Warning: This removes ALL Docker data on your system
# Use with caution!
```

### Selective Cleanup
```bash
# Remove only JSON Toolkit containers
docker rm -f json-toolkit-dev json-toolkit-prod

# Remove only JSON Toolkit images
docker rmi json-toolkit:dev json-toolkit:prod

# Remove unused Docker resources
docker system prune
```

## 🔍 Troubleshooting

### Common Issues

#### Port Already in Use
**Error**: `Port 3000 is already allocated`
**Solution**:
```bash
# Find what's using the port
lsof -i :3000

# Kill the process or use different ports
docker-compose down
```

#### Container Won't Start
**Error**: Container exits immediately
**Solution**:
```bash
# Check container logs
docker logs json-toolkit-dev

# Check if Docker Desktop is running
docker info
```

#### Build Fails
**Error**: Build process fails
**Solution**:
```bash
# Clean Docker cache and rebuild
docker builder prune
npm run docker:dev:build
```

#### No Hot Reload in Development
**Error**: Changes not reflecting
**Solution**:
```bash
# Ensure volume mounts are working
docker inspect json-toolkit-dev | grep Mounts -A 10

# Restart with fresh build
docker-compose down
npm run docker:dev:build
```

#### Development Environment Crypto Error
**Error**: `crypto.hash is not a function` in development
**Note**: This is a known issue with Vite 7.x and Node 18 compatibility in the development Docker environment. 
**Workaround**: Use the production environment for stable containerized deployment:
```bash
npm run docker:prod
```

#### Permission Errors
**Error**: Permission denied errors
**Solution**:
```bash
# On Linux/Mac, check file permissions
ls -la src/

# Ensure Docker has access to project directory
# In Docker Desktop: Settings > Resources > File Sharing
```

### Health Checks

Both environments include health checks:

```bash
# Check development environment health
docker exec json-toolkit-dev wget --spider http://localhost:5173

# Check production environment health
docker exec json-toolkit-prod wget --spider http://localhost:80

# View health status
docker ps
```

### Performance Monitoring

```bash
# View container resource usage
docker stats

# View detailed container info
docker inspect json-toolkit-dev
docker inspect json-toolkit-prod

# View container processes
docker exec json-toolkit-dev ps aux
```

## 🔧 Configuration

### Environment Variables

You can customize the Docker setup with environment variables:

```bash
# Development
export VITE_PORT=5173
export NODE_ENV=development

# Production  
export NODE_ENV=production
export NGINX_PORT=80
```

### Port Configuration

To use different ports, modify the docker-compose files:

```yaml
# docker-compose.yml (development)
ports:
  - "3001:5173"  # Change host port to 3001

# docker-compose.prod.yml (production)  
ports:
  - "8081:80"    # Change host port to 8081
```

### Volume Configuration

For development, you can modify which directories are mounted:

```yaml
volumes:
  - ./src:/app/src:ro           # Source code
  - ./public:/app/public:ro     # Public assets
  - ./index.html:/app/index.html:ro  # Main HTML file
  - /app/node_modules           # Exclude node_modules
```

## 📊 Docker Image Information

### Image Sizes
- **Development**: ~400MB (includes Node.js + dev dependencies)
- **Production**: ~50MB (optimized Nginx + built assets)

### Base Images
- **Development**: `node:18-alpine`
- **Production**: `nginx:alpine` (final stage)

### Build Time
- **Development**: 2-3 minutes (first build), 30 seconds (cached)
- **Production**: 3-4 minutes (includes build step)

## 🔐 Security Features

### Production Security
- ✅ Non-root user execution
- ✅ Security headers (XSS, CSRF protection)
- ✅ Minimal attack surface (no build tools)
- ✅ Health checks for monitoring

### Development Security
- ✅ Non-root user execution
- ✅ Read-only volume mounts
- ✅ Isolated container network

## 📚 Additional Resources

### Docker Commands Reference
```bash
# View all containers
docker ps -a

# View all images
docker images

# View container logs
docker logs <container-name>

# Execute commands in container
docker exec -it <container-name> /bin/sh

# View Docker disk usage
docker system df

# Remove unused resources
docker system prune
```

### Useful Docker Compose Commands
```bash
# View services status
docker-compose ps

# View logs for all services
docker-compose logs

# Restart specific service
docker-compose restart json-toolkit-dev

# Scale services (if needed)
docker-compose up --scale json-toolkit-dev=2
```

## 🆘 Getting Help

### If You Need Help:
1. **Check the logs** first: `docker logs json-toolkit-dev`
2. **Verify Docker is running**: `docker info`
3. **Check port availability**: `lsof -i :3000`
4. **Review troubleshooting section** above
5. **Open an issue** on GitHub with logs and error messages

### Support Channels:
- **GitHub Issues**: https://github.com/milton-mathan/json-toolkit/issues
- **Docker Documentation**: https://docs.docker.com/
- **Docker Desktop Help**: Built-in help section

---

**Happy Dockerizing! 🐳**

*JSON Toolkit - Making JSON and CSV data processing simple and containerized*