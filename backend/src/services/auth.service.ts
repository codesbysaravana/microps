import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { userRepository } from '../repository/user.repository';
import { LoginInput, SignupInput, JwtPayload } from '../types/auth.types';

export class AuthService {
  async signup(input: SignupInput) {
    const existingUser = await userRepository.findByEmail(input.email);
    if (existingUser) {
      throw { status: 409, message: 'Email already in use' };
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(input.password, saltRounds);

    const newUser = await userRepository.create(input, passwordHash);

    // Don't return the password hash
    const { password_hash, ...userWithoutPassword } = newUser;
    return userWithoutPassword;
  }

  async login(input: LoginInput) {
    const user = await userRepository.findByEmail(input.email);
    if (!user) {
      throw { status: 401, message: 'Invalid credentials' };
    }

    const isMatch = await bcrypt.compare(input.password, user.password_hash);
    if (!isMatch) {
      throw { status: 401, message: 'Invalid credentials' };
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET is not configured');

    const payload: JwtPayload = {
      userId: user.id,
      email: user.email,
      name: user.name,
    };

    const token = jwt.sign(payload, secret, { expiresIn: '24h' });

    const { password_hash, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, token };
  }
}

export const authService = new AuthService();
