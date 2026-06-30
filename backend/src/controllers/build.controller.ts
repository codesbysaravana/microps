import { Request, Response } from 'express';
import { buildInitializer } from '../services/build/builder.service';
import { buildBus } from '../utils/eventBus';
import { ecryptAESnGCM } from '../utils/encryptEnv';

export const handleBuildAndDeploy = async (req: Request, res: Response): Promise<void> => {
  try {
    const { repoUrl, branch, buildCommand, projectName, envContent, env } = req.body;
    const secretsPayload = envContent || env || null;

    // req.user is set by requireAuth middleware
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized User' });
      return;
    }

    const encryptedGCM = secretsPayload ? ecryptAESnGCM(secretsPayload) : null;

    const result = await buildInitializer(userId, repoUrl, branch, buildCommand, projectName, encryptedGCM);
    
    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (err: any) {
    console.error('Build Initialization Error:', err);
    res.status(500).json({ success: false, message: 'Server Error', error: err.message });
  }
};

export const handleBuildStream = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).end();
      return;
    }

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    });

    const listener = (data: any) => {
      // Ensure tenants only see their own build logs
      if (data.userId && data.userId !== userId) return;

      const payload = {
        ...data,
        message: data.message ? `${data.message}\n` : data.message,
      };

      res.write(`data: ${JSON.stringify(payload)}\n\n`);
    };

    buildBus.on('build-progress', listener);

    req.on('close', () => {
      buildBus.off('build-progress', listener);
    });
  } catch (err: any) {
    console.error('SSE Error:', err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
