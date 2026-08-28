import { verifyConnection, closeDriver } from './src/db/neo4j.js';

console.log('Testing CognoDB connection...');
try {
  await verifyConnection();
  console.log('✓ CognoDB connection successful.');
} catch (err) {
  console.error('✗ Connection failed:', err.message);
} finally {
  await closeDriver();
}
