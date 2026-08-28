import { getSession } from '../db/neo4j.js';

/**
 * Get a paginated list of repositories.
 *
 * Optional filters:
 * - tech   → repositories using a technology
 * - search → search by repository name/full name
 */
export async function getAllRepositories({
    tech,
    search,
    limit = 50,
    skip = 0
} = {}) {
    const session = getSession();

    try {
        let query;
        const params = {
            limit: Number(limit),
            skip: Number(skip)
        };

        // ------------------------------------------------------------
        // Filter by technology
        // Repository → Technology
        // ------------------------------------------------------------

        if (tech) {
            query = `
        MATCH (r:Repository)-[:USES_TECH]->
              (t:Technology {name: $tech})

        OPTIONAL MATCH
          (d:Developer)-[:CONTRIBUTED_TO]->(r)

        WITH
          r,
          count(DISTINCT d) AS contributorCount

        RETURN
          r,
          contributorCount

        ORDER BY r.stars DESC, r.name ASC

        SKIP toInteger($skip)
        LIMIT toInteger($limit)
      `;

            params.tech = tech;
        }

        // ------------------------------------------------------------
        // Search repositories
        // ------------------------------------------------------------

        else if (search) {
            query = `
        MATCH (r:Repository)

        WHERE
          toLower(r.name) CONTAINS toLower($search)
          OR
          toLower(r.fullName) CONTAINS toLower($search)
          OR
          toLower(r.description) CONTAINS toLower($search)

        OPTIONAL MATCH
          (d:Developer)-[:CONTRIBUTED_TO]->(r)

        WITH
          r,
          count(DISTINCT d) AS contributorCount

        RETURN
          r,
          contributorCount

        ORDER BY r.stars DESC, r.name ASC

        SKIP toInteger($skip)
        LIMIT toInteger($limit)
      `;

            params.search = search;
        }

        // ------------------------------------------------------------
        // All repositories
        // ------------------------------------------------------------

        else {
            query = `
        MATCH (r:Repository)

        OPTIONAL MATCH
          (d:Developer)-[:CONTRIBUTED_TO]->(r)

        WITH
          r,
          count(DISTINCT d) AS contributorCount

        RETURN
          r,
          contributorCount

        ORDER BY r.stars DESC, r.name ASC

        SKIP toInteger($skip)
        LIMIT toInteger($limit)
      `;
        }

        const result = await session.run(query, params);

        return result.records.map(record => ({
            ...record.get('r').properties,
            contributorCount: Number(
                record.get('contributorCount')
            )
        }));
    } finally {
        await session.close();
    }
}


/**
 * Get a single repository by its GitHub repository ID.
 */
export async function getRepositoryById(id) {
    const session = getSession();

    try {
        const result = await session.run(
            `
      MATCH (r:Repository {id: $id})

      OPTIONAL MATCH
        (d:Developer)-[:CONTRIBUTED_TO]->(r)

      WITH
        r,
        count(DISTINCT d) AS contributorCount

      RETURN
        r,
        contributorCount
      `,
            {
                id: String(id)
            }
        );

        if (result.records.length === 0) {
            return null;
        }

        const record = result.records[0];

        return {
            ...record.get('r').properties,
            contributorCount: Number(
                record.get('contributorCount')
            )
        };
    } finally {
        await session.close();
    }
}


/**
 * Get all contributors to a repository.
 *
 * Graph:
 *
 * Developer
 *     ↓ CONTRIBUTED_TO
 * Repository
 */
export async function getRepositoryContributors(
    id,
    limit = 50
) {
    const session = getSession();

    try {
        const result = await session.run(
            `
      MATCH
        (d:Developer)
        -[c:CONTRIBUTED_TO]->
        (r:Repository {id: $id})

      RETURN
        d,
        c.commits AS commits,
        c.role AS role

      ORDER BY commits DESC, d.username ASC

      LIMIT toInteger($limit)
      `,
            {
                id: String(id),
                limit: Number(limit)
            }
        );

        return result.records.map(record => ({
            ...record.get('d').properties,

            commits: Number(
                record.get('commits') || 0
            ),

            role:
                record.get('role') || 'Contributor'
        }));
    } finally {
        await session.close();
    }
}


/**
 * Get technologies used by a repository.
 *
 * Graph:
 *
 * Repository
 *     ↓ USES_TECH
 * Technology
 */
export async function getRepositoryTechnologies(id) {
    const session = getSession();

    try {
        const result = await session.run(
            `
      MATCH
        (r:Repository {id: $id})
        -[:USES_TECH]->
        (t:Technology)

      RETURN
        t.name AS technology,
        t.category AS category

      ORDER BY technology ASC
      `,
            {
                id: String(id)
            }
        );

        return result.records.map(record => ({
            technology: record.get('technology'),
            category: record.get('category')
        }));
    } finally {
        await session.close();
    }
}


/**
 * Get repositories that use BOTH technologies.
 *
 * Example:
 *
 * React + TypeScript
 *
 * Repository
 *    ├── USES_TECH → React
 *    └── USES_TECH → TypeScript
 */
export async function getRepositoriesByTechnologies(
    tech1,
    tech2,
    limit = 20
) {
    const session = getSession();

    try {
        const result = await session.run(
            `
      MATCH
        (r:Repository)-[:USES_TECH]->
        (t1:Technology {name: $tech1})

      MATCH
        (r)-[:USES_TECH]->
        (t2:Technology {name: $tech2})

      OPTIONAL MATCH
        (d:Developer)-[:CONTRIBUTED_TO]->(r)

      WITH
        r,
        count(DISTINCT d) AS contributorCount

      RETURN
        r,
        contributorCount

      ORDER BY r.stars DESC, r.name ASC

      LIMIT toInteger($limit)
      `,
            {
                tech1,
                tech2,
                limit: Number(limit)
            }
        );

        return result.records.map(record => ({
            ...record.get('r').properties,

            contributorCount: Number(
                record.get('contributorCount')
            )
        }));
    } finally {
        await session.close();
    }
}


/**
 * Get the most popular technologies used by a repository.
 *
 * This is useful for repository detail pages
 * and related-technology UI.
 */
export async function getRepositoryTechnologySummary(id) {
    const session = getSession();

    try {
        const result = await session.run(
            `
      MATCH
        (r:Repository {id: $id})
        -[:USES_TECH]->
        (t:Technology)

      OPTIONAL MATCH
        (other:Repository)
        -[:USES_TECH]->
        (t)

      WITH
        t,
        count(DISTINCT other) AS repositoryCount

      RETURN
        t.name AS technology,
        t.category AS category,
        repositoryCount

      ORDER BY repositoryCount DESC, technology ASC
      `,
            {
                id: String(id)
            }
        );

        return result.records.map(record => ({
            technology: record.get('technology'),
            category: record.get('category'),
            repositoryCount: Number(
                record.get('repositoryCount')
            )
        }));
    } finally {
        await session.close();
    }
}