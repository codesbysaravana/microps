import { z } from 'zod';
import { signupSchema, loginSchema } from '../validators/auth.validator';

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  password_hash: string;
  created_at: Date;
  updated_at: Date;
}

export interface JwtPayload {
  userId: number;
  email: string;
  name: string;
}
