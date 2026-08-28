import { Router } from 'express';
import { getAllRepositories } from '../queries/repositories.js';

const router = Router();

router.get('/', async (req, res, next) => {
    try {
        const { search, limit = '5', skip = '0' } = req.query;

        const repositories = await getAllRepositories({
            search: search || undefined,
            limit: parseInt(limit, 10),
            skip: parseInt(skip, 10),
        });

        return res.json({
            repositories,
            count: repositories.length,
        });
    } catch (err) {
        next(err);
    }
});

export default router;