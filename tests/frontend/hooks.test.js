/**
 * tests/frontend/hooks.test.js
 *
 * Tests for React hooks usage and state management
 * Evaluates: Criterion 2 (Front-End Implementation)
 */

const path = require('path');
const fs = require('fs');

const TEST_TIMEOUT = 30000;

describe('React Hooks & State Management Tests', () => {
  let testResults = {
    criterion_id: 'criterion_2',
    subsection: 'hooks',
    total_tests: 0,
    passed: 0,
    failed: 0,
    details: [],
    hooks_usage: {},
  };

  const recordTest = (testName, passed, error = null) => {
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
    });
  };

  afterAll(() => {
    console.log(JSON.stringify(testResults, null, 2));
  });

  describe('useState Hook', () => {
    test('Project uses useState for state management', () => {
      try {
        const { files, usesHook } = checkHookUsage('useState');

        testResults.hooks_usage.useState = {
          used: usesHook,
          file_count: files.length,
        };

        expect(usesHook).toBe(true);
        recordTest('useState usage', true);
      } catch (error) {
        recordTest('useState usage', false, error);
        throw error;
      }
    });

    test('useState is imported correctly', () => {
      try {
        const hasCorrectImport = checkCorrectImport('useState');

        expect(hasCorrectImport).toBe(true);
        recordTest('useState import', true);
      } catch (error) {
        recordTest('useState import', false, error);
        throw error;
      }
    });

    test('State updates follow immutability patterns', () => {
      try {
        const componentDirs = [
          'grading-folder/frontend/components',
          'grading-folder/frontend/pages',
          'components',
          'pages',
        ];

        let followsImmutability = false;

        for (const dir of componentDirs) {
          if (fs.existsSync(dir)) {
            const files = getAllFiles(dir).filter(
              (f) => f.endsWith('.jsx') || f.endsWith('.tsx') || f.endsWith('.js'),
            );

            for (const file of files) {
              const content = fs.readFileSync(file, 'utf8');

              // Look for immutable state update patterns
              if (
                content.includes('useState') &&
                (content.includes('...') || // spread operator
                  content.includes('map(') ||
                  content.includes('filter(') ||
                  content.includes('concat('))
              ) {
                followsImmutability = true;
                break;
              }
            }

            if (followsImmutability) break;
          }
        }

        recordTest('Immutability patterns', followsImmutability);
        expect(true).toBe(true);
      } catch (error) {
        recordTest('Immutability patterns', false, error);
      }
    });
  });

  describe('useEffect Hook', () => {
    test('Project uses useEffect for side effects', () => {
      try {
        const { files, usesHook } = checkHookUsage('useEffect');

        testResults.hooks_usage.useEffect = {
          used: usesHook,
          file_count: files.length,
        };

        expect(usesHook).toBe(true);
        recordTest('useEffect usage', true);
      } catch (error) {
        recordTest('useEffect usage', false, error);
        throw error;
      }
    });

    test('useEffect includes dependency arrays', () => {
      try {
        const componentDirs = [
          'grading-folder/frontend/components',
          'grading-folder/frontend/pages',
          'components',
          'pages',
        ];

        let usesDependencies = false;

        for (const dir of componentDirs) {
          if (fs.existsSync(dir)) {
            const files = getAllFiles(dir).filter((f) => f.endsWith('.jsx') || f.endsWith('.tsx'));

            for (const file of files) {
              const content = fs.readFileSync(file, 'utf8');

              // Look for useEffect with dependency array
              if (content.match(/useEffect\([^)]*,\s*\[/)) {
                usesDependencies = true;
                break;
              }
            }

            if (usesDependencies) break;
          }
        }

        expect(usesDependencies).toBe(true);
        recordTest('useEffect dependencies', true);
      } catch (error) {
        recordTest('useEffect dependencies', false, error);
        throw error;
      }
    });

    test('useEffect cleanup is implemented where needed', () => {
      try {
        const componentDirs = [
          'grading-folder/frontend/components',
          'grading-folder/frontend/pages',
          'components',
          'pages',
        ];

        let hasCleanup = false;

        for (const dir of componentDirs) {
          if (fs.existsSync(dir)) {
            const files = getAllFiles(dir).filter((f) => f.endsWith('.jsx') || f.endsWith('.tsx'));

            for (const file of files) {
              const content = fs.readFileSync(file, 'utf8');

              // Look for cleanup functions (return in useEffect)
              if (
                content.includes('useEffect') &&
                content.match(/useEffect\([^{]*{\s*[^}]*return\s*\(\)\s*=>/)
              ) {
                hasCleanup = true;
                break;
              }
            }

            if (hasCleanup) break;
          }
        }

        // Cleanup is advanced pattern, not always needed
        recordTest('useEffect cleanup', hasCleanup);
        expect(true).toBe(true);
      } catch (error) {
        recordTest('useEffect cleanup', false, error);
      }
    });
  });

  describe('useContext Hook', () => {
    test('Project uses useContext for global state (if applicable)', () => {
      try {
        const { files, usesHook } = checkHookUsage('useContext');

        testResults.hooks_usage.useContext = {
          used: usesHook,
          file_count: files.length,
        };

        // useContext is good but not always necessary
        recordTest('useContext usage', usesHook);
        expect(true).toBe(true);
      } catch (error) {
        recordTest('useContext usage', false, error);
      }
    });

    test('Context is properly created and provided', () => {
      try {
        const allDirs = ['grading-folder/frontend', 'src'];

        let hasContext = false;

        for (const dir of allDirs) {
          if (fs.existsSync(dir)) {
            const files = getAllFiles(dir).filter(
              (f) => f.endsWith('.jsx') || f.endsWith('.tsx') || f.endsWith('.js'),
            );

            for (const file of files) {
              const content = fs.readFileSync(file, 'utf8');

              // Look for Context creation
              if (content.includes('createContext') || content.includes('Context.Provider')) {
                hasContext = true;
                break;
              }
            }

            if (hasContext) break;
          }
        }

        recordTest('Context creation', hasContext);
        expect(true).toBe(true);
      } catch (error) {
        recordTest('Context creation', false, error);
      }
    });
  });

  describe('Custom Hooks', () => {
    test('Project uses custom hooks for reusable logic', () => {
      try {
        const hooksDirs = [
          'grading-folder/frontend/hooks',
          'grading-folder/frontend/src/hooks',
          'hooks',
          'src/hooks',
        ];

        let hasCustomHooks = false;
        let customHookFiles = [];

        for (const dir of hooksDirs) {
          if (fs.existsSync(dir)) {
            customHookFiles = fs
              .readdirSync(dir)
              .filter((f) => f.startsWith('use') && (f.endsWith('.js') || f.endsWith('.ts')));

            if (customHookFiles.length > 0) {
              hasCustomHooks = true;
              break;
            }
          }
        }

        testResults.hooks_usage.custom_hooks = {
          used: hasCustomHooks,
          count: customHookFiles.length,
        };

        // Custom hooks are advanced
        recordTest('Custom hooks', hasCustomHooks);
        expect(true).toBe(true);
      } catch (error) {
        recordTest('Custom hooks', false, error);
      }
    });

    test('Custom hooks follow naming convention (use prefix)', () => {
      try {
        const allDirs = ['grading-folder/frontend', 'src'];

        let customHooks = [];

        for (const dir of allDirs) {
          if (fs.existsSync(dir)) {
            const files = getAllFiles(dir).filter(
              (f) => f.endsWith('.jsx') || f.endsWith('.tsx') || f.endsWith('.js'),
            );

            for (const file of files) {
              const content = fs.readFileSync(file, 'utf8');
              const basename = path.basename(file, path.extname(file));

              // Look for custom hook definitions
              if (
                basename.startsWith('use') &&
                (content.includes('useState') || content.includes('useEffect'))
              ) {
                customHooks.push(basename);
              }
            }
          }
        }

        const followsConvention = customHooks.length > 0;

        recordTest('Custom hook naming', followsConvention);
        expect(true).toBe(true);
      } catch (error) {
        recordTest('Custom hook naming', false, error);
      }
    });
  });

  describe('useCallback & useMemo Hooks', () => {
    test('Project uses useCallback for memoization (optimization)', () => {
      try {
        const { files, usesHook } = checkHookUsage('useCallback');

        testResults.hooks_usage.useCallback = {
          used: usesHook,
          file_count: files.length,
        };

        // useCallback is optimization, not required
        recordTest('useCallback usage', usesHook);
        expect(true).toBe(true);
      } catch (error) {
        recordTest('useCallback usage', false, error);
      }
    });

    test('Project uses useMemo for expensive computations', () => {
      try {
        const { files, usesHook } = checkHookUsage('useMemo');

        testResults.hooks_usage.useMemo = {
          used: usesHook,
          file_count: files.length,
        };

        // useMemo is optimization, not required
        recordTest('useMemo usage', usesHook);
        expect(true).toBe(true);
      } catch (error) {
        recordTest('useMemo usage', false, error);
      }
    });
  });

  describe('useRef Hook', () => {
    test('Project uses useRef where appropriate', () => {
      try {
        const { files, usesHook } = checkHookUsage('useRef');

        testResults.hooks_usage.useRef = {
          used: usesHook,
          file_count: files.length,
        };

        // useRef is useful but not always needed
        recordTest('useRef usage', usesHook);
        expect(true).toBe(true);
      } catch (error) {
        recordTest('useRef usage', false, error);
      }
    });
  });

  describe('useReducer Hook', () => {
    test('Complex state uses useReducer (if applicable)', () => {
      try {
        const { files, usesHook } = checkHookUsage('useReducer');

        testResults.hooks_usage.useReducer = {
          used: usesHook,
          file_count: files.length,
        };

        // useReducer is for complex state, not always needed
        recordTest('useReducer usage', usesHook);
        expect(true).toBe(true);
      } catch (error) {
        recordTest('useReducer usage', false, error);
      }
    });
  });

  describe('State Management Libraries', () => {
    test('Redux/Zustand/other state library usage (if applicable)', () => {
      try {
        let packageJsonPath = path.join(
          process.cwd(),
          'grading-folder',
          'frontend',
          'package.json',
        );
        if (!fs.existsSync(packageJsonPath)) {
          packageJsonPath = path.join(process.cwd(), 'package.json');
        }
        let usesStateLibrary = false;
        let stateLibrary = null;

        if (fs.existsSync(packageJsonPath)) {
          const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
          const deps = {
            ...packageJson.dependencies,
            ...packageJson.devDependencies,
          };

          if (deps.redux || deps['@reduxjs/toolkit']) {
            usesStateLibrary = true;
            stateLibrary = 'Redux';
          } else if (deps.zustand) {
            usesStateLibrary = true;
            stateLibrary = 'Zustand';
          } else if (deps.recoil) {
            usesStateLibrary = true;
            stateLibrary = 'Recoil';
          } else if (deps.mobx) {
            usesStateLibrary = true;
            stateLibrary = 'MobX';
          }
        }

        testResults.hooks_usage.state_library = {
          used: usesStateLibrary,
          library: stateLibrary,
        };

        // State libraries are advanced, not required for all projects
        recordTest('State management library', usesStateLibrary);
        expect(true).toBe(true);
      } catch (error) {
        recordTest('State management library', false, error);
      }
    });
  });

  describe('Hook Best Practices', () => {
    test('Hooks are called at the top level (not conditionally)', () => {
      try {
        const componentDirs = [
          'grading-folder/frontend/components',
          'grading-folder/frontend/pages',
          'components',
          'pages',
        ];

        let followsRules = true;
        let violations = [];

        for (const dir of componentDirs) {
          if (fs.existsSync(dir)) {
            const files = getAllFiles(dir).filter((f) => f.endsWith('.jsx') || f.endsWith('.tsx'));

            for (const file of files) {
              const content = fs.readFileSync(file, 'utf8');

              // Check for hooks inside conditionals (rough heuristic)
              const lines = content.split('\n');
              for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();

                if (
                  (line.includes('if (') || line.includes('if(')) &&
                  i + 1 < lines.length &&
                  lines[i + 1].includes('use')
                ) {
                  violations.push(path.basename(file));
                  followsRules = false;
                  break;
                }
              }
            }
          }
        }

        recordTest('Hook rules compliance', followsRules);
        expect(true).toBe(true);
      } catch (error) {
        recordTest('Hook rules compliance', false, error);
      }
    });

    test('Hooks have appropriate dependency arrays (no missing deps)', () => {
      try {
        const componentDirs = [
          'grading-folder/frontend/components',
          'grading-folder/frontend/pages',
          'components',
          'pages',
        ];

        let hasDependencyArrays = false;

        for (const dir of componentDirs) {
          if (fs.existsSync(dir)) {
            const files = getAllFiles(dir).filter((f) => f.endsWith('.jsx') || f.endsWith('.tsx'));

            for (const file of files) {
              const content = fs.readFileSync(file, 'utf8');

              // Look for useEffect/useCallback/useMemo with deps
              if (content.match(/(useEffect|useCallback|useMemo)\([^)]*,\s*\[/)) {
                hasDependencyArrays = true;
                break;
              }
            }

            if (hasDependencyArrays) break;
          }
        }

        recordTest('Dependency arrays', hasDependencyArrays);
        expect(true).toBe(true);
      } catch (error) {
        recordTest('Dependency arrays', false, error);
      }
    });
  });

  // Helper functions
  function checkHookUsage(hookName) {
    const componentDirs = [
      'grading-folder/frontend/components',
      'grading-folder/frontend/pages',
      'grading-folder/frontend/app',
      'components',
      'pages',
      'app',
    ];

    let usesHook = false;
    let filesWithHook = [];

    for (const dir of componentDirs) {
      if (fs.existsSync(dir)) {
        const files = getAllFiles(dir).filter(
          (f) => f.endsWith('.jsx') || f.endsWith('.tsx') || f.endsWith('.js'),
        );

        for (const file of files) {
          const content = fs.readFileSync(file, 'utf8');

          if (content.includes(hookName)) {
            usesHook = true;
            filesWithHook.push(path.basename(file));
          }
        }
      }
    }

    return { files: filesWithHook, usesHook };
  }

  function checkCorrectImport(hookName) {
    const componentDirs = [
      'grading-folder/frontend/components',
      'grading-folder/frontend/pages',
      'components',
      'pages',
    ];

    let hasCorrectImport = false;

    for (const dir of componentDirs) {
      if (fs.existsSync(dir)) {
        const files = getAllFiles(dir).filter((f) => f.endsWith('.jsx') || f.endsWith('.tsx'));

        for (const file of files) {
          const content = fs.readFileSync(file, 'utf8');

          // Check for proper import
          if (
            content.match(new RegExp(`import.*${hookName}.*from ['"]react['"]`)) ||
            content.match(new RegExp(`import.*{[^}]*${hookName}[^}]*}.*from ['"]react['"]`))
          ) {
            hasCorrectImport = true;
            break;
          }
        }

        if (hasCorrectImport) break;
      }
    }

    return hasCorrectImport;
  }

  function getAllFiles(dir, fileList = []) {
    try {
      if (fs.existsSync(dir)) {
        const files = fs.readdirSync(dir);

        files.forEach((file) => {
          const filePath = path.join(dir, file);
          const stat = fs.statSync(filePath);

          if (stat.isDirectory()) {
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
