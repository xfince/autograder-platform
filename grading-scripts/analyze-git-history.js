/**
 * grading-scripts/analyze-git-history.js
 *
 * Analyzes Git commit history and provides metrics for Criterion 10
 */

const { execSync } = require('child_process');
const fs = require('fs');

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

function analyzeGitHistory() {
  console.error('📜 Analyzing Git History...\n');

  const analysis = {
    timestamp: new Date().toISOString(),
    criterion_id: 'criterion_10',
    is_git_repo: false,
    total_commits: 0,
    unique_commit_days: 0,
    days_since_last_commit: 0,
    avg_days_between_commits: 0,
    commit_frequency: 'none',
    commit_message_quality: {
      meaningful: 0,
      vague: 0,
      total: 0,
    },
    large_commits: 0,
    branches: {
      total: 0,
      non_main: 0,
    },
    merge_commits: 0,
    first_commit_message: '',
    last_commit_message: '',
    commit_timeline: [],
    score_recommendation: 0,
    justification: '',
  };

  // Check if Git repo
  if (!fs.existsSync('.git')) {
    console.error('❌ Not a Git repository');
    analysis.justification = 'Not a Git repository';
    console.log(JSON.stringify(analysis, null, 2));
    return analysis;
  }

  analysis.is_git_repo = true;
  console.error('✅ Git repository detected\n');

  // Get total commits
  const commitCount = runGitCommand('git rev-list --count HEAD');
  analysis.total_commits = parseInt(commitCount) || 0;
  console.error(`📊 Total Commits: ${analysis.total_commits}`);

  if (analysis.total_commits === 0) {
    analysis.justification = 'No commits found';
    console.log(JSON.stringify(analysis, null, 2));
    return analysis;
  }

  // Get commit dates
  const commitDates = runGitCommand('git log --format=%ad --date=short');
  if (commitDates) {
    const dates = commitDates.split('\n').filter((d) => d);
    analysis.unique_commit_days = new Set(dates).size;
    console.error(`📅 Unique Commit Days: ${analysis.unique_commit_days}`);
  }

  // Calculate days since last commit
  const lastCommitDate = runGitCommand('git log -1 --format=%at');
  if (lastCommitDate) {
    const lastCommitTimestamp = parseInt(lastCommitDate);
    const now = Math.floor(Date.now() / 1000);
    analysis.days_since_last_commit = parseFloat(((now - lastCommitTimestamp) / 86400).toFixed(1));
    console.error(`⏰ Days Since Last Commit: ${analysis.days_since_last_commit}`);
  }

  // Calculate average days between commits
  const commitTimestamps = runGitCommand('git log --format=%at');
  if (commitTimestamps) {
    const timestamps = commitTimestamps
      .split('\n')
      .filter((t) => t)
      .map((t) => parseInt(t));

    if (timestamps.length >= 2) {
      let totalDiff = 0;
      for (let i = 0; i < timestamps.length - 1; i++) {
        totalDiff += timestamps[i] - timestamps[i + 1];
      }
      analysis.avg_days_between_commits = parseFloat(
        (totalDiff / (timestamps.length - 1) / 86400).toFixed(2),
      );
      console.error(`📈 Avg Days Between Commits: ${analysis.avg_days_between_commits}`);
    }
  }

  // Determine commit frequency
  if (analysis.unique_commit_days >= 5 && analysis.avg_days_between_commits < 7) {
    analysis.commit_frequency = 'regular';
  } else if (analysis.unique_commit_days >= 3) {
    analysis.commit_frequency = 'moderate';
  } else if (analysis.unique_commit_days >= 1) {
    analysis.commit_frequency = 'sparse';
  } else {
    analysis.commit_frequency = 'irregular';
  }
  console.error(`🔄 Commit Frequency: ${analysis.commit_frequency}\n`);

  // Analyze commit messages
  console.error('💬 Analyzing Commit Messages...');
  const commitMessages = runGitCommand('git log --format=%s');
  if (commitMessages) {
    const messages = commitMessages.split('\n').filter((m) => m);
    analysis.commit_message_quality.total = messages.length;

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
      /^misc$/i,
    ];

    messages.forEach((msg) => {
      const isGeneric = genericPatterns.some((pattern) => pattern.test(msg.trim()));
      if (isGeneric || msg.length < 10) {
        analysis.commit_message_quality.vague++;
      } else {
        analysis.commit_message_quality.meaningful++;
      }
    });

    console.error(`   Meaningful: ${analysis.commit_message_quality.meaningful}`);
    console.error(`   Vague: ${analysis.commit_message_quality.vague}\n`);
  }

  // Detect large commits
  console.error('🔍 Checking for Large Commits...');
  const commitStats = runGitCommand('git log --shortstat --format="%H"');
  if (commitStats) {
    const lines = commitStats.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('files changed')) {
        const filesChanged = parseInt(lines[i].match(/(\d+) files? changed/)?.[1] || 0);
        if (filesChanged > 50) {
          analysis.large_commits++;
        }
      }
    }
    console.error(`   Large Commits (>50 files): ${analysis.large_commits}\n`);
  }

  // Get branches
  const branches = runGitCommand('git branch -a');
  if (branches) {
    const branchList = branches.split('\n').filter((b) => b.trim());
    analysis.branches.total = branchList.length;
    analysis.branches.non_main = branchList.filter(
      (b) => !b.includes('main') && !b.includes('master') && !b.includes('HEAD'),
    ).length;
    console.error(
      `🌿 Branches: ${analysis.branches.total} (${analysis.branches.non_main} non-main)`,
    );
  }

  // Get merge commits
  const mergeCommits = runGitCommand('git log --merges --format=%s');
  if (mergeCommits) {
    analysis.merge_commits = mergeCommits.split('\n').filter((m) => m).length;
    console.error(`🔀 Merge Commits: ${analysis.merge_commits}\n`);
  }

  // Get first and last commit messages
  analysis.first_commit_message = runGitCommand('git log --reverse --format=%s -1') || '';
  analysis.last_commit_message = runGitCommand('git log --format=%s -1') || '';

  // Create commit timeline (sample)
  const timelineData = runGitCommand('git log --format="%ad|%s" --date=short -20');
  if (timelineData) {
    const lines = timelineData.split('\n').filter((l) => l);
    const dateGroups = {};

    lines.forEach((line) => {
      const [date, message] = line.split('|');
      if (!dateGroups[date]) {
        dateGroups[date] = [];
      }
      dateGroups[date].push(message);
    });

    analysis.commit_timeline = Object.entries(dateGroups).map(([date, messages]) => ({
      date,
      commits: messages.length,
      message_sample: messages[0],
    }));
  }

  // Calculate score recommendation
  console.error('📊 Calculating Score...');
  let score = 1.0; // Start with Poor
  const reasons = [];

  // Total commits (0.8 points)
  if (analysis.total_commits >= 20) {
    score += 0.8;
    reasons.push('Excellent commit count (20+)');
  } else if (analysis.total_commits >= 10) {
    score += 0.6;
    reasons.push('Good commit count (10-19)');
  } else if (analysis.total_commits >= 5) {
    score += 0.4;
    reasons.push('Fair commit count (5-9)');
  } else {
    reasons.push('Limited commit count (<5)');
  }

  // Commit frequency (0.8 points)
  if (analysis.commit_frequency === 'regular') {
    score += 0.8;
    reasons.push('Regular commits throughout development');
  } else if (analysis.commit_frequency === 'moderate') {
    score += 0.6;
    reasons.push('Moderate commit frequency');
  } else if (analysis.commit_frequency === 'sparse') {
    score += 0.4;
    reasons.push('Sparse commit frequency');
  } else {
    reasons.push('Irregular commit pattern');
  }

  // Commit message quality (0.8 points)
  const meaningfulPercentage =
    analysis.commit_message_quality.total > 0
      ? (analysis.commit_message_quality.meaningful / analysis.commit_message_quality.total) * 100
      : 0;

  if (meaningfulPercentage >= 70) {
    score += 0.8;
    reasons.push('Excellent commit message quality (70%+ meaningful)');
  } else if (meaningfulPercentage >= 50) {
    score += 0.6;
    reasons.push('Good commit message quality (50-69% meaningful)');
  } else if (meaningfulPercentage >= 30) {
    score += 0.4;
    reasons.push('Fair commit message quality (30-49% meaningful)');
  } else {
    reasons.push('Poor commit message quality (<30% meaningful)');
  }

  // No large commits (0.3 points)
  if (analysis.large_commits <= 1) {
    score += 0.3;
    reasons.push('Good commit granularity');
  } else if (analysis.large_commits <= 3) {
    score += 0.15;
    reasons.push('Some large commits detected');
  } else {
    reasons.push('Multiple large commits suggest infrequent committing');
  }

  // Branching (0.3 points - bonus)
  if (analysis.branches.non_main > 0) {
    score += 0.3;
    reasons.push('Uses branching workflow');
  }

  // Cap at 4.0
  score = Math.min(score, 4.0);
  analysis.score_recommendation = parseFloat(score.toFixed(2));
  analysis.justification = reasons.join('; ');

  console.error(`\n✨ Score Recommendation: ${analysis.score_recommendation}/4.0`);
  console.error(`📝 Justification: ${analysis.justification}\n`);

  // Output JSON (ONLY JSON to stdout)
  console.log(JSON.stringify(analysis, null, 2));

  return analysis;
}

// Run if called directly
if (require.main === module) {
  analyzeGitHistory();
}

module.exports = { analyzeGitHistory };
