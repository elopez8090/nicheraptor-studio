/**
 * Placeholder for a future durable queue consumer (Inngest, Trigger.dev, pgmq, etc.).
 *
 * The worker would:
 * 1. Load generation_jobs row by id
 * 2. For each item in chapter_plan, invoke lib/generation/process-chapter (server)
 * 3. Update job progress after each chapter
 * 4. Respect cancel_requested and retry with backoff on transient failures
 */

export type QueueWorkerJobPayload = {
  jobId: string;
  projectId: string;
};

export function describeGenerationQueueArchitecture(): string {
  return "generation_jobs (DB) → client orchestrator today → future queue worker";
}
