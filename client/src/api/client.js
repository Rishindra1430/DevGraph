import axios from 'axios';

// Use a relative path so requests go through the Vite dev proxy (→ port 5000).
// In production, set VITE_API_URL to the absolute backend URL.
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Centralized error helper
const handleApiError = (error) => {
  console.error('API Request failed:', error);
  const message = error.response?.data?.error || error.response?.data?.message || 'Unable to connect to DevGraph. Please try again.';
  throw new Error(message);
};

export const api = {
  // Health
  getHealth: async () => {
    try {
      const response = await apiClient.get('/health');
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  // Developers
  getDevelopers: async (params = {}) => {
    try {
      const response = await apiClient.get('/developers', { params });
      return response.data; // { developers, count, limit, skip }
    } catch (error) {
      return handleApiError(error);
    }
  },

  getDeveloper: async (username) => {
    try {
      const response = await apiClient.get(`/developers/${username}`);
      return response.data.developer;
    } catch (error) {
      return handleApiError(error);
    }
  },

  getDeveloperRepositories: async (username) => {
    try {
      const response = await apiClient.get(`/developers/${username}/repositories`);
      return response.data.repositories;
    } catch (error) {
      return handleApiError(error);
    }
  },

  getDeveloperTechnologies: async (username) => {
    try {
      const response = await apiClient.get(`/developers/${username}/technologies`);
      return response.data.technologies;
    } catch (error) {
      return handleApiError(error);
    }
  },

  getDeveloperCollaborators: async (username, limit = 10) => {
    try {
      const response = await apiClient.get(`/developers/${username}/collaborators`, { params: { limit } });
      return response.data.collaborators;
    } catch (error) {
      return handleApiError(error);
    }
  },

  getDeveloperEvidence: async (username, tech1, tech2) => {
    try {
      const response = await apiClient.get(`/developers/${username}/evidence`, { params: { tech1, tech2 } });
      return response.data.evidence;
    } catch (error) {
      return handleApiError(error);
    }
  },

  // Technologies
  getTechnologies: async (params = {}) => {
    try {
      const response = await apiClient.get('/technologies', { params });
      return response.data; // { technologies, count, limit, skip }
    } catch (error) {
      return handleApiError(error);
    }
  },

  getTechnology: async (name) => {
    try {
      const response = await apiClient.get(`/technologies/${name}`);
      return response.data.technology;
    } catch (error) {
      return handleApiError(error);
    }
  },

  getTechnologyDevelopers: async (name, limit = 50) => {
    try {
      const response = await apiClient.get(`/technologies/${name}/developers`, { params: { limit } });
      return response.data.developers;
    } catch (error) {
      return handleApiError(error);
    }
  },

  getTechnologyRepositories: async (name, limit = 50) => {
    try {
      const response = await apiClient.get(`/technologies/${name}/repositories`, { params: { limit } });
      return response.data.repositories;
    } catch (error) {
      return handleApiError(error);
    }
  },

  getRelatedTechnologies: async (name, limit = 10) => {
    try {
      const response = await apiClient.get(`/technologies/${name}/related`, { params: { limit } });
      return response.data.related;
    } catch (error) {
      return handleApiError(error);
    }
  },

  // Explore
  explore: async (params = {}) => {
    try {
      const response = await apiClient.get('/explore', { params });
      return response.data; // { developers, count, query }
    } catch (error) {
      return handleApiError(error);
    }
  },

  exploreRepositories: async (params = {}) => {
    try {
      const response = await apiClient.get('/explore/repositories', { params });
      return response.data.repositories;
    } catch (error) {
      return handleApiError(error);
    }
  },

  // Network
  getNetwork: async (params = {}) => {
    try {
      const response = await apiClient.get('/network', { params });
      return response.data; // { nodes, relationships, counts }
    } catch (error) {
      return handleApiError(error);
    }
  },

  getDeveloperNetwork: async (username, depth = 2) => {
    try {
      const response = await apiClient.get(`/network/developer/${username}`, { params: { depth } });
      return response.data; // { nodes, relationships, counts }
    } catch (error) {
      return handleApiError(error);
    }
  },

  getNetworkCollaborators: async (username, limit = 20) => {
    try {
      const response = await apiClient.get(`/network/collaborators/${username}`, { params: { limit } });
      return response.data.collaborators;
    } catch (error) {
      return handleApiError(error);
    }
  },

  // Connections
  getConnections: async (from, to, maxDepth = 6) => {
    try {
      const response = await apiClient.get('/connections', { params: { from, to, maxDepth } });
      return response.data.path; // returns { nodes, relationships, hops }
    } catch (error) {
      return handleApiError(error);
    }
  },
  // Repositories
  getRepositories: async (params = {}) => {
    try {
      const response = await apiClient.get('/repositories', { params });
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
};
