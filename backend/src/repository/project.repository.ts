import { pool } from '../config/db';

export const projectsDB = async (
  userId: number,
  repoUrl: string,
  branch: string,
  language: string,
  framework: string,
  installCommand: string,
  buildCommand: string,
  projectName: string
) => {
  const orgRes = await pool.query('SELECT organization_id FROM organization_members WHERE user_id = $1 LIMIT 1', [userId]);
  const orgId = orgRes.rows[0]?.organization_id || null;

  const query = `
    INSERT INTO projects
    (user_id, organization_id, name, repo_url, branch, language, framework, install_command, build_command, created_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
    RETURNING id
  `;
  const values = [userId, orgId, projectName, repoUrl, branch, language, framework, installCommand, buildCommand];
  
  const result = await pool.query(query, values);
  return result.rows[0];
};

export const fetchProjects = async (userId: number, projectId: number) => {
  try {
    const result = await pool.query(`SELECT id FROM projects WHERE id = $1 AND user_id = $2`, [projectId, userId]);
    return result.rows.length > 0 ? result.rows : false;
  } catch (err) {
    console.error(err);
    return false;
  }
};

export const fetchAllProjectsOneUser = async (userId: number) => {
  try {
    const result = await pool.query(`SELECT * FROM projects WHERE user_id = $1 ORDER BY created_at DESC`, [userId]);
    return result.rows.length > 0 ? result.rows : false;
  } catch (err) {
    console.error(err);
    return false;
  }
};

export const updateProjectDB = async (
  userId: number,
  projectId: number,
  branch: string,
  buildCommand: string,
  installCommand: string
) => {
  try {
    const query = `
      UPDATE projects
      SET branch = $1, build_command = $2, install_command = $3
      WHERE id = $4 AND user_id = $5
      RETURNING *
    `;
    const result = await pool.query(query, [branch, buildCommand, installCommand, projectId, userId]);
    return result.rows.length > 0 ? result.rows[0] : false;
  } catch (err) {
    console.error(err);
    return false;
  }
};

export const deleteProjectDB = async (userId: number, projectId: number) => {
  try {
    const result = await pool.query(`DELETE FROM projects WHERE id = $1 AND user_id = $2 RETURNING id`, [projectId, userId]);
    return result.rows.length > 0 ? true : false;
  } catch (err) {
    console.error(err);
    return false;
  }
};

export const applyProjectFixDB = async (
  userId: number,
  projectId: number,
  updates: { installCommand?: string; buildCommand?: string; language?: string }
) => {
  try {
    const existingRes = await pool.query(`SELECT * FROM projects WHERE id = $1 AND user_id = $2`, [projectId, userId]);
    if (existingRes.rows.length === 0) return false;
    const project = existingRes.rows[0];

    const newInstall = updates.installCommand !== undefined ? updates.installCommand : project.install_command;
    const newBuild = updates.buildCommand !== undefined ? updates.buildCommand : project.build_command;
    const newLang = updates.language !== undefined ? updates.language : project.language;

    const query = `
      UPDATE projects
      SET install_command = $1, build_command = $2, language = $3
      WHERE id = $4 AND user_id = $5
      RETURNING *
    `;
    const result = await pool.query(query, [newInstall, newBuild, newLang, projectId, userId]);
    return result.rows.length > 0 ? result.rows[0] : false;
  } catch (err) {
    console.error(err);
    return false;
  }
};

export const updateProjectLiveUrlDB = async (
  userId: number,
  identifier: number | string,
  liveUrl: string
) => {
  try {
    let query = '';
    let values: any[] = [];
    if (typeof identifier === 'number') {
      query = `UPDATE projects SET live_url = $1 WHERE id = $2 AND user_id = $3 RETURNING *`;
      values = [liveUrl, identifier, userId];
    } else {
      query = `UPDATE projects SET live_url = $1 WHERE name = $2 AND user_id = $3 RETURNING *`;
      values = [liveUrl, identifier, userId];
    }
    const result = await pool.query(query, values);
    return result.rows.length > 0 ? result.rows[0] : false;
  } catch (err) {
    console.error('Error updating project live URL:', err);
    return false;
  }
};

/**
 * Persist ECS service name and task family after a successful deployment.
 * This is critical for multi-tenant isolation: on redeploy, we look up
 * the existing service name so UpdateService is used instead of CreateService.
 */
export const updateProjectEcsMetadata = async (
  projectId: number,
  serviceName: string,
  taskFamily: string
) => {
  try {
    const result = await pool.query(
      `UPDATE projects 
       SET ecs_service_name = $1, ecs_task_family = $2, last_deployed_at = NOW()
       WHERE id = $3 
       RETURNING id, ecs_service_name, ecs_task_family`,
      [serviceName, taskFamily, projectId]
    );
    return result.rows.length > 0 ? result.rows[0] : false;
  } catch (err) {
    console.error('Error updating project ECS metadata:', err);
    return false;
  }
};

/**
 * Look up the ECS service name for a project.
 * Used by deploy.service.ts to decide UpdateService vs CreateService,
 * and by the idle-scaler to enumerate active services.
 */
export const getProjectEcsMetadata = async (projectId: number) => {
  try {
    const result = await pool.query(
      `SELECT id, user_id, name, ecs_service_name, ecs_task_family, last_deployed_at, live_url
       FROM projects WHERE id = $1`,
      [projectId]
    );
    return result.rows.length > 0 ? result.rows[0] : null;
  } catch (err) {
    console.error('Error fetching project ECS metadata:', err);
    return null;
  }
};

/**
 * Get all projects that have active ECS services (for idle-scaler).
 */
export const getActiveEcsProjects = async () => {
  try {
    const result = await pool.query(
      `SELECT id, user_id, name, ecs_service_name, ecs_task_family, last_deployed_at
       FROM projects 
       WHERE ecs_service_name IS NOT NULL`
    );
    return result.rows;
  } catch (err) {
    console.error('Error fetching active ECS projects:', err);
    return [];
  }
};

