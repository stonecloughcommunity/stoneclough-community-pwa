# Test Coverage System Documentation

This document provides comprehensive information about the test coverage system implemented in the Stoneclough Community PWA project.

## Overview

The coverage system provides automated test coverage reporting, badge generation, and enforcement of coverage thresholds across different environments. It integrates with Jest, GitHub Actions, and provides detailed reporting for development and CI/CD workflows.

## Architecture

### Core Components

1. **Jest Configuration** (`jest.config.js`)
   - Environment-specific coverage settings
   - Threshold enforcement
   - Reporter configuration

2. **Coverage Configuration** (`coverage.config.js`)
   - Environment-specific thresholds
   - File categorization (security-critical, performance-critical)
   - Reporter settings

3. **Coverage Reporting** (`scripts/coverage-report.js`)
   - HTML and JSON report generation
   - Coverage analysis and recommendations
   - Threshold validation

4. **Badge Generation** (`scripts/generate-coverage-badge.js`)
   - SVG badge creation
   - README snippet generation
   - Shields.io integration

5. **GitHub Actions** (`.github/workflows/coverage.yml`)
   - Automated coverage reporting
   - PR comments with coverage data
   - Artifact storage

## Coverage Thresholds

### Environment-Specific Thresholds

#### Development
- **Global**: 60% (lines, functions, branches, statements)
- **Purpose**: Encourage testing during development

#### Test
- **Global**: 80% (lines, functions, branches, statements)
- **Security Files**: 95% (lib/security/)
- **Auth Files**: 90% (lib/auth/)
- **Database Files**: 85% (lib/database/)
- **Components**: 75% (components/)

#### CI/Production
- **Global**: 80-85% (lines, functions, branches, statements)
- **Security Files**: 95-98% (lib/security/)
- **Auth Files**: 90-95% (lib/auth/)
- **Database Files**: 85-90% (lib/database/)

### File Categories

#### Security-Critical Files
```
lib/auth/**/*.{js,jsx,ts,tsx}
lib/security/**/*.{js,jsx,ts,tsx}
middleware.ts
lib/database/security.ts
components/auth/**/*.{js,jsx,ts,tsx}
```
**Requirement**: 95-98% coverage

#### Performance-Critical Files
```
lib/database/**/*.{js,jsx,ts,tsx}
lib/cache/**/*.{js,jsx,ts,tsx}
hooks/use-*.{js,jsx,ts,tsx}
components/ui/**/*.{js,jsx,ts,tsx}
```
**Requirement**: 85% coverage

#### Low-Priority Files
```
app/**/page.tsx
app/**/layout.tsx
components/icons/**/*.{js,jsx,ts,tsx}
lib/constants/**/*.{js,jsx,ts,tsx}
lib/types/**/*.{js,jsx,ts,tsx}
```
**Requirement**: Standard thresholds apply

## Usage

### Running Coverage Tests

```bash
# Basic coverage
npm run test:coverage

# Coverage with detailed report
npm run test:coverage:report

# Coverage with badge generation
npm run test:coverage:badges

# CI-specific coverage (strict thresholds)
npm run test:coverage:ci
```

### Interpreting Coverage Reports

#### HTML Report
- Located in `coverage/lcov-report/index.html`
- Interactive file-by-file coverage view
- Line-by-line coverage highlighting
- Branch coverage visualization

#### JSON Report
- Located in `coverage-reports/coverage-report.json`
- Machine-readable coverage data
- Recommendations and analysis
- CI/CD integration data

#### Coverage Badges
- Located in `coverage-badges/`
- SVG badges for README files
- Overall and per-metric badges
- Color-coded based on thresholds

### Coverage Badge Integration

#### Local Badges
```markdown
![Coverage](./coverage-badges/coverage.svg)
![Lines](./coverage-badges/coverage-lines.svg)
![Functions](./coverage-badges/coverage-functions.svg)
![Branches](./coverage-badges/coverage-branches.svg)
![Statements](./coverage-badges/coverage-statements.svg)
```

#### Shields.io Badges
```markdown
![Coverage](https://img.shields.io/badge/coverage-85.2%25-brightgreen)
```

## Configuration

### Environment Variables

```bash
# Test database configuration
TEST_SUPABASE_URL=your_test_supabase_url
TEST_SUPABASE_SERVICE_KEY=your_test_service_key
TEST_SUPABASE_ANON_KEY=your_test_anon_key

# Coverage configuration
NODE_ENV=test|development|production
CI=true|false

# Optional: Coverage debugging
COVERAGE_DEBUG=true
```

### Jest Configuration

The system automatically selects appropriate coverage settings based on `NODE_ENV`:

```javascript
// Get environment-specific configuration
const coverageConfig = getCoverageConfig(process.env.NODE_ENV);

// Apply to Jest
module.exports = {
  ...coverageConfig,
  // other Jest settings
};
```

### Custom Thresholds

To add custom coverage thresholds for specific directories:

```javascript
// In coverage.config.js
coverageThreshold: {
  global: { /* global thresholds */ },
  './your-directory/': {
    branches: 90,
    functions: 90,
    lines: 90,
    statements: 90,
  },
}
```

## GitHub Actions Integration

### Workflow Triggers
- **Push**: to main/develop branches
- **Pull Request**: to main/develop branches
- **Schedule**: Daily at 6 AM UTC
- **Manual**: workflow_dispatch

### Workflow Jobs

#### 1. Coverage Generation
- Runs tests with coverage
- Generates reports and badges
- Uploads to Codecov
- Comments on PRs

#### 2. Coverage Trend Analysis
- Tracks coverage over time
- Commits updated badges
- Analyzes coverage trends

