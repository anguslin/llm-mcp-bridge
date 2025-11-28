import express from 'express';

const router = express.Router();

/**
 * GET /health endpoint
 */
router.get('/', (req, res) => {
  res.json({ status: 'ok' });
});

export default router;

