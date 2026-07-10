import { Request, Response } from 'express';
import { deployServiceECS } from '../services/build/deploy.service';
import { pool } from '../config/db';

const ECR_REGISTRY_URL = process.env.ECR_REGISTRY_URL || '688567265418.dkr.ecr.ap-southeast-2.amazonaws.com';

export const handleGithubWebhook = async (req: Request, res: Response) => {
  try {
    // req.body is a Buffer because of express.raw() in app.ts
    const bodyStr = req.body.toString('utf8');
    const payload = JSON.parse(bodyStr);

    const projectId = payload.project_id;
    const imageTag = payload.image_tag;
    const repoOwner = payload.repo_owner;
    const repoName = payload.repo_name;

    if (!imageTag) {
      return res.status(400).json({ success: false, message: 'Missing image_tag' });
    }

    // Support lookup by project_id OR by repo_owner + repo_name
    const client = await pool.connect();
    try {
      let project;

      if (projectId) {
        const resProj = await client.query('SELECT * FROM projects WHERE id = $1', [projectId]);
        if (resProj.rows.length > 0) project = resProj.rows[0];
      }
      
      // Fallback: lookup by GitHub repo owner + name (the GitHub Action always knows its own repo)
      if (!project && repoOwner && repoName) {
        const resProj = await client.query(
          'SELECT * FROM projects WHERE github_repo_owner = $1 AND github_repo_name = $2 ORDER BY id DESC LIMIT 1',
          [repoOwner, repoName]
        );
        if (resProj.rows.length > 0) project = resProj.rows[0];
      }

      if (!project) {
        return res.status(404).json({ success: false, message: 'Project not found' });
      }

      console.log(`[GitHub Webhook] Received build completion for project ${project.id} (${project.name}) with tag ${imageTag}`);

      // Provision on ECS async (don't block the webhook response)
      deployServiceECS(
        project.user_id,
        project.name,
        `${ECR_REGISTRY_URL}/microps-hq:${imageTag}`,
        null,
        project.id
      ).catch((err: any) => {
        console.error(`[GitHub Webhook] Failed to provision ECS for project ${project.id}`, err);
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
