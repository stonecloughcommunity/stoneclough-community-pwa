#!/usr/bin/env node

/**
 * Coverage Badge Generator
 * 
 * Generates SVG badges for test coverage that can be embedded in README files.
 * Creates badges for overall coverage and individual metrics.
 */

const fs = require('fs');
const path = require('path');

// Configuration
const COVERAGE_DIR = path.join(__dirname, '..', 'coverage');
const BADGES_DIR = path.join(__dirname, '..', 'coverage-badges');
const COVERAGE_SUMMARY_FILE = path.join(COVERAGE_DIR, 'coverage-summary.json');

/**
 * Ensure badges directory exists
 */
function ensureBadgesDirectory() {
  if (!fs.existsSync(BADGES_DIR)) {
    fs.mkdirSync(BADGES_DIR, { recursive: true });
  }
}

/**
 * Get color for coverage percentage
 */
function getCoverageColor(percentage) {
  if (percentage >= 90) return '#4c1';      // Bright green
  if (percentage >= 80) return '#97ca00';   // Green
  if (percentage >= 70) return '#a4a61d';   // Yellow-green
  if (percentage >= 60) return '#dfb317';   // Yellow
  if (percentage >= 50) return '#fe7d37';   // Orange
  return '#e05d44';                         // Red
}

/**
 * Generate SVG badge
 */
