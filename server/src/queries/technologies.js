import { getSession } from '../db/neo4j.js';

/**
 * Get all technologies.
 *
 * Optional:
 * - category → filter by technology category
 * - search   → search by technology name
 */
export async function getAllTechnologies({
    category,
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

        if (category) {
            query = `
        MATCH (t:Technology)

        WHERE t.category = $category

        OPTIONAL MATCH
          (r:Repository)-[:USES_TECH]->(t)

        OPTIONAL MATCH
          (d:Developer)-[:CONTRIBUTED_TO]->(r)

        WITH
          t,
          count(DISTINCT r) AS repositoryCount,
          count(DISTINCT d) AS developerCount

        RETURN
          t,
          repositoryCount,
          developerCount

        ORDER BY developerCount DESC, t.name ASC

        SKIP toInteger($skip)
        LIMIT toInteger($limit)
      `;

            params.category = category;
        } else if (search) {
            query = `
        MATCH (t:Technology)

        WHERE
          toLower(t.name) CONTAINS toLower($search)

        OPTIONAL MATCH
          (r:Repository)-[:USES_TECH]->(t)

        OPTIONAL MATCH
          (d:Developer)-[:CONTRIBUTED_TO]->(r)

        WITH
          t,
          count(DISTINCT r) AS repositoryCount,
          count(DISTINCT d) AS developerCount

        RETURN
          t,
          repositoryCount,
          developerCount

        ORDER BY developerCount DESC, t.name ASC

        SKIP toInteger($skip)
        LIMIT toInteger($limit)
      `;

            params.search = search;
        } else {
            query = `
        MATCH (t:Technology)

        OPTIONAL MATCH
          (r:Repository)-[:USES_TECH]->(t)

        OPTIONAL MATCH
          (d:Developer)-[:CONTRIBUTED_TO]->(r)

        WITH
          t,
          count(DISTINCT r) AS repositoryCount,
          count(DISTINCT d) AS developerCount

        RETURN
          t,
          repositoryCount,
          developerCount

        ORDER BY developerCount DESC, t.name ASC

        SKIP toInteger($skip)
        LIMIT toInteger($limit)
      `;
        }

        const result = await session.run(query, params);

        return result.records.map(record => ({
            ...record.get('t').properties,

            repositoryCount: Number(
                record.get('repositoryCount')
            ),

            developerCount: Number(
                record.get('developerCount')
            )
        }));
    } finally {
        await session.close();
    }
}


/**
 * Get a single technology by name.
 *
 * Returns technology information along with
 * repository and developer counts.
 */
export async function getTechnologyByName(name) {
    const session = getSession();

    try {
        const result = await session.run(
            `
      MATCH (t:Technology {name: $name})

      OPTIONAL MATCH
        (r:Repository)-[:USES_TECH]->(t)

      OPTIONAL MATCH
        (d:Developer)-[:CONTRIBUTED_TO]->(r)

      WITH
        t,
        count(DISTINCT r) AS repositoryCount,
        count(DISTINCT d) AS developerCount

      RETURN
        t,
        repositoryCount,
        developerCount
      `,
            { name }
        );

        if (result.records.length === 0) {
            return null;
        }

        const record = result.records[0];

        return {
            ...record.get('t').properties,

            repositoryCount: Number(
                record.get('repositoryCount')
            ),

            developerCount: Number(
                record.get('developerCount')
            )
        };
    } finally {
        await session.close();
    }
}


/**
 * Get repositories using a technology.
 *
 * Graph:
 *
 * Technology
 *     ↑ USES_TECH
 * Repository
 */
export async function getTechnologyRepositories(
    name,
    limit = 50
) {
    const session = getSession();

    try {
        const result = await session.run(
            `
      MATCH
        (r:Repository)
        -[:USES_TECH]->
        (t:Technology {name: $name})

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
                name,
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
 * Get developers who have worked with a technology.
 *
 * Graph:
 *
 * Developer
 *     ↓ CONTRIBUTED_TO
 * Repository
 *     ↓ USES_TECH
 * Technology
 */
export async function getTechnologyDevelopers(
    name,
    limit = 50
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
        (t:Technology {name: $name})

      WITH
        d,
        count(DISTINCT r) AS repositoryCount

      RETURN
        d,
        repositoryCount

      ORDER BY repositoryCount DESC, d.username ASC

      LIMIT toInteger($limit)
      `,
            {
                name,
                limit: Number(limit)
            }
        );

        return result.records.map(record => ({
            ...record.get('d').properties,

            repositoryCount: Number(
                record.get('repositoryCount')
            )
        }));
    } finally {
        await session.close();
    }
}


/**
 * Get related technologies.
 *
 * Finds technologies that appear in the same
 * repositories as the selected technology.
 *
 * Example:
 *
 * React
 *   ↓
 * Repository
 *   ↓
 * TypeScript
 *
 * This is useful for the "Related Technologies"
 * section of the UI.
 */
export async function getRelatedTechnologies(
    name,
    limit = 10
) {
    const session = getSession();

    try {
        const result = await session.run(
            `
      MATCH
        (t1:Technology {name: $name})
        <-[:USES_TECH]-
        (r:Repository)
        -[:USES_TECH]->
        (t2:Technology)

      WHERE t1 <> t2

      WITH
        t2,
        count(DISTINCT r) AS sharedRepositories

      RETURN
        t2.name AS technology,
        t2.category AS category,
        sharedRepositories

      ORDER BY
        sharedRepositories DESC,
        technology ASC

      LIMIT toInteger($limit)
      `,
            {
                name,
                limit: Number(limit)
            }
        );

        return result.records.map(record => ({
            technology: record.get('technology'),
            category: record.get('category'),

            sharedRepositories: Number(
                record.get('sharedRepositories')
            )
        }));
    } finally {
        await session.close();
    }
}


/**
 * Find repositories using BOTH selected technologies.
 *
 * IMPORTANT:
 * tech1 and tech2 are parameters.
 *
 * Nothing is hardcoded to React or Neo4j.
 *
 * Example:
 *
 * tech1 = "React"
 * tech2 = "TypeScript"
 *
 * or:
 *
 * tech1 = "Python"
 * tech2 = "Docker"
 */
export async function getRepositoriesByTwoTechnologies(
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
        (d:Developer)-[:CONTRIBUTED_TO]->(r)

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

            contributorCount: Number(
                record.get('contributorCount')
            )
        }));
    } finally {
        await session.close();
    }
}