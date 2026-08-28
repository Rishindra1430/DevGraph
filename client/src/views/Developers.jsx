import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';

export default function Developers() {
  const navigate = useNavigate();
  const [developers, setDevelopers] = useState([]);
  const [techList, setTechList] = useState([]);
  const [selectedTech, setSelectedTech] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Pagination
  const [limit] = useState(12);
  const [skip, setSkip] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  // Load technology list for dropdown filter
  useEffect(() => {
    async function loadTechList() {
      try {
        const res = await api.getTechnologies({ limit: 100 });
        setTechList(res.technologies || []);
      } catch (err) {
        console.error('Failed to load technology list:', err);
      }
    }
    loadTechList();
  }, []);

  // Fetch developers list based on search/tech/skip
  useEffect(() => {
    async function fetchDevelopersList() {
      try {
        setLoading(true);
        setError(null);
        
        const params = {
          limit,
          skip
        };

        if (selectedTech) {
          params.tech = selectedTech;
        }

        if (searchQuery) {
          params.search = searchQuery;
        }

        const res = await api.getDevelopers(params);
        setDevelopers(res.developers || []);
        setTotalCount(res.count || 0);
      } catch (err) {
        setError(err.message || 'Failed to fetch developers.');
      } finally {
        setLoading(false);
      }
    }

    fetchDevelopersList();
  }, [selectedTech, searchQuery, skip, limit]);

  return (
    <div className="flex-grow p-margin-mobile md:p-margin-desktop max-w-max-width mx-auto w-full pb-24 md:pb-12">
      {/* Header Section */}
      <div className="mb-10">
        <h1 className="font-display-lg text-display-lg text-white mb-2">Developers Directory</h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant max-w-3xl">
          Browse and search contributors inside the DevGraph network. View their repository metrics and technology focus.
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
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setSkip(0); // reset page
            }}
            placeholder="Search by username or name..."
            className="w-full bg-[#0B0E14] border border-[#30363D] rounded py-2 pl-10 pr-4 text-white placeholder-outline-variant focus:outline-none focus:border-electric-cyan focus:ring-1 focus:ring-electric-cyan transition-all"
          />
        </div>

        {/* Tech Filter Dropdown */}
        <div className="relative w-full md:w-64">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">terminal</span>
          <select 
            value={selectedTech}
            onChange={(e) => {
              setSelectedTech(e.target.value);
              setSkip(0); // reset page
            }}
            className="w-full bg-[#0B0E14] border border-[#30363D] text-white rounded py-2 pl-10 pr-4 focus:outline-none focus:border-electric-cyan focus:ring-1 focus:ring-electric-cyan transition-shadow appearance-none"
          >
            <option value="">All Technologies</option>
            {techList.map(t => (
              <option key={t.name} value={t.name}>{t.name}</option>
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
            <div key={i} className="bg-[#161B22] border border-[#30363D] rounded-lg p-5 h-56" />
          ))}
        </div>
      ) : (
        <>
          {developers.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-xl border border-dashed border-[#30363D] rounded-lg text-center">
              <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-md">groups</span>
              <h3 className="font-headline-md text-lg text-white font-semibold mb-xs">No developers found</h3>
              <p className="font-body-md text-on-surface-variant max-w-[448px]">
                Try clearing the search query or adjusting the technology filter.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {developers.map((dev) => (
                <div 
                  key={dev.username}
                  onClick={() => navigate(`/developers/${dev.username}`)}
                  className="bg-[#161B22] border border-[#30363D] rounded-lg p-5 flex flex-col justify-between hover:border-electric-cyan hover:shadow-lg transition-all cursor-pointer group"
                >
                  <div className="flex items-start gap-4">
                    <img 
                      className="w-12 h-12 rounded-full border border-outline-variant object-cover group-hover:border-electric-cyan transition-colors"
                      src={dev.avatar || 'https://lh3.googleusercontent.com/aida-public/AB6AXuCbrjo3jdCnLk_QbpKcnOJ-RhA5MKXkZ9UZphjYypwGQG_G_SS5oCwo0urruz_f2KHUQJ_3OUHKUpBuVZIyykPqwjOnxMMpI7dqzOdb8O8oPiZvZVwVZaEUmzQG9NEtuVutV8Pa6sbllQIwne5dhHqWXAnz5JieIHjYdljg4Hg_xBFSuVJKaAP8dZHLYO8VUygwEehropx-cZVEFTv7d6yzFLgPMmxvDya7seovc0CGSmzVopazrOWJ'} 
                      alt={dev.name} 
                    />
                    <div className="min-w-0">
                      <h4 className="font-body-lg font-semibold text-white truncate group-hover:text-electric-cyan transition-colors">{dev.name || dev.username}</h4>
                      <p className="font-label-sm text-outline-variant">@{dev.username}</p>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-[#30363D] flex items-center justify-between text-xs text-on-surface-variant">
                    <div className="flex flex-col">
                      <span className="uppercase text-[9px] tracking-wider text-outline">Repos</span>
                      <span className="font-label-md text-white font-bold text-sm">{dev.repoCount || 0}</span>
                    </div>
                    <div className="flex items-center gap-1 text-electric-cyan font-mono text-[10px] bg-[#1C2128] border border-[#30363D] px-2 py-0.5 rounded">
                      <span>View Profile</span>
                      <span className="material-symbols-outlined text-[10px]">arrow_forward</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Simple Pagination */}
          {developers.length > 0 && (
            <div className="mt-12 flex items-center justify-between border-t border-[#30363D] pt-6">
              <span className="text-sm text-on-surface-variant">
                Showing {skip + 1} - {Math.min(skip + developers.length, totalCount)} of {totalCount} developers
              </span>
              <div className="flex gap-2">
                <button 
                  disabled={skip === 0}
                  onClick={() => setSkip(prev => Math.max(prev - limit, 0))}
                  className="px-4 py-2 border border-[#30363D] text-white hover:bg-[#1C2128] rounded font-label-md text-label-md disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
                >
                  Previous
                </button>
                <button 
                  disabled={skip + developers.length >= totalCount}
                  onClick={() => setSkip(prev => prev + limit)}
                  className="px-4 py-2 border border-[#30363D] text-white hover:bg-[#1C2128] rounded font-label-md text-label-md disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
