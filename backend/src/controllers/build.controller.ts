import { Request, Response } from 'express';
import { buildInitializer } from '../services/build/builder.service';
import { buildBus } from '../utils/eventBus';
import { ecryptAESnGCM } from '../utils/encryptEnv';
import { applyProjectFixDB } from '../repository/project.repository';

export const handleBuildAndDeploy = async (req: Request, res: Response): Promise<void> => {
  try {
    const { repoUrl, branch, buildCommand, projectName, envContent, env, installCommand, runtime, projectId } = req.body;
    const secretsPayload = envContent || env || null;

    // req.user is set by requireAuth middleware
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized User' });
      return;
    }

    const encryptedGCM = secretsPayload ? ecryptAESnGCM(secretsPayload) : null;

    const customOverrides = {
      installCommand,
      buildCommand,
      runtime,
      projectId: projectId ? Number(projectId) : undefined,
    };

    const result = await buildInitializer(userId, repoUrl, branch || 'main', buildCommand || 'npm run build', projectName, encryptedGCM, customOverrides);
    
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

    // Send an immediate heartbeat to establish the connection
    res.write(':\n\n');

    // Send a heartbeat ping every 15 seconds to prevent browser/Nginx disconnects
    const heartbeatInterval = setInterval(() => {
      res.write(':\n\n');
    }, 15000);

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
      clearInterval(heartbeatInterval);
      buildBus.off('build-progress', listener);
    });
  } catch (err: any) {
    console.error('SSE Error:', err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

export const handleApplyFix = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized User' });
      return;
    }

    const { projectId, actionType, payload } = req.body;
    if (!projectId || !payload) {
      res.status(400).json({ success: false, message: 'Missing projectId or payload' });
      return;
    }

    const updates: { installCommand?: string; buildCommand?: string; language?: string } = {};
    if (payload.installCommand) updates.installCommand = payload.installCommand;
    if (payload.buildCommand) updates.buildCommand = payload.buildCommand;
    if (payload.targetValue) updates.language = payload.targetValue;

    const updatedProject = await applyProjectFixDB(userId, Number(projectId), updates);
    if (!updatedProject) {
      res.status(404).json({ success: false, message: 'Project not found' });
      return;
    }

    const buildResult = await buildInitializer(
      userId,
      updatedProject.repo_url,
      updatedProject.branch || 'main',
      updatedProject.build_command || '',
      updatedProject.name,
      null,
      {
        installCommand: updatedProject.install_command,
        buildCommand: updatedProject.build_command,
        runtime: updatedProject.language,
        projectId: updatedProject.id,
      }
    );

    res.status(200).json({
      success: true,
      message: 'Fix applied successfully and build re-triggered!',
      project: updatedProject,
      build: buildResult,
    });
  } catch (err: any) {
    console.error('Apply Fix Error:', err);
    res.status(500).json({ success: false, message: 'Server Error', error: err.message });
  }
};
