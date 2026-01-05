/**
 * tests/git/commit-history.test.js
 *
 * Tests for Git version control usage and commit history
 * Evaluates: Criterion 10 (Git Version Control)
 */

const { execSync } = require('child_process');
const fs = require('fs');

const TEST_TIMEOUT = 30000;

describe('Git Version Control Tests', () => {
  let testResults = {
    criterion_id: 'criterion_10',
    total_tests: 0,
    passed: 0,
    failed: 0,
    details: [],
    git_metrics: {},
  };

  const recordTest = (testName, passed, error = null, metrics = null) => {
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
      metrics,
    });
  };

  afterAll(() => {
    console.log(JSON.stringify(testResults, null, 2));
  });

  // Helper to run git commands
  function runGitCommand(command) {
    try {
      return execSync(command, {
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe'],
      }).trim();
    } catch (error) {
      return null;
    }
  }

  describe('Git Repository Setup', () => {
    test('Project is a Git repository', () => {
      try {
        const isGitRepo = fs.existsSync('.git');

        expect(isGitRepo).toBe(true);
        recordTest('Git repository exists', true);
      } catch (error) {
        recordTest('Git repository exists', false, error);
        throw error;
      }
    });

    test('Git repository has commits', () => {
      try {
        const commitCount = runGitCommand('git rev-list --count HEAD');
        const count = parseInt(commitCount);

        testResults.git_metrics.total_commits = count;

        expect(count).toBeGreaterThan(0);
        recordTest('Has commits', true, null, { commit_count: count });
      } catch (error) {
        recordTest('Has commits', false, error);
        throw error;
      }
    });
  });

  describe('Commit Frequency', () => {
    test('Multiple commits throughout development (not just 1-2)', () => {
      try {
        const commitCount = runGitCommand('git rev-list --count HEAD');
        const count = parseInt(commitCount);

        // Should have at least 5 commits
        const hasRegularCommits = count >= 5;

        expect(hasRegularCommits).toBe(true);
        recordTest('Multiple commits', true, null, { commit_count: count });
      } catch (error) {
        recordTest('Multiple commits', false, error);
        throw error;
      }
    });

    test('Commits are spread over time (not all in one day)', () => {
      try {
        // Get commit dates
        const commitDates = runGitCommand('git log --format=%ad --date=short');

        if (!commitDates) {
          recordTest('Commits spread over time', false, new Error('No commit dates'));
          return;
        }

        const dates = commitDates.split('\n').filter((d) => d);
        const uniqueDates = new Set(dates);

        testResults.git_metrics.unique_commit_days = uniqueDates.size;
        testResults.git_metrics.total_days_span = calculateDaySpan(dates);

        // Should have commits on at least 3 different days
        const spreadOverTime = uniqueDates.size >= 3;

        expect(spreadOverTime).toBe(true);
        recordTest('Commits spread over time', true, null, {
          unique_days: uniqueDates.size,
        });
      } catch (error) {
        recordTest('Commits spread over time', false, error);
        throw error;
      }
    });

    test('Average time between commits is reasonable', () => {
      try {
        const commitTimestamps = runGitCommand('git log --format=%at');

        if (!commitTimestamps) {
          recordTest('Reasonable commit frequency', false, new Error('No timestamps'));
          return;
        }

        const timestamps = commitTimestamps
          .split('\n')
          .filter((t) => t)
          .map((t) => parseInt(t));

        if (timestamps.length < 2) {
          recordTest('Reasonable commit frequency', false, new Error('Not enough commits'));
          return;
        }

        // Calculate average days between commits
        let totalDiff = 0;
        for (let i = 0; i < timestamps.length - 1; i++) {
          totalDiff += timestamps[i] - timestamps[i + 1];
        }
        const avgDaysBetween = totalDiff / (timestamps.length - 1) / 86400;

        testResults.git_metrics.avg_days_between_commits = avgDaysBetween.toFixed(2);

        // Average should be less than 7 days (weekly commits)
        const isReasonable = avgDaysBetween < 7;

        recordTest('Reasonable commit frequency', isReasonable, null, {
          avg_days: avgDaysBetween.toFixed(2),
        });
        expect(true).toBe(true);
      } catch (error) {
        recordTest('Reasonable commit frequency', false, error);
      }
    });
  });

  describe('Commit Messages', () => {
    test('Commit messages are meaningful (not generic)', () => {
      try {
        const commitMessages = runGitCommand('git log --format=%s');

        if (!commitMessages) {
          recordTest('Meaningful commit messages', false, new Error('No messages'));
          return;
        }

        const messages = commitMessages.split('\n').filter((m) => m);

        // Check for generic/bad commit messages
        const genericPatterns = [
          /^update$/i,
          /^fix$/i,
          /^commit$/i,
          /^changes$/i,
          /^stuff$/i,
          /^work$/i,
          /^test$/i,
          /^wip$/i,
          /^\.$/,
          /^asdf$/i,
        ];

        let meaningfulCount = 0;
        let vagueCount = 0;

        messages.forEach((msg) => {
          const isGeneric = genericPatterns.some((pattern) => pattern.test(msg.trim()));
          if (isGeneric) {
            vagueCount++;
          } else if (msg.length >= 10) {
            // At least 10 chars
            meaningfulCount++;
          }
        });

        testResults.git_metrics.meaningful_messages = meaningfulCount;
        testResults.git_metrics.vague_messages = vagueCount;

        // At least 60% should be meaningful
        const meaningfulPercentage = (meaningfulCount / messages.length) * 100;
        const hasMeaningfulMessages = meaningfulPercentage >= 60;

        expect(hasMeaningfulMessages).toBe(true);
        recordTest('Meaningful commit messages', true, null, {
          meaningful: meaningfulCount,
          vague: vagueCount,
          percentage: meaningfulPercentage.toFixed(1),
        });
      } catch (error) {
        recordTest('Meaningful commit messages', false, error);
        throw error;
      }
    });

    test('Commit messages follow conventions (capitalized, descriptive)', () => {
      try {
        const commitMessages = runGitCommand('git log --format=%s -20'); // Last 20 commits

        if (!commitMessages) {
          recordTest('Commit message conventions', false, new Error('No messages'));
          return;
        }

        const messages = commitMessages.split('\n').filter((m) => m);

        let capitalizedCount = 0;
        let descriptiveCount = 0;

        messages.forEach((msg) => {
          // Check if first letter is capitalized
          if (/^[A-Z]/.test(msg)) {
            capitalizedCount++;
          }

          // Check if descriptive (has actual words, not just symbols)
          if (msg.length >= 15 && /[a-zA-Z]/.test(msg)) {
            descriptiveCount++;
          }
        });

        const followsConventions = capitalizedCount / messages.length >= 0.5;

        recordTest('Commit message conventions', followsConventions, null, {
          capitalized: capitalizedCount,
          descriptive: descriptiveCount,
          total: messages.length,
        });
        expect(true).toBe(true);
      } catch (error) {
        recordTest('Commit message conventions', false, error);
      }
    });

    test('No very large commits (indicating infrequent commits)', () => {
      try {
        const commitStats = runGitCommand('git log --shortstat --format="%H"');

        if (!commitStats) {
          recordTest('No large commits', false, new Error('No commit stats'));
          return;
        }

        const lines = commitStats.split('\n');
        let largeCommits = 0;

        for (let i = 0; i < lines.length; i++) {
          if (lines[i].includes('files changed')) {
            const filesChanged = parseInt(lines[i].match(/(\d+) files? changed/)?.[1] || 0);

            // Consider commits with >50 files as "large dumps"
            if (filesChanged > 50) {
              largeCommits++;
            }
          }
        }

        testResults.git_metrics.large_commits = largeCommits;

        // Should have no more than 2 large commits
        const noLargeCommits = largeCommits <= 2;

        recordTest('No large commits', noLargeCommits, null, {
          large_commit_count: largeCommits,
        });
        expect(true).toBe(true);
      } catch (error) {
        recordTest('No large commits', false, error);
      }
    });
  });

  describe('Branching & Merging', () => {
    test('Project shows evidence of branching workflow (optional)', () => {
      try {
        const branches = runGitCommand('git branch -a');

        if (!branches) {
          recordTest('Branching workflow', false, new Error('No branches'));
          return;
        }

        const branchList = branches.split('\n').filter((b) => b.trim());
        const nonMainBranches = branchList.filter(
          (b) => !b.includes('main') && !b.includes('master') && !b.includes('HEAD'),
        );

        testResults.git_metrics.branches = {
          total: branchList.length,
          non_main: nonMainBranches.length,
        };

        // Branching is good practice but not required for all projects
        const usesBranching = nonMainBranches.length > 0;

        recordTest('Branching workflow', usesBranching);
        expect(true).toBe(true);
      } catch (error) {
        recordTest('Branching workflow', false, error);
      }
    });

    test('Merge commits show collaborative workflow (if applicable)', () => {
      try {
        const mergeCommits = runGitCommand('git log --merges --format=%s');

        const hasMergeCommits = mergeCommits && mergeCommits.length > 0;

        testResults.git_metrics.merge_commits = hasMergeCommits
          ? mergeCommits.split('\n').filter((m) => m).length
          : 0;

        // Merges are optional for solo projects
        recordTest('Merge commits', hasMergeCommits);
        expect(true).toBe(true);
      } catch (error) {
        recordTest('Merge commits', false, error);
      }
    });
  });

  describe('Commit Content Quality', () => {
    test('Commits focus on specific features/fixes (atomic commits)', () => {
      try {
        const commitMessages = runGitCommand('git log --format=%s -30');

        if (!commitMessages) {
          recordTest('Atomic commits', false, new Error('No messages'));
          return;
        }

        const messages = commitMessages.split('\n').filter((m) => m);

        // Look for focused commit messages
        const focusedKeywords = [
          'add',
          'fix',
          'update',
          'remove',
          'refactor',
          'implement',
          'create',
          'delete',
          'improve',
          'enhance',
        ];

        let focusedCount = 0;
        messages.forEach((msg) => {
          const lowerMsg = msg.toLowerCase();
          if (focusedKeywords.some((keyword) => lowerMsg.includes(keyword))) {
            focusedCount++;
          }
        });

        const atomicPercentage = (focusedCount / messages.length) * 100;
        const hasAtomicCommits = atomicPercentage >= 40;

        recordTest('Atomic commits', hasAtomicCommits, null, {
          focused_commits: focusedCount,
          percentage: atomicPercentage.toFixed(1),
        });
        expect(true).toBe(true);
      } catch (error) {
        recordTest('Atomic commits', false, error);
      }
    });
  });

  describe('.gitignore File', () => {
    test('Project has .gitignore file', () => {
      try {
        const hasGitignore = fs.existsSync('.gitignore');

        expect(hasGitignore).toBe(true);
        recordTest('.gitignore exists', true);
      } catch (error) {
        recordTest('.gitignore exists', false, error);
        throw error;
      }
    });

    test('.gitignore ignores common files (node_modules, .env, etc.)', () => {
      try {
        if (!fs.existsSync('.gitignore')) {
          recordTest('.gitignore content', false, new Error('No .gitignore'));
          return;
        }

        const gitignoreContent = fs.readFileSync('.gitignore', 'utf8');

        const importantPatterns = ['node_modules', '.env', '.next', 'dist', 'build'];

        let foundPatterns = 0;
        importantPatterns.forEach((pattern) => {
          if (gitignoreContent.includes(pattern)) {
            foundPatterns++;
          }
        });

        const hasProperIgnores = foundPatterns >= 3;

        expect(hasProperIgnores).toBe(true);
        recordTest('.gitignore content', true, null, {
          patterns_found: foundPatterns,
          total_checked: importantPatterns.length,
        });
      } catch (error) {
        recordTest('.gitignore content', false, error);
        throw error;
      }
    });

    test('No sensitive files committed (.env, secrets)', () => {
      try {
        const trackedFiles = runGitCommand('git ls-files');

        if (!trackedFiles) {
          recordTest('No sensitive files', false, new Error('Cannot list files'));
          return;
        }

        const files = trackedFiles.split('\n');

        const sensitivePatterns = [
          /\.env$/,
          /\.env\.local$/,
          /\.env\.production$/,
          /secrets/i,
          /\.pem$/,
          /\.key$/,
          /\.p12$/,
        ];

        const sensitiveFiles = files.filter((file) =>
          sensitivePatterns.some((pattern) => pattern.test(file)),
        );

        const noSensitiveFiles = sensitiveFiles.length === 0;

        expect(noSensitiveFiles).toBe(true);
        recordTest('No sensitive files', true, null, {
          sensitive_files_found: sensitiveFiles.length,
        });
      } catch (error) {
        recordTest('No sensitive files', false, error);
        throw error;
      }
    });
  });

  describe('Commit Timeline', () => {
    test('First and last commits show development progression', () => {
      try {
        const firstCommit = runGitCommand('git log --reverse --format=%s -1');
        const lastCommit = runGitCommand('git log --format=%s -1');

        testResults.git_metrics.first_commit_message = firstCommit;
        testResults.git_metrics.last_commit_message = lastCommit;

        // Just check that they exist and are different
        const showsProgression = firstCommit !== lastCommit;

        recordTest('Development progression', showsProgression);
        expect(true).toBe(true);
      } catch (error) {
        recordTest('Development progression', false, error);
      }
    });

    test('Recent commits show active development', () => {
      try {
        const lastCommitDate = runGitCommand('git log -1 --format=%at');

        if (!lastCommitDate) {
          recordTest('Recent activity', false, new Error('No commit date'));
          return;
        }

        const lastCommitTimestamp = parseInt(lastCommitDate);
        const now = Math.floor(Date.now() / 1000);
        const daysSinceLastCommit = (now - lastCommitTimestamp) / 86400;

        testResults.git_metrics.days_since_last_commit = daysSinceLastCommit.toFixed(1);

        // Last commit should be within 30 days
        const isRecent = daysSinceLastCommit <= 30;

        recordTest('Recent activity', isRecent, null, {
          days_since_last: daysSinceLastCommit.toFixed(1),
        });
        expect(true).toBe(true);
      } catch (error) {
        recordTest('Recent activity', false, error);
      }
    });
  });

  // Helper function
  function calculateDaySpan(dates) {
    if (dates.length < 2) return 0;

    const sortedDates = dates.sort();
    const firstDate = new Date(sortedDates[0]);
    const lastDate = new Date(sortedDates[sortedDates.length - 1]);

    const diffTime = Math.abs(lastDate - firstDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
  }
});

// module.exports = { testResults };
