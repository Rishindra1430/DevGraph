import { getSession, closeDriver } from './src/db/neo4j.js';

console.log('Fetching Developer usernames from database...');
const session = getSession();
try {
  const result = await session.run('MATCH (d:Developer) RETURN d.username AS username LIMIT 50');
  console.log(result.records.map(r => r.get('username')));
} catch (e) {
  console.error(e);
} finally {
  await session.close();
  await closeDriver();
}
