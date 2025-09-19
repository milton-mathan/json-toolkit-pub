# 🖥️ Local Development Setup

Complete guide for setting up JSON Toolkit on your local machine for development.

## 📋 Prerequisites

### Required Software
- **Node.js** 22.x or higher (LTS recommended)
- **npm** 10.x or higher (comes with Node.js)
- **Git** for version control

### Recommended Tools
- **Visual Studio Code** with extensions:
  - TypeScript and JavaScript Language Features
  - Tailwind CSS IntelliSense
  - ESLint
  - Prettier
- **Chrome DevTools** or **Firefox Developer Tools**

### System Requirements
- **RAM**: 4GB minimum, 8GB recommended
- **Storage**: 2GB free space for dependencies
- **OS**: Windows 10+, macOS 10.15+, or Linux

## 🚀 Quick Setup

### 1. Clone the Repository
```bash
# Clone the repository
git clone https://github.com/your-username/json-toolkit.git
cd json-toolkit
```

### 2. Install Dependencies
```bash
# Install all dependencies
npm install

# Verify installation
npm list --depth=0
```

### 3. Start Development Server
```bash
# Start development server with hot reload
npm run dev
```

**🎉 The application will be available at:** `http://localhost:5173`

## 📦 Available Scripts

### Development Commands
```bash
# Start development server (default port 5173)
npm run dev

# Start development server on custom port
npm run dev -- --port 3000

# Start development server and open browser
npm run dev -- --open
```

### Build Commands
```bash
# Build for production
npm run build

# Preview production build locally
npm run preview

# Build and preview in one command
npm run build && npm run preview
```

### Code Quality Commands
```bash
# Run ESLint for code linting
npm run lint

# Run ESLint with auto-fix
npm run lint -- --fix

# Check TypeScript types
npm run typecheck
```

### Testing Commands
```bash
# Run all unit tests
npm test

# Run tests in watch mode (re-runs on file changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run integration tests
npm run test:integration

# Run end-to-end tests
npm run test:e2e

# Run all tests (used in CI)
npm run test:ci
```

## 🔧 Configuration

### Environment Variables
Create a `.env.local` file in the root directory for local environment variables:

```bash
# .env.local
VITE_APP_VERSION=1.0.0
VITE_API_BASE_URL=http://localhost:3000/api
NODE_ENV=development
```

**Available Environment Variables:**
- `VITE_APP_VERSION` - Application version (optional)
- `VITE_API_BASE_URL` - API base URL (if using external APIs)
- `NODE_ENV` - Environment mode (development/production)

### Vite Configuration
The project uses Vite for development and building. Configuration is in `vite.config.ts`:

```typescript
// Key configurations:
- Hot Module Replacement (HMR) enabled
- TypeScript support
- React 19 support
- Tailwind CSS processing
- Bundle optimization
```

### TypeScript Configuration
TypeScript is configured with strict mode in `tsconfig.json`:

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true
  }
}
```

## 🧪 Testing Setup

### Unit Testing with Jest
```bash
# Run specific test file
npm test FieldInput.test.tsx

# Run tests matching pattern
npm test -- --testNamePattern="validation"

# Run tests in specific directory
npm test src/components/json-generator/

# Update snapshots
npm test -- --updateSnapshot
```

### Integration Testing
```bash
# Run integration tests
npm run test:integration

# Run specific integration test
npm run test:integration -- --grep "JSON Generator workflow"
```

### End-to-End Testing with Playwright
```bash
# Install Playwright browsers (first time only)
npx playwright install

# Run E2E tests
npm run test:e2e

# Run E2E tests in headed mode (see browser)
npm run test:e2e -- --headed

# Run specific E2E test
npm run test:e2e -- tests/json-generator.spec.ts
```

## 🛠️ Development Workflow

### 1. Feature Development
```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Make changes and test
npm run dev
npm test

# Check code quality
npm run lint
npm run typecheck

