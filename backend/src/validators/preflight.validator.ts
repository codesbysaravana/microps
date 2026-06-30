import { z } from 'zod';

export const analyzeRepoSchema = z.object({
  repoUrl: z.string().url('Must be a valid GitHub URL.').includes('github.com', { message: 'Must be a github.com repository URL.' }),
});

export type AnalyzeRepoInput = z.infer<typeof analyzeRepoSchema>;
