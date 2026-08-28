import { getSession } from '../db/neo4j.js';

/**
 * Get a graph neighborhood around a developer.
 *
 * This powers the Network Explorer.
 *
 * Graph:
 *
 * Developer
 *    ↓
 * Repository
 *    ↓
 * Technology
 *
 * The query returns nodes + relationships so the frontend
 * can construct the interactive D3 graph.
 */
export async function getDeveloperNetwork(
    username,
    depth = 2
) {
    const session = getSession();

    try {
        const safeDepth = Math.min(
            Math.max(Number(depth) || 2, 1),
            3
        );

        const result = await session.run(
            `
      MATCH (d:Developer {username: $username})

      OPTIONAL MATCH p =
        (d)-[:CONTRIBUTED_TO|USES_TECH*1..${safeDepth}]-(connected)

      WITH d, collect(DISTINCT p) AS paths

      UNWIND paths AS p

      WITH
        collect(DISTINCT nodes(p)) AS nodeGroups,
        collect(DISTINCT relationships(p)) AS relationshipGroups

      RETURN
        nodeGroups,
        relationshipGroups
      `,
            {
                username
            }
        );

        if (result.records.length === 0) {
            return {
                nodes: [],
                relationships: []
            };
        }

        const record = result.records[0];

        const nodeGroups = record.get('nodeGroups') || [];
        const relationshipGroups =
            record.get('relationshipGroups') || [];

        // Flatten nested node arrays and deduplicate by
        // label + stable identifier.
        const nodeMap = new Map();

        for (const group of nodeGroups) {
            for (const node of group) {
                const properties = node.properties || {};
                const labels = node.labels || [];

                const identifier =
                    properties.username ||
                    properties.id ||
                    properties.name;

                const key = `${labels[0] || 'Node'}:${identifier}`;

                if (!nodeMap.has(key)) {
                    nodeMap.set(key, {
                        id: key,
                        type: labels[0] || 'Node',
                        properties
                    });
                }
            }
        }

        // Flatten and deduplicate relationships.
        const relationshipMap = new Map();

        for (const group of relationshipGroups) {
            for (const relationship of group) {
                const properties =
                    relationship.properties || {};

                const key =
                    `${relationship.startNodeElementId || relationship.startNode}-${relationship.type}-${relationship.endNodeElementId || relationship.endNode}`;

                if (!relationshipMap.has(key)) {
                    relationshipMap.set(key, {
                        id: key,
                        type: relationship.type,
                        properties,
                        startNode:
                            relationship.startNodeElementId ||
                            relationship.startNode,
                        endNode:
                            relationship.endNodeElementId ||
                            relationship.endNode
                    });
                }
            }
        }

        return {
            nodes: Array.from(nodeMap.values()),
            relationships: Array.from(
                relationshipMap.values()
            )
        };
    } finally {
        await session.close();
    }
}


/**
 * Get a lightweight network containing all developers,
 * repositories and technologies.
 *
 * This is useful for the initial Network Explorer.
 *
 * LIMITS are intentionally applied so we don't attempt
 * to render hundreds of developers at once.
 */
