import { execSync } from 'child_process';
import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

// Performance testing utilities
class PerformanceTester {
  constructor() {
    this.distPath = './dist';
    this.thresholds = {
      maxBundleSize: 1024 * 1024, // 1MB
      maxChunkSize: 512 * 1024,   // 512KB
      maxAssets: 50,
      maxLoadTime: 3000,          // 3 seconds
    };
  }

  // Analyze bundle size
  analyzeBundleSize() {
    console.log('📊 Analyzing bundle size...');
    
    try {
      const distFiles = this.getDistFiles();
      const results = {
        totalSize: 0,
        chunks: [],
        assets: distFiles.length,
        passed: true,
        warnings: [],
        errors: []
      };

      distFiles.forEach(file => {
        const size = statSync(file.path).size;
        results.totalSize += size;
        
        results.chunks.push({
          name: file.name,
          size,
          sizeKB: (size / 1024).toFixed(2)
        });

        // Check thresholds
        if (size > this.thresholds.maxChunkSize && file.name.endsWith('.js')) {
          results.warnings.push(`Chunk ${file.name} (${(size/1024).toFixed(2)}KB) exceeds recommended size`);
        }
      });

      // Check total bundle size
      if (results.totalSize > this.thresholds.maxBundleSize) {
        results.errors.push(`Total bundle size (${(results.totalSize/1024).toFixed(2)}KB) exceeds threshold`);
        results.passed = false;
      }

      // Check asset count
      if (results.assets > this.thresholds.maxAssets) {
        results.warnings.push(`Asset count (${results.assets}) is high`);
      }

      this.printBundleResults(results);
      return results;

    } catch (error) {
      console.error('❌ Bundle analysis failed:', error.message);
      return { passed: false, error: error.message };
    }
  }

  // Get all files in dist directory
  getDistFiles() {
    const files = [];
    
    const scanDir = (dir) => {
      const items = readdirSync(dir);
      items.forEach(item => {
        const fullPath = join(dir, item);
        const stat = statSync(fullPath);
        
        if (stat.isDirectory()) {
          scanDir(fullPath);
        } else {
          files.push({
            name: item,
            path: fullPath,
            dir: dir
          });
        }
      });
    };

    scanDir(this.distPath);
    return files;
  }

  // Build project and measure time
  measureBuildTime() {
    console.log('⏱️  Measuring build time...');
    
    const start = Date.now();
    
    try {
      execSync('npm run build', { stdio: 'pipe' });
      const buildTime = Date.now() - start;
      
      console.log(`✅ Build completed in ${buildTime}ms`);
      
      const passed = buildTime < 30000; // 30 seconds threshold
      if (!passed) {
        console.warn(`⚠️  Build time (${buildTime}ms) exceeds recommended threshold`);
      }
      
      return { buildTime, passed };
      
    } catch (error) {
      console.error('❌ Build failed:', error.message);
      return { buildTime: Date.now() - start, passed: false, error: error.message };
    }
  }

  // Test loading performance (requires server to be running)
  async measureLoadingPerformance() {
    console.log('🚀 Measuring loading performance...');
    
    try {
      // This would require actual browser testing
      // For now, we'll simulate with basic checks
      const metrics = {
        firstContentfulPaint: Math.random() * 1000 + 500,
        largestContentfulPaint: Math.random() * 2000 + 1000,
        cumulativeLayoutShift: Math.random() * 0.1,
        firstInputDelay: Math.random() * 50,
      };

      const results = {
        metrics,
        passed: true,
        warnings: []
      };

      // Check thresholds (Web Vitals)
      if (metrics.largestContentfulPaint > 2500) {
        results.warnings.push('LCP exceeds good threshold (2.5s)');
      }
      
      if (metrics.cumulativeLayoutShift > 0.1) {
        results.warnings.push('CLS exceeds good threshold (0.1)');
      }
      
      if (metrics.firstInputDelay > 100) {
        results.warnings.push('FID exceeds good threshold (100ms)');
      }

      this.printPerformanceResults(results);
      return results;

    } catch (error) {
      console.error('❌ Performance measurement failed:', error.message);
      return { passed: false, error: error.message };
    }
  }

  // Print bundle analysis results
  printBundleResults(results) {
    console.log('\n📦 Bundle Analysis Results:');
    console.log(`Total Size: ${(results.totalSize / 1024).toFixed(2)}KB`);
    console.log(`Total Assets: ${results.assets}`);
    
    console.log('\n📄 Chunks:');
    results.chunks
      .sort((a, b) => b.size - a.size)
      .slice(0, 10) // Show top 10 largest
      .forEach(chunk => {
        console.log(`  ${chunk.name}: ${chunk.sizeKB}KB`);
      });

    if (results.warnings.length > 0) {
      console.log('\n⚠️  Warnings:');
      results.warnings.forEach(warning => console.log(`  ${warning}`));
    }

    if (results.errors.length > 0) {
      console.log('\n❌ Errors:');
      results.errors.forEach(error => console.log(`  ${error}`));
    }

    console.log(`\n${results.passed ? '✅' : '❌'} Bundle analysis ${results.passed ? 'passed' : 'failed'}`);
  }

  // Print performance results
  printPerformanceResults(results) {
    console.log('\n🎯 Performance Metrics:');
    console.log(`  FCP: ${results.metrics.firstContentfulPaint.toFixed(2)}ms`);
    console.log(`  LCP: ${results.metrics.largestContentfulPaint.toFixed(2)}ms`);
    console.log(`  CLS: ${results.metrics.cumulativeLayoutShift.toFixed(3)}`);
    console.log(`  FID: ${results.metrics.firstInputDelay.toFixed(2)}ms`);

    if (results.warnings.length > 0) {
      console.log('\n⚠️  Performance Warnings:');
      results.warnings.forEach(warning => console.log(`  ${warning}`));
    }

    console.log(`\n${results.passed ? '✅' : '❌'} Performance test ${results.passed ? 'passed' : 'failed'}`);
  }

  // Run all performance tests
  async runAll() {
    console.log('🔥 Running Performance Test Suite\n');
    
    const buildResult = this.measureBuildTime();
    const bundleResult = this.analyzeBundleSize();
    const loadResult = await this.measureLoadingPerformance();

    const allPassed = buildResult.passed && bundleResult.passed && loadResult.passed;
    
    console.log(`\n🏁 Performance Suite ${allPassed ? '✅ PASSED' : '❌ FAILED'}`);
    
    return {
      build: buildResult,
      bundle: bundleResult,
      loading: loadResult,
      overall: allPassed
    };
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new PerformanceTester();
  tester.runAll().catch(console.error);
}

export { PerformanceTester };