function generateBadge(label, value, color) {
  const labelWidth = label.length * 6 + 10;
  const valueWidth = value.length * 6 + 10;
  const totalWidth = labelWidth + valueWidth;
  
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${totalWidth}" height="20">
    <linearGradient id="b" x2="0" y2="100%">
      <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
      <stop offset="1" stop-opacity=".1"/>
    </linearGradient>
    <clipPath id="a">
      <rect width="${totalWidth}" height="20" rx="3" fill="#fff"/>
    </clipPath>
    <g clip-path="url(#a)">
      <path fill="#555" d="M0 0h${labelWidth}v20H0z"/>
      <path fill="${color}" d="M${labelWidth} 0h${valueWidth}v20H${labelWidth}z"/>
      <path fill="url(#b)" d="M0 0h${totalWidth}v20H0z"/>
    </g>
    <g fill="#fff" text-anchor="middle" font-family="DejaVu Sans,Verdana,Geneva,sans-serif" font-size="110">
      <text x="${labelWidth / 2 * 10}" y="150" fill="#010101" fill-opacity=".3" transform="scale(.1)" textLength="${(label.length * 6) * 10}">${label}</text>
      <text x="${labelWidth / 2 * 10}" y="140" transform="scale(.1)" textLength="${(label.length * 6) * 10}">${label}</text>
      <text x="${(labelWidth + valueWidth / 2) * 10}" y="150" fill="#010101" fill-opacity=".3" transform="scale(.1)" textLength="${(value.length * 6) * 10}">${value}</text>
      <text x="${(labelWidth + valueWidth / 2) * 10}" y="140" transform="scale(.1)" textLength="${(value.length * 6) * 10}">${value}</text>
    </g>
  </svg>`;
}

/**
 * Generate coverage badges
 */
function generateCoverageBadges() {
  if (!fs.existsSync(COVERAGE_SUMMARY_FILE)) {
    throw new Error('Coverage summary file not found. Run tests with coverage first.');
  }
  
  const summaryData = fs.readFileSync(COVERAGE_SUMMARY_FILE, 'utf8');
  const summary = JSON.parse(summaryData);
  const total = summary.total;
  
  ensureBadgesDirectory();
  
  // Generate individual metric badges
  const metrics = ['lines', 'functions', 'branches', 'statements'];
  
  metrics.forEach(metric => {
    const percentage = total[metric].pct;
    const value = `${percentage.toFixed(1)}%`;
    const color = getCoverageColor(percentage);
    const badge = generateBadge(metric, value, color);
    
    const badgePath = path.join(BADGES_DIR, `coverage-${metric}.svg`);
    fs.writeFileSync(badgePath, badge);
    console.log(`Generated ${metric} badge: ${badgePath}`);
  });
  
  // Generate overall coverage badge (using lines as primary metric)
  const overallPercentage = total.lines.pct;
  const overallValue = `${overallPercentage.toFixed(1)}%`;
  const overallColor = getCoverageColor(overallPercentage);
  const overallBadge = generateBadge('coverage', overallValue, overallColor);
  
  const overallBadgePath = path.join(BADGES_DIR, 'coverage.svg');
  fs.writeFileSync(overallBadgePath, overallBadge);
  console.log(`Generated overall coverage badge: ${overallBadgePath}`);
  
  // Generate combined badge with all metrics
  const combinedValue = `L:${total.lines.pct.toFixed(0)}% F:${total.functions.pct.toFixed(0)}% B:${total.branches.pct.toFixed(0)}% S:${total.statements.pct.toFixed(0)}%`;
  const combinedColor = getCoverageColor(Math.min(total.lines.pct, total.functions.pct, total.branches.pct, total.statements.pct));
  const combinedBadge = generateBadge('coverage', combinedValue, combinedColor);
  
  const combinedBadgePath = path.join(BADGES_DIR, 'coverage-detailed.svg');
  fs.writeFileSync(combinedBadgePath, combinedBadge);
  console.log(`Generated detailed coverage badge: ${combinedBadgePath}`);
  
  return {
    overall: overallPercentage,
    metrics: {
      lines: total.lines.pct,
      functions: total.functions.pct,
      branches: total.branches.pct,
      statements: total.statements.pct,
    },
    badges: {
      overall: overallBadgePath,
      lines: path.join(BADGES_DIR, 'coverage-lines.svg'),
      functions: path.join(BADGES_DIR, 'coverage-functions.svg'),
      branches: path.join(BADGES_DIR, 'coverage-branches.svg'),
      statements: path.join(BADGES_DIR, 'coverage-statements.svg'),
      detailed: combinedBadgePath,
    },
  };
}

/**
 * Generate README snippet with badges
 */
function generateReadmeSnippet(badgeInfo) {
  const snippet = `
## Test Coverage

![Coverage](./coverage-badges/coverage.svg)
![Lines](./coverage-badges/coverage-lines.svg)
![Functions](./coverage-badges/coverage-functions.svg)
![Branches](./coverage-badges/coverage-branches.svg)
![Statements](./coverage-badges/coverage-statements.svg)

### Coverage Details

- **Overall Coverage**: ${badgeInfo.overall.toFixed(1)}%
- **Lines**: ${badgeInfo.metrics.lines.toFixed(1)}%
- **Functions**: ${badgeInfo.metrics.functions.toFixed(1)}%
- **Branches**: ${badgeInfo.metrics.branches.toFixed(1)}%
- **Statements**: ${badgeInfo.metrics.statements.toFixed(1)}%

*Coverage badges are automatically updated when tests are run.*
`;

  const snippetPath = path.join(BADGES_DIR, 'README-snippet.md');
  fs.writeFileSync(snippetPath, snippet.trim());
  console.log(`Generated README snippet: ${snippetPath}`);
  
  return snippet;
}

/**
 * Generate shields.io style badges
 */
function generateShieldsBadges(badgeInfo) {
  const shields = {
    overall: `https://img.shields.io/badge/coverage-${badgeInfo.overall.toFixed(1)}%25-${getCoverageColor(badgeInfo.overall).replace('#', '')}`,
    lines: `https://img.shields.io/badge/lines-${badgeInfo.metrics.lines.toFixed(1)}%25-${getCoverageColor(badgeInfo.metrics.lines).replace('#', '')}`,
    functions: `https://img.shields.io/badge/functions-${badgeInfo.metrics.functions.toFixed(1)}%25-${getCoverageColor(badgeInfo.metrics.functions).replace('#', '')}`,
    branches: `https://img.shields.io/badge/branches-${badgeInfo.metrics.branches.toFixed(1)}%25-${getCoverageColor(badgeInfo.metrics.branches).replace('#', '')}`,
    statements: `https://img.shields.io/badge/statements-${badgeInfo.metrics.statements.toFixed(1)}%25-${getCoverageColor(badgeInfo.metrics.statements).replace('#', '')}`,
  };
  
  const shieldsSnippet = `
## Test Coverage (Shields.io)

![Coverage](${shields.overall})
![Lines](${shields.lines})
![Functions](${shields.functions})
![Branches](${shields.branches})
![Statements](${shields.statements})
`;

  const shieldsPath = path.join(BADGES_DIR, 'shields-snippet.md');
  fs.writeFileSync(shieldsPath, shieldsSnippet.trim());
  console.log(`Generated Shields.io snippet: ${shieldsPath}`);
  
  return shields;
}

/**
 * Main function
 */
function main() {
  console.log('🏷️  Generating coverage badges...');
  
  try {
    const badgeInfo = generateCoverageBadges();
    generateReadmeSnippet(badgeInfo);
    generateShieldsBadges(badgeInfo);
    
    console.log('\n📊 Coverage Badge Summary:');
    console.log(`Overall: ${badgeInfo.overall.toFixed(1)}%`);
    console.log(`Lines: ${badgeInfo.metrics.lines.toFixed(1)}%`);
    console.log(`Functions: ${badgeInfo.metrics.functions.toFixed(1)}%`);
    console.log(`Branches: ${badgeInfo.metrics.branches.toFixed(1)}%`);
    console.log(`Statements: ${badgeInfo.metrics.statements.toFixed(1)}%`);
    
    console.log('\n✅ Coverage badges generated successfully');
    
  } catch (error) {
    console.error('❌ Badge generation failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  generateCoverageBadges,
  generateReadmeSnippet,
  generateShieldsBadges,
};
