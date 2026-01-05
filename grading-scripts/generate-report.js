/**
 * grading-scripts/generate-report.js
 *
 * Generates final comprehensive grading report
 */

const fs = require('fs');
const path = require('path');

function loadJSON(filename) {
  try {
    if (fs.existsSync(filename)) {
      return JSON.parse(fs.readFileSync(filename, 'utf8'));
    }
  } catch (error) {
    console.error(`Error loading ${filename}:`, error.message);
  }
  return null;
}

function calculateLetterGrade(totalScore, maxScore) {
  const percentage = (totalScore / maxScore) * 100;

  if (percentage >= 90) return 'A';
  if (percentage >= 85) return 'A-';
  if (percentage >= 80) return 'B+';
  if (percentage >= 75) return 'B';
  if (percentage >= 70) return 'B-';
  if (percentage >= 65) return 'C+';
  if (percentage >= 60) return 'C';
  if (percentage >= 55) return 'C-';
  if (percentage >= 50) return 'D';
  return 'F';
}

function generateReport() {
  console.log('📊 Generating Final Grading Report...\n');

  // Load all data files
  const rubric = loadJSON('rubric.json');
  const unitTests = loadJSON('unit-test-results.json');
  const gitAnalysis = loadJSON('git-analysis.json');
  const codeSummaries = loadJSON('code-summaries.json');
  const gptEvaluation = loadJSON('gpt-evaluation.json');
  const deploymentTest = loadJSON('deployment-test.json');

  if (!rubric) {
    console.error('❌ rubric.json not found');
    process.exit(1);
  }

  const report = {
    timestamp: new Date().toISOString(),
    student_repository: process.env.GITHUB_REPOSITORY || 'Unknown',
    grading_date: new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }),
    scores: {},
    total_score: 0,
    max_score: rubric.metadata?.total_points || 64,
    percentage: 0,
    letter_grade: '',
    build_status: 'unknown',
    test_execution: {},
    criteria_breakdown: [],
  };

  // Determine build status
  if (process.env.BUILD_FAILED === 'true') {
    report.build_status = 'FAILED';
  } else if (unitTests || gptEvaluation) {
    report.build_status = 'SUCCESS';
  }

  // Process each criterion
  rubric.criteria.forEach((criterion) => {
    const criterionResult = {
      id: criterion.id,
      title: criterion.title,
      max_points: criterion.max_points,
      score: 0,
      evaluation_method: criterion.evaluation_method,
      level_achieved: 'Not Evaluated',
      justification: '',
      strengths: [],
      weaknesses: [],
      improvements: [],
      files_analyzed: [],
    };

    // Get score based on evaluation method
    if (criterion.evaluation_method === 'unit_test') {
      // Pure unit test criteria
      const unitScore = unitTests?.criteria_scores?.[criterion.id];
      if (unitScore) {
        criterionResult.score = unitScore.score;
        criterionResult.unit_test_results = {
          total: unitScore.total_tests,
          passed: unitScore.passed,
          failed: unitScore.failed,
        };

        // Determine level
        const percentage = (criterionResult.score / criterion.max_points) * 100;
        if (percentage >= 90) criterionResult.level_achieved = 'Excellent';
        else if (percentage >= 75) criterionResult.level_achieved = 'Good';
        else if (percentage >= 50) criterionResult.level_achieved = 'Fair';
        else criterionResult.level_achieved = 'Poor';

        criterionResult.justification = `Unit tests: ${unitScore.passed}/${unitScore.total_tests} passed`;
      }
    } else if (criterion.evaluation_method === 'gpt_semantic') {
      // Pure GPT criteria
      const gptResult = gptEvaluation?.criteria_evaluations?.[criterion.id];
      if (gptResult) {
        criterionResult.score = gptResult.score;
        criterionResult.level_achieved = gptResult.level_achieved;
        criterionResult.justification = gptResult.justification;
        criterionResult.strengths = gptResult.strengths;
        criterionResult.weaknesses = gptResult.weaknesses;
        criterionResult.improvements = gptResult.improvements;
        criterionResult.files_analyzed = gptResult.files_analyzed;
      }
    } else if (criterion.evaluation_method === 'hybrid') {
      // Hybrid criteria
      const gptResult = gptEvaluation?.criteria_evaluations?.[criterion.id];
      if (gptResult) {
        criterionResult.score = gptResult.score;
        criterionResult.level_achieved = gptResult.level_achieved;
        criterionResult.justification = gptResult.justification;
        criterionResult.strengths = gptResult.strengths;
        criterionResult.weaknesses = gptResult.weaknesses;
        criterionResult.improvements = gptResult.improvements;
        criterionResult.files_analyzed = gptResult.files_analyzed;

        if (gptResult.hybrid_calculation) {
          criterionResult.hybrid_breakdown = gptResult.hybrid_calculation;
          criterionResult.unit_test_results = {
            score: gptResult.hybrid_calculation.unit_test_score,
            weight: gptResult.hybrid_calculation.unit_test_weight,
          };
        }
      }
    }

    // Special handling for specific criteria
    if (criterion.id === 'criterion_10' && gitAnalysis) {
      // Git history
      criterionResult.score = gitAnalysis.score_recommendation || 0;
      criterionResult.justification = gitAnalysis.justification;
      criterionResult.git_metrics = {
        total_commits: gitAnalysis.total_commits,
        commit_frequency: gitAnalysis.commit_frequency,
        meaningful_messages: gitAnalysis.commit_message_quality?.meaningful,
        vague_messages: gitAnalysis.commit_message_quality?.vague,
      };
    }

    if (criterion.id === 'criterion_16' && deploymentTest) {
      // Deployment
      const deployResult = deploymentTest;
      criterionResult.deployment_url = deployResult.deployment_url;
      criterionResult.deployment_status = deployResult.passed > 0 ? 'accessible' : 'failed';
    }

    report.criteria_breakdown.push(criterionResult);
    report.total_score += criterionResult.score;
  });

  // Calculate final grade
  report.percentage = ((report.total_score / report.max_score) * 100).toFixed(1);
  report.letter_grade = calculateLetterGrade(report.total_score, report.max_score);

  // Test execution summary
  if (unitTests) {
    report.test_execution = {
      total_tests: unitTests.total_tests,
      passed: unitTests.passed,
      failed: unitTests.failed,
      success_rate: unitTests.success_rate,
    };
  }

  // Generate markdown report
  const markdown = generateMarkdownReport(report, rubric, gitAnalysis, codeSummaries);

  // Write report
  fs.writeFileSync('GRADING_REPORT.md', markdown);
  console.log('✅ Report written to GRADING_REPORT.md\n');

  // Also output JSON
  fs.writeFileSync('grading-report.json', JSON.stringify(report, null, 2));

  // Print summary
  console.log('='.repeat(60));
  console.log('📊 FINAL GRADING SUMMARY');
  console.log('='.repeat(60));
  console.log(
    `Total Score: ${report.total_score.toFixed(2)}/${report.max_score} (${report.percentage}%)`,
  );
  console.log(`Letter Grade: ${report.letter_grade}`);
  console.log(`Build Status: ${report.build_status}`);
  console.log('='.repeat(60) + '\n');

  return report;
}

