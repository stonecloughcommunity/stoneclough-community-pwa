#!/usr/bin/env node

/**
 * Coverage Report Generator
 * 
 * This script generates comprehensive test coverage reports and provides
 * analysis of coverage trends, uncovered code, and recommendations.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const COVERAGE_DIR = path.join(__dirname, '..', 'coverage');
const REPORTS_DIR = path.join(__dirname, '..', 'coverage-reports');
const COVERAGE_SUMMARY_FILE = path.join(COVERAGE_DIR, 'coverage-summary.json');
const LCOV_FILE = path.join(COVERAGE_DIR, 'lcov.info');

// Coverage thresholds
const THRESHOLDS = {
  global: {
    branches: 80,
    functions: 80,
    lines: 80,
    statements: 80,
  },
  critical: {
    branches: 90,
    functions: 90,
    lines: 90,
    statements: 90,
  },
};

// Critical files that should have higher coverage
const CRITICAL_FILES = [
  'lib/auth/',
  'lib/security/',
  'lib/database/',
  'components/auth/',
];

/**
 * Ensure directories exist
 */
function ensureDirectories() {
  if (!fs.existsSync(REPORTS_DIR)) {
    fs.mkdirSync(REPORTS_DIR, { recursive: true });
  }
}

/**
 * Run Jest with coverage
 */
function runCoverageTests() {
  console.log('🧪 Running tests with coverage...');
  
  try {
    execSync('npm run test:coverage', {
      stdio: 'inherit',
      cwd: path.join(__dirname, '..'),
    });
    console.log('✅ Coverage tests completed');
  } catch (error) {
    console.error('❌ Coverage tests failed:', error.message);
    process.exit(1);
  }
}

/**
 * Load coverage summary
 */
function loadCoverageSummary() {
  if (!fs.existsSync(COVERAGE_SUMMARY_FILE)) {
    throw new Error('Coverage summary file not found. Run tests with coverage first.');
  }
  
  const summaryData = fs.readFileSync(COVERAGE_SUMMARY_FILE, 'utf8');
  return JSON.parse(summaryData);
}

/**
 * Analyze coverage data
 */
function analyzeCoverage(summary) {
  const analysis = {
    overall: summary.total,
    files: [],
    criticalFiles: [],
    lowCoverageFiles: [],
    recommendations: [],
  };

  // Analyze individual files
  Object.entries(summary).forEach(([filePath, coverage]) => {
    if (filePath === 'total') return;

    const fileAnalysis = {
      path: filePath,
      coverage,
      isCritical: CRITICAL_FILES.some(critical => filePath.includes(critical)),
      needsAttention: false,
    };

    // Check if file needs attention
    const minCoverage = fileAnalysis.isCritical ? 
      Math.min(...Object.values(THRESHOLDS.critical)) :
      Math.min(...Object.values(THRESHOLDS.global));

    const actualMinCoverage = Math.min(
      coverage.lines.pct,
      coverage.functions.pct,
      coverage.branches.pct,
      coverage.statements.pct
    );

    if (actualMinCoverage < minCoverage) {
      fileAnalysis.needsAttention = true;
      analysis.lowCoverageFiles.push(fileAnalysis);
    }

    if (fileAnalysis.isCritical) {
      analysis.criticalFiles.push(fileAnalysis);
    }

    analysis.files.push(fileAnalysis);
  });

  // Generate recommendations
  analysis.recommendations = generateRecommendations(analysis);

  return analysis;
}

/**
 * Generate coverage recommendations
 */