export async function getNetworkOverview({
    developerLimit = 60,
    repositoryLimit = 30,
    technologyLimit = 30
} = {}) {
    const session = getSession();

    try {
        const result = await session.run(
            `
      MATCH (d:Developer)

      OPTIONAL MATCH
        (d)-[:CONTRIBUTED_TO]->(r:Repository)

      WITH
        d,
        count(DISTINCT r) AS repoCount

      ORDER BY repoCount DESC

      LIMIT toInteger($developerLimit)

      WITH collect(d) AS developers

      UNWIND developers AS d

      OPTIONAL MATCH
        (d)-[:CONTRIBUTED_TO]->(r:Repository)

      OPTIONAL MATCH
        (r)-[:USES_TECH]->(t:Technology)

      WITH
        developers,
        collect(DISTINCT r) AS repositories,
        collect(DISTINCT t) AS technologies

      RETURN
        developers,
        repositories,
        technologies
      `,
            {
                developerLimit: Number(developerLimit),
                repositoryLimit: Number(repositoryLimit),
                technologyLimit: Number(technologyLimit)
            }
        );

        if (result.records.length === 0) {
            return {
                nodes: [],
                relationships: []
            };
        }

        const record = result.records[0];

        const developers =
            record.get('developers') || [];

        const repositories =
            record.get('repositories') || [];

        const technologies =
            record.get('technologies') || [];

        const nodeMap = new Map();

        // ------------------------------------------------------------
        // Developers
        // ------------------------------------------------------------

        for (const node of developers) {
            const properties = node.properties || {};

            const id =
                `Developer:${properties.username || properties.id}`;

            nodeMap.set(id, {
                id,
                type: 'Developer',
                properties
            });
        }

        // ------------------------------------------------------------
        // Repositories
        // ------------------------------------------------------------

        for (const node of repositories) {
            const properties = node.properties || {};

            const id =
                `Repository:${properties.id || properties.fullName}`;

            nodeMap.set(id, {
                id,
                type: 'Repository',
                properties
            });
        }

        // ------------------------------------------------------------
        // Technologies
        // ------------------------------------------------------------

        for (const node of technologies) {
            const properties = node.properties || {};

            const id =
                `Technology:${properties.name}`;

            nodeMap.set(id, {
                id,
                type: 'Technology',
                properties
            });
        }

        // ------------------------------------------------------------
        // Fetch relationships between the selected nodes
        // ------------------------------------------------------------

        const usernames = developers
            .map(node => node.properties?.username)
            .filter(Boolean);

        const repositoryIds = repositories
            .map(node => node.properties?.id)
            .filter(Boolean);

        const technologyNames = technologies
            .map(node => node.properties?.name)
            .filter(Boolean);

        const relationshipResult =
            await session.run(
                `
        MATCH (a)-[rel]->(b)

        WHERE
          (
            a:Developer
            AND a.username IN $usernames
          )
          OR
          (
            a:Repository
            AND a.id IN $repositoryIds
          )

        RETURN
          a,
          rel,
          b
        `,
                {
                    usernames,
                    repositoryIds,
                    technologyNames
                }
            );

        const relationshipMap = new Map();

        for (const record of relationshipResult.records) {
            const start =
                record.get('a');

            const relationship =
                record.get('rel');

            const end =
                record.get('b');

            const startProperties =
                start.properties || {};

            const endProperties =
                end.properties || {};

            const startId =
                `${start.labels?.[0] || 'Node'}:${startProperties.username ||
                startProperties.id ||
                startProperties.name
                }`;

            const endId =
                `${end.labels?.[0] || 'Node'}:${endProperties.username ||
                endProperties.id ||
                endProperties.name
                }`;

            // Only include relationships whose endpoints
            // are present in our selected node set.
            if (
                !nodeMap.has(startId) ||
                !nodeMap.has(endId)
            ) {
                continue;
            }

            const key =
                `${startId}-${relationship.type}-${endId}`;

            relationshipMap.set(key, {
                id: key,
                type: relationship.type,
                properties:
                    relationship.properties || {},
                startNode: startId,
                endNode: endId
            });
        }

        return {
            nodes: Array.from(nodeMap.values()),
            relationships: Array.from(
                relationshipMap.values()
            )
        };
    } finally {
        await session.close();
    }
}


/**
 * Find the shortest connection path between two developers.
 *
 * This is one of the strongest graph-specific features
 * in DevGraph.
 *
 * Example:
 *
 * Developer A
 *      ↓
 * Repository
 *      ↓
 * Developer B
 *
 * Or:
 *
 * Developer A
 *      ↓
 * Repository
 *      ↓
 * Technology
 *      ↓
 * Repository
 *      ↓
 * Developer B
 *
 * The exact path is determined by the graph.
 */
