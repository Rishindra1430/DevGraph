import { Router } from 'express';
import { verifyConnection } from '../db/neo4j.js';

const router = Router();

/**
 * GET /api/health
 *
 * Verifies the server is running and CognoDB is reachable.
 * Safe for load balancer and uptime monitor polling.
 */
router.get('/', async (req, res, next) => {
  try {
    await verifyConnection();

    return res.json({
      status: 'ok',
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    // Database unreachable — return 503 without leaking credentials
    return res.status(503).json({
      status: 'error',
      database: 'unreachable',
      timestamp: new Date().toISOString()
    });
  }
});

export default router;
