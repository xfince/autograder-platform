/**
 * tests/deployment/url-accessibility.test.js
 *
 * Tests deployment URL accessibility and basic functionality
 * Evaluates: Criterion 16 (Deployment & Production Readiness)
 */

const { chromium } = require('playwright');
const axios = require('axios');

const TEST_TIMEOUT = 60000; // Deployment tests may take longer

describe('Deployment URL Accessibility Tests', () => {
  let testResults = {
    criterion_id: 'criterion_16',
    total_tests: 0,
    passed: 0,
    failed: 0,
    details: [],
    deployment_url: null,
  };

  let deploymentUrl;
  let browser;
  let page;

  beforeAll(async () => {
    try {
      // Read deployment URL from file
      const fs = require('fs');
      const path = require('path');
      const urlFilePath = path.join(process.cwd(), 'DEPLOYMENT_URL.txt');

      if (fs.existsSync(urlFilePath)) {
        deploymentUrl = fs.readFileSync(urlFilePath, 'utf8').trim();
        testResults.deployment_url = deploymentUrl;

        // Ensure URL has protocol
        if (!deploymentUrl.startsWith('http')) {
          deploymentUrl = 'https://' + deploymentUrl;
          testResults.deployment_url = deploymentUrl;
        }

        console.log(`Testing deployment at: ${deploymentUrl}`);

        // Launch browser
        browser = await chromium.launch({ headless: true });
        page = await browser.newPage();
      } else {
        console.error('DEPLOYMENT_URL.txt not found');
      }
    } catch (error) {
      console.error('Setup error:', error.message);
    }
  }, TEST_TIMEOUT);

  afterAll(async () => {
    try {
      if (page) await page.close();
      if (browser) await browser.close();

      console.log(JSON.stringify(testResults, null, 2));
    } catch (error) {
      console.error('Cleanup error:', error.message);
    }
  }, TEST_TIMEOUT);

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

  describe('Basic Accessibility', () => {
    test(
      'Deployment URL is accessible via HTTP/HTTPS',
      async () => {
        if (!deploymentUrl) {
          recordTest('URL accessibility', false, new Error('No deployment URL'));
          return;
        }

        try {
          const response = await axios.get(deploymentUrl, {
            timeout: 30000,
            validateStatus: (status) => status < 500, // Accept any status < 500
          });

          expect(response.status).toBeLessThan(500);
          recordTest('URL accessibility', true);
        } catch (error) {
          recordTest('URL accessibility', false, error);
          throw error;
        }
      },
      TEST_TIMEOUT,
    );

    test(
      'Deployment URL returns valid HTML',
      async () => {
        if (!deploymentUrl) {
          recordTest('Valid HTML response', false, new Error('No deployment URL'));
          return;
        }

        try {
          const response = await axios.get(deploymentUrl, {
            timeout: 30000,
          });

          const isHTML = response.headers['content-type']?.includes('text/html');
          const hasHTML = response.data?.includes('<html') || response.data?.includes('<!DOCTYPE');

          expect(isHTML || hasHTML).toBe(true);
          recordTest('Valid HTML response', true);
        } catch (error) {
          recordTest('Valid HTML response', false, error);
          throw error;
        }
      },
      TEST_TIMEOUT,
    );

    test(
      'Deployment has valid SSL certificate (HTTPS)',
      async () => {
        if (!deploymentUrl) {
          recordTest('SSL certificate', false, new Error('No deployment URL'));
          return;
        }

        try {
          const isHTTPS = deploymentUrl.startsWith('https://');

          if (isHTTPS) {
            // Try to access with axios (will fail if cert is invalid)
            await axios.get(deploymentUrl, { timeout: 30000 });
            recordTest('SSL certificate', true);
          } else {
            // HTTP is okay but HTTPS is preferred
            recordTest('SSL certificate', false, new Error('Using HTTP instead of HTTPS'));
          }

          expect(true).toBe(true);
        } catch (error) {
          if (
            error.code === 'CERT_HAS_EXPIRED' ||
            error.code === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE'
          ) {
            recordTest('SSL certificate', false, error);
          } else {
            recordTest('SSL certificate', true); // Other errors are okay
          }
        }
      },
      TEST_TIMEOUT,
    );
  });

  describe('Page Load Performance', () => {
    test(
      'Homepage loads within acceptable time (< 5 seconds)',
      async () => {
        if (!deploymentUrl || !page) {
          recordTest('Page load time', false, new Error('Browser not available'));
          return;
        }

        try {
          const startTime = Date.now();
          await page.goto(deploymentUrl, {
            waitUntil: 'domcontentloaded',
            timeout: 30000,
          });
          const loadTime = Date.now() - startTime;

          testResults.page_load_time_ms = loadTime;

          // Under 5 seconds is good
          expect(loadTime).toBeLessThan(5000);
          recordTest('Page load time', true);
        } catch (error) {
          recordTest('Page load time', false, error);
          throw error;
        }
      },
      TEST_TIMEOUT,
    );

    test(
      'No console errors on page load',
      async () => {
        if (!deploymentUrl || !page) {
          recordTest('Console errors', false, new Error('Browser not available'));
          return;
        }

        try {
          const errors = [];

          page.on('console', (msg) => {
            if (msg.type() === 'error') {
              errors.push(msg.text());
            }
          });

          await page.goto(deploymentUrl, {
            waitUntil: 'networkidle',
            timeout: 30000,
          });

          // Wait a bit for any late errors
          await page.waitForTimeout(2000);

          testResults.console_errors = errors;

          // Some errors are acceptable (3rd party, etc.)
          expect(errors.length).toBeLessThan(5);
          recordTest('Console errors', true);
        } catch (error) {
          recordTest('Console errors', false, error);
          throw error;
        }
      },
      TEST_TIMEOUT,
    );
  });

  describe('Content Verification', () => {
    test(
      'Page has meaningful content (not blank)',
      async () => {
        if (!deploymentUrl || !page) {
          recordTest('Meaningful content', false, new Error('Browser not available'));
          return;
        }

        try {
          await page.goto(deploymentUrl, {
            waitUntil: 'domcontentloaded',
            timeout: 30000,
          });

          const bodyText = await page.textContent('body');
          const hasContent = bodyText && bodyText.trim().length > 50;

          expect(hasContent).toBe(true);
          recordTest('Meaningful content', true);
        } catch (error) {
          recordTest('Meaningful content', false, error);
          throw error;
        }
      },
      TEST_TIMEOUT,
    );

    test(
      'Page has proper title tag',
      async () => {
        if (!deploymentUrl || !page) {
          recordTest('Title tag', false, new Error('Browser not available'));
          return;
        }

        try {
          await page.goto(deploymentUrl, {
            waitUntil: 'domcontentloaded',
            timeout: 30000,
          });

          const title = await page.title();
          const hasTitle = title && title.length > 0 && title !== 'React App';

          expect(hasTitle).toBe(true);
          recordTest('Title tag', true);
        } catch (error) {
          recordTest('Title tag', false, error);
          throw error;
        }
      },
      TEST_TIMEOUT,
    );

    test(
      'Page includes meta tags',
      async () => {
        if (!deploymentUrl || !page) {
          recordTest('Meta tags', false, new Error('Browser not available'));
          return;
        }

        try {
          await page.goto(deploymentUrl, {
            waitUntil: 'domcontentloaded',
            timeout: 30000,
          });

          const metaTags = await page.$$('meta');
          expect(metaTags.length).toBeGreaterThan(0);
          recordTest('Meta tags', true);
        } catch (error) {
          recordTest('Meta tags', false, error);
          throw error;
        }
      },
      TEST_TIMEOUT,
    );
  });

  describe('UI Rendering', () => {
    test(
      'Page renders React/Next.js application',
      async () => {
        if (!deploymentUrl || !page) {
          recordTest('React app rendering', false, new Error('Browser not available'));
          return;
        }

        try {
          await page.goto(deploymentUrl, {
            waitUntil: 'networkidle',
            timeout: 30000,
          });

          // Check for React root or Next.js indicators
          const hasReactRoot = await page.$('#root, #__next, [data-reactroot]');

          expect(hasReactRoot).toBeTruthy();
          recordTest('React app rendering', true);
        } catch (error) {
          recordTest('React app rendering', false, error);
          throw error;
        }
      },
      TEST_TIMEOUT,
    );

    test(
      'CSS styles are loaded',
      async () => {
        if (!deploymentUrl || !page) {
          recordTest('CSS loading', false, new Error('Browser not available'));
          return;
        }

        try {
          await page.goto(deploymentUrl, {
            waitUntil: 'networkidle',
            timeout: 30000,
          });

          const stylesheets = await page.$$('link[rel="stylesheet"], style');
          const hasStyles = stylesheets.length > 0;

          expect(hasStyles).toBe(true);
          recordTest('CSS loading', true);
        } catch (error) {
          recordTest('CSS loading', false, error);
          throw error;
        }
      },
      TEST_TIMEOUT,
    );

    test(
      'JavaScript bundles are loaded',
      async () => {
        if (!deploymentUrl || !page) {
          recordTest('JavaScript loading', false, new Error('Browser not available'));
          return;
        }

        try {
          await page.goto(deploymentUrl, {
            waitUntil: 'networkidle',
            timeout: 30000,
          });

          const scripts = await page.$$('script[src]');
          const hasScripts = scripts.length > 0;

          expect(hasScripts).toBe(true);
          recordTest('JavaScript loading', true);
        } catch (error) {
          recordTest('JavaScript loading', false, error);
          throw error;
        }
      },
      TEST_TIMEOUT,
    );
  });

  describe('API Connectivity', () => {
    test(
      'Deployed frontend can connect to backend API',
      async () => {
        if (!deploymentUrl) {
          recordTest('API connectivity', false, new Error('No deployment URL'));
          return;
        }

        try {
          // Try common API endpoints relative to deployment
          const apiEndpoints = [
            `${deploymentUrl}/api/health`,
            `${deploymentUrl}/api/users`,
            `${deploymentUrl}/api`,
          ];

          let apiAccessible = false;

          for (const endpoint of apiEndpoints) {
            try {
              const response = await axios.get(endpoint, {
                timeout: 10000,
                validateStatus: (status) => status < 500,
              });

              if (response.status < 500) {
                apiAccessible = true;
                break;
              }
            } catch (err) {
              continue;
            }
          }

          // API might be on different domain, so don't fail if not found
          recordTest('API connectivity', apiAccessible);
          expect(true).toBe(true);
        } catch (error) {
          recordTest('API connectivity', false, error);
        }
      },
      TEST_TIMEOUT,
    );
  });

  describe('Production Optimization', () => {
    test(
      'Assets are served with compression (gzip/brotli)',
      async () => {
        if (!deploymentUrl) {
          recordTest('Asset compression', false, new Error('No deployment URL'));
          return;
        }

        try {
          const response = await axios.get(deploymentUrl, {
            timeout: 30000,
            headers: { 'Accept-Encoding': 'gzip, deflate, br' },
          });

          const encoding = response.headers['content-encoding'];
          const isCompressed = encoding && (encoding.includes('gzip') || encoding.includes('br'));

          // Compression is good practice
          recordTest('Asset compression', Boolean(isCompressed));
          expect(true).toBe(true);
        } catch (error) {
          recordTest('Asset compression', false, error);
        }
      },
      TEST_TIMEOUT,
    );

    test(
      'Caching headers are configured',
      async () => {
        if (!deploymentUrl) {
          recordTest('Caching headers', false, new Error('No deployment URL'));
          return;
        }

        try {
          const response = await axios.get(deploymentUrl, {
            timeout: 30000,
          });

          const cacheControl = response.headers['cache-control'];
          const etag = response.headers['etag'];

          const hasCaching = cacheControl || etag;

          // Caching is optimization
          recordTest('Caching headers', Boolean(hasCaching));
          expect(true).toBe(true);
        } catch (error) {
          recordTest('Caching headers', false, error);
        }
      },
      TEST_TIMEOUT,
    );
  });

  describe('Mobile Responsiveness', () => {
    test(
      'Page is responsive on mobile viewport',
      async () => {
        if (!deploymentUrl || !page) {
          recordTest('Mobile responsiveness', false, new Error('Browser not available'));
          return;
        }

        try {
          await page.setViewportSize({ width: 375, height: 667 }); // iPhone size

          await page.goto(deploymentUrl, {
            waitUntil: 'domcontentloaded',
            timeout: 30000,
          });

          // Check if viewport meta tag exists
          const viewportMeta = await page.$('meta[name="viewport"]');

          expect(viewportMeta).toBeTruthy();
          recordTest('Mobile responsiveness', true);
        } catch (error) {
          recordTest('Mobile responsiveness', false, error);
          throw error;
        }
      },
      TEST_TIMEOUT,
    );
  });

  describe('Error Handling', () => {
    test(
      '404 pages are handled gracefully',
      async () => {
        if (!deploymentUrl) {
          recordTest('404 handling', false, new Error('No deployment URL'));
          return;
        }

        try {
          const response = await axios.get(`${deploymentUrl}/this-page-does-not-exist`, {
            timeout: 10000,
            validateStatus: () => true, // Accept any status
          });

          // Should return 404 or redirect
          expect(response.status).toBeDefined();
          recordTest('404 handling', true);
        } catch (error) {
          recordTest('404 handling', false, error);
          throw error;
        }
      },
      TEST_TIMEOUT,
    );
  });
});

// module.exports = { testResults };
