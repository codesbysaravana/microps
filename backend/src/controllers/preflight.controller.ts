import { Request, Response } from 'express';
import { runPreflightAnalysis } from '../services/preflight/engine.service';
import { AnalyzeRepoInput } from '../validators/preflight.validator';

export const analyzeRepository = async (req: Request, res: Response): Promise<void> => {
  try {
    const { repoUrl } = req.body as AnalyzeRepoInput;
    
    // We run the heavy preflight analysis synchronously for now, as it takes ~1.8s.
    // In a massive scale app, this might be offloaded to a queue, but the user explicitly wants a fast 10-second demo block.
    const report = await runPreflightAnalysis(repoUrl);

    res.status(report.success ? 200 : 400).json({
      success: report.success,
      data: report,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to run Pre-Flight Analysis',
      error: err.message,
    });
  }
};
