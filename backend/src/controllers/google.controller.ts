import { Request, Response } from 'express';
import { googleService } from '../services/google.service';

export const googleController = {
  loginRedirect: async (req: Request, res: Response) => {
    try {
      const redirectUrl = googleService.getOAuthRedirectUrl();
      res.redirect(redirectUrl);
    } catch (error) {
      console.error('[Google Auth] Redirect Error:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  },

  handleCallback: async (req: Request, res: Response) => {
    try {
      const code = req.query.code as string;
      if (!code) {
        res.status(400).json({ message: 'Missing authorization code' });
        return;
      }
      
      const { token } = await googleService.exchangeCodeForToken(code);
      // In production, we'd redirect to frontend with JWT or set HttpOnly cookie
      // For now, return JSON so frontend can store token
      res.redirect(`https://microps.in/login?token=${token}`);
    } catch (error) {
      console.error('[Google Auth] Callback Error:', error);
      res.redirect(`https://microps.in/login?error=auth_failed`);
    }
  }
};
