import { pool } from '../config/db';
import { EncryptedEnvPayload } from '../utils/encryptEnv';

export const envStoreCreate = async (projectId: number, encryptedGCM: EncryptedEnvPayload | null) => {
  try {
    if (!encryptedGCM?.encryptedPayload) return null;

    const result = await pool.query(
      `
      INSERT INTO project_environment_variables
        (project_id, encrypted_payload, iv)
      VALUES
        ($1, $2, $3)
      RETURNING *;
      `,
      [projectId, encryptedGCM.encryptedPayload, encryptedGCM.iv]
    );

    return result.rows[0];
  } catch (err) {
    console.error('Error storing environment variables:', err);
    throw err;
  }
};
