import neo4j from 'neo4j-driver';
import { env } from '../config/env.js';

let driver;

export function getDriver() {
  if (!driver) {
    driver = neo4j.driver(
      env.neo4jUri,
      neo4j.auth.basic(env.neo4jUsername, env.neo4jPassword),
      {
        disableLosslessIntegers: true // Converts Neo4j integers directly to JS numbers
      }
    );
  }
  return driver;
}

export async function verifyConnection() {
  const d = getDriver();
  let session;
  try {
    session = d.session({ database: env.neo4jDatabase });
    // Run a simple query to verify connectivity
    await session.run('RETURN 1 AS val');
    return true;
  } catch (error) {
    console.error('Failed to verify connection to CognoDB:', error.message);
    throw error;
  } finally {
    if (session) {
      await session.close();
    }
  }
}

export async function closeDriver() {
  if (driver) {
    await driver.close();
    driver = null;
    console.log('CognoDB driver connection closed gracefully.');
  }
}

export function getSession() {
  return getDriver().session({ database: env.neo4jDatabase });
}
