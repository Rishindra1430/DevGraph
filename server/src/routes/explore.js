import { Router } from 'express';
import {
  exploreDevelopers,
  findRepositoriesByTechnology,
  findRepositoriesByTwoTechnologies,
  getExploreTechnologies
} from '../queries/explore.js';

const router = Router();

/**
 * GET /api/explore
 *
 * The core "Explore" query.
 *
 * Behavior:
 *
 *   - tech1 only  → find developers experienced with tech1
 *   - tech1+tech2 → find developers experienced with BOTH
 *
 * IMPORTANT:
 * Technology names are never hardcoded.
 * These all work identically:
 *
 *   /api/explore?tech1=React
 *   /api/explore?tech1=React&tech2=Neo4j
 *   /api/explore?tech1=Python&tech2=Docker
 *   /api/explore?tech1=TypeScript&tech2=GraphQL
 *   /api/explore?tech1=JavaScript
 *
 * Required query params:
 *   tech1   - first technology name
 *
 * Optional query params:
 *   tech2   - second technology name (enables intersection mode)
 *   limit   - max results (default 20)
 */
router.get('/', async (req, res, next) => {
  try {
    const { tech1, tech2, limit = '20' } = req.query;

    if (!tech1) {
      return res.status(400).json({
        error: 'tech1 is a required query parameter.'
      });
    }

    const parsedLimit = Math.min(
      Math.max(parseInt(limit, 10) || 20, 1),
      100
    );

    const developers = await exploreDevelopers({
      tech1,
      tech2: tech2 || undefined,
      limit: parsedLimit
    });

    const response = {
      developers,
      count: developers.length,
      query: {
        tech1,
        tech2: tech2 || null,
        mode: tech2 ? 'intersection' : 'single'
      }
    };

    return res.json(response);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/explore/repositories
 *
 * Find repositories by one or two technologies.
 *
 *   /api/explore/repositories?tech1=React
 *   /api/explore/repositories?tech1=React&tech2=TypeScript
 *
 * Required query params:
 *   tech1   - first technology name
 *
 * Optional query params:
 *   tech2   - second technology name
 *   limit   - max results (default 20)
 */
router.get('/repositories', async (req, res, next) => {
  try {
    const { tech1, tech2, limit = '20' } = req.query;

    if (!tech1) {
      return res.status(400).json({
        error: 'tech1 is a required query parameter.'
      });
    }

    const parsedLimit = Math.min(
      Math.max(parseInt(limit, 10) || 20, 1),
      100
    );

    const repositories = tech2
      ? await findRepositoriesByTwoTechnologies(tech1, tech2, parsedLimit)
      : await findRepositoriesByTechnology(tech1, parsedLimit);

    return res.json({
      repositories,
      count: repositories.length,
      query: {
        tech1,
        tech2: tech2 || null,
        mode: tech2 ? 'intersection' : 'single'
      }
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/explore/technologies
 *
 * Returns the list of all technologies available for
 * use in Explore dropdowns.
 *
 * The frontend can use this to populate selectors
 * instead of hardcoding technology names.
 */
router.get('/technologies', async (req, res, next) => {
  try {
    const technologies = await getExploreTechnologies();

    return res.json({
      technologies,
      count: technologies.length
    });
  } catch (err) {
    next(err);
  }
});

export default router;
