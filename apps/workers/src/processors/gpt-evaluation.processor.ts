import { Job } from 'bull';

export interface GPTEvaluationJobData {
  submissionId: string;
  criterionId: string;
  context: string;
}

export async function processGPTEvaluation(job: Job<GPTEvaluationJobData>) {
  console.log(`🤖 GPT evaluation for criterion: ${job.data.criterionId}`);

  // TODO: Implement GPT evaluation logic
  // - Build prompt from criterion
  // - Call OpenAI API with LangSmith tracing
  // - Parse GPT response
  // - Calculate weighted score

  return {
    success: true,
    score: 0,
    justification: 'GPT evaluation placeholder',
  };
}
