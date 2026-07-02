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

  async findById(id: number): Promise<AuthUser | null> {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  async updateProfile(id: number, name: string): Promise<AuthUser | null> {
    const result = await pool.query(
      `UPDATE users 
       SET name = $1, updated_at = NOW() 
       WHERE id = $2 
       RETURNING *`,
      [name, id]
    );
    return result.rows[0] || null;
  }
}

export const userRepository = new UserRepository();

