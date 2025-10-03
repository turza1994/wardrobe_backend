export interface JobOptions {
  delay?: number;
  attempts?: number;
  backoff?: {
    type: 'fixed' | 'exponential';
    delay: number;
  };
}

export interface RecurringJobOptions extends JobOptions {
  cron?: string;
  repeat?: {
    every?: number;
    limit?: number;
  };
}

export interface IJobService {
  addJob<T = any>(queueName: string, jobName: string, data: T, options?: JobOptions): Promise<void>;
  addRecurringJob<T = any>(
    queueName: string,
    jobName: string,
    data: T,
    options: RecurringJobOptions
  ): Promise<void>;
  removeJob(queueName: string, jobId: string): Promise<void>;
  getJobStatus(queueName: string, jobId: string): Promise<string | null>;
}
