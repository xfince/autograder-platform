import Queue from 'bull';
import { redisConnection } from './redis';

// Queue names
export enum QueueNames {
  GRADING = 'grading',
  GIT_CLONE = 'git-clone',
  TEST_EXECUTION = 'test-execution',
  CODE_ANALYSIS = 'code-analysis',
  GPT_EVALUATION = 'gpt-evaluation',
  REPORT_GENERATION = 'report-generation',
}

// Queue options - use connection options instead of connection instance
const queueOptions = {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD || undefined,
  },
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: {
      age: 86400, // Keep completed jobs for 24 hours
      count: 1000,
    },
    removeOnFail: {
      age: 604800, // Keep failed jobs for 7 days
    },
  },
};

// Create queues
export const gradingQueue = new Queue(QueueNames.GRADING, queueOptions);
export const gitCloneQueue = new Queue(QueueNames.GIT_CLONE, queueOptions);
export const testExecutionQueue = new Queue(QueueNames.TEST_EXECUTION, queueOptions);
export const codeAnalysisQueue = new Queue(QueueNames.CODE_ANALYSIS, queueOptions);
export const gptEvaluationQueue = new Queue(QueueNames.GPT_EVALUATION, queueOptions);
export const reportGenerationQueue = new Queue(QueueNames.REPORT_GENERATION, queueOptions);

// Export all queues
export const queues = {
  grading: gradingQueue,
  gitClone: gitCloneQueue,
  testExecution: testExecutionQueue,
  codeAnalysis: codeAnalysisQueue,
  gptEvaluation: gptEvaluationQueue,
  reportGeneration: reportGenerationQueue,
};

console.log('📦 All job queues initialized');
