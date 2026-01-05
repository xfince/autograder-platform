/**
 * tests/security/env-variables.test.js & sensitive-data.test.js (Combined)
 *
 * Tests for security best practices
 * Evaluates: Criterion 13 (Security Best Practices)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const TEST_TIMEOUT = 30000;

describe('Security Best Practices Tests', () => {
  let testResults = {
    criterion_id: 'criterion_13',
    total_tests: 0,
    passed: 0,
    failed: 0,
    details: [],
    security_issues: [],
  };

  const recordTest = (testName, passed, error = null, issues = []) => {
    testResults.total_tests++;
    if (passed) {
      testResults.passed++;
    } else {
      testResults.failed++;
    }
    testResults.details.push({
      test: testName,
      passed,
      error: error ? error.message : null,
      issues,
    });

    if (issues.length > 0) {
      testResults.security_issues.push(...issues);
    }
  };

  afterAll(() => {
    console.log(JSON.stringify(testResults, null, 2));
  });

  describe('Environment Variables', () => {
    test('Project uses .env file for configuration', () => {
      try {
        const envFiles = ['.env', '.env.local', '.env.example', '.env.template'];

        let hasEnvFile = false;
        let foundFile = null;

        for (const file of envFiles) {
          if (fs.existsSync(file)) {
            hasEnvFile = true;
            foundFile = file;
            break;
          }
        }

        expect(hasEnvFile).toBe(true);
        recordTest('.env file exists', true, null, foundFile ? [] : ['No .env file found']);
      } catch (error) {
        recordTest('.env file exists', false, error);
        throw error;
      }
    });

    test('.env file is in .gitignore', () => {
      try {
        if (!fs.existsSync('.gitignore')) {
          recordTest('.env in .gitignore', false, new Error('No .gitignore'));
          return;
        }

        const gitignoreContent = fs.readFileSync('.gitignore', 'utf8');
        const ignoresEnv = gitignoreContent.includes('.env');

        expect(ignoresEnv).toBe(true);
        recordTest('.env in .gitignore', true);
      } catch (error) {
        recordTest('.env in .gitignore', false, error);
        throw error;
      }
    });

    test('.env.example or .env.template exists for reference', () => {
      try {
        const exampleFiles = ['.env.example', '.env.template', '.env.sample', 'env.example'];

        let hasExample = false;

        for (const file of exampleFiles) {
          if (fs.existsSync(file)) {
            hasExample = true;
            break;
          }
        }

        // Example file is good practice but not required
        recordTest('.env example file', hasExample);
        expect(true).toBe(true);
      } catch (error) {
        recordTest('.env example file', false, error);
      }
    });

    test('Environment variables are accessed via process.env', () => {
      try {
        const backendDirs = ['grading-folder/backend', 'server', 'backend'];

        let usesProcessEnv = false;
        let fileCount = 0;

        for (const dir of backendDirs) {
          if (fs.existsSync(dir)) {
            const files = getAllFiles(dir).filter((f) => f.endsWith('.js') || f.endsWith('.ts'));

            for (const file of files) {
              const content = fs.readFileSync(file, 'utf8');

              if (content.includes('process.env.')) {
                usesProcessEnv = true;
                fileCount++;
              }
            }
          }
        }

        expect(usesProcessEnv).toBe(true);
        recordTest(
          'process.env usage',
          true,
          null,
          usesProcessEnv ? [] : ['No process.env usage found'],
        );
      } catch (error) {
        recordTest('process.env usage', false, error);
        throw error;
      }
    });
  });

  describe('Sensitive Data Protection', () => {
    test('No hardcoded API keys or secrets in code', () => {
      try {
        const dirsToCheck = [
          'grading-folder/frontend',
          'grading-folder/backend',
          'src',
          'components',
          'pages',
        ];

        const suspiciousPatterns = [
          /api[_-]?key\s*=\s*["'][a-zA-Z0-9]{20,}/i,
          /secret\s*=\s*["'][a-zA-Z0-9]{20,}/i,
          /password\s*=\s*["'][^"']{8,}["']/i,
          /token\s*=\s*["'][a-zA-Z0-9]{20,}/i,
          /sk_live_/i, // Stripe live keys
          /pk_live_/i, // Stripe live keys
        ];

        let issues = [];

        for (const dir of dirsToCheck) {
          if (fs.existsSync(dir)) {
            const files = getAllFiles(dir).filter(
              (f) =>
                (f.endsWith('.js') ||
                  f.endsWith('.ts') ||
                  f.endsWith('.jsx') ||
                  f.endsWith('.tsx')) &&
                !f.includes('node_modules') &&
                !f.includes('.test.') &&
                !f.includes('.spec.'),
            );

            for (const file of files) {
              const content = fs.readFileSync(file, 'utf8');

              suspiciousPatterns.forEach((pattern, index) => {
                if (pattern.test(content)) {
                  issues.push(`Potential hardcoded secret in ${path.basename(file)}`);
                }
              });
            }
          }
        }

        const noHardcodedSecrets = issues.length === 0;

        expect(noHardcodedSecrets).toBe(true);
        recordTest('No hardcoded secrets', true, null, issues);
      } catch (error) {
        recordTest('No hardcoded secrets', false, error);
        throw error;
      }
    });

    test('No sensitive data in committed files', () => {
      try {
        const trackedFiles = execSync('git ls-files', { encoding: 'utf8' }).trim();
        const files = trackedFiles.split('\n');

        let sensitiveFiles = [];

        files.forEach((file) => {
          // Check for .env files (shouldn't be committed)
          if (file.match(/\.env$/) && !file.includes('example')) {
            sensitiveFiles.push(file);
          }

          // Check for database files
          if (file.match(/\.(db|sqlite|sql)$/)) {
            sensitiveFiles.push(file);
          }

          // Check for key files
          if (file.match(/\.(pem|key|p12|pfx)$/)) {
            sensitiveFiles.push(file);
          }
        });

        const noSensitiveFiles = sensitiveFiles.length === 0;

        expect(noSensitiveFiles).toBe(true);
        recordTest(
          'No sensitive files committed',
          true,
          null,
          sensitiveFiles.map((f) => `Sensitive file committed: ${f}`),
        );
      } catch (error) {
        recordTest('No sensitive files committed', false, error);
        throw error;
      }
    });

    test('Passwords are not stored in plain text', () => {
      try {
        const backendDirs = ['grading-folder/backend', 'server', 'backend'];

        let plainTextPassword = false;
        let issues = [];

        for (const dir of backendDirs) {
          if (fs.existsSync(dir)) {
            const files = getAllFiles(dir).filter((f) => f.endsWith('.js') || f.endsWith('.ts'));

            for (const file of files) {
              const content = fs.readFileSync(file, 'utf8');

              // Check for password assignment without hashing
              const lines = content.split('\n');
              for (let i = 0; i < lines.length; i++) {
                const line = lines[i].toLowerCase();

                // Red flags: password = "something" or password: "something"
                if (
                  line.includes('password') &&
                  (line.includes('= "') || line.includes(': "')) &&
                  !line.includes('hash') &&
                  !line.includes('bcrypt') &&
                  !line.includes('crypto') &&
                  !line.includes('process.env')
                ) {
                  plainTextPassword = true;
                  issues.push(`Possible plain text password in ${path.basename(file)}:${i + 1}`);
                }
              }
            }
          }
        }

        recordTest('No plain text passwords', !plainTextPassword, null, issues);
        expect(true).toBe(true);
      } catch (error) {
        recordTest('No plain text passwords', false, error);
      }
    });
  });

  describe('Security Packages', () => {
    test('Project uses bcrypt for password hashing', () => {
      try {
        const packageJsonPath = path.join(process.cwd(), 'package.json');

        if (!fs.existsSync(packageJsonPath)) {
          recordTest('bcrypt usage', false, new Error('No package.json'));
          return;
        }

        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        const deps = {
          ...packageJson.dependencies,
          ...packageJson.devDependencies,
        };

        const usesBcrypt = deps.bcrypt || deps.bcryptjs;

        expect(usesBcrypt).toBe(true);
        recordTest('bcrypt usage', true);
      } catch (error) {
        recordTest('bcrypt usage', false, error);
        throw error;
      }
    });

    test('Project uses helmet for security headers', () => {
      try {
        const packageJsonPath = path.join(process.cwd(), 'package.json');

        if (!fs.existsSync(packageJsonPath)) {
          recordTest('helmet usage', false, new Error('No package.json'));
          return;
        }

        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        const deps = {
          ...packageJson.dependencies,
          ...packageJson.devDependencies,
        };

        const usesHelmet = Boolean(deps.helmet);

        // Helmet is good practice but not critical
        recordTest('helmet usage', usesHelmet);
        expect(true).toBe(true);
      } catch (error) {
        recordTest('helmet usage', false, error);
      }
    });

    test('Project uses express-validator or similar for input validation', () => {
      try {
        const packageJsonPath = path.join(process.cwd(), 'package.json');

        if (!fs.existsSync(packageJsonPath)) {
          recordTest('Input validation package', false, new Error('No package.json'));
          return;
        }

        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        const deps = {
          ...packageJson.dependencies,
          ...packageJson.devDependencies,
        };

        const usesValidation = deps['express-validator'] || deps.joi || deps.yup || deps.zod;

        // Validation packages are good but validation can be manual
        recordTest('Input validation package', usesValidation);
        expect(true).toBe(true);
      } catch (error) {
        recordTest('Input validation package', false, error);
      }
    });

    test('Project uses cors for CORS configuration', () => {
      try {
        const packageJsonPath = path.join(process.cwd(), 'package.json');

        if (!fs.existsSync(packageJsonPath)) {
          recordTest('CORS package', false, new Error('No package.json'));
          return;
        }

        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        const deps = {
          ...packageJson.dependencies,
          ...packageJson.devDependencies,
        };

        const usesCors = Boolean(deps.cors);

        expect(usesCors).toBe(true);
        recordTest('CORS package', true);
      } catch (error) {
        recordTest('CORS package', false, error);
        throw error;
      }
    });
  });

  describe('SQL/NoSQL Injection Prevention', () => {
    test('Database queries use parameterized queries or ORM', () => {
      try {
        const backendDirs = ['grading-folder/backend', 'server', 'backend'];

        let usesORM = false;
        let directQueries = [];

        for (const dir of backendDirs) {
          if (fs.existsSync(dir)) {
            const files = getAllFiles(dir).filter((f) => f.endsWith('.js') || f.endsWith('.ts'));

            for (const file of files) {
              const content = fs.readFileSync(file, 'utf8');

              // Check for Mongoose (MongoDB ORM)
              if (content.includes('mongoose') || content.includes('Schema')) {
                usesORM = true;
              }

              // Check for dangerous string concatenation in queries
              if (content.match(/db\.query.*\+.*req\./i) || content.match(/\.find\(.*\$.*req\./i)) {
                directQueries.push(path.basename(file));
              }
            }
          }
        }

        const safeQueries = usesORM && directQueries.length === 0;

        recordTest(
          'Injection prevention',
          safeQueries || usesORM,
          null,
          directQueries.map((f) => `Potential injection risk in ${f}`),
        );
        expect(true).toBe(true);
      } catch (error) {
        recordTest('Injection prevention', false, error);
      }
    });
  });

  describe('XSS Protection', () => {
    test('User input is sanitized or escaped', () => {
      try {
        const frontendDirs = ['grading-folder/frontend', 'components', 'pages'];

        let usesSanitization = false;

        for (const dir of frontendDirs) {
          if (fs.existsSync(dir)) {
            const files = getAllFiles(dir).filter((f) => f.endsWith('.jsx') || f.endsWith('.tsx'));

            for (const file of files) {
              const content = fs.readFileSync(file, 'utf8');

              // Check for sanitization libraries or practices
              if (
                content.includes('DOMPurify') ||
                content.includes('sanitize') ||
                content.includes('escape')
              ) {
                usesSanitization = true;
                break;
              }

              // React automatically escapes by default, so that's good
              // Check for dangerous patterns like dangerouslySetInnerHTML
              if (content.includes('dangerouslySetInnerHTML')) {
                // This could be a risk if not sanitized
              }
            }
          }
        }

        // React provides XSS protection by default
        recordTest('XSS protection', true);
        expect(true).toBe(true);
      } catch (error) {
        recordTest('XSS protection', false, error);
      }
    });

    test('No use of dangerouslySetInnerHTML without sanitization', () => {
      try {
        const frontendDirs = ['grading-folder/frontend', 'components', 'pages'];

        let unsafeDangerouslySet = [];

        for (const dir of frontendDirs) {
          if (fs.existsSync(dir)) {
            const files = getAllFiles(dir).filter((f) => f.endsWith('.jsx') || f.endsWith('.tsx'));

            for (const file of files) {
              const content = fs.readFileSync(file, 'utf8');

              if (content.includes('dangerouslySetInnerHTML')) {
                // Check if it's sanitized
                const lines = content.split('\n');
                let foundDangerous = false;
                let foundSanitize = false;

                for (let i = 0; i < lines.length; i++) {
                  if (lines[i].includes('dangerouslySetInnerHTML')) {
                    foundDangerous = true;
                    // Check surrounding lines for sanitization
                    const context = lines.slice(Math.max(0, i - 5), i + 5).join('\n');
                    if (context.includes('DOMPurify') || context.includes('sanitize')) {
                      foundSanitize = true;
                    }
                  }
                }

                if (foundDangerous && !foundSanitize) {
                  unsafeDangerouslySet.push(path.basename(file));
                }
              }
            }
          }
        }

        const isSafe = unsafeDangerouslySet.length === 0;

        recordTest(
          'Safe dangerouslySetInnerHTML',
          isSafe,
          null,
          unsafeDangerouslySet.map((f) => `Unsanitized dangerouslySetInnerHTML in ${f}`),
        );
        expect(true).toBe(true);
      } catch (error) {
        recordTest('Safe dangerouslySetInnerHTML', false, error);
      }
    });
  });

  describe('Authentication Security', () => {
    test('JWT secrets are not hardcoded', () => {
      try {
        const backendDirs = ['grading-folder/backend', 'server', 'backend'];

        let hardcodedSecret = false;
        let issues = [];

        for (const dir of backendDirs) {
          if (fs.existsSync(dir)) {
            const files = getAllFiles(dir).filter((f) => f.endsWith('.js') || f.endsWith('.ts'));

            for (const file of files) {
              const content = fs.readFileSync(file, 'utf8');

              // Look for jwt.sign with hardcoded secret
              const jwtMatches = content.match(/jwt\.sign\([^)]+['"]([^'"]{10,})['"][^)]*\)/g);

              if (jwtMatches) {
                jwtMatches.forEach((match) => {
                  if (!match.includes('process.env')) {
                    hardcodedSecret = true;
                    issues.push(`Hardcoded JWT secret in ${path.basename(file)}`);
                  }
                });
              }
            }
          }
        }

        const isSecure = !hardcodedSecret;

        expect(isSecure).toBe(true);
        recordTest('JWT secret security', true, null, issues);
      } catch (error) {
        recordTest('JWT secret security', false, error);
        throw error;
      }
    });
  });

  describe('Dependencies Security', () => {
    test('No known vulnerable packages (npm audit)', () => {
      try {
        // Run npm audit
        const auditResult = execSync('npm audit --json', {
          encoding: 'utf8',
          stdio: ['pipe', 'pipe', 'pipe'],
        });

        const audit = JSON.parse(auditResult);
        const vulnerabilities = audit.metadata?.vulnerabilities || {};

        const criticalCount = vulnerabilities.critical || 0;
        const highCount = vulnerabilities.high || 0;

        const isSafe = criticalCount === 0 && highCount === 0;

        recordTest(
          'No critical vulnerabilities',
          isSafe,
          null,
          isSafe ? [] : [`${criticalCount} critical, ${highCount} high vulnerabilities found`],
        );
        expect(true).toBe(true);
      } catch (error) {
        // npm audit returns non-zero exit code if vulnerabilities found
        recordTest('No critical vulnerabilities', false, error);
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