# Build to ensure everything works
npm run build
```

### 2. Code Quality Checks
```bash
# Run all quality checks
npm run lint && npm run typecheck && npm test
```

### 3. Pre-commit Workflow
```bash
# Before committing, run:
npm run build     # Ensure build works
npm run test:ci   # Run all tests
npm run lint      # Check code style
```

## 🔍 Troubleshooting

### Common Issues

#### Port Already in Use
**Error**: `Port 5173 is already in use`

**Solutions:**
```bash
# Option 1: Use different port
npm run dev -- --port 3000

# Option 2: Kill process using port 5173
# On Windows:
netstat -ano | findstr :5173
taskkill /PID <PID> /F

# On macOS/Linux:
lsof -ti:5173 | xargs kill
```

#### Node.js Version Issues
**Error**: `Node.js version not compatible`

**Solution:**
```bash
# Check current version
node --version

# Install Node.js 22.x from nodejs.org
# Or use Node Version Manager (nvm)
nvm install 22
nvm use 22
```

#### Dependencies Installation Issues
**Error**: `npm install fails`

**Solutions:**
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Use legacy peer deps (if peer dependency conflicts)
npm install --legacy-peer-deps
```

#### TypeScript Errors
**Error**: TypeScript compilation errors

**Solutions:**
```bash
# Check TypeScript version
npx tsc --version

# Run type checking
npm run typecheck

# Restart TypeScript service in VS Code
Ctrl+Shift+P → "TypeScript: Restart TS Server"
```

#### Build Errors
**Error**: Build fails with memory issues

**Solution:**
```bash
# Increase Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=4096"
npm run build

# On Windows:
set NODE_OPTIONS="--max-old-space-size=4096"
npm run build
```

#### Hot Reload Not Working
**Error**: Changes not reflecting in browser

**Solutions:**
```bash
# Hard refresh browser
Ctrl+Shift+R (or Cmd+Shift+R on Mac)

# Restart dev server
Ctrl+C (to stop)
npm run dev

# Check if files are being watched
# Ensure your files are in src/ directory
```

### Development Tools Setup

#### VS Code Extensions
Install these recommended extensions:

1. **ES7+ React/Redux/React-Native snippets**
2. **TypeScript Importer**
3. **Auto Rename Tag**
4. **Bracket Pair Colorizer**
5. **GitLens**

#### VS Code Settings
Add to your `settings.json`:
```json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "tailwindCSS.experimental.classRegex": [
    "class[:]\\s*['\"`]([^'\"`]*)['\"`]"
  ]
}
```

## 📊 Performance Optimization

### Development Performance
```bash
# Analyze bundle size
npm run build
npx vite-bundle-analyzer dist

# Check memory usage during development
node --inspect node_modules/.bin/vite

# Profile build performance
npm run build -- --profile
```

### Build Optimization
```bash
# Build with detailed output
npm run build -- --mode production --verbose

# Analyze production bundle
npx source-map-explorer dist/assets/*.js
```

## 🔐 Security Considerations

### Local Development Security
- ✅ Never commit `.env.local` files
- ✅ Use HTTPS in production
- ✅ Keep dependencies updated
- ✅ Validate all user inputs

### Dependency Security
```bash
# Check for vulnerabilities
npm audit

# Fix vulnerabilities automatically
npm audit fix

# Check for outdated packages
npm outdated

# Update dependencies
npm update
```

## 📚 Additional Resources

### Documentation
- [React 19 Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Vite Guide](https://vitejs.dev/guide/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

### Debugging Tools
- **React Developer Tools**: Browser extension for React debugging
- **Redux DevTools**: For state management debugging
- **Vite DevTools**: Built-in development tools
- **Browser DevTools**: Network, Performance, and Memory tabs

### Community Resources
- [React Community](https://react.dev/community)
- [TypeScript Community](https://www.typescriptlang.org/community)
- [Vite Discord](https://chat.vitejs.dev/)

## 🆘 Getting Help

### If You're Stuck:
1. **Check the console** for error messages
2. **Search the issue** in GitHub Issues
3. **Check troubleshooting section** above
4. **Restart your development server**
5. **Clear browser cache** and try again

### Support Channels:
- **GitHub Issues**: For bug reports and feature requests
- **GitHub Discussions**: For questions and community help
- **Stack Overflow**: Tag your questions with `json-toolkit`

---

**Happy coding! 💻**

*JSON Toolkit - Local development made simple*