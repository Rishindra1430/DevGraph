import { getSession } from '../db/neo4j.js';

/**
 * Get a paginated list of developers.
 *
 * Optional filters:
 * - tech   → developers who have worked with a technology
 * - search → search by name or username
 */
export async function getAllDevelopers({
  tech,
  search,
  limit = 50,
  skip = 0
} = {}) {
  const session = getSession();

  try {
    let query;
    let params = {
      limit: Number(limit),
      skip: Number(skip)
    };

    // ------------------------------------------------------------
    // Filter by technology
    // Developer → Repository → Technology
    // ------------------------------------------------------------

    if (tech) {
      query = `
        MATCH (d:Developer)
              -[:CONTRIBUTED_TO]->
              (r:Repository)
              -[:USES_TECH]->
              (t:Technology {name: $tech})

        WITH d,
             count(DISTINCT r) AS repoCount

        RETURN
          d,
          repoCount

        ORDER BY repoCount DESC, d.username ASC

        SKIP toInteger($skip)
        LIMIT toInteger($limit)
      `;

      params.tech = tech;
    }

    // ------------------------------------------------------------
    // Search developers
    // ------------------------------------------------------------

    else if (search) {
      query = `
        MATCH (d:Developer)

        WHERE
          toLower(d.name) CONTAINS toLower($search)
          OR
          toLower(d.username) CONTAINS toLower($search)

        OPTIONAL MATCH
          (d)-[:CONTRIBUTED_TO]->(r:Repository)

        WITH
          d,
          count(DISTINCT r) AS repoCount

        RETURN
          d,
          repoCount

        ORDER BY repoCount DESC, d.username ASC

        SKIP toInteger($skip)
        LIMIT toInteger($limit)
      `;

      params.search = search;
    }

    // ------------------------------------------------------------
    // All developers
    // ------------------------------------------------------------

    else {
      query = `
        MATCH (d:Developer)

        OPTIONAL MATCH
          (d)-[:CONTRIBUTED_TO]->(r:Repository)

        WITH
          d,
          count(DISTINCT r) AS repoCount

        RETURN
          d,
          repoCount

        ORDER BY repoCount DESC, d.username ASC

        SKIP toInteger($skip)
        LIMIT toInteger($limit)
      `;
    }

    const result = await session.run(query, params);

    return result.records.map(record => ({
      ...record.get('d').properties,
      repoCount: Number(record.get('repoCount'))
    }));
  } finally {
    await session.close();
  }
}


/**
 * Get a single developer by username.
 */
export async function getDeveloperByUsername(username) {
  const session = getSession();

  try {
    const result = await session.run(
      `
      MATCH (d:Developer {username: $username})

      OPTIONAL MATCH
        (d)-[:CONTRIBUTED_TO]->(r:Repository)

      WITH
        d,
        count(DISTINCT r) AS repoCount

      RETURN
        d,
        repoCount
      `,
      { username }
    );

    if (result.records.length === 0) {
      return null;
    }

    const record = result.records[0];

    return {
      ...record.get('d').properties,
      repoCount: Number(record.get('repoCount'))
    };
  } finally {
    await session.close();
  }
}


/**
 * Get repositories contributed to by a developer.
 *
 * Returns contribution information such as:
 * - commits
 * - role
 */
export async function getDeveloperRepositories(username) {
  const session = getSession();

  try {
    const result = await session.run(
      `
      MATCH
        (d:Developer {username: $username})
        -[c:CONTRIBUTED_TO]->
        (r:Repository)

      RETURN
        r,
        c

      ORDER BY c.commits DESC, r.name ASC
      `,
      { username }
    );

    return result.records.map(record => ({
      ...record.get('r').properties,
      commits: Number(
        record.get('c').properties.commits || 0
      ),
      role: record.get('c').properties.role || 'Contributor'
    }));
  } finally {
    await session.close();
  }
}


/**
 * Get technologies a developer has worked with.
 *
 * This is a 2-hop graph traversal:
 *
 * Developer
 *     ↓ CONTRIBUTED_TO
 * Repository
 *     ↓ USES_TECH
 * Technology
 */
export async function getDeveloperTechnologies(username) {
  const session = getSession();

  try {
    const result = await session.run(
      `
      MATCH
        (d:Developer {username: $username})
        -[:CONTRIBUTED_TO]->
        (r:Repository)
        -[:USES_TECH]->
        (t:Technology)

      RETURN DISTINCT
        t.name AS technology,
        t.category AS category,
        count(DISTINCT r) AS repositoryCount

      ORDER BY repositoryCount DESC, technology ASC
      `,
      { username }
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


/**
 * Find developers who collaborated with a given developer.
 *
 * Graph pattern:
 *
 * Developer A
 *      ↓
 * Repository
 *      ↑
 * Developer B
 *
 * Developers are ranked by the number of
 * repositories they shared.
 */
export async function getDeveloperCollaborators(
  username,
  limit = 10
) {
  const session = getSession();

  try {
    const result = await session.run(
      `
      MATCH
        (d:Developer {username: $username})
        -[:CONTRIBUTED_TO]->
        (r:Repository)
        <-[:CONTRIBUTED_TO]-
        (collab:Developer)

      WHERE collab.username <> $username

      WITH
        collab,
        collect(DISTINCT r.fullName) AS sharedRepositories

      RETURN
        collab,
        size(sharedRepositories) AS sharedRepos,
        sharedRepositories

      ORDER BY sharedRepos DESC, collab.username ASC

      LIMIT toInteger($limit)
      `,
      {
        username,
        limit: Number(limit)
      }
    );

    return result.records.map(record => ({
      ...record.get('collab').properties,

      sharedRepos: Number(
        record.get('sharedRepos')
      ),

      sharedRepositories:
        record.get('sharedRepositories')
    }));
  } finally {
    await session.close();
  }
}


/**
 * Find developers who have experience with BOTH technologies.
 *
 * This is one of the most important queries in DevGraph.
 *
 * Example:
 *
 * React + Neo4j
 *
 * Developer
 *    ├──→ Repository ──→ React
 *    │
 *    └──→ Repository ──→ Neo4j
 *
 * This is a graph-specific intersection query.
 */
export async function findDevelopersByTechnologies(
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

      RETURN DISTINCT
        d,
        collect(DISTINCT r1.fullName) AS firstTechRepositories,
        collect(DISTINCT r2.fullName) AS secondTechRepositories

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
 * Search developers by username or display name.
 */
export async function searchDevelopers(
  query,
  limit = 10
) {
  const session = getSession();

  try {
    const result = await session.run(
      `
      MATCH (d:Developer)

      WHERE
        toLower(d.name) CONTAINS toLower($query)
        OR
        toLower(d.username) CONTAINS toLower($query)

      OPTIONAL MATCH
        (d)-[:CONTRIBUTED_TO]->(r:Repository)

      WITH
        d,
        count(DISTINCT r) AS repoCount

      RETURN
        d,
        repoCount

      ORDER BY repoCount DESC, d.username ASC

      LIMIT toInteger($limit)
      `,
      {
        query,
        limit: Number(limit)
      }
    );

    return result.records.map(record => ({
      ...record.get('d').properties,
      repoCount: Number(
        record.get('repoCount')
      )
    }));
  } finally {
    await session.close();
  }
}