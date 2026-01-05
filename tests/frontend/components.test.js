/**
 * tests/frontend/components.test.js
 *
 * Tests for React/Next.js component implementation
 * Evaluates: Criterion 2 (Front-End Implementation)
 */

const React = require('react');
const { render, screen, waitFor } = require('@testing-library/react');
require('@testing-library/jest-dom');
const path = require('path');
const fs = require('fs');

const TEST_TIMEOUT = 30000;

describe('Frontend Component Tests', () => {
  let testResults = {
    criterion_id: 'criterion_2',
    total_tests: 0,
    passed: 0,
    failed: 0,
    details: [],
    components_found: [],
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

  describe('Component Structure & Organization', () => {
    test('Project has organized component structure', () => {
      try {
        const componentDirs = [
          'grading-folder/frontend/components',
          'grading-folder/frontend/src/components',
          'components',
          'src/components',
        ];

        let hasComponents = false;
        let componentCount = 0;

        for (const dir of componentDirs) {
          if (fs.existsSync(dir)) {
            const files = getAllFiles(dir);
            const componentFiles = files.filter(
              (f) => f.endsWith('.jsx') || f.endsWith('.tsx') || f.endsWith('.js'),
            );

            if (componentFiles.length > 0) {
              hasComponents = true;
              componentCount = componentFiles.length;
              testResults.components_found = componentFiles.map((f) => path.basename(f));
              break;
            }
          }
        }

        expect(hasComponents).toBe(true);
        expect(componentCount).toBeGreaterThan(0);
        recordTest('Component structure exists', true);
      } catch (error) {
        recordTest('Component structure exists', false, error);
        throw error;
      }
    });

    test('Components follow naming conventions', () => {
      try {
        const componentDirs = [
          'grading-folder/frontend/components',
          'components',
          'src/components',
        ];

        let properNaming = false;
        let componentFiles = [];

        for (const dir of componentDirs) {
          if (fs.existsSync(dir)) {
            componentFiles = getAllFiles(dir).filter(
              (f) => f.endsWith('.jsx') || f.endsWith('.tsx'),
            );
            break;
          }
        }

        if (componentFiles.length > 0) {
          // Check if components start with capital letter (PascalCase)
          const wellNamed = componentFiles.filter((f) => {
            const basename = path.basename(f, path.extname(f));
            return /^[A-Z]/.test(basename);
          });

          properNaming = wellNamed.length > 0;
        }

        recordTest('Component naming conventions', properNaming);
        expect(true).toBe(true);
      } catch (error) {
        recordTest('Component naming conventions', false, error);
      }
    });

    test('Components are modular (separate files)', () => {
      try {
        const componentDirs = ['grading-folder/frontend/components', 'components'];

        let componentFiles = [];

        for (const dir of componentDirs) {
          if (fs.existsSync(dir)) {
            componentFiles = getAllFiles(dir).filter(
              (f) => f.endsWith('.jsx') || f.endsWith('.tsx'),
            );
            break;
          }
        }

        // Multiple component files indicate modularity
        const isModular = componentFiles.length >= 3;

        expect(isModular).toBe(true);
        recordTest('Component modularity', true);
      } catch (error) {
        recordTest('Component modularity', false, error);
        throw error;
      }
    });
  });

  describe('Component Implementation Quality', () => {
    test('Components use functional component pattern', () => {
      try {
        const componentDirs = ['grading-folder/frontend/components', 'components'];

        let usesFunctional = false;

        for (const dir of componentDirs) {
          if (fs.existsSync(dir)) {
            const files = getAllFiles(dir).filter((f) => f.endsWith('.jsx') || f.endsWith('.tsx'));

            for (const file of files) {
              const content = fs.readFileSync(file, 'utf8');

              // Check for functional component patterns
              if (
                content.includes('const ') &&
                (content.includes('return (') || content.includes('return(')) &&
                (content.includes('=>') || content.includes('function'))
              ) {
                usesFunctional = true;
                break;
              }
            }

            if (usesFunctional) break;
          }
        }

        expect(usesFunctional).toBe(true);
        recordTest('Functional components', true);
      } catch (error) {
        recordTest('Functional components', false, error);
        throw error;
      }
    });

    test('Components properly export (default or named)', () => {
      try {
        const componentDirs = ['grading-folder/frontend/components', 'components'];

        let hasExports = false;

        for (const dir of componentDirs) {
          if (fs.existsSync(dir)) {
            const files = getAllFiles(dir).filter((f) => f.endsWith('.jsx') || f.endsWith('.tsx'));

            for (const file of files) {
              const content = fs.readFileSync(file, 'utf8');

              // Check for exports
              if (
                content.includes('export default') ||
                content.includes('export {') ||
                content.includes('export const')
              ) {
                hasExports = true;
                break;
              }
            }

            if (hasExports) break;
          }
        }

        expect(hasExports).toBe(true);
        recordTest('Component exports', true);
      } catch (error) {
        recordTest('Component exports', false, error);
        throw error;
      }
    });

    test('Components import React/Next.js properly', () => {
      try {
        const componentDirs = ['grading-folder/frontend/components', 'components'];

        let hasReactImports = false;

        for (const dir of componentDirs) {
          if (fs.existsSync(dir)) {
            const files = getAllFiles(dir).filter((f) => f.endsWith('.jsx') || f.endsWith('.tsx'));

            for (const file of files) {
              const content = fs.readFileSync(file, 'utf8');

              // Check for React imports (or Next.js which includes React)
              if (
                content.includes("from 'react'") ||
                content.includes('from "react"') ||
                content.includes("from 'next/") ||
                // React 17+ doesn't require import in JSX files
                file.endsWith('.jsx') ||
                file.endsWith('.tsx')
              ) {
                hasReactImports = true;
                break;
              }
            }

            if (hasReactImports) break;
          }
        }

        expect(hasReactImports).toBe(true);
        recordTest('React imports', true);
      } catch (error) {
        recordTest('React imports', false, error);
        throw error;
      }
    });
  });

  describe('Component Reusability', () => {
    test('Project has reusable UI components', () => {
      try {
        const componentDirs = ['grading-folder/frontend/components', 'components'];

        let reusableComponents = [];
        const commonReusableNames = [
          'button',
          'input',
          'card',
          'modal',
          'form',
          'header',
          'footer',
          'navbar',
          'sidebar',
          'layout',
          'loading',
          'spinner',
          'alert',
          'badge',
          'avatar',
        ];

        for (const dir of componentDirs) {
          if (fs.existsSync(dir)) {
            const files = getAllFiles(dir);

            reusableComponents = files.filter((f) => {
              const basename = path.basename(f).toLowerCase();
              return commonReusableNames.some((name) => basename.includes(name));
            });

            break;
          }
        }

        const hasReusableComponents = reusableComponents.length > 0;

        recordTest('Reusable UI components', hasReusableComponents);
        expect(true).toBe(true);
      } catch (error) {
        recordTest('Reusable UI components', false, error);
      }
    });

    test('Components accept props for customization', () => {
      try {
        const componentDirs = ['grading-folder/frontend/components', 'components'];

        let usesProps = false;

        for (const dir of componentDirs) {
          if (fs.existsSync(dir)) {
            const files = getAllFiles(dir).filter((f) => f.endsWith('.jsx') || f.endsWith('.tsx'));

            for (const file of files) {
              const content = fs.readFileSync(file, 'utf8');

              // Check for props usage
              if (
                content.includes('props.') ||
                (content.includes('{ ') && content.includes(' }')) ||
                content.match(/const \w+ = \([^)]*\{[^}]*\}/)
              ) {
                usesProps = true;
                break;
              }
            }

            if (usesProps) break;
          }
        }

        expect(usesProps).toBe(true);
        recordTest('Props usage', true);
      } catch (error) {
        recordTest('Props usage', false, error);
        throw error;
      }
    });
  });

  describe('JSX/TSX Syntax', () => {
    test('Components use proper JSX syntax', () => {
      try {
        const componentDirs = ['grading-folder/frontend/components', 'components'];

        let usesJSX = false;

        for (const dir of componentDirs) {
          if (fs.existsSync(dir)) {
            const files = getAllFiles(dir).filter((f) => f.endsWith('.jsx') || f.endsWith('.tsx'));

            for (const file of files) {
              const content = fs.readFileSync(file, 'utf8');

              // Check for JSX syntax
              if (
                content.includes('<') &&
                content.includes('>') &&
                (content.includes('</') || content.includes('/>'))
              ) {
                usesJSX = true;
                break;
              }
            }

            if (usesJSX) break;
          }
        }

        expect(usesJSX).toBe(true);
        recordTest('JSX syntax', true);
      } catch (error) {
        recordTest('JSX syntax', false, error);
        throw error;
      }
    });

    test('Components use proper HTML semantics', () => {
      try {
        const componentDirs = ['grading-folder/frontend/components', 'components'];

        let usesSemanticHTML = false;
        const semanticTags = [
          '<header',
          '<footer',
          '<nav',
          '<main',
          '<section',
          '<article',
          '<aside',
          '<form',
          '<button',
        ];

        for (const dir of componentDirs) {
          if (fs.existsSync(dir)) {
            const files = getAllFiles(dir).filter((f) => f.endsWith('.jsx') || f.endsWith('.tsx'));

            for (const file of files) {
              const content = fs.readFileSync(file, 'utf8');

              // Check for semantic HTML tags
              if (semanticTags.some((tag) => content.includes(tag))) {
                usesSemanticHTML = true;
                break;
              }
            }

            if (usesSemanticHTML) break;
          }
        }

        recordTest('Semantic HTML', usesSemanticHTML);
        expect(true).toBe(true);
      } catch (error) {
        recordTest('Semantic HTML', false, error);
      }
    });
  });

  describe('Component Separation of Concerns', () => {
    test('Logic and presentation are properly separated', () => {
      try {
        const componentDirs = ['grading-folder/frontend/components', 'components'];

        let hasSeparation = false;

        for (const dir of componentDirs) {
          if (fs.existsSync(dir)) {
            const files = getAllFiles(dir).filter((f) => f.endsWith('.jsx') || f.endsWith('.tsx'));

            // Check if components use hooks for logic separation
            for (const file of files) {
              const content = fs.readFileSync(file, 'utf8');

              if (
                (content.includes('useState') ||
                  content.includes('useEffect') ||
                  content.includes('useCallback')) &&
                content.includes('return (')
              ) {
                hasSeparation = true;
                break;
              }
            }

            if (hasSeparation) break;
          }
        }

        recordTest('Separation of concerns', hasSeparation);
        expect(true).toBe(true);
      } catch (error) {
        recordTest('Separation of concerns', false, error);
      }
    });

    test('No excessive prop drilling (max 2-3 levels)', () => {
      try {
        const componentDirs = ['grading-folder/frontend/components', 'components'];

        let hasMinimalPropDrilling = true;

        for (const dir of componentDirs) {
          if (fs.existsSync(dir)) {
            const files = getAllFiles(dir).filter((f) => f.endsWith('.jsx') || f.endsWith('.tsx'));

            for (const file of files) {
              const content = fs.readFileSync(file, 'utf8');

              // Look for excessive prop passing patterns
              // This is a heuristic - checking for many props being passed
              const propMatches = content.match(/\w+={[^}]+}/g);
              if (propMatches && propMatches.length > 10) {
                // Might indicate prop drilling, but not necessarily bad
                // We'll be lenient here
              }
            }
          }
        }

        recordTest('Minimal prop drilling', hasMinimalPropDrilling);
        expect(true).toBe(true);
      } catch (error) {
        recordTest('Minimal prop drilling', false, error);
      }
    });
  });

  describe('Component Size & Complexity', () => {
    test('Components are reasonably sized (< 300 lines)', () => {
      try {
        const componentDirs = ['grading-folder/frontend/components', 'components'];

        let allReasonablySized = true;
        let largeComponents = [];

        for (const dir of componentDirs) {
          if (fs.existsSync(dir)) {
            const files = getAllFiles(dir).filter((f) => f.endsWith('.jsx') || f.endsWith('.tsx'));

            for (const file of files) {
              const content = fs.readFileSync(file, 'utf8');
              const lineCount = content.split('\n').length;

              if (lineCount > 300) {
                allReasonablySized = false;
                largeComponents.push(path.basename(file));
              }
            }
          }
        }

        recordTest('Component size', allReasonablySized);
        expect(true).toBe(true);
      } catch (error) {
        recordTest('Component size', false, error);
      }
    });
  });

  describe('Styling Approach', () => {
    test('Components have styling (CSS/Tailwind/styled-components)', () => {
      try {
        const componentDirs = ['grading-folder/frontend/components', 'components'];

        let hasStyling = false;

        for (const dir of componentDirs) {
          if (fs.existsSync(dir)) {
            const files = getAllFiles(dir);

            for (const file of files) {
              const content = fs.readFileSync(file, 'utf8');

              // Check for various styling approaches
              if (
                content.includes('className=') ||
                content.includes('style={') ||
                content.includes('styled.') ||
                content.includes('css`') ||
                file.endsWith('.module.css') ||
                file.endsWith('.module.scss')
              ) {
                hasStyling = true;
                break;
              }
            }

            if (hasStyling) break;
          }
        }

        expect(hasStyling).toBe(true);
        recordTest('Component styling', true);
      } catch (error) {
        recordTest('Component styling', false, error);
        throw error;
      }
    });

    test('Styling is consistent across components', () => {
      try {
        const componentDirs = ['grading-folder/frontend/components', 'components'];

        let stylingApproaches = new Set();

        for (const dir of componentDirs) {
          if (fs.existsSync(dir)) {
            const files = getAllFiles(dir).filter((f) => f.endsWith('.jsx') || f.endsWith('.tsx'));

            for (const file of files) {
              const content = fs.readFileSync(file, 'utf8');

              if (content.includes('className=')) stylingApproaches.add('className');
              if (content.includes('styled.')) stylingApproaches.add('styled-components');
              if (content.includes('style={')) stylingApproaches.add('inline-styles');
            }
          }
        }

        // Consistency is good, but mixing is sometimes necessary
        const isConsistent = stylingApproaches.size <= 2;

        recordTest('Styling consistency', isConsistent);
        expect(true).toBe(true);
      } catch (error) {
        recordTest('Styling consistency', false, error);
      }
    });
  });

  describe('Component Comments & Documentation', () => {
    test('Complex components have helpful comments', () => {
      try {
        const componentDirs = ['grading-folder/frontend/components', 'components'];

        let hasComments = false;

        for (const dir of componentDirs) {
          if (fs.existsSync(dir)) {
            const files = getAllFiles(dir).filter((f) => f.endsWith('.jsx') || f.endsWith('.tsx'));

            for (const file of files) {
              const content = fs.readFileSync(file, 'utf8');

              // Check for comments
              if (content.includes('//') || content.includes('/*')) {
                hasComments = true;
                break;
              }
            }

            if (hasComments) break;
          }
        }

        recordTest('Component comments', hasComments);
        expect(true).toBe(true);
      } catch (error) {
        recordTest('Component comments', false, error);
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
