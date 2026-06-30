import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import logger from '../lib/logger';

export class AuthController {
  static async githubCallback(req: Request, res: Response): Promise<void> {
    try {
      const { code } = req.body;

      if (!code || typeof code !== 'string') {
        res.status(400).json({ error: 'Authorization code is required' });
        return;
      }

      const result = await AuthService.authenticateWithGitHub(code);
      
      res.json(result);
    } catch (error: any) {
      logger.error(error, 'Auth Controller Error');
      res.status(500).json({ error: 'Internal server error during authentication' });
    }
  }

  static async me(req: Request, res: Response): Promise<void> {
    // req.user is guaranteed to exist because of requireAuth middleware
    res.json({ message: 'You are authenticated!', user: req.user });
  }

  static async requestEmailLogin(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;
      if (!email || typeof email !== 'string') {
        res.status(400).json({ error: 'Email is required' });
        return;
      }

      await AuthService.sendMagicLink(email);
      res.json({ message: 'Magic link sent successfully!' });
    } catch (error: any) {
      logger.error(error, 'Auth Controller requestEmailLogin Error');
      res.status(500).json({ error: error.message || 'Internal server error during email sign in' });
    }
  }

  static async verifyEmailLogin(req: Request, res: Response): Promise<void> {
    try {
      const { token } = req.body;
      if (!token || typeof token !== 'string') {
        res.status(400).json({ error: 'Token is required' });
        return;
      }

      const result = await AuthService.verifyMagicLink(token);
      res.json(result);
    } catch (error: any) {
      logger.error(error, 'Auth Controller verifyEmailLogin Error');
      res.status(400).json({ error: error.message || 'Verification failed' });
    }
  }
}
