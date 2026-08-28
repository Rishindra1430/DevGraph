/**
 * Curated technology taxonomy for DevGraph.
 *
 * GitHub provides languages and repository topics, but those values
 * are not always normalized or sufficient to describe the technologies
 * used by a project.
 *
 * This mapping converts GitHub values into consistent Technology nodes.
 */

export const technologyMapping = {
  // ============================================================
  // Frontend
  // ============================================================

  react: {
    name: 'React',
    category: 'Frontend'
  },

  reactjs: {
    name: 'React',
    category: 'Frontend'
  },

  'react.js': {
    name: 'React',
    category: 'Frontend'
  },

  'react-native': {
    name: 'React Native',
    category: 'Frontend'
  },

  reactnative: {
    name: 'React Native',
    category: 'Frontend'
  },

  nextjs: {
    name: 'Next.js',
    category: 'Frontend'
  },

  'next.js': {
    name: 'Next.js',
    category: 'Frontend'
  },

  'next-js': {
    name: 'Next.js',
    category: 'Frontend'
  },

  vue: {
    name: 'Vue.js',
    category: 'Frontend'
  },

  vuejs: {
    name: 'Vue.js',
    category: 'Frontend'
  },

  'vue.js': {
    name: 'Vue.js',
    category: 'Frontend'
  },

  svelte: {
    name: 'Svelte',
    category: 'Frontend'
  },

  angular: {
    name: 'Angular',
    category: 'Frontend'
  },

  tailwind: {
    name: 'Tailwind CSS',
    category: 'Frontend'
  },

  tailwindcss: {
    name: 'Tailwind CSS',
    category: 'Frontend'
  },

  'tailwind-css': {
    name: 'Tailwind CSS',
    category: 'Frontend'
  },

  // ============================================================
  // Backend
  // ============================================================

  node: {
    name: 'Node.js',
    category: 'Backend'
  },

  nodejs: {
    name: 'Node.js',
    category: 'Backend'
  },

  'node.js': {
    name: 'Node.js',
    category: 'Backend'
  },

  express: {
    name: 'Express',
    category: 'Backend'
  },

  expressjs: {
    name: 'Express',
    category: 'Backend'
  },

  django: {
    name: 'Django',
    category: 'Backend'
  },

  fastapi: {
    name: 'FastAPI',
    category: 'Backend'
  },

  flask: {
    name: 'Flask',
    category: 'Backend'
  },

  nestjs: {
    name: 'NestJS',
    category: 'Backend'
  },

  // ============================================================
  // Databases
  // ============================================================

  neo4j: {
    name: 'Neo4j',
    category: 'Database'
  },

  'neo4j-database': {
    name: 'Neo4j',
    category: 'Database'
  },

  'graph-database': {
    name: 'Neo4j',
    category: 'Database'
  },

  postgresql: {
    name: 'PostgreSQL',
    category: 'Database'
  },

  postgres: {
    name: 'PostgreSQL',
    category: 'Database'
  },

  mongodb: {
    name: 'MongoDB',
    category: 'Database'
  },

  redis: {
    name: 'Redis',
    category: 'Database'
  },

  mysql: {
    name: 'MySQL',
    category: 'Database'
  },

  sqlite: {
    name: 'SQLite',
    category: 'Database'
  },

  // ============================================================
  // Graph / Query Technologies
  // ============================================================

  cypher: {
    name: 'Cypher',
    category: 'Database'
  },

  opencypher: {
    name: 'openCypher',
    category: 'Database'
  },

  'open-cypher': {
    name: 'openCypher',
    category: 'Database'
  },

  // ============================================================
  // DevOps / Infrastructure
  // ============================================================

  docker: {
    name: 'Docker',
    category: 'DevOps'
  },

  kubernetes: {
    name: 'Kubernetes',
    category: 'DevOps'
  },

  k8s: {
    name: 'Kubernetes',
    category: 'DevOps'
  },

  aws: {
    name: 'AWS',
    category: 'Infrastructure'
  },

  gcp: {
    name: 'GCP',
    category: 'Infrastructure'
  },

  vercel: {
    name: 'Vercel',
    category: 'Infrastructure'
  },

  'github-actions': {
    name: 'GitHub Actions',
    category: 'DevOps'
  },

  githubactions: {
    name: 'GitHub Actions',
    category: 'DevOps'
  },

  // ============================================================
  // Programming Languages
  // ============================================================

  typescript: {
    name: 'TypeScript',
    category: 'Language'
  },

  ts: {
    name: 'TypeScript',
    category: 'Language'
  },

  javascript: {
    name: 'JavaScript',
    category: 'Language'
  },

  js: {
    name: 'JavaScript',
    category: 'Language'
  },

  python: {
    name: 'Python',
    category: 'Language'
  },

  py: {
    name: 'Python',
    category: 'Language'
  },

  java: {
    name: 'Java',
    category: 'Language'
  },

  go: {
    name: 'Go',
    category: 'Language'
  },

  golang: {
    name: 'Go',
    category: 'Language'
  },

  rust: {
    name: 'Rust',
    category: 'Language'
  },

  c: {
    name: 'C',
    category: 'Language'
  },

  'c++': {
    name: 'C++',
    category: 'Language'
  },

  'c#': {
    name: 'C#',
    category: 'Language'
  },

  // ============================================================
  // API / Data
  // ============================================================

  graphql: {
    name: 'GraphQL',
    category: 'API'
  },

  'graphql-api': {
    name: 'GraphQL',
    category: 'API'
  },

  rest: {
    name: 'REST',
    category: 'API'
  },

  'rest-api': {
    name: 'REST',
    category: 'API'
  },

  grpc: {
    name: 'gRPC',
    category: 'API'
  }
};


/**
 * Normalize a GitHub value.
 *
 * Handles:
 * - capitalization
 * - whitespace
 * - underscores
 */
function cleanTechnologyKey(value) {
  if (!value || typeof value !== 'string') {
    return null;
  }

  return value
    .toLowerCase()
    .trim()
    .replace(/_/g, '-');
}


/**
 * Convert GitHub primary language + topics/languages
 * into unique Technology nodes.
 *
 * Returns:
 *
 * [
 *   {
 *     name: 'React',
 *     category: 'Frontend'
 *   },
 *   {
 *     name: 'TypeScript',
 *     category: 'Language'
 *   }
 * ]
 */
export function normalizeTechnologies(primaryLanguage, values = []) {
  const technologies = new Map();

  const addTechnology = (value) => {
    const key = cleanTechnologyKey(value);

    if (!key) {
      return;
    }

    const match = technologyMapping[key];

    if (!match) {
      return;
    }

    technologies.set(match.name, match);
  };

  // Primary GitHub language
  addTechnology(primaryLanguage);

  // Repository topics + language list
  if (Array.isArray(values)) {
    for (const value of values) {
      addTechnology(value);
    }
  }

  return Array.from(technologies.values());
}