import {
  verifyConnection,
  getSession,
  closeDriver
} from '../db/neo4j.js';

import { importGithubData } from './githubImporter.js';

const isReset = process.argv.includes('--reset');

async function seed() {
  console.log('DevGraph Seeding Tool');
  console.log('────────────────────────────────────');

  let session;

  try {
    // ============================================================
    // 1. Verify CognoDB connection
    // ============================================================

    console.log('Verifying connection to CognoDB...');

    await verifyConnection();

    console.log('✓ CognoDB connection verified.');

    session = getSession();

    // ============================================================
    // 2. Optional database reset
    // ============================================================

    if (isReset) {
      console.log('\n⚠ Reset flag detected.');
      console.log('Purging existing graph...');

      await session.run(`
        MATCH (n)
        DETACH DELETE n
      `);

      console.log('✓ Existing graph deleted.');
    } else {
      console.log('\nIdempotent mode enabled.');
      console.log('Existing data will be preserved.');
    }

    // ============================================================
    // 3. Create uniqueness constraints
    // ============================================================

    console.log('\nSetting up uniqueness constraints...');

    try {
      await session.run(`
        CREATE CONSTRAINT unique_developer_username
        IF NOT EXISTS
        FOR (d:Developer)
        REQUIRE d.username IS UNIQUE
      `);

      await session.run(`
        CREATE CONSTRAINT unique_repository_id
        IF NOT EXISTS
        FOR (r:Repository)
        REQUIRE r.id IS UNIQUE
      `);

      await session.run(`
        CREATE CONSTRAINT unique_technology_name
        IF NOT EXISTS
        FOR (t:Technology)
        REQUIRE t.name IS UNIQUE
      `);

      console.log('✓ Uniqueness constraints ready.');
    } catch (error) {
      console.warn(
        '⚠ Could not create constraints:',
        error.message
      );

      console.warn(
        'Continuing because MERGE is still used for idempotency.'
      );
    }

    // ============================================================
    // 4. Import real GitHub data
    // ============================================================

    console.log('\nFetching real GitHub data...');

    const githubData = await importGithubData(25);

    if (!githubData.length) {
      throw new Error(
        'GitHub importer returned no repositories. ' +
        'Check GITHUB_TOKEN and GitHub API connectivity.'
      );
    }

    console.log(
      `✓ Received ${githubData.length} repositories from GitHub.`
    );

    // ============================================================
    // 5. Write graph to CognoDB
    // ============================================================

    console.log('\nWriting graph data to CognoDB...');

    for (const item of githubData) {
      const {
        repository,
        technologies,
        contributors
      } = item;

      // ----------------------------------------------------------
      // Repository
      // ----------------------------------------------------------

      await session.run(
        `
        MERGE (r:Repository {id: $id})

        SET
          r.name = $name,
          r.fullName = $fullName,
          r.description = $description,
          r.url = $url,
          r.stars = $stars,
          r.owner = $owner
        `,
        repository
      );

      // ----------------------------------------------------------
      // Technologies
      // ----------------------------------------------------------

      for (const tech of technologies) {
        await session.run(
          `
          MERGE (t:Technology {name: $name})
          SET t.category = $category
          `,
          {
            name: tech.name,
            category: tech.category
          }
        );

        await session.run(
          `
          MATCH (r:Repository {id: $repoId})
          MATCH (t:Technology {name: $techName})

          MERGE (r)-[:USES_TECH]->(t)
          `,
          {
            repoId: repository.id,
            techName: tech.name
          }
        );
      }

      // ----------------------------------------------------------
      // Developers + contributions
      // ----------------------------------------------------------

      for (const dev of contributors) {
        let role = 'Contributor';

        if (dev.commits > 100) {
          role = 'Maintainer';
        } else if (dev.commits > 25) {
          role = 'Core Contributor';
        }

        await session.run(
          `
          MERGE (d:Developer {username: $username})

          ON CREATE SET
            d.id = $id,
            d.name = $name,
            d.avatar = $avatar,
            d.profileUrl = $profileUrl,
            d.bio = ''

          ON MATCH SET
            d.id = $id,
            d.avatar = $avatar,
            d.profileUrl = $profileUrl
          `,
          {
            username: dev.username,
            id: dev.id,
            name: dev.name || dev.username,
            avatar: dev.avatar,
            profileUrl: dev.profileUrl
          }
        );

        await session.run(
          `
          MATCH (d:Developer {username: $username})
          MATCH (r:Repository {id: $repoId})

          MERGE (d)-[c:CONTRIBUTED_TO]->(r)

          SET
            c.commits = $commits,
            c.role = $role
          `,
          {
            username: dev.username,
            repoId: repository.id,
            commits: dev.commits,
            role
          }
        );
      }

      console.log(
        `✓ ${repository.fullName} | ` +
        `${technologies.length} technologies | ` +
        `${contributors.length} contributors`
      );
    }

    // ============================================================
    // 6. Verify graph
    // ============================================================

    console.log('\nVerifying graph...');

    const developersResult = await session.run(`
      MATCH (d:Developer)
      RETURN count(d) AS count
    `);

    const repositoriesResult = await session.run(`
      MATCH (r:Repository)
      RETURN count(r) AS count
    `);

    const technologiesResult = await session.run(`
      MATCH (t:Technology)
      RETURN count(t) AS count
    `);

    const contributionsResult = await session.run(`
      MATCH ()-[r:CONTRIBUTED_TO]->()
      RETURN count(r) AS count
    `);

    const technologyRelationshipsResult = await session.run(`
      MATCH ()-[r:USES_TECH]->()
      RETURN count(r) AS count
    `);

    const developers =
      developersResult.records[0].get('count');

    const repositories =
      repositoriesResult.records[0].get('count');

    const technologies =
      technologiesResult.records[0].get('count');

    const contributions =
      contributionsResult.records[0].get('count');

    const technologyRelationships =
      technologyRelationshipsResult.records[0].get('count');

    console.log('\nDevGraph CognoDB Summary');
    console.log('────────────────────────────────────');

    console.log(`Developers:               ${developers}`);
    console.log(`Repositories:             ${repositories}`);
    console.log(`Technologies:             ${technologies}`);
    console.log(`CONTRIBUTED_TO relations: ${contributions}`);
    console.log(`USES_TECH relations:      ${technologyRelationships}`);

    // ============================================================
    // 7. Verify important technologies
    // ============================================================

    const technologyCheck = await session.run(`
      MATCH (t:Technology)
      WHERE t.name IN [
        'React',
        'Neo4j',
        'TypeScript',
        'JavaScript',
        'Node.js',
        'Python',
        'Docker',
        'GraphQL'
      ]
      RETURN t.name AS name
      ORDER BY t.name
    `);

    const availableTechnologies =
      technologyCheck.records.map(
        record => record.get('name')
      );

    console.log('\nKey technologies found:');

    if (availableTechnologies.length) {
      for (const technology of availableTechnologies) {
        console.log(`  ✓ ${technology}`);
      }
    } else {
      console.log('  ⚠ No expected technologies found.');
    }

    // ============================================================
    // 8. Check React + Neo4j intersection
    // ============================================================

    const intersectionResult = await session.run(
      `
      MATCH (d:Developer)
            -[:CONTRIBUTED_TO]->(r1:Repository)
            -[:USES_TECH]->(t1:Technology)

      MATCH (d)
            -[:CONTRIBUTED_TO]->(r2:Repository)
            -[:USES_TECH]->(t2:Technology)

      WHERE t1.name = $tech1
        AND t2.name = $tech2

      RETURN DISTINCT
        d.username AS username,
        d.name AS name

      ORDER BY username
      LIMIT 20
      `,
      {
        tech1: 'React',
        tech2: 'Neo4j'
      }
    );

    console.log('\nReact + Neo4j intersection:');

    if (intersectionResult.records.length) {
      for (const record of intersectionResult.records) {
        console.log(
          `  ✓ ${record.get('username')}`
        );
      }

      console.log(
        `✓ Found ${intersectionResult.records.length} developers ` +
        'with both React and Neo4j experience.'
      );
    } else {
      console.log(
        '  ⚠ No React + Neo4j intersection found in the current dataset.'
      );

      console.log(
        '  This is NOT a seed failure. We should adjust the curated ' +
        'repository set to produce a stronger overlap.'
      );
    }

    console.log('\n✓ Seeding completed successfully.');
  } catch (error) {
    console.error(
      '\n✗ Fatal: Seeding failed:',
      error.message
    );

    process.exitCode = 1;
  } finally {
    if (session) {
      await session.close();
    }

    await closeDriver();
  }
}

seed();