#### 3. Security Coverage
- Validates security-critical file coverage
- Ensures high coverage for auth/security code

### PR Comments

The workflow automatically comments on PRs with coverage information:

```markdown
## 📊 Test Coverage Report

| Metric | Coverage | Status |
|--------|----------|--------|
| Lines | 85.2% | ✅ |
| Functions | 82.1% | ✅ |
| Branches | 78.9% | ❌ |
| Statements | 85.0% | ✅ |

### ⚠️ Recommendations (2)
- **HIGH**: Global branches coverage (78.9%) is below threshold (80%)
- **CRITICAL**: Security file coverage below critical threshold
```

## Troubleshooting

### Common Issues

#### 1. Coverage Thresholds Not Met
```
Jest: "global" coverage threshold for lines (80%) not met: 75.2%
```

**Solutions**:
- Add more tests for uncovered lines
- Review coverage report to identify gaps
- Consider adjusting thresholds if appropriate

#### 2. Missing Coverage Data
```
Jest: Coverage data for ./lib/database/ was not found.
```

**Solutions**:
- Ensure files exist in the specified directory
- Check `collectCoverageFrom` patterns
- Verify file extensions are included

#### 3. Badge Generation Fails
```
Coverage summary file not found. Run tests with coverage first.
```

**Solutions**:
- Run `npm run test:coverage` first
- Check that `coverage/coverage-summary.json` exists
- Verify Jest coverage configuration

#### 4. GitHub Actions Failures
```
Missing required environment variables
```

**Solutions**:
- Add required secrets to GitHub repository
- Verify secret names match workflow file
- Check environment variable usage

### Debugging Coverage Issues

#### 1. Enable Debug Mode
```bash
COVERAGE_DEBUG=true npm run test:coverage:report
```

#### 2. Check Coverage Patterns
```bash
# Test coverage collection patterns
node -e "
const config = require('./coverage.config.js');
console.log(config.getCoverageConfig('test').collectCoverageFrom);
"
```

#### 3. Analyze Uncovered Code
```bash
# Generate detailed HTML report
npm run test:coverage
open coverage/lcov-report/index.html
```

#### 4. Validate Configuration
```bash
# Test configuration loading
node -e "
const { validateCoverageConfig, getCoverageConfig } = require('./coverage.config.js');
const config = getCoverageConfig('test');
validateCoverageConfig(config);
console.log('Configuration valid');
"
```

## Best Practices

### Writing Testable Code

1. **Keep Functions Small**: Easier to achieve 100% coverage
2. **Avoid Complex Conditionals**: Reduces branch coverage requirements
3. **Separate Concerns**: Makes testing individual components easier
4. **Use Dependency Injection**: Enables better mocking and testing

### Coverage Strategy

1. **Start with Critical Code**: Focus on security and auth first
2. **Incremental Improvement**: Gradually increase coverage thresholds
3. **Quality over Quantity**: Meaningful tests are better than coverage padding
4. **Regular Review**: Monitor coverage trends and address gaps

### CI/CD Integration

1. **Fail Fast**: Set appropriate thresholds to catch issues early
2. **Provide Feedback**: Use PR comments to guide developers
3. **Track Trends**: Monitor coverage changes over time
4. **Automate Reporting**: Generate and share coverage reports automatically

## Maintenance

### Regular Tasks

#### Weekly
- Review coverage reports for trends
- Address critical coverage gaps
- Update coverage thresholds if needed

#### Monthly
- Analyze coverage trends
- Review and update file categorizations
- Optimize test performance

#### Quarterly
- Review coverage strategy
- Update documentation
- Evaluate new coverage tools

### Updating Thresholds

When updating coverage thresholds:

1. **Gradual Increases**: Increase by 5-10% at a time
2. **Team Communication**: Discuss changes with the team
3. **Documentation**: Update this document
4. **Testing**: Verify changes work in CI/CD

### Adding New File Categories

To add new file categories with specific thresholds:

1. **Update Configuration**:
   ```javascript
   // In coverage.config.js
   './new-category/': {
     branches: 85,
     functions: 85,
     lines: 85,
     statements: 85,
   }
   ```

2. **Update Documentation**: Add to this file
3. **Test Changes**: Verify thresholds are enforced
4. **Communicate**: Inform the team of new requirements

## Integration with Other Tools

### Codecov
- Automatic upload via GitHub Actions
- Trend analysis and reporting
- PR integration and comments

### SonarQube (Future)
- Code quality and coverage analysis
- Security vulnerability detection
- Technical debt tracking

### IDE Integration
- VS Code coverage extensions
- IntelliJ coverage runners
- Real-time coverage feedback

## Metrics and KPIs

### Coverage Metrics
- **Overall Coverage**: Target 80%+
- **Security Coverage**: Target 95%+
- **Critical Path Coverage**: Target 90%+
- **New Code Coverage**: Target 85%+

### Quality Metrics
- **Test Execution Time**: < 5 minutes
- **Coverage Report Generation**: < 30 seconds
- **Badge Update Frequency**: On every commit
- **False Positive Rate**: < 5%

## Future Enhancements

### Planned Features
1. **Visual Coverage Diff**: Show coverage changes in PRs
2. **Coverage Heatmaps**: Visual representation of coverage
3. **Intelligent Thresholds**: Dynamic thresholds based on file importance
4. **Performance Impact**: Track test execution performance

### Integration Opportunities
1. **IDE Plugins**: Real-time coverage feedback
2. **Slack Integration**: Coverage notifications
3. **Dashboard**: Centralized coverage monitoring
4. **ML Analysis**: Predictive coverage recommendations
