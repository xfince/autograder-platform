/**
 * grading-scripts/gpt-evaluator.js
 *
 * Uses GPT-4o to evaluate code quality and semantic aspects
 */

const fs = require('fs');
const path = require('path');
const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function evaluateWithGPT() {
  console.error('🤖 Starting GPT-4o Evaluation...\n');

  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ OPENAI_API_KEY environment variable not set');
    process.exit(1);
  }

  // Load rubric
  const rubric = JSON.parse(fs.readFileSync('rubric.json', 'utf8'));

  // Load code summaries
  let codeSummaries = {};
  if (fs.existsSync('code-summaries.json')) {
    codeSummaries = JSON.parse(fs.readFileSync('code-summaries.json', 'utf8'));
  }

  // Load unit test results
  let unitTestResults = {};
  if (fs.existsSync('unit-test-results.json')) {
    unitTestResults = JSON.parse(fs.readFileSync('unit-test-results.json', 'utf8'));
  }

  const evaluation = {
    timestamp: new Date().toISOString(),
    model: 'gpt-4o',
    criteria_evaluations: {},
    metadata: {
      total_api_calls: 0,
      total_tokens_used: 0,
      evaluation_time_ms: 0,
    },
  };

  const startTime = Date.now();

  // Get criteria that need GPT evaluation
  const gptCriteria = rubric.criteria.filter(
    (c) => c.evaluation_method === 'gpt_semantic' || c.evaluation_method === 'hybrid',
  );

  console.error(`📋 Evaluating ${gptCriteria.length} criteria with GPT-4o\n`);

  // Batch criteria into groups to minimize API calls
  const batches = [
    // Batch 1: Planning & Documentation
    gptCriteria.filter((c) => ['criterion_1', 'criterion_15'].includes(c.id)),

    // Batch 2: Frontend Quality
    gptCriteria.filter((c) => ['criterion_2', 'criterion_7'].includes(c.id)),

    // Batch 3: Backend Quality
    gptCriteria.filter((c) => ['criterion_3', 'criterion_4'].includes(c.id)),

    // Batch 4: Code Quality & Advanced Features
    gptCriteria.filter((c) => ['criterion_8', 'criterion_12'].includes(c.id)),

    // Batch 5: Remaining criteria
    gptCriteria.filter(
      (c) =>
        ![
          'criterion_1',
          'criterion_2',
          'criterion_3',
          'criterion_4',
          'criterion_7',
          'criterion_8',
          'criterion_12',
          'criterion_15',
        ].includes(c.id),
    ),
  ].filter((batch) => batch.length > 0);

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    console.error(`📦 Processing Batch ${i + 1}/${batches.length} (${batch.length} criteria)...`);

    for (const criterion of batch) {
      try {
        console.error(`   Evaluating: ${criterion.title}`);

        const result = await evaluateCriterion(criterion, codeSummaries, unitTestResults, rubric);
        evaluation.criteria_evaluations[criterion.id] = result;
        evaluation.metadata.total_api_calls++;
        evaluation.metadata.total_tokens_used += result.tokens_used || 0;

        console.error(`   ✅ Score: ${result.score}/${criterion.max_points}`);

        // Small delay to avoid rate limits
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`   ❌ Error evaluating ${criterion.title}:`, error.message);
        evaluation.criteria_evaluations[criterion.id] = {
          criterion_id: criterion.id,
          score: 0,
          error: error.message,
          evaluation_failed: true,
        };
      }
    }

    console.error();
  }

  evaluation.metadata.evaluation_time_ms = Date.now() - startTime;

  console.error('✨ GPT Evaluation Complete!\n');
  console.error(`📊 Statistics:`);
  console.error(`   Total API Calls: ${evaluation.metadata.total_api_calls}`);
  console.error(`   Total Tokens: ${evaluation.metadata.total_tokens_used}`);
  console.error(`   Time: ${(evaluation.metadata.evaluation_time_ms / 1000).toFixed(2)}s\n`);

  // Output JSON (ONLY JSON to stdout)
  console.log(JSON.stringify(evaluation, null, 2));

  return evaluation;
}

