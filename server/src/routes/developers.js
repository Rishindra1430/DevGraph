import { Router } from 'express';
import {
  getAllDevelopers,
  getDeveloperByUsername,
  getDeveloperRepositories,
  getDeveloperTechnologies,
  getDeveloperCollaborators,
  searchDevelopers
} from '../queries/developers.js';

const router = Router();

/**
 * GET /api/developers
 *
 * Returns a paginated list of developers.
 *
 * Query params:
 *   tech    - filter by technology name (e.g. "React")
 *   search  - text search by name or username
 *   limit   - max results (default 50)
 *   skip    - pagination offset (default 0)
 */
router.get('/', async (req, res, next) => {
  try {
    const {
      tech,
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

    const developers = await getAllDevelopers({
      tech: tech || undefined,
      search: search || undefined,
      limit: parsedLimit,
      skip: parsedSkip
    });

    return res.json({
      developers,
      count: developers.length,
      limit: parsedLimit,
      skip: parsedSkip
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/developers/:username
 *
 * Returns a single developer by username.
 * Returns 404 if the developer does not exist.
 */
router.get('/:username', async (req, res, next) => {
  try {
    const { username } = req.params;

    const developer = await getDeveloperByUsername(username);

    if (!developer) {
      return res.status(404).json({
        error: `Developer "${username}" not found.`
      });
    }

    return res.json({ developer });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/developers/:username/repositories
 *
 * Returns repositories contributed to by the developer.
 * Ordered by commits descending.
 */
router.get('/:username/repositories', async (req, res, next) => {
  try {
    const { username } = req.params;

    const developer = await getDeveloperByUsername(username);

    if (!developer) {
      return res.status(404).json({
        error: `Developer "${username}" not found.`
      });
    }

    const repositories = await getDeveloperRepositories(username);

    return res.json({ repositories, count: repositories.length });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/developers/:username/technologies
 *
 * Returns all technologies the developer has worked with
 * via their contributed repositories.
 *
 * Graph traversal:
 *   Developer → CONTRIBUTED_TO → Repository → USES_TECH → Technology
 */
router.get('/:username/technologies', async (req, res, next) => {
  try {
    const { username } = req.params;

    const developer = await getDeveloperByUsername(username);

    if (!developer) {
      return res.status(404).json({
        error: `Developer "${username}" not found.`
      });
    }

    const technologies = await getDeveloperTechnologies(username);

    return res.json({ technologies, count: technologies.length });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/developers/:username/collaborators
 *
 * Returns developers who have contributed to shared repositories.
 * Ranked by number of shared repositories.
 *
 * Query params:
 *   limit  - max results (default 10)
 */
router.get('/:username/collaborators', async (req, res, next) => {
  try {
    const { username } = req.params;
    const { limit = '10' } = req.query;

    const developer = await getDeveloperByUsername(username);

    if (!developer) {
      return res.status(404).json({
        error: `Developer "${username}" not found.`
      });
    }

    const parsedLimit = Math.min(
      Math.max(parseInt(limit, 10) || 10, 1),
      100
    );

    const collaborators = await getDeveloperCollaborators(
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
 * GET /api/developers/:username/evidence
 *
 * Returns the repository evidence showing WHY a developer
 * matched a two-technology intersection search.
 *
 * Required query params:
 *   tech1  - first technology name
 *   tech2  - second technology name
 */
router.get('/:username/evidence', async (req, res, next) => {
  try {
    const { username } = req.params;
    const { tech1, tech2 } = req.query;

    if (!tech1 || !tech2) {
      return res.status(400).json({
        error: 'Both tech1 and tech2 are required query parameters.'
      });
    }

    const developer = await getDeveloperByUsername(username);

    if (!developer) {
      return res.status(404).json({
        error: `Developer "${username}" not found.`
      });
    }

    // Import getDeveloperTechnologyEvidence lazily to avoid circular deps
    const { getDeveloperTechnologyEvidence } = await import(
      '../queries/explore.js'
    );

    const evidence = await getDeveloperTechnologyEvidence(
      username,
      tech1,
      tech2
    );

    return res.json({ evidence });
  } catch (err) {
    next(err);
  }
});

export default router;
