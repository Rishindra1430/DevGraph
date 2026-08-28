import { Router } from 'express';
import {
  getAllTechnologies,
  getTechnologyByName,
  getTechnologyRepositories,
  getTechnologyDevelopers,
  getRelatedTechnologies
} from '../queries/technologies.js';

const router = Router();

/**
 * GET /api/technologies
 *
 * Returns all technologies in the graph.
 * Includes repository and developer counts.
 *
 * Query params:
 *   category  - filter by category (e.g. "Frontend", "Database")
 *   search    - text search by technology name
 *   limit     - max results (default 50)
 *   skip      - pagination offset (default 0)
 */
router.get('/', async (req, res, next) => {
  try {
    const {
      category,
      search,
      limit = '50',
      skip = '0'
    } = req.query;

    const parsedLimit = Math.min(
      Math.max(parseInt(limit, 10) || 50, 1),
      200
    );

    const parsedSkip = Math.max(
      parseInt(skip, 10) || 0,
      0
    );

    const technologies = await getAllTechnologies({
      category: category || undefined,
      search: search || undefined,
      limit: parsedLimit,
      skip: parsedSkip
    });

    return res.json({
      technologies,
      count: technologies.length,
      limit: parsedLimit,
      skip: parsedSkip
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/technologies/:name
 *
 * Returns a single technology by its exact name.
 * Returns 404 if not found.
 *
 * Example:
 *   GET /api/technologies/React
 *   GET /api/technologies/Neo4j
 *   GET /api/technologies/TypeScript
 */
router.get('/:name', async (req, res, next) => {
  try {
    const { name } = req.params;

    const technology = await getTechnologyByName(name);

    if (!technology) {
      return res.status(404).json({
        error: `Technology "${name}" not found.`
      });
    }

    return res.json({ technology });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/technologies/:name/developers
 *
 * Returns developers who have worked with this technology.
 * Ordered by number of relevant repositories.
 *
 * Query params:
 *   limit  - max results (default 50)
 */
router.get('/:name/developers', async (req, res, next) => {
  try {
    const { name } = req.params;
    const { limit = '50' } = req.query;

    const technology = await getTechnologyByName(name);

    if (!technology) {
      return res.status(404).json({
        error: `Technology "${name}" not found.`
      });
    }

    const parsedLimit = Math.min(
      Math.max(parseInt(limit, 10) || 50, 1),
      200
    );

    const developers = await getTechnologyDevelopers(name, parsedLimit);

    return res.json({ developers, count: developers.length });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/technologies/:name/repositories
 *
 * Returns repositories using this technology.
 * Ordered by stars descending.
 *
 * Query params:
 *   limit  - max results (default 50)
 */
router.get('/:name/repositories', async (req, res, next) => {
  try {
    const { name } = req.params;
    const { limit = '50' } = req.query;

    const technology = await getTechnologyByName(name);

    if (!technology) {
      return res.status(404).json({
        error: `Technology "${name}" not found.`
      });
    }

    const parsedLimit = Math.min(
      Math.max(parseInt(limit, 10) || 50, 1),
      200
    );

    const repositories = await getTechnologyRepositories(name, parsedLimit);

    return res.json({ repositories, count: repositories.length });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/technologies/:name/related
 *
 * Returns technologies that appear in the same repositories.
 * Useful for populating the "Related Technologies" UI.
 *
 * Query params:
 *   limit  - max results (default 10)
 */
router.get('/:name/related', async (req, res, next) => {
  try {
    const { name } = req.params;
    const { limit = '10' } = req.query;

    const parsedLimit = Math.min(
      Math.max(parseInt(limit, 10) || 10, 1),
      50
    );

    const related = await getRelatedTechnologies(name, parsedLimit);

    return res.json({ related, count: related.length });
  } catch (err) {
    next(err);
  }
});

export default router;
