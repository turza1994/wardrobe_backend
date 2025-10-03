import { IJobService } from './jobService.interface';
import { InMemoryJobService } from './inMemoryJobService';

export const jobService: IJobService = new InMemoryJobService();

export { IJobService };
