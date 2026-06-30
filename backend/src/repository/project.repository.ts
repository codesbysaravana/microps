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
