import { env } from './src/config/env.js';

console.log('--- Env Check ---');
console.log('NEO4J_URI set?', !!env.neo4jUri);
console.log('NEO4J_USERNAME:', env.neo4jUsername);
console.log('NEO4J_DATABASE:', env.neo4jDatabase);
console.log('NEO4J_PASSWORD set?', !!env.neo4jPassword);
console.log('GITHUB_TOKEN set?', !!env.githubToken);
console.log('PORT:', env.port);
