import { IJobService, JobOptions, RecurringJobOptions } from './jobService.interface';

export class InMemoryJobService implements IJobService {
  private jobs: Map<string, any> = new Map();

  async addJob<T = any>(
    queueName: string,
    jobName: string,
    data: T,
    options?: JobOptions
  ): Promise<void> {
    const jobId = `${queueName}:${jobName}:${Date.now()}`;
    
    console.log(`[InMemoryJobService] Job scheduled: ${jobId}`, {
      queueName,
      jobName,
      data,
      options,
    });

    this.jobs.set(jobId, { queueName, jobName, data, options, status: 'pending' });

    if (options?.delay) {
      setTimeout(() => {
        console.log(`[InMemoryJobService] Job would execute now: ${jobId}`);
      }, options.delay);
    }
  }

  async addRecurringJob<T = any>(
    queueName: string,
    jobName: string,
    data: T,
    options: RecurringJobOptions
  ): Promise<void> {
    console.log(`[InMemoryJobService] Recurring job scheduled: ${queueName}:${jobName}`, {
      data,
      options,
    });
  }

  async removeJob(queueName: string, jobId: string): Promise<void> {
    this.jobs.delete(jobId);
  }

  async getJobStatus(queueName: string, jobId: string): Promise<string | null> {
    const job = this.jobs.get(jobId);
    return job ? job.status : null;
  }
}
