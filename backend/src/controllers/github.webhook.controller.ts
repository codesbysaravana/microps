import { Request, Response } from 'express';
import { deployServiceECS } from '../services/build/deploy.service';
import { pool } from '../config/db';

export const handleGithubWebhook = async (req: Request, res: Response) => {
  try {
    // req.body is a Buffer because of express.raw() in app.ts
    const bodyStr = req.body.toString('utf8');
    const payload = JSON.parse(bodyStr);

    const projectId = payload.project_id;
    const imageTag = payload.image_tag;

    if (!projectId || !imageTag) {
      return res.status(400).json({ success: false, message: 'Missing project_id or image_tag' });
    }

    console.log(`[GitHub Webhook] Received build completion for project ${projectId} with tag ${imageTag}`);

    const client = await pool.connect();
    try {
      const resProj = await client.query('SELECT * FROM projects WHERE id = $1', [projectId]);
      if (resProj.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Project not found' });
      }
      
      const project = resProj.rows[0];

      // Provision on ECS async (don't block the webhook response)
      deployServiceECS(
        project.user_id,
        project.name,
        `688567265418.dkr.ecr.ap-southeast-2.amazonaws.com/microps-hq:${imageTag}`,
        null, // We could fetch from envStoreGet(project.id) if we want
        project.id
      ).catch((err: any) => {
        console.error(`[GitHub Webhook] Failed to provision ECS for project ${projectId}`, err);
      });

      return res.status(200).json({ success: true, message: 'Provisioning started' });
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error('[GitHub Webhook] Error processing payload:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};
