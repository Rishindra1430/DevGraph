import { Router } from 'express';

import healthRouter from './health.js';
import developersRouter from './developers.js';
import technologiesRouter from './technologies.js';
import exploreRouter from './explore.js';
import networkRouter from './network.js';
import repositoriesRouter from './repositories.js';

const router = Router();

// Health check
router.use('/health', healthRouter);

// Repository endpoints
router.use('/repositories', repositoriesRouter);

// Developer endpoints
router.use('/developers', developersRouter);

// Technology endpoints
router.use('/technologies', technologiesRouter);

// Explore (technology intersection) endpoints
router.use('/explore', exploreRouter);

// Network graph endpoints
// Note: /api/connections is also handled here as a sub-route
router.use('/network', networkRouter);

// /api/connections → mounted under /network/connections
// We also expose it at the top-level for client convenience:
// GET /api/connections?from=a&to=b
router.use('/connections', (req, res, next) => {
  // Rewrite to the network router's connections handler
  req.url = '/connections' + (req.url === '/' ? '' : req.url);
  networkRouter(req, res, next);
});

export default router;
