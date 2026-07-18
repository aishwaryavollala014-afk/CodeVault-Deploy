import { Request, Response } from 'express';
import { UserSearchService } from '../services/userSearch.service';
import logger from '../lib/logger';

export class UserSearchController {
  // GET /api/users/search?q= — public profile search for the global search bar.
  static async search(req: Request, res: Response): Promise<void> {
    try {
      const q = typeof req.query.q === 'string' ? req.query.q : '';
      res.json(await UserSearchService.search(q));
    } catch (error) {
      logger.error(error, 'User search error');
      res.status(500).json({ error: 'Search failed' });
    }
  }
}
