/**
 * grading-scripts/code-summarizer.js
 *
 * Summarizes code from grading-folder for GPT-4o analysis
 * Creates concise summaries to manage token limits
 */

const fs = require('fs');
const path = require('path');

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

function extractImports(content) {
  const imports = [];
  const lines = content.split('\n');

  for (const line of lines) {
    if (line.trim().startsWith('import ') || line.trim().startsWith('require(')) {
      imports.push(line.trim());
    }
  }

  return imports;
}

function extractExports(content) {
  const exports = [];
  const exportPatterns = [
    /export\s+default\s+(\w+)/g,
    /export\s+{\s*([^}]+)\s*}/g,
    /export\s+const\s+(\w+)/g,
    /export\s+function\s+(\w+)/g,
    /module\.exports\s*=\s*(\w+)/g,
  ];

  exportPatterns.forEach((pattern) => {
    const matches = content.matchAll(pattern);
    for (const match of matches) {
      exports.push(match[1]);
    }
  });

  return exports;
}

function extractFunctions(content) {
  const functions = [];
  const functionPatterns = [
    /function\s+(\w+)\s*\(/g,
    /const\s+(\w+)\s*=\s*\([^)]*\)\s*=>/g,
    /(\w+)\s*:\s*function\s*\(/g,
    /async\s+function\s+(\w+)\s*\(/g,
  ];

  functionPatterns.forEach((pattern) => {
    const matches = content.matchAll(pattern);
    for (const match of matches) {
      functions.push(match[1]);
    }
  });

  return [...new Set(functions)]; // Remove duplicates
}

function extractReactHooks(content) {
  const hooks = [];
  const hookPatterns = [
    'useState',
    'useEffect',
    'useContext',
    'useReducer',
    'useCallback',
    'useMemo',
    'useRef',
    'useRouter',
    'useParams',
  ];

  hookPatterns.forEach((hook) => {
    if (content.includes(hook)) {
      hooks.push(hook);
    }
  });

  return hooks;
}

function analyzeComplexity(content) {
  const lines = content.split('\n').length;
  let complexity = 'simple';

  if (lines > 200) complexity = 'high';
  else if (lines > 100) complexity = 'medium';
  else complexity = 'low';

  return { lines, complexity };
}

function extractKeySnippets(content, maxSnippets = 3) {
  const snippets = [];
  const lines = content.split('\n');

  // Look for important patterns
  const importantPatterns = [
    { pattern: /export\s+default/, context: 5 },
    { pattern: /useState|useEffect/, context: 3 },
    { pattern: /router\.(get|post|put|delete)/, context: 4 },
    { pattern: /async\s+function/, context: 4 },
    { pattern: /\.find\(|\.create\(|\.save\(/, context: 3 },
  ];

  for (let i = 0; i < lines.length && snippets.length < maxSnippets; i++) {
    for (const { pattern, context } of importantPatterns) {
      if (pattern.test(lines[i])) {
        const start = Math.max(0, i - 1);
        const end = Math.min(lines.length, i + context);
        const snippet = lines.slice(start, end).join('\n');

        if (snippet.length > 20 && !snippets.includes(snippet)) {
          snippets.push(snippet.trim());
          break;
        }
      }
    }
  }

  return snippets;
}

function summarizeFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const ext = path.extname(filePath);
    const basename = path.basename(filePath);

    const summary = {
      file_path: filePath.replace(process.cwd(), ''),
      file_name: basename,
      language: ext.substring(1),
      ...analyzeComplexity(content),
      imports: extractImports(content).slice(0, 10), // Limit imports
      exports: extractExports(content).slice(0, 5),
      functions: extractFunctions(content).slice(0, 10),
      key_snippets: extractKeySnippets(content, 2),
    };

    // Add React-specific info for frontend files
    if (ext === '.jsx' || ext === '.tsx') {
      summary.hooks_used = extractReactHooks(content);
      summary.component_type = content.includes('class ') ? 'class' : 'functional';
      summary.has_jsx = content.includes('return (') || content.includes('return(');
    }

    // Add backend-specific info
    if (filePath.includes('backend') || filePath.includes('server')) {
      summary.has_express_routes = content.includes('router.') || content.includes('app.');
      summary.has_mongoose = content.includes('mongoose') || content.includes('Schema');
      summary.has_async = content.includes('async ');
    }

    return summary;
  } catch (error) {
    return {
      file_path: filePath,
      error: error.message,
    };
  }
}

function summarizeCode() {
  console.error('📝 Summarizing Code for GPT Analysis...\n');

  const summaries = {
    timestamp: new Date().toISOString(),
    frontend: {
      components: [],
      pages: [],
      total_files: 0,
    },
    backend: {
      routes: [],
      models: [],
      controllers: [],
      middleware: [],
      total_files: 0,
    },
    documentation: [],
    statistics: {
      total_lines: 0,
      total_files: 0,
      languages: {},
    },
  };

  // Summarize Frontend
  console.error('🎨 Analyzing Frontend...');
  const frontendDirs = [
    'grading-folder/frontend/components',
    'grading-folder/frontend/pages',
    'grading-folder/frontend/app',
  ];

  frontendDirs.forEach((dir) => {
    if (fs.existsSync(dir)) {
      const files = getAllFiles(dir).filter(
        (f) => f.endsWith('.jsx') || f.endsWith('.tsx') || f.endsWith('.js') || f.endsWith('.ts'),
      );

      files.forEach((file) => {
        const summary = summarizeFile(file);

        if (dir.includes('components')) {
          summaries.frontend.components.push(summary);
        } else if (dir.includes('pages') || dir.includes('app')) {
          summaries.frontend.pages.push(summary);
        }

        summaries.frontend.total_files++;
        summaries.statistics.total_files++;
        summaries.statistics.total_lines += summary.lines || 0;

        const lang = summary.language;
        summaries.statistics.languages[lang] = (summaries.statistics.languages[lang] || 0) + 1;
      });
    }
  });

  console.error(`   Components: ${summaries.frontend.components.length}`);
  console.error(`   Pages: ${summaries.frontend.pages.length}\n`);

  // Summarize Backend
  console.error('⚙️  Analyzing Backend...');
  const backendDirs = {
    routes: 'grading-folder/backend/routes',
    models: 'grading-folder/backend/models',
    controllers: 'grading-folder/backend/controllers',
    middleware: 'grading-folder/backend/middleware',
  };

  Object.entries(backendDirs).forEach(([type, dir]) => {
    if (fs.existsSync(dir)) {
      const files = getAllFiles(dir).filter((f) => f.endsWith('.js') || f.endsWith('.ts'));

      files.forEach((file) => {
        const summary = summarizeFile(file);
        summaries.backend[type].push(summary);
        summaries.backend.total_files++;
        summaries.statistics.total_files++;
        summaries.statistics.total_lines += summary.lines || 0;

        const lang = summary.language;
        summaries.statistics.languages[lang] = (summaries.statistics.languages[lang] || 0) + 1;
      });
    }
  });

  console.error(`   Routes: ${summaries.backend.routes.length}`);
  console.error(`   Models: ${summaries.backend.models.length}`);
  console.error(`   Controllers: ${summaries.backend.controllers.length}`);
  console.error(`   Middleware: ${summaries.backend.middleware.length}\n`);

  // Summarize Documentation
  console.error('📚 Analyzing Documentation...');
  const docFiles = ['grading-folder/README.md', 'grading-folder/PLANNING.md', 'README.md'];

  docFiles.forEach((file) => {
    if (fs.existsSync(file)) {
      try {
        const content = fs.readFileSync(file, 'utf8');
        summaries.documentation.push({
          file_name: path.basename(file),
          lines: content.split('\n').length,
          word_count: content.split(/\s+/).length,
          has_sections: content.includes('##'),
          preview: content.substring(0, 500),
        });
      } catch (error) {
        // Ignore
      }
    }
  });

  console.error(`   Documentation files: ${summaries.documentation.length}\n`);

  // Print statistics
  console.error('📊 Code Statistics:');
  console.error(`   Total Files: ${summaries.statistics.total_files}`);
  console.error(`   Total Lines: ${summaries.statistics.total_lines}`);
  console.error(`   Languages: ${Object.keys(summaries.statistics.languages).join(', ')}\n`);

  // Calculate summary size
  const jsonSize = JSON.stringify(summaries).length;
  console.error(`💾 Summary Size: ${(jsonSize / 1024).toFixed(2)} KB`);
  console.error(`📏 Estimated Tokens: ~${Math.ceil(jsonSize / 4)}\n`);

  // Output JSON (ONLY JSON to stdout)
  console.log(JSON.stringify(summaries, null, 2));

  return summaries;
}

// Run if called directly
if (require.main === module) {
  summarizeCode();
}

module.exports = { summarizeCode };
