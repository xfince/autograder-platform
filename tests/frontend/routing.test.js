/**
 * tests/frontend/routing.test.js
 * 
 * Tests for Next.js routing implementation
 * Evaluates: Criterion 2 (Front-End Implementation)
 */

const path = require('path');
const fs = require('fs');

const TEST_TIMEOUT = 30000;

describe('Next.js Routing Tests', () => {
  let testResults = {
    criterion_id: 'criterion_2',
    subsection: 'routing',
    total_tests: 0,
    passed: 0,
    failed: 0,
    details: [],
    routing_info: {}
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
      error: error ? error.message : null
    });
  };

  afterAll(() => {
    console.log(JSON.stringify(testResults, null, 2));
  });

  describe('Next.js Project Structure', () => {
    test('Project uses Next.js framework', () => {
      try {
        let packageJsonPath = path.join(process.cwd(), 'grading-folder', 'frontend', 'package.json');
        if (!fs.existsSync(packageJsonPath)) {
          packageJsonPath = path.join(process.cwd(), 'package.json');
        }
        let usesNext = false;

        if (fs.existsSync(packageJsonPath)) {
          const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
          const deps = {
            ...packageJson.dependencies,
            ...packageJson.devDependencies
          };

          usesNext = Boolean(deps.next);
          
          testResults.routing_info.next_version = deps.next || 'not found';
        }

        expect(usesNext).toBe(true);
        recordTest('Next.js framework', true);
      } catch (error) {
        recordTest('Next.js framework', false, error);
        throw error;
      }
    });

    test('Project has pages or app directory for routing', () => {
      try {
        const routingDirs = [
          'pages',
          'src/pages',
          'app',
          'src/app'
        ];

        let hasRoutingDir = false;
        let routingType = null;

        for (const dir of routingDirs) {
          if (fs.existsSync(dir)) {
            hasRoutingDir = true;
            routingType = dir.includes('app') ? 'App Router' : 'Pages Router';
            testResults.routing_info.routing_type = routingType;
            testResults.routing_info.routing_directory = dir;
            break;
          }
        }

        expect(hasRoutingDir).toBe(true);
        recordTest('Routing directory exists', true);
      } catch (error) {
        recordTest('Routing directory exists', false, error);
        throw error;
      }
    });
  });

  describe('Page Routes', () => {
    test('Project has multiple page routes', () => {
      try {
        const routingDirs = [
          'pages',
          'src/pages',
          'app',
          'src/app'
        ];

        let pageFiles = [];

        for (const dir of routingDirs) {
          if (fs.existsSync(dir)) {
            pageFiles = getAllFiles(dir).filter(f => 
              (f.endsWith('.jsx') || 
               f.endsWith('.tsx') || 
               f.endsWith('.js')) &&
              !f.includes('_app') &&
              !f.includes('_document') &&
              !f.includes('.test.') &&
              !f.includes('.spec.')
            );
            break;
          }
        }

        testResults.routing_info.page_count = pageFiles.length;
        testResults.routing_info.pages = pageFiles.map(f => path.basename(f));

        const hasMultiplePages = pageFiles.length >= 2;

        expect(hasMultiplePages).toBe(true);
        recordTest('Multiple page routes', true);
      } catch (error) {
        recordTest('Multiple page routes', false, error);
        throw error;
      }
    });

    test('Home page (index) exists', () => {
      try {
        const indexPaths = [
          'pages/index.jsx',
          'pages/index.tsx',
          'pages/index.js',
          'src/pages/index.jsx',
          'src/pages/index.tsx',
          'src/pages/index.js',
          'app/page.jsx',
          'app/page.tsx',
          'app/page.js',
          'src/app/page.jsx',
          'src/app/page.tsx',
          'src/app/page.js'
        ];

        let hasHomePage = false;

        for (const indexPath of indexPaths) {
          if (fs.existsSync(indexPath)) {
            hasHomePage = true;
            testResults.routing_info.home_page = indexPath;
            break;
          }
        }

        expect(hasHomePage).toBe(true);
        recordTest('Home page exists', true);
      } catch (error) {
        recordTest('Home page exists', false, error);
        throw error;
      }
    });

    test('Pages export default components', () => {
      try {
        const routingDirs = [
          'pages',
          'src/pages',
          'app',
          'src/app'
        ];

        let hasDefaultExports = false;

        for (const dir of routingDirs) {
          if (fs.existsSync(dir)) {
            const pageFiles = getAllFiles(dir).filter(f => 
              (f.endsWith('.jsx') || f.endsWith('.tsx') || f.endsWith('.js')) &&
              (f.includes('/page.') || f.includes('/index.') || path.dirname(f) === dir)
            );

            for (const file of pageFiles) {
              const content = fs.readFileSync(file, 'utf8');
              
              if (content.includes('export default')) {
                hasDefaultExports = true;
                break;
              }
            }
            
            if (hasDefaultExports) break;
          }
        }

        expect(hasDefaultExports).toBe(true);
        recordTest('Default exports', true);
      } catch (error) {
        recordTest('Default exports', false, error);
        throw error;
      }
    });
  });

  describe('Dynamic Routes', () => {
    test('Project uses dynamic routes (if applicable)', () => {
      try {
        const routingDirs = [
          'pages',
          'src/pages',
          'app',
          'src/app'
        ];

        let hasDynamicRoutes = false;
        let dynamicRoutes = [];

        for (const dir of routingDirs) {
          if (fs.existsSync(dir)) {
            const allFiles = getAllFiles(dir);
            
            // Look for dynamic route patterns
            dynamicRoutes = allFiles.filter(f => {
              const basename = path.basename(f);
              return basename.includes('[') && basename.includes(']');
            });

            if (dynamicRoutes.length > 0) {
              hasDynamicRoutes = true;
              break;
            }
          }
        }

        testResults.routing_info.dynamic_routes = {
          used: hasDynamicRoutes,
          count: dynamicRoutes.length,
          routes: dynamicRoutes.map(f => path.basename(f))
        };

        // Dynamic routes are advanced but not required
        recordTest('Dynamic routes', hasDynamicRoutes);
        expect(true).toBe(true);
      } catch (error) {
        recordTest('Dynamic routes', false, error);
      }
    });

    test('Dynamic route parameters are accessed correctly', () => {
      try {
        const routingDirs = [
          'pages',
          'src/pages',
          'app',
          'src/app'
        ];

        let usesRouteParams = false;

        for (const dir of routingDirs) {
          if (fs.existsSync(dir)) {
            const dynamicFiles = getAllFiles(dir).filter(f => 
              path.basename(f).includes('[') && path.basename(f).includes(']')
            );

            for (const file of dynamicFiles) {
              const content = fs.readFileSync(file, 'utf8');
              
              // Check for useRouter or params usage
              if (content.includes('useRouter') || 
                  content.includes('router.query') ||
                  content.includes('params.')) {
                usesRouteParams = true;
                break;
              }
            }
            
            if (usesRouteParams) break;
          }
        }

        recordTest('Route parameters', usesRouteParams);
        expect(true).toBe(true);
      } catch (error) {
        recordTest('Route parameters', false, error);
      }
    });
  });

  describe('Navigation', () => {
    test('Project uses Next.js Link component for navigation', () => {
      try {
        const allDirs = [
          'grading-folder/frontend/components',
          'grading-folder/frontend/pages',
          'components',
          'pages',
          'app'
        ];

        let usesLink = false;
        let linkUsageCount = 0;

        for (const dir of allDirs) {
          if (fs.existsSync(dir)) {
            const files = getAllFiles(dir).filter(f => 
              f.endsWith('.jsx') || f.endsWith('.tsx') || f.endsWith('.js')
            );

            for (const file of files) {
              const content = fs.readFileSync(file, 'utf8');
              
              // Check for Link usage
              if ((content.includes("from 'next/link'") || content.includes('from "next/link"')) &&
                  content.includes('<Link')) {
                usesLink = true;
                linkUsageCount++;
              }
            }
          }
        }

        testResults.routing_info.link_usage = {
          used: usesLink,
          files_count: linkUsageCount
        };

        expect(usesLink).toBe(true);
        recordTest('Link component usage', true);
      } catch (error) {
        recordTest('Link component usage', false, error);
        throw error;
      }
    });

    test('Project uses useRouter hook for programmatic navigation', () => {
      try {
        const allDirs = [
          'grading-folder/frontend/components',
          'grading-folder/frontend/pages',
          'components',
          'pages',
          'app'
        ];

        let usesRouter = false;

        for (const dir of allDirs) {
          if (fs.existsSync(dir)) {
            const files = getAllFiles(dir).filter(f => 
              f.endsWith('.jsx') || f.endsWith('.tsx') || f.endsWith('.js')
            );

            for (const file of files) {
              const content = fs.readFileSync(file, 'utf8');
              
              // Check for useRouter usage
              if (content.includes('useRouter') &&
                  (content.includes("from 'next/router'") || 
                   content.includes('from "next/router"') ||
                   content.includes("from 'next/navigation'") ||
                   content.includes('from "next/navigation"'))) {
                usesRouter = true;
                break;
              }
            }
            
            if (usesRouter) break;
          }
        }

        testResults.routing_info.router_usage = usesRouter;

        // useRouter is useful but not always needed
        recordTest('useRouter usage', usesRouter);
        expect(true).toBe(true);
      } catch (error) {
        recordTest('useRouter usage', false, error);
      }
    });
  });

  describe('Nested Routes', () => {
    test('Project has nested route structure (if applicable)', () => {
      try {
        const routingDirs = [
          'pages',
          'src/pages',
          'app',
          'src/app'
        ];

        let hasNestedRoutes = false;
        let nestedDepth = 0;

        for (const dir of routingDirs) {
          if (fs.existsSync(dir)) {
            const allFiles = getAllFiles(dir).filter(f => 
              f.endsWith('.jsx') || f.endsWith('.tsx') || f.endsWith('.js')
            );

            // Check nesting depth
            for (const file of allFiles) {
              const relativePath = path.relative(dir, file);
              const depth = relativePath.split(path.sep).length - 1;
              
              if (depth >= 2) {
                hasNestedRoutes = true;
                nestedDepth = Math.max(nestedDepth, depth);
              }
            }
          }
        }

        testResults.routing_info.nested_routes = {
          used: hasNestedRoutes,
          max_depth: nestedDepth
        };

        // Nested routes show good organization
        recordTest('Nested routes', hasNestedRoutes);
        expect(true).toBe(true);
      } catch (error) {
        recordTest('Nested routes', false, error);
      }
    });
  });

  describe('Layout Components', () => {
    test('Project uses _app.js/_app.tsx for global layout (Pages Router)', () => {
      try {
        const appPaths = [
          'pages/_app.jsx',
          'pages/_app.tsx',
          'pages/_app.js',
          'src/pages/_app.jsx',
          'src/pages/_app.tsx',
          'src/pages/_app.js'
        ];

        let hasAppFile = false;

        for (const appPath of appPaths) {
          if (fs.existsSync(appPath)) {
            hasAppFile = true;
            testResults.routing_info.app_file = appPath;
            break;
          }
        }

        // _app is common but not required with App Router
        recordTest('_app file', hasAppFile);
        expect(true).toBe(true);
      } catch (error) {
        recordTest('_app file', false, error);
      }
    });

    test('Project uses layout.jsx/layout.tsx (App Router)', () => {
      try {
        const layoutPaths = [
          'app/layout.jsx',
          'app/layout.tsx',
          'app/layout.js',
          'src/app/layout.jsx',
          'src/app/layout.tsx',
          'src/app/layout.js'
        ];

        let hasLayoutFile = false;

        for (const layoutPath of layoutPaths) {
          if (fs.existsSync(layoutPath)) {
            hasLayoutFile = true;
            testResults.routing_info.layout_file = layoutPath;
            break;
          }
        }

        // Layout is required for App Router
        recordTest('Layout file', hasLayoutFile);
        expect(true).toBe(true);
      } catch (error) {
        recordTest('Layout file', false, error);
      }
    });

    test('Layout components wrap page content properly', () => {
      try {
        const layoutPaths = [
          'pages/_app.jsx',
          'pages/_app.tsx',
          'pages/_app.js',
          'app/layout.jsx',
          'app/layout.tsx',
          'app/layout.js'
        ];

        let layoutWrapsContent = false;

        for (const layoutPath of layoutPaths) {
          if (fs.existsSync(layoutPath)) {
            const content = fs.readFileSync(layoutPath, 'utf8');
            
            // Check if layout wraps children
            if (content.includes('children') || 
                content.includes('Component') ||
                content.includes('pageProps')) {
              layoutWrapsContent = true;
              break;
            }
          }
        }

        recordTest('Layout wraps content', layoutWrapsContent);
        expect(true).toBe(true);
      } catch (error) {
        recordTest('Layout wraps content', false, error);
      }
    });
  });

  describe('API Routes (if applicable)', () => {
    test('Project has API routes in pages/api (if applicable)', () => {
      try {
        const apiDirs = [
          'pages/api',
          'src/pages/api',
          'app/api'
        ];

        let hasApiRoutes = false;
        let apiRouteCount = 0;

        for (const dir of apiDirs) {
          if (fs.existsSync(dir)) {
            const apiFiles = getAllFiles(dir).filter(f => 
              f.endsWith('.js') || f.endsWith('.ts')
            );
            
            if (apiFiles.length > 0) {
              hasApiRoutes = true;
              apiRouteCount = apiFiles.length;
              break;
            }
          }
        }

        testResults.routing_info.api_routes = {
          used: hasApiRoutes,
          count: apiRouteCount
        };

        // API routes in Next.js are optional (backend might be separate)
        recordTest('API routes', hasApiRoutes);
        expect(true).toBe(true);
      } catch (error) {
        recordTest('API routes', false, error);
      }
    });
  });

  describe('Route Protection', () => {
    test('Protected routes have authentication checks', () => {
      try {
        const allDirs = [
          'pages',
          'src/pages',
          'app',
          'components'
        ];

        let hasRouteProtection = false;

        for (const dir of allDirs) {
          if (fs.existsSync(dir)) {
            const files = getAllFiles(dir).filter(f => 
              f.endsWith('.jsx') || f.endsWith('.tsx') || f.endsWith('.js')
            );

            for (const file of files) {
              const content = fs.readFileSync(file, 'utf8');
              
              // Look for auth checks
              if ((content.includes('useAuth') || 
                   content.includes('isAuthenticated') ||
                   content.includes('getServerSideProps') ||
                   content.includes('middleware')) &&
                  (content.includes('redirect') || content.includes('push('))) {
                hasRouteProtection = true;
                break;
              }
            }
            
            if (hasRouteProtection) break;
          }
        }

        recordTest('Route protection', hasRouteProtection);
        expect(true).toBe(true);
      } catch (error) {
        recordTest('Route protection', false, error);
      }
    });
  });

  describe('Metadata & SEO', () => {
    test('Pages include Head component for metadata', () => {
      try {
        const routingDirs = [
          'pages',
          'src/pages',
          'app'
        ];

        let usesHead = false;

        for (const dir of routingDirs) {
          if (fs.existsSync(dir)) {
            const files = getAllFiles(dir).filter(f => 
              f.endsWith('.jsx') || f.endsWith('.tsx') || f.endsWith('.js')
            );

            for (const file of files) {
              const content = fs.readFileSync(file, 'utf8');
              
              // Check for Head or metadata usage
              if ((content.includes("from 'next/head'") || content.includes('from "next/head"')) &&
                  content.includes('<Head')) {
                usesHead = true;
                break;
              }
              
              // App Router uses metadata export
              if (content.includes('export const metadata')) {
                usesHead = true;
                break;
              }
            }
            
            if (usesHead) break;
          }
        }

        recordTest('Head/metadata usage', usesHead);
        expect(true).toBe(true);
      } catch (error) {
        recordTest('Head/metadata usage', false, error);
      }
    });
  });

  // Helper function
  function getAllFiles(dir, fileList = []) {
    try {
      if (fs.existsSync(dir)) {
        const files = fs.readdirSync(dir);
        
        files.forEach(file => {
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

module.exports = { testResults };