function generateRecommendations(analysis) {
  const recommendations = [];

  // Overall coverage recommendations
  const overall = analysis.overall;
  Object.entries(THRESHOLDS.global).forEach(([metric, threshold]) => {
    if (overall[metric].pct < threshold) {
      recommendations.push({
        type: 'global',
        priority: 'high',
        metric,
        current: overall[metric].pct,
        target: threshold,
        message: `Global ${metric} coverage (${overall[metric].pct}%) is below threshold (${threshold}%)`,
      });
    }
  });

  // Critical file recommendations
  analysis.criticalFiles.forEach(file => {
    Object.entries(THRESHOLDS.critical).forEach(([metric, threshold]) => {
      if (file.coverage[metric].pct < threshold) {
        recommendations.push({
          type: 'critical',
          priority: 'critical',
          file: file.path,
          metric,
          current: file.coverage[metric].pct,
          target: threshold,
          message: `Critical file ${file.path} has ${metric} coverage (${file.coverage[metric].pct}%) below critical threshold (${threshold}%)`,
        });
      }
    });
  });

  // Low coverage file recommendations
  analysis.lowCoverageFiles.forEach(file => {
    if (!file.isCritical) { // Don't duplicate critical file recommendations
      const minCoverage = Math.min(
        file.coverage.lines.pct,
        file.coverage.functions.pct,
        file.coverage.branches.pct,
        file.coverage.statements.pct
      );

      recommendations.push({
        type: 'low-coverage',
        priority: 'medium',
        file: file.path,
        current: minCoverage,
        target: THRESHOLDS.global.lines,
        message: `File ${file.path} has low coverage (${minCoverage.toFixed(1)}%)`,
      });
    }
  });

  // Sort by priority
  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return recommendations;
}

/**
 * Generate HTML report
 */