function generateMarkdownReport(report, rubric, gitAnalysis, codeSummaries) {
  let md = '';

  // Header
  md += `# 📊 Grading Report\n\n`;
  md += `**Student Repository**: ${report.student_repository}\n`;
  md += `**Grading Date**: ${report.grading_date}\n`;
  md += `**Total Score**: ${report.total_score.toFixed(2)} / ${report.max_score} (${report.percentage}%)\n`;
  md += `**Letter Grade**: ${report.letter_grade}\n\n`;

  md += `---\n\n`;

  // Executive Summary
  md += `## Executive Summary\n\n`;

  const excellentAreas = report.criteria_breakdown.filter((c) => c.score >= 3.5);
  const goodAreas = report.criteria_breakdown.filter((c) => c.score >= 3.0 && c.score < 3.5);
  const needsWork = report.criteria_breakdown.filter((c) => c.score < 3.0);

  if (excellentAreas.length > 0) {
    md += `Your project demonstrates ${excellentAreas.length > 3 ? 'strong' : 'good'} technical implementation`;
    if (excellentAreas.length > 0) {
      md += ` with particularly excellent work in ${excellentAreas
        .slice(0, 3)
        .map((a) => a.title.toLowerCase())
        .join(', ')}`;
    }
    md += `. `;
  }

  if (needsWork.length > 0) {
    md += `Areas for improvement include ${needsWork
      .slice(0, 3)
      .map((a) => a.title.toLowerCase())
      .join(', ')}.`;
  }

  md += `\n\n---\n\n`;

  // Build Status
  md += `## 🏗️ Build Status\n\n`;
  if (report.build_status === 'SUCCESS') {
    md += `✅ **Build Successful**\n`;
    md += `- Frontend build: Success\n`;
    md += `- Backend build: Success\n`;
    md += `- No build errors detected\n\n`;
  } else if (report.build_status === 'FAILED') {
    md += `❌ **Build Failed**\n`;
    md += `- Some unit tests could not run due to build errors\n`;
    md += `- Unit-testable criteria awarded 0 points\n`;
    md += `- GPT evaluation completed on available code\n\n`;
  }

  md += `---\n\n`;

  // Test Execution Summary
  if (report.test_execution.total_tests > 0) {
    md += `## 🧪 Test Execution Summary\n\n`;
    md += `**Total Tests**: ${report.test_execution.total_tests}\n`;
    md += `**Passed**: ${report.test_execution.passed} ✅ (${report.test_execution.success_rate}%)\n`;
    md += `**Failed**: ${report.test_execution.failed} ❌\n\n`;
    md += `---\n\n`;
  }

  // Detailed Breakdown
  md += `## 📋 Detailed Breakdown\n\n`;

  report.criteria_breakdown.forEach((criterion, index) => {
    md += `### ${index + 1}. ${criterion.title}\n`;
    md += `**Score**: ${criterion.score.toFixed(1)} / ${criterion.max_points} (${criterion.level_achieved})\n`;
    md += `**Evaluation Method**: ${formatEvaluationMethod(criterion.evaluation_method)}\n\n`;

    // Unit test results
    if (criterion.unit_test_results) {
      md += `**Unit Test Results**:\n`;
      if (criterion.unit_test_results.total !== undefined) {
        md += `- Tests Passed: ${criterion.unit_test_results.passed}/${criterion.unit_test_results.total}\n`;
      }
      if (criterion.hybrid_breakdown) {
        md += `- Unit Test Score: ${criterion.hybrid_breakdown.unit_test_score}/${criterion.max_points} (${criterion.hybrid_breakdown.unit_test_weight * 100}% weight)\n`;
        md += `- GPT Score: ${criterion.hybrid_breakdown.gpt_score}/${criterion.max_points} (${criterion.hybrid_breakdown.gpt_weight * 100}% weight)\n`;
      }
      md += `\n`;
    }

    // Justification
    if (criterion.justification) {
      md += `**Justification**:\n${criterion.justification}\n\n`;
    }

    // Strengths
    if (criterion.strengths && criterion.strengths.length > 0) {
      md += `**Strengths**:\n`;
      criterion.strengths.forEach((s) => (md += `- ${s}\n`));
      md += `\n`;
    }

    // Weaknesses
    if (criterion.weaknesses && criterion.weaknesses.length > 0) {
      md += `**Weaknesses**:\n`;
      criterion.weaknesses.forEach((w) => (md += `- ${w}\n`));
      md += `\n`;
    }

    // Improvements
    if (criterion.improvements && criterion.improvements.length > 0) {
      md += `**Improvements**:\n`;
      criterion.improvements.forEach((i) => (md += `- ${i}\n`));
      md += `\n`;
    }

    // Files analyzed
    if (criterion.files_analyzed && criterion.files_analyzed.length > 0) {
      md += `**Files Analyzed**:\n`;
      criterion.files_analyzed.forEach((f) => (md += `- \`${f}\`\n`));
      md += `\n`;
    }

    // Git metrics
    if (criterion.git_metrics) {
      md += `**Git Metrics**:\n`;
      md += `- Total Commits: ${criterion.git_metrics.total_commits}\n`;
      md += `- Commit Frequency: ${criterion.git_metrics.commit_frequency}\n`;
      md += `- Meaningful Messages: ${criterion.git_metrics.meaningful_messages}\n`;
      md += `- Vague Messages: ${criterion.git_metrics.vague_messages}\n\n`;
    }

    // Deployment info
    if (criterion.deployment_url) {
      md += `**Deployment**:\n`;
      md += `- URL: ${criterion.deployment_url}\n`;
      md += `- Status: ${criterion.deployment_status}\n\n`;
    }

    md += `---\n\n`;
  });

  // Overall Assessment
  md += `## 🎯 Overall Assessment\n\n`;

  md += `**Excellent Areas** (3.5-4.0):\n`;
  excellentAreas.forEach((area) => {
    md += `- ${area.title} (${area.score.toFixed(1)})\n`;
  });
  md += `\n`;

  md += `**Good Areas** (3.0-3.4):\n`;
  goodAreas.forEach((area) => {
    md += `- ${area.title} (${area.score.toFixed(1)})\n`;
  });
  md += `\n`;

  if (needsWork.length > 0) {
    md += `**Areas Needing Improvement** (<3.0):\n`;
    needsWork.forEach((area) => {
      md += `- ${area.title} (${area.score.toFixed(1)})\n`;
    });
    md += `\n`;
  }

  // Top priority improvements
  md += `**Top Priority Improvements**:\n`;
  const allImprovements = report.criteria_breakdown
    .flatMap((c) => c.improvements || [])
    .filter((v, i, a) => a.indexOf(v) === i) // Remove duplicates
    .slice(0, 5);

  allImprovements.forEach((imp, i) => {
    md += `${i + 1}. ${imp}\n`;
  });
  md += `\n`;

  // Congratulations
  const topArea = excellentAreas[0];
  if (topArea) {
    md += `**Congratulations on**: ${topArea.justification || `Your excellent work in ${topArea.title}`}\n\n`;
  }

  md += `---\n\n`;

  // Metadata
  md += `## 📝 Grading Metadata\n\n`;
  md += `- **Grading System Version**: 1.0\n`;
  md += `- **GPT Model Used**: GPT-4o\n`;
  md += `- **Grading Timestamp**: ${report.timestamp}\n`;
  if (codeSummaries) {
    md += `- **Total Files Analyzed**: ${codeSummaries.statistics?.total_files || 0}\n`;
    md += `- **Total Lines of Code**: ${codeSummaries.statistics?.total_lines || 0}\n`;
  }

  return md;
}

function formatEvaluationMethod(method) {
  const methods = {
    unit_test: 'Unit Testing',
    gpt_semantic: 'GPT Semantic Analysis',
    hybrid: 'Hybrid (Unit Tests + GPT Analysis)',
  };
  return methods[method] || method;
}

// Run if called directly
if (require.main === module) {
  try {
    generateReport();
    process.exit(0);
  } catch (error) {
    console.error('Fatal error generating report:', error);
    process.exit(1);
  }
}

module.exports = { generateReport };
