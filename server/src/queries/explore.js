import { getSession } from '../db/neo4j.js';

/**
 * Find developers who have experience with one technology.
 *
 * Graph traversal:
 *
 * Developer
 *    ↓ CONTRIBUTED_TO
 * Repository
 *    ↓ USES_TECH
 * Technology
 *
 * Example:
 *   technology = "React"
 *
 * This returns developers who contributed to at least
 * one repository using React.
 */
export async function findDevelopersByTechnology(
    technology,
    limit = 20
) {
    const session = getSession();

    try {
        const result = await session.run(
            `
      MATCH
        (d:Developer)
        -[:CONTRIBUTED_TO]->
        (r:Repository)
        -[:USES_TECH]->
        (t:Technology {name: $technology})

      WITH
        d,
        collect(DISTINCT r.fullName) AS repositories,
        count(DISTINCT r) AS repositoryCount

      RETURN
        d,
        repositories,
        repositoryCount

      ORDER BY
        repositoryCount DESC,
        d.username ASC

      LIMIT toInteger($limit)
      `,
            {
                technology,
                limit: Number(limit)
            }
        );

        return result.records.map(record => ({
            ...record.get('d').properties,

            repositories:
                record.get('repositories'),

            repositoryCount:
                Number(record.get('repositoryCount'))
        }));
    } finally {
        await session.close();
    }
}


/**
 * Find developers who have experience with BOTH technologies.
 *
 * This is the primary "Graph beats SQL" query for DevGraph.
 *
 * Graph:
 *
 *                         ┌──→ Technology A
 *                         │
 * Developer → Repository ─┤
 *                         │
 *                         └──→ Technology B
 *
 * More generally:
 *
 * Developer
 *    ├── CONTRIBUTED_TO → Repository → USES_TECH → Technology A
 *    │
 *    └── CONTRIBUTED_TO → Repository → USES_TECH → Technology B
 *
 * The developer does NOT have to use both technologies
 * in the same repository.
 *
 * Example:
 *
 * React + Neo4j
 *
 * OR
 *
 * Python + Docker
 *
 * OR
 *
 * TypeScript + GraphQL
 */
export async function findDevelopersByTwoTechnologies(
    tech1,
    tech2,
    limit = 20
) {
    const session = getSession();

    try {
        const result = await session.run(
            `
      MATCH
        (d:Developer)
        -[:CONTRIBUTED_TO]->
        (r1:Repository)
        -[:USES_TECH]->
        (t1:Technology {name: $tech1})

      MATCH
        (d)
        -[:CONTRIBUTED_TO]->
        (r2:Repository)
        -[:USES_TECH]->
        (t2:Technology {name: $tech2})

      WITH
        d,
        collect(DISTINCT r1.fullName) AS firstTechRepositories,
        collect(DISTINCT r2.fullName) AS secondTechRepositories

      RETURN
        d,
        firstTechRepositories,
        secondTechRepositories

      ORDER BY d.username ASC

      LIMIT toInteger($limit)
      `,
            {
                tech1,
                tech2,
                limit: Number(limit)
            }
        );

        return result.records.map(record => ({
            ...record.get('d').properties,

            firstTechRepositories:
                record.get('firstTechRepositories'),

            secondTechRepositories:
                record.get('secondTechRepositories')
        }));
    } finally {
        await session.close();
    }
}


/**
 * Generic Explore query.
 *
 * If only tech1 is supplied:
 *
 *   Find developers using tech1.
 *
 * If tech1 AND tech2 are supplied:
 *
 *   Find developers using BOTH.
 *
 * This function gives the API a single entry point for
 * the Explore screen.
 */
export async function exploreDevelopers({
    tech1,
    tech2,
    limit = 20
} = {}) {
    if (!tech1) {
        throw new Error(
            'At least one technology is required.'
        );
    }

    // ------------------------------------------------------------
    // One technology
    // ------------------------------------------------------------

    if (!tech2) {
        return findDevelopersByTechnology(
            tech1,
            limit
        );
    }

    // ------------------------------------------------------------
    // Two technologies
    // ------------------------------------------------------------

    return findDevelopersByTwoTechnologies(
        tech1,
        tech2,
        limit
    );
}


