import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from root of project
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const requiredEnv = ['NEO4J_URI', 'NEO4J_USERNAME', 'NEO4J_PASSWORD'];

for (const key of requiredEnv) {
  if (!process.env[key]) {
    console.error(`Error: Missing required environment variable ${key}`);
    process.exit(1);
  }
}

export const env = {
  neo4jUri: process.env.NEO4J_URI,
  neo4jUsername: process.env.NEO4J_USERNAME,
  neo4jPassword: process.env.NEO4J_PASSWORD,
  neo4jDatabase: process.env.NEO4J_DATABASE || 'neo4j',
  port: parseInt(process.env.PORT || '5000', 10),
  githubToken: process.env.GITHUB_TOKEN || ''
};
