#!/usr/bin/env node

/**
 * Deployment Validation Script
 * 
 * This script validates the deployment configuration and checks
 * that all required files and settings are in place.
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 JSON Toolkit Deployment Validation\n');

const checks = [];
let hasErrors = false;

function addCheck(name, success, message) {
  checks.push({ name, success, message });
  if (!success) hasErrors = true;
}

// Check required files
console.log('📁 Checking required files...');

const requiredFiles = [
  'vercel.json',
  '.vercelignore', 
  '.github/workflows/deploy.yml',
  'package.json',
  '.nvmrc'
];

requiredFiles.forEach(file => {
  const exists = fs.existsSync(path.join(__dirname, '..', file));
  addCheck(
    `File: ${file}`,
    exists,
    exists ? 'Found' : 'Missing - required for deployment'
  );
});

// Check package.json configuration
console.log('\n📦 Checking package.json configuration...');

try {
  const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
  
  // Check Node.js version
  const hasEngines = packageJson.engines && packageJson.engines.node;
  addCheck(
    'Node.js version constraint',
    hasEngines,
    hasEngines ? `Set to ${packageJson.engines.node}` : 'Missing engines.node field'
  );
  
  // Check build script
  const hasBuildScript = packageJson.scripts && packageJson.scripts.build;
  addCheck(
    'Build script',
    hasBuildScript,
    hasBuildScript ? 'Found' : 'Missing npm run build script'
  );
  
  // Check dependencies
  const hasReact = packageJson.dependencies && packageJson.dependencies.react;
  const hasVite = packageJson.devDependencies && packageJson.devDependencies.vite;
  addCheck(
    'React dependency',
    hasReact,
    hasReact ? `Version ${packageJson.dependencies.react}` : 'Missing React dependency'
  );
  addCheck(
    'Vite build tool',
    hasVite,
    hasVite ? `Version ${packageJson.devDependencies.vite}` : 'Missing Vite dependency'
  );
  
} catch (error) {
  addCheck('package.json parsing', false, `Invalid JSON: ${error.message}`);
}

// Check Vercel configuration
console.log('\n⚡ Checking Vercel configuration...');

try {
  const vercelConfig = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'vercel.json'), 'utf8'));
  
  addCheck(
    'Vercel framework',
    vercelConfig.framework === 'vite',
    vercelConfig.framework ? `Set to ${vercelConfig.framework}` : 'Framework not specified'
  );
  
  addCheck(
    'Build output directory',
    vercelConfig.outputDirectory === 'dist',
    vercelConfig.outputDirectory ? `Set to ${vercelConfig.outputDirectory}` : 'Output directory not specified'
  );
  
  addCheck(
    'SPA routing configured',
    vercelConfig.rewrites && vercelConfig.rewrites.length > 0,
    vercelConfig.rewrites ? 'Configured for SPA' : 'Missing SPA routing configuration'
  );
  
} catch (error) {
  addCheck('Vercel config parsing', false, `Invalid JSON: ${error.message}`);
}

// Check GitHub Actions workflow
console.log('\n🔄 Checking GitHub Actions workflow...');

try {
  const workflowPath = path.join(__dirname, '..', '.github', 'workflows', 'deploy.yml');
  const workflow = fs.readFileSync(workflowPath, 'utf8');
  
  addCheck(
    'Workflow file syntax',
    workflow.includes('name: Deploy to Vercel'),
    workflow.includes('name:') ? 'Valid YAML structure' : 'Invalid workflow syntax'
  );
  
  addCheck(
    'Required secrets referenced',
    workflow.includes('VERCEL_TOKEN') && workflow.includes('VERCEL_ORG_ID') && workflow.includes('VERCEL_PROJECT_ID'),
    'All required Vercel secrets are referenced'
  );
  
  addCheck(
    'Node.js version in workflow',
    workflow.includes('node-version: [22.x]') || workflow.includes("node-version: '22.x'"),
    'Node.js 22.x specified in workflow'
  );
  
} catch (error) {
  addCheck('GitHub Actions workflow', false, `Cannot read workflow file: ${error.message}`);
}

// Test build process
console.log('\n🏗️  Testing build process...');

try {
  execSync('npm run build', { stdio: 'pipe', cwd: path.join(__dirname, '..') });
  addCheck('Build process', true, 'Build completed successfully');
  
  // Check if dist directory was created
  const distExists = fs.existsSync(path.join(__dirname, '..', 'dist'));
  addCheck('Build output', distExists, distExists ? 'dist/ directory created' : 'No build output found');
  
  if (distExists) {
    const indexExists = fs.existsSync(path.join(__dirname, '..', 'dist', 'index.html'));
    addCheck('HTML output', indexExists, indexExists ? 'index.html generated' : 'No index.html found');
  }
  
} catch (error) {
  addCheck('Build process', false, `Build failed: ${error.message.split('\n')[0]}`);
}

// Print results
console.log('\n📊 Validation Results:\n');

checks.forEach(check => {
  const icon = check.success ? '✅' : '❌';
  const status = check.success ? 'PASS' : 'FAIL';
  console.log(`${icon} ${check.name}: ${status}`);
  if (check.message) {
    console.log(`   ${check.message}`);
  }
});

console.log('\n' + '='.repeat(60));

if (hasErrors) {
  console.log('❌ Deployment validation FAILED');
  console.log('\nPlease fix the issues above before deploying to Vercel.');
  console.log('See DEPLOYMENT.md for detailed setup instructions.');
  process.exit(1);
} else {
  console.log('✅ All deployment checks PASSED');
  console.log('\nYour project is ready for deployment to Vercel!');
  console.log('\nNext steps:');
  console.log('1. Set up GitHub secrets (see DEPLOYMENT.md)');
  console.log('2. Push to main branch to trigger deployment');
  console.log('3. Monitor deployment in GitHub Actions tab');
}

console.log('\n📖 For complete setup guide: DEPLOYMENT.md');
console.log('🔧 For troubleshooting: GitHub Issues with deployment label');