/**
 * Find repositories using one technology.
 *
 * Useful when the Explore UI allows the user to switch
 * between "Developers" and "Repositories".
 */
export async function findRepositoriesByTechnology(
    technology,
    limit = 20
) {
    const session = getSession();

    try {
        const result = await session.run(
            `
      MATCH
        (r:Repository)
        -[:USES_TECH]->
        (t:Technology {name: $technology})

      OPTIONAL MATCH
        (d:Developer)
        -[:CONTRIBUTED_TO]->
        (r)

      WITH
        r,
        count(DISTINCT d) AS contributorCount

      RETURN
        r,
        contributorCount

      ORDER BY
        r.stars DESC,
        r.name ASC

      LIMIT toInteger($limit)
      `,
            {
                technology,
                limit: Number(limit)
            }
        );

        return result.records.map(record => ({
            ...record.get('r').properties,

            contributorCount:
                Number(record.get('contributorCount'))
        }));
    } finally {
        await session.close();
    }
}


/**
 * Find repositories using BOTH technologies.
 *
 * The two technology values are completely dynamic.
 */
export async function findRepositoriesByTwoTechnologies(
    tech1,
    tech2,
    limit = 20
) {
    const session = getSession();

    try {
        const result = await session.run(
            `
      MATCH
        (r:Repository)
        -[:USES_TECH]->
        (t1:Technology {name: $tech1})

      MATCH
        (r)
        -[:USES_TECH]->
        (t2:Technology {name: $tech2})

      OPTIONAL MATCH
        (d:Developer)
        -[:CONTRIBUTED_TO]->
        (r)

      WITH
        r,
        count(DISTINCT d) AS contributorCount

      RETURN
        r,
        contributorCount

      ORDER BY
        r.stars DESC,
        r.name ASC

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

            contributorCount:
                Number(record.get('contributorCount'))
        }));
    } finally {
        await session.close();
    }
}


/**
 * Get the relationship evidence for a developer and
 * two selected technologies.
 *
 * This is useful for the UI because we can show exactly
 * WHY a developer matched the search.
 */
export async function getDeveloperTechnologyEvidence(
    username,
    tech1,
    tech2
) {
    const session = getSession();

    try {
        const result = await session.run(
            `
      MATCH
        (d:Developer {username: $username})

      OPTIONAL MATCH
        (d)-[:CONTRIBUTED_TO]->
        (r1:Repository)
        -[:USES_TECH]->
        (t1:Technology {name: $tech1})

      OPTIONAL MATCH
        (d)-[:CONTRIBUTED_TO]->
        (r2:Repository)
        -[:USES_TECH]->
        (t2:Technology {name: $tech2})

      RETURN
        d.username AS username,

        collect(DISTINCT {
          repository: r1.fullName,
          technology: t1.name
        }) AS firstTechnologyEvidence,

        collect(DISTINCT {
          repository: r2.fullName,
          technology: t2.name
        }) AS secondTechnologyEvidence
      `,
            {
                username,
                tech1,
                tech2
            }
        );

        if (result.records.length === 0) {
            return null;
        }

        const record = result.records[0];

        return {
            username: record.get('username'),

            firstTechnologyEvidence:
                record
                    .get('firstTechnologyEvidence')
                    .filter(item => item.repository !== null),

            secondTechnologyEvidence:
                record
                    .get('secondTechnologyEvidence')
                    .filter(item => item.repository !== null)
        };
    } finally {
        await session.close();
    }
}


/**
 * Get available technology names for Explore selectors.
 *
 * This allows the frontend to populate the dropdowns
 * directly from the graph instead of hardcoding technologies.
 */
export async function getExploreTechnologies() {
    const session = getSession();

    try {
        const result = await session.run(
            `
      MATCH (t:Technology)

      RETURN
        t.name AS name,
        t.category AS category

      ORDER BY
        t.category ASC,
        t.name ASC
      `
        );

        return result.records.map(record => ({
            name: record.get('name'),
            category: record.get('category')
        }));
    } finally {
        await session.close();
    }
}