import {
  gradingQueue,
  gitCloneQueue,
  testExecutionQueue,
  codeAnalysisQueue,
  gptEvaluationQueue,
  reportGenerationQueue,
} from '../config/queues';
import { processGradingJob } from '../processors/grading.processor';
import { processGitClone } from '../processors/git-clone.processor';
import { processTestExecution } from '../processors/test-execution.processor';
import { processCodeAnalysis } from '../processors/code-analysis.processor';
import { processGPTEvaluation } from '../processors/gpt-evaluation.processor';
import { processReportGeneration } from '../processors/report-generation.processor';

export async function startWorkers() {
  const concurrency = parseInt(process.env.CONCURRENT_JOBS || '2');

  // Register processors
  gradingQueue.process(concurrency, processGradingJob);
  gitCloneQueue.process(concurrency, processGitClone);
  testExecutionQueue.process(concurrency, processTestExecution);
  codeAnalysisQueue.process(concurrency, processCodeAnalysis);
  gptEvaluationQueue.process(concurrency, processGPTEvaluation);
  reportGenerationQueue.process(concurrency, processReportGeneration);

  // Event listeners for grading queue
  gradingQueue.on('completed', (job, result) => {
    console.log(`✅ Grading job ${job.id} completed:`, result);
  });

  gradingQueue.on('failed', (job, error) => {
    console.error(`❌ Grading job ${job?.id} failed:`, error.message);
  });

  gradingQueue.on('progress', (job, progress) => {
    console.log(`⏳ Grading job ${job.id} progress: ${progress}%`);
  });

  console.log(`👷 Workers started with concurrency: ${concurrency}`);
}