function generateHTMLReport(analysis) {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test Coverage Report - Stoneclough Community PWA</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1, h2, h3 { color: #333; }
        .metric { display: inline-block; margin: 10px; padding: 15px; border-radius: 6px; min-width: 120px; text-align: center; }
        .metric-excellent { background: #d4edda; color: #155724; }
        .metric-good { background: #fff3cd; color: #856404; }
        .metric-poor { background: #f8d7da; color: #721c24; }
        .recommendations { margin-top: 30px; }
        .recommendation { margin: 10px 0; padding: 15px; border-radius: 6px; border-left: 4px solid; }
        .recommendation-critical { background: #f8d7da; border-color: #dc3545; }
        .recommendation-high { background: #fff3cd; border-color: #ffc107; }
        .recommendation-medium { background: #d1ecf1; border-color: #17a2b8; }
        .file-list { margin-top: 20px; }
        .file-item { margin: 5px 0; padding: 10px; background: #f8f9fa; border-radius: 4px; }
        .critical-file { border-left: 3px solid #dc3545; }
        .timestamp { color: #666; font-size: 0.9em; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Test Coverage Report</h1>
        <p class="timestamp">Generated: ${new Date().toLocaleString()}</p>
        
        <h2>Overall Coverage</h2>
        <div>
            ${Object.entries(analysis.overall).map(([metric, data]) => {
              if (metric === 'total') return '';
              const pct = data.pct;
              const className = pct >= 90 ? 'metric-excellent' : pct >= 80 ? 'metric-good' : 'metric-poor';
              return `<div class="metric ${className}">
                <strong>${metric.toUpperCase()}</strong><br>
                ${pct.toFixed(1)}%<br>
                <small>${data.covered}/${data.total}</small>
              </div>`;
            }).join('')}
        </div>

        <h2>Recommendations</h2>
        <div class="recommendations">
            ${analysis.recommendations.length === 0 ? 
              '<p>🎉 Great job! All coverage thresholds are met.</p>' :
              analysis.recommendations.map(rec => `
                <div class="recommendation recommendation-${rec.priority}">
                  <strong>${rec.priority.toUpperCase()}: ${rec.message}</strong>
                  ${rec.file ? `<br><small>File: ${rec.file}</small>` : ''}
                </div>
              `).join('')
            }
        </div>

        <h2>Critical Files Coverage</h2>
        <div class="file-list">
            ${analysis.criticalFiles.length === 0 ? 
              '<p>No critical files found.</p>' :
              analysis.criticalFiles.map(file => `
                <div class="file-item critical-file">
                  <strong>${file.path}</strong><br>
                  Lines: ${file.coverage.lines.pct.toFixed(1)}% | 
                  Functions: ${file.coverage.functions.pct.toFixed(1)}% | 
                  Branches: ${file.coverage.branches.pct.toFixed(1)}% | 
                  Statements: ${file.coverage.statements.pct.toFixed(1)}%
                </div>
              `).join('')
            }
        </div>

        <h2>Files Needing Attention</h2>
        <div class="file-list">
            ${analysis.lowCoverageFiles.length === 0 ? 
              '<p>All files meet coverage thresholds! 🎉</p>' :
              analysis.lowCoverageFiles.map(file => `
                <div class="file-item">
                  <strong>${file.path}</strong><br>
                  Lines: ${file.coverage.lines.pct.toFixed(1)}% | 
                  Functions: ${file.coverage.functions.pct.toFixed(1)}% | 
                  Branches: ${file.coverage.branches.pct.toFixed(1)}% | 
                  Statements: ${file.coverage.statements.pct.toFixed(1)}%
                </div>
              `).join('')
            }
        </div>
    </div>
</body>
</html>`;

  const reportPath = path.join(REPORTS_DIR, 'coverage-report.html');
  fs.writeFileSync(reportPath, html);
  console.log(`📊 HTML report generated: ${reportPath}`);
  
  return reportPath;
}

/**
 * Generate JSON report for CI/CD
 */
function generateJSONReport(analysis) {
  const report = {
    timestamp: new Date().toISOString(),
    overall: analysis.overall,
    summary: {
      totalFiles: analysis.files.length,
      criticalFiles: analysis.criticalFiles.length,
      lowCoverageFiles: analysis.lowCoverageFiles.length,
      recommendations: analysis.recommendations.length,
    },
    thresholds: THRESHOLDS,
    recommendations: analysis.recommendations,
    passed: analysis.recommendations.filter(r => r.priority === 'critical').length === 0,
  };

  const reportPath = path.join(REPORTS_DIR, 'coverage-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`📋 JSON report generated: ${reportPath}`);
  
  return report;
}

/**
 * Main function
 */
function main() {
  console.log('📊 Generating coverage report...');
  
  try {
    ensureDirectories();
    
    // Run tests if coverage data doesn't exist
    if (!fs.existsSync(COVERAGE_SUMMARY_FILE)) {
      runCoverageTests();
    }
    
    // Load and analyze coverage
    const summary = loadCoverageSummary();
    const analysis = analyzeCoverage(summary);
    
    // Generate reports
    generateHTMLReport(analysis);
    const jsonReport = generateJSONReport(analysis);
    
    // Print summary
    console.log('\n📊 Coverage Summary:');
    console.log(`Lines: ${analysis.overall.lines.pct.toFixed(1)}%`);
    console.log(`Functions: ${analysis.overall.functions.pct.toFixed(1)}%`);
    console.log(`Branches: ${analysis.overall.branches.pct.toFixed(1)}%`);
    console.log(`Statements: ${analysis.overall.statements.pct.toFixed(1)}%`);
    
    if (analysis.recommendations.length > 0) {
      console.log(`\n⚠️  ${analysis.recommendations.length} recommendations found`);
      analysis.recommendations.slice(0, 5).forEach(rec => {
        console.log(`  ${rec.priority.toUpperCase()}: ${rec.message}`);
      });
    } else {
      console.log('\n🎉 All coverage thresholds met!');
    }
    
    // Exit with error code if critical issues found
    const criticalIssues = analysis.recommendations.filter(r => r.priority === 'critical');
    if (criticalIssues.length > 0) {
      console.log(`\n❌ ${criticalIssues.length} critical coverage issues found`);
      process.exit(1);
    }
    
    console.log('\n✅ Coverage report generation complete');
    
  } catch (error) {
    console.error('❌ Coverage report generation failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  analyzeCoverage,
  generateHTMLReport,
  generateJSONReport,
};
