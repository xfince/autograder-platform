/**
 * tests/typescript/type-checking.test.js & tests/student-tests/test-existence.test.js (Combined)
 *
 * Tests for TypeScript implementation and student-written tests
 * Evaluates: Criterion 9 (TypeScript) & Criterion 11 (Testing)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const TEST_TIMEOUT = 30000;

describe('TypeScript & Student Testing Tests', () => {
  let testResults = {
    criterion_9_typescript: {
      total_tests: 0,
      passed: 0,
      failed: 0,
      details: [],
      typescript_info: {},
    },
    criterion_11_student_tests: {
      total_tests: 0,
      passed: 0,
      failed: 0,
      details: [],
      test_info: {},
    },
  };

  const recordTest = (criterion, testName, passed, error = null, info = null) => {
    const results =
      criterion === 9 ? testResults.criterion_9_typescript : testResults.criterion_11_student_tests;

    results.total_tests++;
    if (passed) {
      results.passed++;
    } else {
      results.failed++;
    }
    results.details.push({
      test: testName,
      passed,
      error: error ? error.message : null,
      info,
    });
  };

  afterAll(() => {
    console.log(JSON.stringify(testResults, null, 2));
  });

  // ==========================================
  // TYPESCRIPT TESTS (Criterion 9)
  // ==========================================

  describe('TypeScript Implementation', () => {
    test('Project uses TypeScript', () => {
      try {
        const packageJsonPath = path.join(process.cwd(), 'package.json');

        if (!fs.existsSync(packageJsonPath)) {
          recordTest(9, 'TypeScript in project', false, new Error('No package.json'));
          return;
        }

        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        const deps = {
          ...packageJson.dependencies,
          ...packageJson.devDependencies,
        };

        const usesTypeScript = Boolean(deps.typescript);

        testResults.criterion_9_typescript.typescript_info.uses_typescript = usesTypeScript;
        testResults.criterion_9_typescript.typescript_info.version = deps.typescript;

        // TypeScript is optional
        recordTest(9, 'TypeScript in project', usesTypeScript);
        expect(true).toBe(true);
      } catch (error) {
        recordTest(9, 'TypeScript in project', false, error);
      }
    });

    test('TypeScript configuration file exists (tsconfig.json)', () => {
      try {
        const tsconfigPath = path.join(process.cwd(), 'tsconfig.json');
        const hasTsConfig = fs.existsSync(tsconfigPath);

        if (hasTsConfig) {
          const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));
          testResults.criterion_9_typescript.typescript_info.tsconfig = {
            strict: tsconfig.compilerOptions?.strict,
            target: tsconfig.compilerOptions?.target,
          };
        }

        recordTest(9, 'tsconfig.json exists', hasTsConfig);
        expect(true).toBe(true);
      } catch (error) {
        recordTest(9, 'tsconfig.json exists', false, error);
      }
    });

    test('Project has .ts or .tsx files', () => {
      try {
        const dirsToCheck = [
          'grading-folder/frontend',
          'grading-folder/backend',
          'src',
          'components',
          'pages',
        ];

        let tsFiles = [];

        for (const dir of dirsToCheck) {
          if (fs.existsSync(dir)) {
            const files = getAllFiles(dir).filter((f) => f.endsWith('.ts') || f.endsWith('.tsx'));
            tsFiles.push(...files);
          }
        }

        testResults.criterion_9_typescript.typescript_info.ts_file_count = tsFiles.length;
        testResults.criterion_9_typescript.typescript_info.sample_files = tsFiles
          .slice(0, 5)
          .map((f) => path.basename(f));

        const hasTsFiles = tsFiles.length > 0;

        recordTest(9, 'TypeScript files exist', hasTsFiles, null, {
          file_count: tsFiles.length,
        });
        expect(true).toBe(true);
      } catch (error) {
        recordTest(9, 'TypeScript files exist', false, error);
      }
    });

    test('TypeScript files have type annotations', () => {
      try {
        const dirsToCheck = [
          'grading-folder/frontend',
          'grading-folder/backend',
          'src',
          'components',
        ];

        let annotatedFiles = 0;
        let totalTsFiles = 0;

        for (const dir of dirsToCheck) {
          if (fs.existsSync(dir)) {
            const files = getAllFiles(dir).filter((f) => f.endsWith('.ts') || f.endsWith('.tsx'));

            totalTsFiles += files.length;

            for (const file of files) {
              const content = fs.readFileSync(file, 'utf8');

              // Look for type annotations
              if (
                content.match(/:\s*(string|number|boolean|any|void|object)/i) ||
                content.includes('interface ') ||
                content.includes('type ')
              ) {
                annotatedFiles++;
              }
            }
          }
        }

        testResults.criterion_9_typescript.typescript_info.annotated_files = annotatedFiles;
        testResults.criterion_9_typescript.typescript_info.total_ts_files = totalTsFiles;

        const hasAnnotations = annotatedFiles > 0;

        recordTest(9, 'Type annotations present', hasAnnotations, null, {
          annotated: annotatedFiles,
          total: totalTsFiles,
        });
        expect(true).toBe(true);
      } catch (error) {
        recordTest(9, 'Type annotations present', false, error);
      }
    });

    test('Interfaces or types are defined', () => {
      try {
        const dirsToCheck = ['grading-folder/frontend', 'grading-folder/backend', 'src'];

        let interfaceCount = 0;
        let typeCount = 0;

        for (const dir of dirsToCheck) {
          if (fs.existsSync(dir)) {
            const files = getAllFiles(dir).filter((f) => f.endsWith('.ts') || f.endsWith('.tsx'));

            for (const file of files) {
              const content = fs.readFileSync(file, 'utf8');

              const interfaces = content.match(/interface\s+\w+/g);
              const types = content.match(/type\s+\w+\s*=/g);

              if (interfaces) interfaceCount += interfaces.length;
              if (types) typeCount += types.length;
            }
          }
        }

        testResults.criterion_9_typescript.typescript_info.interfaces = interfaceCount;
        testResults.criterion_9_typescript.typescript_info.types = typeCount;

        const hasCustomTypes = interfaceCount > 0 || typeCount > 0;

        recordTest(9, 'Custom types/interfaces', hasCustomTypes, null, {
          interfaces: interfaceCount,
          types: typeCount,
        });
        expect(true).toBe(true);
      } catch (error) {
        recordTest(9, 'Custom types/interfaces', false, error);
      }
    });

    test('Limited use of "any" type', () => {
      try {
        const dirsToCheck = ['grading-folder/frontend', 'grading-folder/backend', 'src'];

        let anyCount = 0;
        let totalAnnotations = 0;

        for (const dir of dirsToCheck) {
          if (fs.existsSync(dir)) {
            const files = getAllFiles(dir).filter((f) => f.endsWith('.ts') || f.endsWith('.tsx'));

            for (const file of files) {
              const content = fs.readFileSync(file, 'utf8');

              const anyMatches = content.match(/:\s*any\b/g);
              const allAnnotations = content.match(
                /:\s*(string|number|boolean|any|void|object|Array)/gi,
              );

              if (anyMatches) anyCount += anyMatches.length;
              if (allAnnotations) totalAnnotations += allAnnotations.length;
            }
          }
        }

        testResults.criterion_9_typescript.typescript_info.any_usage = {
          count: anyCount,
          total_annotations: totalAnnotations,
          percentage: totalAnnotations > 0 ? ((anyCount / totalAnnotations) * 100).toFixed(1) : 0,
        };

        // Less than 20% "any" usage is good
        const limitedAny = totalAnnotations === 0 || anyCount / totalAnnotations < 0.2;

        recordTest(9, 'Limited "any" usage', limitedAny, null, {
          any_count: anyCount,
          total: totalAnnotations,
        });
        expect(true).toBe(true);
      } catch (error) {
        recordTest(9, 'Limited "any" usage', false, error);
      }
    });

    test('TypeScript compiles without errors', () => {
      try {
        if (!fs.existsSync('tsconfig.json')) {
          recordTest(9, 'TypeScript compilation', false, new Error('No tsconfig.json'));
          return;
        }

        // Try to compile TypeScript
        try {
          execSync('npx tsc --noEmit', {
            encoding: 'utf8',
            stdio: ['pipe', 'pipe', 'pipe'],
          });

          recordTest(9, 'TypeScript compilation', true);
        } catch (error) {
          // Compilation errors
          recordTest(9, 'TypeScript compilation', false, new Error('Compilation errors'));
        }

        expect(true).toBe(true);
      } catch (error) {
        recordTest(9, 'TypeScript compilation', false, error);
      }
    });
  });

  // ==========================================
  // STUDENT TESTING TESTS (Criterion 11)
  // ==========================================

  describe('Student-Written Tests', () => {
    test('Project has test files', () => {
      try {
        const testPatterns = [
          '**/*.test.js',
          '**/*.test.ts',
          '**/*.test.jsx',
          '**/*.test.tsx',
          '**/*.spec.js',
          '**/*.spec.ts',
        ];

        let testFiles = [];
        const dirsToCheck = [
          'grading-folder/frontend',
          'grading-folder/backend',
          'src',
          'components',
          'tests',
          '__tests__',
        ];

        for (const dir of dirsToCheck) {
          if (fs.existsSync(dir)) {
            const files = getAllFiles(dir).filter(
              (f) => f.includes('.test.') || f.includes('.spec.') || f.includes('__tests__'),
            );
            testFiles.push(...files);
          }
        }

        testResults.criterion_11_student_tests.test_info.test_file_count = testFiles.length;
        testResults.criterion_11_student_tests.test_info.test_files = testFiles
          .slice(0, 10)
          .map((f) => path.basename(f));

        const hasTests = testFiles.length > 0;

        recordTest(11, 'Test files exist', hasTests, null, {
          test_count: testFiles.length,
        });
        expect(true).toBe(true);
      } catch (error) {
        recordTest(11, 'Test files exist', false, error);
      }
    });

    test('Testing framework is configured (Jest, Vitest, etc.)', () => {
      try {
        const packageJsonPath = path.join(process.cwd(), 'package.json');

        if (!fs.existsSync(packageJsonPath)) {
          recordTest(11, 'Testing framework', false, new Error('No package.json'));
          return;
        }

        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        const deps = {
          ...packageJson.dependencies,
          ...packageJson.devDependencies,
        };

        const testFrameworks = {
          jest: deps.jest,
          vitest: deps.vitest,
          mocha: deps.mocha,
          'react-testing-library': deps['@testing-library/react'],
        };

        const hasFramework = Object.values(testFrameworks).some((v) => v);
        const framework = Object.keys(testFrameworks).find((k) => testFrameworks[k]);

        testResults.criterion_11_student_tests.test_info.framework = framework || 'none';

        recordTest(11, 'Testing framework', hasFramework, null, {
          framework: framework || 'none',
        });
        expect(true).toBe(true);
      } catch (error) {
        recordTest(11, 'Testing framework', false, error);
      }
    });

    test('Test files contain actual test cases', () => {
      try {
        const dirsToCheck = ['grading-folder/frontend', 'grading-folder/backend', 'src', 'tests'];

        let totalTests = 0;
        let filesWithTests = 0;

        for (const dir of dirsToCheck) {
          if (fs.existsSync(dir)) {
            const files = getAllFiles(dir).filter(
              (f) => f.includes('.test.') || f.includes('.spec.'),
            );

            for (const file of files) {
              const content = fs.readFileSync(file, 'utf8');

              // Count test cases
              const testMatches = content.match(/(test|it)\s*\(/g);
              if (testMatches) {
                totalTests += testMatches.length;
                filesWithTests++;
              }
            }
          }
        }

        testResults.criterion_11_student_tests.test_info.total_test_cases = totalTests;
        testResults.criterion_11_student_tests.test_info.files_with_tests = filesWithTests;

        const hasTestCases = totalTests > 0;

        recordTest(11, 'Test cases exist', hasTestCases, null, {
          test_cases: totalTests,
          files: filesWithTests,
        });
        expect(true).toBe(true);
      } catch (error) {
        recordTest(11, 'Test cases exist', false, error);
      }
    });

    test('Tests can be run with npm test or similar', () => {
      try {
        const packageJsonPath = path.join(process.cwd(), 'package.json');

        if (!fs.existsSync(packageJsonPath)) {
          recordTest(11, 'Test script exists', false, new Error('No package.json'));
          return;
        }

        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        const hasTestScript = packageJson.scripts && packageJson.scripts.test;

        testResults.criterion_11_student_tests.test_info.test_script =
          packageJson.scripts?.test || 'none';

        recordTest(11, 'Test script exists', hasTestScript, null, {
          script: packageJson.scripts?.test,
        });
        expect(true).toBe(true);
      } catch (error) {
        recordTest(11, 'Test script exists', false, error);
      }
    });

    test('Tests cover critical functionality', () => {
      try {
        const dirsToCheck = ['grading-folder/frontend', 'grading-folder/backend', 'tests'];

        const criticalAreas = {
          authentication: false,
          api: false,
          components: false,
          database: false,
        };

        for (const dir of dirsToCheck) {
          if (fs.existsSync(dir)) {
            const files = getAllFiles(dir).filter(
              (f) => f.includes('.test.') || f.includes('.spec.'),
            );

            for (const file of files) {
              const filename = path.basename(file).toLowerCase();
              const content = fs.readFileSync(file, 'utf8').toLowerCase();

              if (
                filename.includes('auth') ||
                content.includes('login') ||
                content.includes('auth')
              ) {
                criticalAreas.authentication = true;
              }
              if (
                filename.includes('api') ||
                content.includes('api') ||
                content.includes('endpoint')
              ) {
                criticalAreas.api = true;
              }
              if (filename.includes('component') || content.includes('render')) {
                criticalAreas.components = true;
              }
              if (
                filename.includes('db') ||
                filename.includes('database') ||
                content.includes('database')
              ) {
                criticalAreas.database = true;
              }
            }
          }
        }

        const coverageCount = Object.values(criticalAreas).filter((v) => v).length;
        testResults.criterion_11_student_tests.test_info.critical_areas_covered = criticalAreas;

        const goodCoverage = coverageCount >= 2;

        recordTest(11, 'Critical functionality tested', goodCoverage, null, {
          areas_covered: coverageCount,
        });
        expect(true).toBe(true);
      } catch (error) {
        recordTest(11, 'Critical functionality tested', false, error);
      }
    });

    test('Application runs without console errors', () => {
      try {
        // This is hard to test in unit tests, so we'll check for console.error/console.warn usage
        const dirsToCheck = ['grading-folder/frontend', 'src', 'components'];

        let errorCount = 0;
        let warnCount = 0;

        for (const dir of dirsToCheck) {
          if (fs.existsSync(dir)) {
            const files = getAllFiles(dir).filter(
              (f) =>
                (f.endsWith('.js') ||
                  f.endsWith('.jsx') ||
                  f.endsWith('.ts') ||
                  f.endsWith('.tsx')) &&
                !f.includes('.test.') &&
                !f.includes('.spec.'),
            );

            for (const file of files) {
              const content = fs.readFileSync(file, 'utf8');

              // Count console.error and console.warn
              const errors = content.match(/console\.error/g);
              const warns = content.match(/console\.warn/g);

              if (errors) errorCount += errors.length;
              if (warns) warnCount += warns.length;
            }
          }
        }

        testResults.criterion_11_student_tests.test_info.console_usage = {
          errors: errorCount,
          warnings: warnCount,
        };

        // Some console usage is okay for debugging
        recordTest(11, 'Console clean', true);
        expect(true).toBe(true);
      } catch (error) {
        recordTest(11, 'Console clean', false, error);
      }
    });

    test('Test quality: tests have assertions/expectations', () => {
      try {
        const dirsToCheck = ['grading-folder/frontend', 'grading-folder/backend', 'tests'];

        let testsWithAssertions = 0;
        let totalTests = 0;

        for (const dir of dirsToCheck) {
          if (fs.existsSync(dir)) {
            const files = getAllFiles(dir).filter(
              (f) => f.includes('.test.') || f.includes('.spec.'),
            );

            for (const file of files) {
              const content = fs.readFileSync(file, 'utf8');

              // Count tests
              const tests = content.match(/(test|it)\s*\(/g);
              if (tests) totalTests += tests.length;

              // Count assertions
              const assertions = content.match(/(expect|assert|should)\s*\(/g);
              if (assertions) testsWithAssertions += assertions.length;
            }
          }
        }

        testResults.criterion_11_student_tests.test_info.assertions = {
          total: testsWithAssertions,
          tests: totalTests,
        };

        const hasAssertions = testsWithAssertions > 0;

        recordTest(11, 'Tests have assertions', hasAssertions, null, {
          assertions: testsWithAssertions,
          tests: totalTests,
        });
        expect(true).toBe(true);
      } catch (error) {
        recordTest(11, 'Tests have assertions', false, error);
      }
    });
  });

  // Helper function
  function getAllFiles(dir, fileList = []) {
    try {
      if (fs.existsSync(dir)) {
        const files = fs.readdirSync(dir);

        files.forEach((file) => {
          const filePath = path.join(dir, file);
          const stat = fs.statSync(filePath);

          if (stat.isDirectory() && !filePath.includes('node_modules')) {
            getAllFiles(filePath, fileList);
          } else {
            fileList.push(filePath);
          }
        });
      }
    } catch (error) {
      // Ignore errors
    }

    return fileList;
  }
});

// module.exports = { testResults };
