import { Request, Response } from 'express';
import { pool } from '../config/db';

export const getDashboardOverview = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    // Get user's primary organization
    const orgRes = await pool.query(
      'SELECT organization_id FROM organization_members WHERE user_id = $1 LIMIT 1',
      [userId]
    );
    const orgId = orgRes.rows[0]?.organization_id || null;

    // Get true count of projects
    const projectsRes = await pool.query(
      'SELECT COUNT(*) as count FROM projects WHERE user_id = $1',
      [userId]
    );
    const totalProjects = parseInt(projectsRes.rows[0]?.count || '0', 10);

    // Get true usage statistics if org exists
    let buildMinutesUsed = 0;
    let buildMinutesLimit = 100;
    let egressGbUsed = 0;
    let egressGbLimit = 50;

    if (orgId) {
      const usageRes = await pool.query(
        'SELECT metric_key, used_value, limit_value FROM organization_usage WHERE organization_id = $1',
        [orgId]
      );
      for (const row of usageRes.rows) {
        if (row.metric_key === 'build_minutes') {
          buildMinutesUsed = parseFloat(row.used_value || '0');
          buildMinutesLimit = parseFloat(row.limit_value || '100');
        } else if (row.metric_key === 'egress_gb') {
          egressGbUsed = parseFloat(row.used_value || '0');
          egressGbLimit = parseFloat(row.limit_value || '50');
        }
      }
    }

    // Get recent projects list
    const recentProjectsRes = await pool.query(
      'SELECT id, name, repo_url, branch, language, live_url, created_at FROM projects WHERE user_id = $1 ORDER BY created_at DESC LIMIT 5',
      [userId]
    );

    res.status(200).json({
      success: true,
      data: {
        totalProjects,
        buildMinutes: {
          used: buildMinutesUsed,
          limit: buildMinutesLimit,
        },
        bandwidthGb: {
          used: egressGbUsed,
          limit: egressGbLimit,
        },
        recentProjects: recentProjectsRes.rows,
        systemHealth: {
          status: 'HEALTHY',
          orchestrator: 'AWS ECS Fargate',
          region: process.env.AWS_REGION || 'ap-southeast-2',
          timestamp: new Date().toISOString(),
        },
      },
    });
  } catch (err: any) {
    console.error('Get Dashboard Overview Error:', err);
    res.status(500).json({ success: false, message: 'Server Error', error: err.message });
  }
};
