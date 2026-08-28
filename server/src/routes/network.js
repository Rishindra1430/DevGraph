import { Router } from 'express';
import {
  getNetworkOverview,
  getDeveloperNetwork,
  getNetworkCollaborators,
  findDeveloperConnection
} from '../queries/network.js';

const router = Router();

/**
 * GET /api/network
 *
 * Returns a graph-ready payload of nodes and relationships
 * for the Network Explorer overview.
 *
 * Includes the most-connected developers, their repositories,
 * and the technologies used.
 *
 * Query params:
 *   developerLimit    - max developers to include (default 60)
 *   repositoryLimit   - max repositories (default 30)
 *   technologyLimit   - max technologies (default 30)
 */
router.get('/', async (req, res, next) => {
  try {
    const {
      developerLimit = '60',
      repositoryLimit = '30',
      technologyLimit = '30'
    } = req.query;

    const network = await getNetworkOverview({
      developerLimit: Math.min(parseInt(developerLimit, 10) || 60, 200),
      repositoryLimit: Math.min(parseInt(repositoryLimit, 10) || 30, 100),
      technologyLimit: Math.min(parseInt(technologyLimit, 10) || 30, 100)
    });

    return res.json({
      nodes: network.nodes,
      relationships: network.relationships,
      counts: {
        nodes: network.nodes.length,
        relationships: network.relationships.length
      }
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/network/developer/:username
 *
 * Returns the graph neighborhood around a specific developer.
 *
 * Traverses up to `depth` hops from the developer through
 * CONTRIBUTED_TO and USES_TECH relationships.
 *
 * Query params:
 *   depth  - traversal depth 1–3 (default 2)
 */
router.get('/developer/:username', async (req, res, next) => {
  try {
    const { username } = req.params;
    const { depth = '2' } = req.query;

    const parsedDepth = Math.min(
      Math.max(parseInt(depth, 10) || 2, 1),
      3
    );

    const network = await getDeveloperNetwork(username, parsedDepth);

    if (network.nodes.length === 0) {
      return res.status(404).json({
        error: `Developer "${username}" not found or has no graph connections.`
      });
    }

    return res.json({
      nodes: network.nodes,
      relationships: network.relationships,
      counts: {
        nodes: network.nodes.length,
        relationships: network.relationships.length
      }
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/network/collaborators/:username
 *
 * Returns the direct collaborator graph for a developer.
 * Ranked by shared repository count.
 *
 * Query params:
 *   limit  - max collaborators (default 20)
 */
router.get('/collaborators/:username', async (req, res, next) => {
  try {
    const { username } = req.params;
    const { limit = '20' } = req.query;

    const parsedLimit = Math.min(
      Math.max(parseInt(limit, 10) || 20, 1),
      100
    );

    const collaborators = await getNetworkCollaborators(
      username,
      parsedLimit
    );

    return res.json({
      collaborators,
      count: collaborators.length
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/connections
 *
 * Finds the shortest connection path between two developers.
 * The path traverses repositories and technologies as intermediary
 * nodes — this is a graph-specific capability.
 *
 * Required query params:
 *   from  - source developer username
 *   to    - target developer username
 *
 * Optional query params:
 *   maxDepth  - maximum path length (default 6, max 10)
 *
 * Returns:
 *   - nodes: ordered list of nodes on the path
 *   - relationships: ordered list of hops
 *   - hops: total number of hops
 *
 * Returns 404 when no path exists.
 */
router.get('/connections', async (req, res, next) => {
  try {
    const { from, to, maxDepth = '6' } = req.query;

    if (!from) {
      return res.status(400).json({
        error: '"from" is a required query parameter (source developer username).'
      });
    }

    if (!to) {
      return res.status(400).json({
        error: '"to" is a required query parameter (target developer username).'
      });
    }

    if (from === to) {
      return res.status(400).json({
        error: '"from" and "to" must be different developers.'
      });
    }

    const parsedDepth = Math.min(
      Math.max(parseInt(maxDepth, 10) || 6, 2),
      10
    );

    const path = await findDeveloperConnection(from, to, parsedDepth);

    if (!path) {
      return res.status(404).json({
        error: `No connection found between "${from}" and "${to}" within ${parsedDepth} hops.`,
        from,
        to
      });
    }

    return res.json({
      path,
      from,
      to,
      hops: path.hops
    });
  } catch (err) {
    next(err);
  }
});

export default router;
