import { getGithubData } from './githubClient.js';
import { normalizeTechnologies } from './technologyMapping.js';

/*
 * Keep this list intentionally small.
 *
 * These repositories are used as the initial real-world dataset.
 * GitHub is only the source of seed data; the application itself
 * will query CognoDB after importing.
 */
const CURATED_REPOSITORIES = [
  { owner: 'facebook', repo: 'react' },
  { owner: 'vercel', repo: 'next.js' },
  { owner: 'expressjs', repo: 'express' },
  { owner: 'neo4j', repo: 'neo4j' },
  { owner: 'neo4j', repo: 'neo4j-javascript-driver' },
  { owner: 'microsoft', repo: 'TypeScript' },
  { owner: 'tailwindlabs', repo: 'tailwindcss' },
  { owner: 'docker', repo: 'cli' },
  { owner: 'graphql', repo: 'graphql-spec' },
  { owner: 'vitejs', repo: 'vite' },
  { owner: 'd3', repo: 'd3' },
  { owner: 'xyflow', repo: 'xyflow' },
  { owner: 'prisma', repo: 'prisma' },
  { owner: 'nodejs', repo: 'node' },
  { owner: 'reactjs', repo: 'react.dev' },
  { owner: 'postgres', repo: 'postgres' },
  { owner: 'python', repo: 'cpython' },
  { owner: 'moby', repo: 'moby' },
  { owner: 'firstlovecenter', repo: 'grandstack-template-ts' },
  { owner: 'alexandregv', repo: 'Matcha' },
  { owner: 'cognitx-leyton', repo: 'codegraph' }
];

/**
 * Import real GitHub data for the curated repository set.
 *
 * GitHub data is used only during seeding.
 * The application does not depend on GitHub at runtime.
 */
export async function importGithubData(contributorLimit = 25) {
  const dataset = [];

  let successfulRepos = 0;
  let failedRepos = 0;

  console.log(
    `Starting GitHub import for ${CURATED_REPOSITORIES.length} repositories...\n`
  );

  for (const { owner, repo } of CURATED_REPOSITORIES) {
    try {
      console.log(`Fetching ${owner}/${repo}...`);

      // ---------------------------------------------------------
      // 1. Repository metadata
      // ---------------------------------------------------------

      const repoDetails = await getGithubData(
        `/repos/${owner}/${repo}`
      );

      // ---------------------------------------------------------
      // 2. Repository languages
      // ---------------------------------------------------------

      const languagesData = await getGithubData(
        `/repos/${owner}/${repo}/languages`
      );

      const languages = Object.keys(languagesData || {});

      // ---------------------------------------------------------
      // 3. Normalize languages + topics into technologies
      // ---------------------------------------------------------

      const topics = repoDetails.topics || [];

      const normalizedTechs = normalizeTechnologies(
        repoDetails.language,
        [
          ...topics,
          ...languages
        ]
      );

      // ---------------------------------------------------------
      // 4. Contributors
      // ---------------------------------------------------------

      const contributorsData = await getGithubData(
        `/repos/${owner}/${repo}/contributors`,
        {
          per_page: contributorLimit
        }
      );

      /*
       * GitHub may return bots such as dependabot.
       * They are not useful as human developers in DevGraph.
       */
      const contributors = (contributorsData || [])
        .filter(contributor => contributor.type !== 'Bot')
        .map(contributor => ({
          id: String(contributor.id),
          username: contributor.login,
          name: contributor.name || contributor.login,
          avatar: contributor.avatar_url,
          profileUrl: contributor.html_url,
          commits: contributor.contributions || 0
        }));

      // ---------------------------------------------------------
      // 5. Construct normalized dataset
      // ---------------------------------------------------------

      dataset.push({
        repository: {
          id: String(repoDetails.id),
          name: repoDetails.name,
          fullName: repoDetails.full_name,
          description: repoDetails.description || '',
          url: repoDetails.html_url,
          stars: repoDetails.stargazers_count || 0,
          owner: repoDetails.owner?.login || owner
        },

        technologies: normalizedTechs,

        contributors
      });

      successfulRepos++;

      console.log(
        `✓ ${owner}/${repo} | ` +
        `${normalizedTechs.length} technologies | ` +
        `${contributors.length} human contributors`
      );
    } catch (error) {
      failedRepos++;

      console.error(
        `✗ Failed ${owner}/${repo}: ${error.message}`
      );
    }
  }

  console.log('\n────────────────────────────');
  console.log('GitHub Import Summary');
  console.log('────────────────────────────');
  console.log(
    `Successful repositories: ${successfulRepos}`
  );
  console.log(
    `Failed repositories: ${failedRepos}`
  );
  console.log(
    `Total records prepared: ${dataset.length}`
  );
  console.log('────────────────────────────\n');

  return dataset;
}