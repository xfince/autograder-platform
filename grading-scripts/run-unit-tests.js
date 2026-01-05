/**
 * grading-scripts/run-unit-tests.js
 *
 * Orchestrates execution of all unit tests and aggregates results
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

async function runUnitTests() {
  const results = {
    timestamp: new Date().toISOString(),
    total_tests: 0,
    passed: 0,
    failed: 0,
    success_rate: 0,
    execution_time_ms: 0,
    test_suites: {},
    criteria_scores: {},
  };

  const startTime = Date.now();

  console.error('🧪 Running Unit Tests...\n');

  // Define all test suites with their criterion mapping
  const testSuites = [
    // Backend Tests
    {
      name: 'API Endpoints',
      file: 'tests/backend/api-endpoints.test.js',
      criterion: 'criterion_3',
    },
    { name: 'Authentication', file: 'tests/backend/auth.test.js', criterion: 'criterion_5' },
    { name: 'Database', file: 'tests/backend/database.test.js', criterion: 'criterion_4' },
    { name: 'Middleware', file: 'tests/backend/middleware.test.js', criterion: 'criterion_3' },
    {
      name: 'Error Handling',
      file: 'tests/backend/error-handling.test.js',
      criterion: 'criterion_3',
    },

    // Integration Tests
    {
      name: 'API Integration',
      file: 'tests/integration/api-calls.test.js',
      criterion: 'criterion_6',
    },
    { name: 'Data Flow', file: 'tests/integration/data-flow.test.js', criterion: 'criterion_6' },

    // Deployment Tests
    {
      name: 'Deployment',
      file: 'tests/deployment/url-accessibility.test.js',
      criterion: 'criterion_16',
    },

    // Performance Tests
    { name: 'Performance', file: 'tests/performance/load-time.test.js', criterion: 'criterion_14' },

    // Frontend Tests
    { name: 'Components', file: 'tests/frontend/components.test.js', criterion: 'criterion_2' },
    { name: 'Hooks', file: 'tests/frontend/hooks.test.js', criterion: 'criterion_2' },
    { name: 'Routing', file: 'tests/frontend/routing.test.js', criterion: 'criterion_2' },

    // System Tests
    { name: 'Git History', file: 'tests/git/commit-history.test.js', criterion: 'criterion_10' },
    { name: 'Security', file: 'tests/security/env-variables.test.js', criterion: 'criterion_13' },
    {
      name: 'TypeScript & Testing',
      file: 'tests/typescript/type-checking.test.js',
      criteria: ['criterion_9', 'criterion_11'],
    },
  ];

  // Run each test suite
  for (const suite of testSuites) {
    console.error(`\n📋 Running: ${suite.name}`);

    try {
      if (!fs.existsSync(suite.file)) {
        console.error(`   ⚠️  Test file not found: ${suite.file}`);
        results.test_suites[suite.name] = {
          status: 'skipped',
          reason: 'Test file not found',
        };
        continue;
      }

      // Run the test suite using Jest
      const output = execSync(`npx jest ${suite.file} --json --silent`, {
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe'],
        maxBuffer: 10 * 1024 * 1024, // 10MB buffer
      });

      const testResult = JSON.parse(output);

      const suiteResult = {
        status: testResult.success ? 'passed' : 'failed',
        total: testResult.numTotalTests || 0,
        passed: testResult.numPassedTests || 0,
        failed: testResult.numFailedTests || 0,
        duration_ms: testResult.testResults?.[0]?.perfStats?.runtime || 0,
        criterion: suite.criterion || suite.criteria,
      };

      results.test_suites[suite.name] = suiteResult;
      results.total_tests += suiteResult.total;
      results.passed += suiteResult.passed;
      results.failed += suiteResult.failed;

      console.error(`   ✅ Passed: ${suiteResult.passed}/${suiteResult.total}`);
    } catch (error) {
      console.error(`   ❌ Suite failed or error occurred`);
      console.error(`   Error: ${error.message}`);
      if (error.stderr) {
        console.error(`   Stderr: ${error.stderr.toString().substring(0, 500)}`);
      }

      // Try to parse error output for test results
      try {
        const errorOutput = error.stdout || error.stderr || '';
        const jsonMatch = errorOutput.match(/\{[\s\S]*"success"[\s\S]*\}/);

        if (jsonMatch) {
          const testResult = JSON.parse(jsonMatch[0]);

          results.test_suites[suite.name] = {
            status: 'failed',
            total: testResult.numTotalTests || 0,
            passed: testResult.numPassedTests || 0,
            failed: testResult.numFailedTests || 0,
            error: testResult.testResults?.[0]?.message,
          };

          results.total_tests += testResult.numTotalTests || 0;
          results.passed += testResult.numPassedTests || 0;
          results.failed += testResult.numFailedTests || 0;
        } else {
          results.test_suites[suite.name] = {
            status: 'error',
            error: error.message || 'Unknown error',
          };
        }
      } catch (parseError) {
        results.test_suites[suite.name] = {
          status: 'error',
          error: 'Failed to parse test results',
        };
      }
    }
  }

  // Calculate success rate
  results.execution_time_ms = Date.now() - startTime;
  results.success_rate =
    results.total_tests > 0 ? ((results.passed / results.total_tests) * 100).toFixed(2) : 0;

  // Map results to criteria
  results.criteria_scores = mapTestsToCriteria(results.test_suites);

  // Print summary
  console.error('\n' + '='.repeat(60));
  console.error('📊 UNIT TEST SUMMARY');
  console.error('='.repeat(60));
  console.error(`Total Tests: ${results.total_tests}`);
  console.error(`Passed: ${results.passed} ✅`);
  console.error(`Failed: ${results.failed} ❌`);
  console.error(`Success Rate: ${results.success_rate}%`);
  console.error(`Execution Time: ${(results.execution_time_ms / 1000).toFixed(2)}s`);
  console.error('='.repeat(60) + '\n');

  // Output JSON to stdout for workflow to capture
  console.log(JSON.stringify(results, null, 2));

  return results;
}

function mapTestsToCriteria(testSuites) {
  const criteriaScores = {};

  // Initialize all criteria
  for (let i = 1; i <= 16; i++) {
    criteriaScores[`criterion_${i}`] = {
      total_tests: 0,
      passed: 0,
      failed: 0,
      score: 0,
      max_score: 4,
    };
  }

  // Map test results to criteria
  Object.entries(testSuites).forEach(([suiteName, suiteResult]) => {
    if (suiteResult.criterion) {
      const criterion = criteriaScores[suiteResult.criterion];
      if (criterion) {
        criterion.total_tests += suiteResult.total || 0;
        criterion.passed += suiteResult.passed || 0;
        criterion.failed += suiteResult.failed || 0;
      }
    } else if (suiteResult.criteria && Array.isArray(suiteResult.criteria)) {
      // Handle multiple criteria (like TypeScript & Testing)
      suiteResult.criteria.forEach((crit) => {
        const criterion = criteriaScores[crit];
        if (criterion) {
          criterion.total_tests += (suiteResult.total || 0) / suiteResult.criteria.length;
          criterion.passed += (suiteResult.passed || 0) / suiteResult.criteria.length;
          criterion.failed += (suiteResult.failed || 0) / suiteResult.criteria.length;
        }
      });
    }
  });

  // Calculate scores (0-4 scale based on pass percentage)
  Object.values(criteriaScores).forEach((criterion) => {
    if (criterion.total_tests > 0) {
      const passRate = criterion.passed / criterion.total_tests;

      // Scale to 0-4
      if (passRate >= 0.9)
        criterion.score = 4.0; // Excellent: 90%+
      else if (passRate >= 0.75)
        criterion.score = 3.5; // Good-Excellent: 75-89%
      else if (passRate >= 0.6)
        criterion.score = 3.0; // Good: 60-74%
      else if (passRate >= 0.5)
        criterion.score = 2.5; // Fair-Good: 50-59%
      else if (passRate >= 0.4)
        criterion.score = 2.0; // Fair: 40-49%
      else if (passRate >= 0.25)
        criterion.score = 1.5; // Poor-Fair: 25-39%
      else criterion.score = 1.0; // Poor: <25%
    }
  });

  return criteriaScores;
}

// Run if called directly
if (require.main === module) {
  runUnitTests()
    .then((results) => {
      process.exit(results.failed > 0 ? 1 : 0);
    })
    .catch((error) => {
      console.error('Fatal error running tests:', error);
      process.exit(1);
    });
}

module.exports = { runUnitTests };
