import axios from 'axios';
import { env } from '../config/env.js';

const GITHUB_API_URL = 'https://api.github.com';

const axiosInstance = axios.create({
  baseURL: GITHUB_API_URL,
  timeout: 10000,
  headers: {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    ...(env.githubToken
      ? { Authorization: `Bearer ${env.githubToken}` }
      : {})
  }
});

// Prevent duplicate requests during a single seed run.
const cache = new Map();

/**
 * Perform a GET request to the GitHub API.
 *
 * Includes:
 * - request caching
 * - authentication when GITHUB_TOKEN exists
 * - rate-limit reporting
 * - retry handling for temporary server errors
 */
export async function getGithubData(url, params = {}, retries = 3) {
  const cacheKey = `${url}?${JSON.stringify(params)}`;

  if (cache.has(cacheKey)) {
    return cache.get(cacheKey);
  }

  try {
    const response = await axiosInstance.get(url, { params });

    const remaining = response.headers['x-ratelimit-remaining'];
    const limit = response.headers['x-ratelimit-limit'];
    const resetTime = response.headers['x-ratelimit-reset'];

    if (remaining !== undefined) {
      console.log(
        `GitHub API Rate Limit: ${remaining}/${limit} remaining.`
      );
    }

    cache.set(cacheKey, response.data);

    return response.data;
  } catch (error) {
    const status = error.response?.status;
    const headers = error.response?.headers || {};

    // GitHub rate limit reached
    if (status === 403 && headers['x-ratelimit-remaining'] === '0') {
      const resetTime = headers['x-ratelimit-reset'];

      const waitSeconds = resetTime
        ? Math.max(
          0,
          Math.ceil(
            (Number(resetTime) * 1000 - Date.now()) / 1000
          )
        )
        : 60;

      throw new Error(
        `GITHUB_RATE_LIMIT_EXHAUSTED: GitHub API rate limit reached. ` +
        `Try again in approximately ${waitSeconds} seconds.`
      );
    }

    // Retry temporary GitHub server errors
    if (retries > 0 && status >= 500) {
      console.warn(
        `Temporary GitHub error (${status}). Retrying ${url}... ` +
        `(${retries} retries remaining)`
      );

      await new Promise(resolve => setTimeout(resolve, 2000));

      return getGithubData(url, params, retries - 1);
    }

    throw error;
  }
}