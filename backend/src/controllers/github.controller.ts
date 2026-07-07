import { Request, Response } from 'express';
import { githubService } from '../services/github.service';

export const githubController = {
  loginRedirect: async (req: Request, res: Response) => {
    try {
      const redirectUrl = githubService.getOAuthRedirectUrl();
      res.redirect(redirectUrl);
    } catch (error) {
      console.error('[GitHub Auth] Redirect Error:', error);
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
      
      const { token, user } = await githubService.exchangeCodeForToken(code);
      // In production, we'd redirect to frontend with JWT or set HttpOnly cookie
      // For now, return JSON so frontend can store token
      res.redirect(`https://microps.in/login?token=${token}`);
    } catch (error) {
      console.error('[GitHub Auth] Callback Error:', error);
      res.redirect(`https://microps.in/login?error=auth_failed`);
    }
  },

  getUserRepos: async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const repos = await githubService.fetchUserRepositories(userId);
      res.json({ repos });
    } catch (error) {
      console.error('[GitHub API] Fetch Repos Error:', error);
      res.status(500).json({ message: 'Failed to fetch repositories' });
    }
  },

  installRunner: async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const { owner, repoName, projectId } = req.body;
      
      if (!owner || !repoName || !projectId) {
        res.status(400).json({ message: 'Missing required fields' });
        return;
      }

      const result = await githubService.injectBYOCWorkflow(userId, projectId, owner, repoName);
      res.json(result);
    } catch (error) {
      console.error('[GitHub API] Install Runner Error:', error);
      res.status(500).json({ message: 'Failed to install GitHub Actions Runner' });
    }
  }
};