async function evaluateCriterion(criterion, codeSummaries, unitTestResults, rubric) {
  const isHybrid = criterion.evaluation_method === 'hybrid';

  // Build context for GPT
  let context = buildContext(criterion, codeSummaries, unitTestResults);

  // Build prompt
  const prompt = `You are an expert code reviewer evaluating a student's full-stack project for an academic course.

**Criterion**: ${criterion.title}
**ID**: ${criterion.id}
**Max Points**: ${criterion.max_points}
**Evaluation Method**: ${criterion.evaluation_method}

**Scoring Levels**:
- Excellent (4 points): ${criterion.levels.Excellent}
- Good (3 points): ${criterion.levels.Good}
- Fair (2 points): ${criterion.levels.Fair}
- Poor (1 point): ${criterion.levels.Poor}

**Evaluation Instructions**: ${criterion.gpt_instructions}

${
  isHybrid
    ? `**Unit Test Results**:
- Tests Passed: ${unitTestResults.criteria_scores?.[criterion.id]?.passed || 0}
- Tests Failed: ${unitTestResults.criteria_scores?.[criterion.id]?.failed || 0}
- Test Score: ${unitTestResults.criteria_scores?.[criterion.id]?.score || 0}/${criterion.max_points}
`
    : ''
}

**Code Analysis**:
${context}

**Your Task**:
Analyze the provided information and assign a score between 1.0 and 4.0 (decimals allowed for in-between cases).
${isHybrid ? `Note: The unit test score is ${unitTestResults.criteria_scores?.[criterion.id]?.score || 0}. You should evaluate the semantic/qualitative aspects and your score will be weighted at ${criterion.gpt_weight * 100}% while unit tests are weighted at ${criterion.unit_test_weight * 100}%.` : ''}

Provide your response in JSON format:
{
  "score": <number between 1.0 and 4.0>,
  "level_achieved": "<Poor/Fair/Good/Excellent or combination>",
  "justification": "<detailed explanation of score>",
  "strengths": ["<specific strength 1>", "<specific strength 2>", ...],
  "weaknesses": ["<specific weakness 1>", "<specific weakness 2>", ...],
  "improvements": ["<specific improvement 1>", "<specific improvement 2>", ...],
  "files_analyzed": ["<file1>", "<file2>", ...]
}`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content:
            'You are an expert full-stack development instructor evaluating student projects. Provide fair, constructive feedback with specific examples.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    });

    const gptResponse = JSON.parse(response.choices[0].message.content);

    let finalScore = gptResponse.score;

    // Calculate weighted score for hybrid criteria
    if (isHybrid) {
      const unitScore = unitTestResults.criteria_scores?.[criterion.id]?.score || 0;
      const gptScore = gptResponse.score;

      finalScore = unitScore * criterion.unit_test_weight + gptScore * criterion.gpt_weight;
      finalScore = parseFloat(finalScore.toFixed(2));

      gptResponse.hybrid_calculation = {
        unit_test_score: unitScore,
        unit_test_weight: criterion.unit_test_weight,
        gpt_score: gptScore,
        gpt_weight: criterion.gpt_weight,
        final_score: finalScore,
      };
    }

    return {
      criterion_id: criterion.id,
      criterion_title: criterion.title,
      score: finalScore,
      max_points: criterion.max_points,
      gpt_score: gptResponse.score,
      level_achieved: gptResponse.level_achieved,
      justification: gptResponse.justification,
      strengths: gptResponse.strengths || [],
      weaknesses: gptResponse.weaknesses || [],
      improvements: gptResponse.improvements || [],
      files_analyzed: gptResponse.files_analyzed || [],
      tokens_used: response.usage?.total_tokens || 0,
      ...(isHybrid && { hybrid_calculation: gptResponse.hybrid_calculation }),
    };
  } catch (error) {
    throw new Error(`GPT API error: ${error.message}`);
  }
}

function buildContext(criterion, codeSummaries, unitTestResults) {
  let context = '';

  // Add relevant code summaries based on criterion
  if (criterion.id === 'criterion_1') {
    // Planning & Documentation
    context += '**Documentation**:\n';
    if (codeSummaries.documentation) {
      codeSummaries.documentation.forEach((doc) => {
        context += `- ${doc.file_name} (${doc.lines} lines, ${doc.word_count} words)\n`;
        context += `  Preview: ${doc.preview}\n\n`;
      });
    }
  } else if (criterion.id === 'criterion_2' || criterion.id === 'criterion_7') {
    // Frontend
    context += '**Frontend Components**:\n';
    if (codeSummaries.frontend?.components) {
      codeSummaries.frontend.components.slice(0, 10).forEach((comp) => {
        context += `- ${comp.file_name} (${comp.lines} lines)\n`;
        context += `  Hooks: ${comp.hooks_used?.join(', ') || 'none'}\n`;
        context += `  Type: ${comp.component_type || 'unknown'}\n`;
        if (comp.key_snippets?.length > 0) {
          context += `  Key code:\n\`\`\`\n${comp.key_snippets[0]}\n\`\`\`\n`;
        }
      });
    }
  } else if (criterion.id === 'criterion_3' || criterion.id === 'criterion_4') {
    // Backend
    context += '**Backend Structure**:\n';
    context += `Routes: ${codeSummaries.backend?.routes?.length || 0}\n`;
    context += `Models: ${codeSummaries.backend?.models?.length || 0}\n`;
    context += `Controllers: ${codeSummaries.backend?.controllers?.length || 0}\n\n`;

    if (codeSummaries.backend?.routes) {
      context += '**Sample Routes**:\n';
      codeSummaries.backend.routes.slice(0, 5).forEach((route) => {
        context += `- ${route.file_name} (${route.lines} lines)\n`;
        context += `  Functions: ${route.functions?.join(', ') || 'none'}\n`;
        if (route.key_snippets?.length > 0) {
          context += `  Key code:\n\`\`\`\n${route.key_snippets[0]}\n\`\`\`\n`;
        }
      });
    }
  } else if (criterion.id === 'criterion_8') {
    // Code Quality
    context += '**Code Statistics**:\n';
    context += `Total Files: ${codeSummaries.statistics?.total_files || 0}\n`;
    context += `Total Lines: ${codeSummaries.statistics?.total_lines || 0}\n`;
    context += `Languages: ${Object.keys(codeSummaries.statistics?.languages || {}).join(', ')}\n\n`;

    // Sample from both frontend and backend
    context += '**Sample Code Quality**:\n';
    const allFiles = [
      ...(codeSummaries.frontend?.components || []).slice(0, 3),
      ...(codeSummaries.backend?.routes || []).slice(0, 3),
    ];

    allFiles.forEach((file) => {
      context += `- ${file.file_name}: ${file.lines} lines, complexity: ${file.complexity}\n`;
    });
  } else {
    // Generic context
    context += `**Project Overview**:\n`;
    context += `Frontend Files: ${codeSummaries.frontend?.total_files || 0}\n`;
    context += `Backend Files: ${codeSummaries.backend?.total_files || 0}\n`;
    context += `Total Lines of Code: ${codeSummaries.statistics?.total_lines || 0}\n`;
  }

  return context;
}

// Run if called directly
if (require.main === module) {
  evaluateWithGPT()
    .then((results) => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { evaluateWithGPT };