export async function findDeveloperConnection(
    from,
    to,
    maxDepth = 6
) {
    const session = getSession();

    try {
        const safeDepth = Math.min(
            Math.max(Number(maxDepth) || 6, 2),
            10
        );

        const result = await session.run(
            `
      MATCH p = shortestPath(
        (a:Developer {username: $from})
        -[:CONTRIBUTED_TO|USES_TECH*..${safeDepth}]-
        (b:Developer {username: $to})
      )

      RETURN p
      `,
            {
                from,
                to
            }
        );

        if (result.records.length === 0) {
            return null;
        }

        const path =
            result.records[0].get('p');

        // Always use path.segments for reliable node/rel wiring.
        // The Neo4j driver guarantees segment ordering even when
        // path.nodes / path.relationships are missing.
        const segments = Array.isArray(path?.segments)
            ? path.segments
            : [];

        const nodeList = [];
        const relList = [];

        for (let i = 0; i < segments.length; i++) {
            const seg = segments[i];
            if (i === 0) nodeList.push(seg.start);
            nodeList.push(seg.end);
            relList.push(seg.relationship);
        }

        // Fallback: if no segments, try path.nodes / path.relationships
        if (nodeList.length === 0) {
            (path?.nodes ?? []).forEach(n => nodeList.push(n));
            (path?.relationships ?? []).forEach(r => relList.push(r));
        }

        const mapNode = (node) => {
            const properties = node?.properties || {};
            const type = node?.labels?.[0] || 'Node';
            const identifier =
                properties.username ||
                properties.id ||
                properties.name;
            return { id: `${type}:${identifier}`, type, properties };
        };

        const nodes = nodeList.map(mapNode);

        const relationships = relList.map((rel, index) => ({
            id: `${nodes[index]?.id}-${rel?.type}-${nodes[index + 1]?.id}`,
            type: rel?.type || 'UNKNOWN',
            properties: rel?.properties || {},
            startNode: nodes[index]?.id,
            endNode: nodes[index + 1]?.id
        }));

        return {
            nodes,
            relationships,
            hops: relationships.length
        };
    } finally {
        await session.close();
    }
}


/**
 * Get direct collaborators for a developer.
 *
 * Developer A
 *      ↓
 * Repository
 *      ↑
 * Developer B
 *
 * Developers are ranked by the number of repositories
 * they have worked on together.
 */
export async function getNetworkCollaborators(
    username,
    limit = 20
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
        (collaborator:Developer)

      WHERE collaborator.username <> $username

      WITH
        collaborator,
        collect(DISTINCT r.fullName) AS sharedRepositories

      RETURN
        collaborator,
        sharedRepositories,
        size(sharedRepositories) AS collaborationCount

      ORDER BY
        collaborationCount DESC,
        collaborator.username ASC

      LIMIT toInteger($limit)
      `,
            {
                username,
                limit: Number(limit)
            }
        );

        return result.records.map(record => ({
            ...record.get('collaborator').properties,

            collaborationCount:
                Number(
                    record.get('collaborationCount')
                ),

            sharedRepositories:
                record.get('sharedRepositories')
        }));
    } finally {
        await session.close();
    }
}


/**
 * Get the complete graph neighborhood for two developers.
 *
 * Useful when comparing two developers in the Network Explorer.
 */
export async function compareDeveloperNetworks(
    username1,
    username2
) {
    const session = getSession();

    try {
        const result = await session.run(
            `
      MATCH
        (d1:Developer {username: $username1})

      OPTIONAL MATCH
        (d1)-[:CONTRIBUTED_TO]->(r1:Repository)
        -[:USES_TECH]->(t1:Technology)

      WITH
        d1,
        collect(DISTINCT r1) AS repos1,
        collect(DISTINCT t1) AS techs1

      OPTIONAL MATCH
        (d2:Developer {username: $username2})
        -[:CONTRIBUTED_TO]->(r2:Repository)
        -[:USES_TECH]->(t2:Technology)

      RETURN
        d1,
        repos1,
        techs1,
        d2,
        collect(DISTINCT r2) AS repos2,
        collect(DISTINCT t2) AS techs2
      `,
            {
                username1,
                username2
            }
        );

        if (result.records.length === 0) {
            return null;
        }

        const record = result.records[0];

        const developer1 =
            record.get('d1');

        const developer2 =
            record.get('d2');

        if (!developer1 || !developer2) {
            return null;
        }

        return {
            developer1:
                developer1.properties,

            developer2:
                developer2.properties,

            repositories1:
                (record.get('repos1') || [])
                    .map(node => node.properties),

            repositories2:
                (record.get('repos2') || [])
                    .map(node => node.properties),

            technologies1:
                (record.get('techs1') || [])
                    .map(node => node.properties),

            technologies2:
                (record.get('techs2') || [])
                    .map(node => node.properties)
        };
    } finally {
        await session.close();
    }
}