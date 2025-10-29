import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { searchDocuments } from '../services/searchService.js';

const router = Router();

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { q } = req.query;
    if (!q) {
      res.status(400).json({ error: 'A search query (?q=) is required' });
      return;
    }

    const results = await searchDocuments(q);
    res.json({ results });
  })
);

export default router;
