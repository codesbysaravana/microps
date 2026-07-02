import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';

export class AuthController {
  async signup(req: Request, res: Response, next: NextFunction) {
    try {
      // Body is already validated and typed by Zod middleware
      const user = await authService.signup(req.body);
      res.status(201).json({
        success: true,
        message: 'User created successfully',
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.login(req.body);
      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async me(req: Request, res: Response, next: NextFunction) {
    try {
      res.status(200).json({
        success: true,
        message: 'Authenticated',
        data: { user: req.user },
      });
    } catch (error) {
      next(error);
    }
  }

  async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized User' });
        return;
      }
      const { name } = req.body;
      if (!name || typeof name !== 'string' || !name.trim()) {
        res.status(400).json({ success: false, message: 'Name is required' });
        return;
      }
      const updated = await authService.updateProfile(userId, name.trim());
      res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: { user: updated },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
