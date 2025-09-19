# ☁️ Vercel Deployment Guide

Complete guide for deploying JSON Toolkit to Vercel with manual deployment or optional GitHub Actions setup.

## 🚀 Quick Deployment (Recommended)

### Option 1: Vercel CLI (Easiest)
```bash
# Install Vercel CLI
npm install -g vercel@latest

# Login to Vercel
vercel login

# Deploy from project directory
vercel

# Follow the prompts to deploy
```

### Option 2: Vercel Dashboard (Web Interface)
1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "Add New Project"
3. Import your GitHub repository
4. Configure build settings (auto-detected)
5. Click "Deploy"

## 📋 Prerequisites

- **Vercel Account**: Free account at [vercel.com](https://vercel.com)
- **GitHub Repository**: Your JSON Toolkit repository
- **Node.js**: Version 22.x or higher (for local testing)

## 🛠️ Detailed Setup Instructions

### Step 1: Prepare Your Repository

Ensure your repository has these key files:
- `package.json` with build scripts
- `vite.config.ts` properly configured
- `vercel.json` for deployment configuration

### Step 2: Create Vercel Account

1. Visit [vercel.com](https://vercel.com)
2. Click "Sign Up" and choose "Continue with GitHub"
3. Authorize Vercel to access your GitHub account

### Step 3: Deploy via Vercel Dashboard

1. **Import Project**:
   - Click "Add New Project" in your Vercel dashboard
   - Select your `json-toolkit-pub` repository
   - Click "Import"

2. **Configure Project**:
   - **Project Name**: `json-toolkit` (or your preferred name)
   - **Framework Preset**: Vite (should be auto-detected)
   - **Root Directory**: `./` (default)
   - **Build Command**: `npm run build` (auto-detected)
   - **Output Directory**: `dist` (auto-detected)

3. **Environment Variables** (if needed):
   - Click "Environment Variables" section
   - Add any custom environment variables
   - For this project, no environment variables are required

4. **Deploy**:
   - Click "Deploy"
   - Wait for the build to complete (~2-3 minutes)
   - Your app will be available at: `https://your-project-name.vercel.app`

### Step 4: Verify Deployment

1. **Test the Application**:
   - Visit your deployed URL
   - Test JSON Generator functionality
   - Test CSV Converter
   - Test XML Converter
   - Verify dark/light theme toggle

2. **Check Performance**:
   - Vercel provides automatic performance monitoring
   - View deployment logs in Vercel dashboard

## 🔧 Configuration Options

### Custom Domain Setup

1. In Vercel dashboard, go to your project
2. Click **Settings** → **Domains**
3. Add your custom domain
4. Configure DNS records as instructed

### Build Optimization

The project is pre-configured with optimal settings:

```json
// vite.config.ts includes:
{
  "build": {
    "target": "es2020",
    "rollupOptions": {
      "output": {
        "manualChunks": {
          "react": ["react", "react-dom"],
          "router": ["react-router-dom"]
        }
      }
    }
  }
}
```

### Environment Variables (Optional)

If you need to add environment variables:

1. **In Vercel Dashboard**:
   - Go to Project → Settings → Environment Variables
   - Add variables for all environments (Production, Preview, Development)

2. **Common Variables**:
   ```
   VITE_APP_VERSION=1.0.0
   VITE_API_BASE_URL=https://api.yourdomain.com
   NODE_ENV=production
   ```

## 🔄 Continuous Deployment

### Automatic Deployments
- **Production**: Auto-deploy when you push to `main` branch
- **Preview**: Auto-deploy for pull requests (if using GitHub integration)

### Manual Deployments
```bash
# Deploy latest changes
vercel

# Deploy specific branch
vercel --prod

# Deploy with custom project name
vercel --name my-json-toolkit
```

## 🧪 Testing Before Deployment

### Local Production Build
```bash
# Build for production
npm run build

# Preview production build locally
npm run preview

# Test the production build
# Visit http://localhost:4173
```

### Deployment Validation
```bash
# Install deployment validation script
npm install -g wait-on

# Check if deployment is live
wait-on https://your-project-name.vercel.app
```

## 🔍 Troubleshooting

### Common Issues

#### Build Failures
**Error**: `Build failed with exit code 1`

**Solutions**:
```bash
# Check build locally first
npm run build

# Check Node.js version (requires 22.x)
node --version

# Clear cache and rebuild
rm -rf node_modules dist
npm install
npm run build
```

#### Environment Variable Issues
**Error**: `Environment variable not found`

**Solution**:
1. Add variables in Vercel Dashboard → Settings → Environment Variables
2. Redeploy the project
3. Ensure variables start with `VITE_` for client-side access

#### Performance Issues
**Error**: Large bundle size or slow loading

**Solution**:
```bash
# Analyze bundle size
npm run build
npx vite-bundle-analyzer dist

# The project already includes optimizations:
# - Code splitting
# - Tree shaking
# - Compression
```

#### Domain Issues
**Error**: Domain not working

**Solution**:
1. Check DNS configuration
2. Wait 24-48 hours for DNS propagation
3. Verify SSL certificate is active

### Deployment Logs

**Access Logs**:
1. Go to Vercel Dashboard → Your Project
2. Click on a deployment
3. View "Build Logs" and "Function Logs"

**Common Log Messages**:
```
✓ Build completed successfully
✓ Deployment ready
⚠ Large bundle size detected
✗ Build failed: dependency not found
```

## 🚀 Advanced Setup (Optional GitHub Actions)

If you want to set up automated deployments with GitHub Actions:

### Required Secrets
Add these to your GitHub repository secrets (`Settings` → `Secrets and variables` → `Actions`):

| Secret Name | Description | How to Get |
|-------------|-------------|------------|
| `VERCEL_TOKEN` | Vercel authentication token | [Vercel Account Settings](https://vercel.com/account/tokens) |
| `VERCEL_ORG_ID` | Your Vercel organization ID | Run `vercel link` in your project |
| `VERCEL_PROJECT_ID` | Your Vercel project ID | Run `vercel link` in your project |

### Get Vercel IDs
```bash
# Install Vercel CLI
npm install -g vercel@latest

# Login and link project
vercel login
vercel link

# Get project details
cat .vercel/project.json
# This shows your VERCEL_ORG_ID and VERCEL_PROJECT_ID
```

### Create GitHub Action (Optional)
Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Vercel

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
  VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22.x'
          cache: 'npm'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Build project
        run: npm run build
        
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

## 📊 Performance Monitoring

### Built-in Vercel Analytics
- **Web Vitals**: Core Web Vitals tracking
- **Performance**: Real-time performance metrics
- **Usage**: Bandwidth and function execution stats

### Lighthouse Integration
The project includes Lighthouse-friendly optimizations:
- ✅ Performance: Optimized bundle size
- ✅ Accessibility: WCAG 2.1 AA compliance
- ✅ Best Practices: Security headers, HTTPS
- ✅ SEO: Meta tags and semantic HTML

## 🔐 Security Considerations

### Automatic Security Features
- ✅ **HTTPS**: Automatic SSL certificates
- ✅ **Security Headers**: CSP, HSTS, X-Frame-Options
- ✅ **DDoS Protection**: Built-in protection
- ✅ **Edge Network**: Global CDN distribution

### Best Practices
1. **Secrets Management**: Use Vercel environment variables
2. **Dependencies**: Keep packages updated
3. **Monitoring**: Enable Vercel monitoring
4. **Backups**: Git repository serves as backup

## 💰 Cost Considerations

### Vercel Free Tier
- **Bandwidth**: 100 GB/month
- **Function Executions**: 100 GB-hrs/month
- **Build Minutes**: 6,000 minutes/month
- **Projects**: Unlimited
- **Team Members**: 1 (personal account)

### Usage for JSON Toolkit
The JSON Toolkit is a static React app that uses minimal resources:
- **Bandwidth**: ~2MB per user visit
- **Functions**: Not used (static app)
- **Build Time**: ~2-3 minutes per deployment

## 📞 Support Resources

- **Vercel Documentation**: [vercel.com/docs](https://vercel.com/docs)
- **GitHub Issues**: Report bugs in your repository
- **Vercel Community**: [github.com/vercel/vercel/discussions](https://github.com/vercel/vercel/discussions)
- **Stack Overflow**: Tag questions with `vercel` and `json-toolkit`

---

## 🎯 Quick Start Summary

1. **Create Vercel account** at [vercel.com](https://vercel.com)
2. **Import your repository** via Vercel dashboard
3. **Deploy** with one click (auto-configured)
4. **Access your app** at the provided URL
5. **Optional**: Add custom domain or GitHub Actions

Your JSON Toolkit will be live in minutes! 🚀