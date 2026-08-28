import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';

export default function Technologies() {
  const navigate = useNavigate();
  const [technologies, setTechnologies] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchTechnologiesList() {
      try {
        setLoading(true);
        setError(null);

        const params = {
          limit: 100
        };

        if (searchQuery) {
          params.search = searchQuery;
        }
        if (categoryFilter) {
          params.category = categoryFilter;
        }

        const res = await api.getTechnologies(params);
        setTechnologies(res.technologies || []);
      } catch (err) {
        setError(err.message || 'Failed to load technologies.');
      } finally {
        setLoading(false);
      }
    }

    fetchTechnologiesList();
  }, [searchQuery, categoryFilter]);

  // Extract unique categories for dropdown
  const categories = ['Frontend', 'Backend', 'Database', 'DevOps', 'Infrastructure', 'Language', 'API'];

  return (
    <div className="flex-grow p-margin-mobile md:p-margin-desktop max-w-max-width mx-auto w-full pb-24 md:pb-12">
      {/* Header Section */}
      <div className="mb-10">
        <h1 className="font-display-lg text-display-lg text-white mb-2">Technologies Ecosystem</h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant max-w-3xl">
          Browse specialized technologies mapped inside the DevGraph developer network. Compare active repository and contributor counts.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#161B22] border border-[#30363D] rounded-lg p-md mb-8 flex flex-col md:flex-row gap-4 items-center justify-between shadow-[0_4px_12px_rgba(0,0,0,0.15)]">
        {/* Search Input */}
        <div className="relative w-full md:w-80 group">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-electric-cyan transition-colors">search</span>
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by technology name..."
            className="w-full bg-[#0B0E14] border border-[#30363D] rounded py-2 pl-10 pr-4 text-white placeholder-outline-variant focus:outline-none focus:border-electric-cyan focus:ring-1 focus:ring-electric-cyan transition-all"
          />
        </div>

        {/* Category Dropdown */}
        <div className="relative w-full md:w-64">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">category</span>
          <select 
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full bg-[#0B0E14] border border-[#30363D] text-white rounded py-2 pl-10 pr-4 focus:outline-none focus:border-electric-cyan focus:ring-1 focus:ring-electric-cyan transition-shadow appearance-none"
          >
            <option value="">All Categories</option>
            {categories.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Error View */}
      {error && (
        <div className="p-md bg-error/10 border border-error/20 rounded-lg text-error mb-8">
          {error}
        </div>
      )}

      {/* Grid List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-pulse">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-[#161B22] border border-[#30363D] rounded-lg p-5 h-44" />
          ))}
        </div>
      ) : (
        <>
          {technologies.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-xl border border-dashed border-[#30363D] rounded-lg text-center">
              <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-md">terminal</span>
              <h3 className="font-headline-md text-lg text-white font-semibold mb-xs">No technologies found</h3>
              <p className="font-body-md text-on-surface-variant max-w-[448px]">
                Try clearing the search query or adjusting the category filter.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {technologies.map((tech) => (
                <div 
                  key={tech.name}
                  onClick={() => navigate(`/technologies/${encodeURIComponent(tech.name)}`)}
                  className="bg-[#161B22] border border-[#30363D] rounded-lg p-5 flex flex-col justify-between hover:border-electric-cyan hover:shadow-lg transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded bg-surface-variant flex items-center justify-center text-electric-cyan border border-[#30363D] group-hover:border-primary/50 shrink-0">
                      <span className="material-symbols-outlined">code</span>
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-body-lg font-semibold text-white truncate group-hover:text-electric-cyan transition-colors">{tech.name}</h4>
                      <p className="font-label-sm text-outline-variant text-[10px] uppercase">{tech.category || 'Tech'}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-6 pt-4 border-t border-[#30363D]">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-outline-variant uppercase">Developers</span>
                      <span className="font-label-md text-white font-bold">{tech.developerCount || 0}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] text-outline-variant uppercase">Repositories</span>
                      <span className="font-label-md text-white font-bold">{tech.repositoryCount || 0}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
