import { pool } from '../config/db';
import { AuthUser, SignupInput } from '../types/auth.types';

export class UserRepository {
  async findByEmail(email: string): Promise<AuthUser | null> {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows[0] || null;
  }

  async create(user: SignupInput, passwordHash: string): Promise<AuthUser> {
    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash, created_at, updated_at) 
       VALUES ($1, $2, $3, NOW(), NOW()) 
       RETURNING *`,
      [user.name, user.email, passwordHash]
    );
    return result.rows[0];
  }
}

export const userRepository = new UserRepository();
