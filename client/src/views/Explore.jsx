import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';

export default function Explore() {
  const navigate = useNavigate();
  const [techList, setTechList] = useState([]);
  const [tech1, setTech1] = useState('');
  const [tech2, setTech2] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchTriggered, setSearchTriggered] = useState(false);
  const [developers, setDevelopers] = useState([]);
  const [error, setError] = useState(null);

  // Load technologies on mount for selector dropdowns
  useEffect(() => {
    async function loadTechnologies() {
      try {
        const res = await api.getTechnologies({ limit: 100 });
        setTechList(res.technologies || []);
        
        // Auto-select first tech if available
        if (res.technologies && res.technologies.length > 0) {
          setTech1(res.technologies[0].name);
        }
      } catch (err) {
        console.error('Error loading technologies:', err);
      }
    }
    loadTechnologies();
  }, []);

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!tech1) return;

    try {
      setLoading(true);
      setError(null);
      setSearchTriggered(true);

      const params = { tech1 };
      if (tech2) params.tech2 = tech2;

      const res = await api.explore(params);
      setDevelopers(res.developers || []);
    } catch (err) {
      setError(err.message || 'Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-grow p-margin-mobile md:p-margin-desktop max-w-max-width mx-auto w-full pb-24 md:pb-12">
      {/* Header Section */}
      <div className="mb-10">
        <h1 className="font-display-lg text-display-lg text-white mb-2">Technology Intersection Search</h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant max-w-3xl">
          Find developers by technology experience. Discover contributors who have worked across multiple technology ecosystems.
        </p>
      </div>

      {/* Search Panel */}
      <form onSubmit={handleSearch} className="bg-[#161B22] rounded-xl p-lg border border-[#30363D] mb-12 shadow-[0_4px_24px_rgba(0,0,0,0.2)]">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter items-end">
          {/* Tech 1 Selector */}
          <div className="flex flex-col gap-2">
            <label className="font-label-md text-label-md text-on-surface-variant uppercase">Technology 1 (Required)</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">terminal</span>
              <select 
                value={tech1}
                onChange={(e) => setTech1(e.target.value)}
                className="w-full bg-[#0B0E14] border border-[#30363D] text-white rounded-DEFAULT py-3 pl-10 pr-4 focus:outline-none focus:border-electric-cyan focus:ring-1 focus:ring-electric-cyan transition-shadow appearance-none"
              >
                <option value="">Select Technology 1</option>
                {techList.map(t => (
                  <option key={t.name} value={t.name}>{t.name} ({t.category || 'Other'})</option>
                ))}
              </select>
            </div>
          </div>

          {/* Tech 2 Selector */}
          <div className="flex flex-col gap-2 relative">
            <div className="hidden md:flex absolute -left-8 top-1/2 -translate-y-1/2 w-8 justify-center z-10">
              <span className="material-symbols-outlined text-electric-cyan opacity-50">add</span>
            </div>
            <label className="font-label-md text-label-md text-on-surface-variant uppercase">Technology 2 (Optional)</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">database</span>
              <select 
                value={tech2}
                onChange={(e) => setTech2(e.target.value)}
                className="w-full bg-[#0B0E14] border border-[#30363D] text-white rounded-DEFAULT py-3 pl-10 pr-4 focus:outline-none focus:border-electric-cyan focus:ring-1 focus:ring-electric-cyan transition-shadow appearance-none"
              >
                <option value="">None (Single Tech Mode)</option>
                {techList
                  .filter(t => t.name !== tech1)
                  .map(t => (
                    <option key={t.name} value={t.name}>{t.name} ({t.category || 'Other'})</option>
                  ))
                }
              </select>
            </div>
          </div>
        </div>

        <div className="mt-lg flex justify-end">
          <button 
            type="submit"
            disabled={!tech1}
            className="bg-electric-cyan text-[#0B0E14] font-bold rounded-DEFAULT py-3 px-8 flex items-center gap-2 hover:opacity-90 disabled:opacity-50 transition-opacity cursor-pointer"
          >
            <span className="material-symbols-outlined">search</span>
            Find Developers
          </button>
        </div>
      </form>

      {/* Results Section */}
      {searchTriggered && (
        <>
          <div className="mb-6 flex items-center justify-between border-b border-outline-variant pb-4">
            <h2 className="font-headline-md text-headline-md text-on-surface">
              {loading ? (
                <span>Searching...</span>
              ) : (
                <span>
                  {developers.length} {developers.length === 1 ? 'developer' : 'developers'} found for {tech1} {tech2 && `+ ${tech2}`}
                </span>
              )}
            </h2>
          </div>

          {error && (
            <div className="p-md bg-error/10 border border-error/20 rounded-lg text-error mb-6">
              {error}
            </div>
          )}

          {loading ? (
            // Skeleton Loader for results
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-gutter animate-pulse">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-[#161B22] border border-[#30363D] rounded-lg p-6 h-48" />
              ))}
            </div>
          ) : (
            <>
              {developers.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-xl border border-dashed border-[#30363D] rounded-lg text-center">
                  <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-md">person_search</span>
                  <h3 className="font-headline-md text-lg text-white font-semibold mb-xs">No matching developers</h3>
                  <p className="font-body-md text-on-surface-variant max-w-[448px]">
                    No developers in our graph currently have contributions using {tech1} {tech2 && `and ${tech2}`}. Try adjusting the technology filters.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-gutter">
                  {developers.map((dev) => (
                    <div 
                      key={dev.username}
                      onClick={() => navigate(`/developers/${dev.username}`)}
                      className="bg-[#161B22] border border-[#30363D] rounded-lg p-md flex flex-col gap-4 hover:border-electric-cyan transition-colors cursor-pointer group"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                          <img 
                            alt={dev.name} 
                            className="w-12 h-12 rounded-full border border-outline-variant object-cover" 
                            src={dev.avatar || 'https://lh3.googleusercontent.com/aida-public/AB6AXuCbrjo3jdCnLk_QbpKcnOJ-RhA5MKXkZ9UZphjYypwGQG_G_SS5oCwo0urruz_f2KHUQJ_3OUHKUpBuVZIyykPqwjOnxMMpI7dqzOdb8O8oPiZvZVwVZaEUmzQG9NEtuVutV8Pa6sbllQIwne5dhHqWXAnz5JieIHjYdljg4Hg_xBFSuVJKaAP8dZHLYO8VUygwEehropx-cZVEFTv7d6yzFLgPMmxvDya7seovc0CGSmzVopazrOWJ'} 
                          />
                          <div>
                            <h3 className="font-body-lg text-body-lg font-bold text-white group-hover:text-electric-cyan transition-colors">{dev.name || dev.username}</h3>
                            <div className="font-label-sm text-label-sm text-on-surface-variant uppercase">@{dev.username}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 bg-[#1C2128] px-2 py-1 rounded border border-[#30363D]">
                          <div className="w-1.5 h-1.5 rounded-full bg-electric-cyan"></div>
                          <span className="font-label-sm text-label-sm text-white">Active</span>
                        </div>
                      </div>

                      {/* Technology skill labels */}
                      <div className="grid grid-cols-2 gap-4 mt-2">
                        <div>
                          <div className="flex justify-between font-label-sm text-label-sm mb-1 text-on-surface-variant">
                            <span>{tech1}</span>
                            <span>Contributor</span>
                          </div>
                          <div className="h-1.5 w-full bg-surface-variant rounded-full overflow-hidden">
                            <div className="h-full bg-electric-cyan w-4/5 rounded-full"></div>
                          </div>
                        </div>
                        {tech2 && (
                          <div>
                            <div className="flex justify-between font-label-sm text-label-sm mb-1 text-on-surface-variant">
                              <span>{tech2}</span>
                              <span>Contributor</span>
                            </div>
                            <div className="h-1.5 w-full bg-surface-variant rounded-full overflow-hidden">
                              <div className="h-full bg-electric-cyan/70 w-3/5 rounded-full"></div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Evidence Section */}
                      <div className="mt-2 pt-4 border-t border-[#30363D] border-dashed">
                        <div className="font-label-sm text-label-sm text-on-surface-variant uppercase mb-2">Intersection Evidence</div>
                        {tech2 ? (
                          <div className="font-body-md text-body-md text-secondary leading-relaxed">
                            Contributed to <span className="text-white font-medium">{(dev.firstTechRepositories || []).join(', ') || 'shared ecosystem'}</span> using {tech1}.
                            <br />
                            Contributed to <span className="text-white font-medium">{(dev.secondTechRepositories || []).join(', ') || 'shared ecosystem'}</span> using {tech2}.
                          </div>
                        ) : (
                          <div className="font-body-md text-body-md text-secondary leading-relaxed">
                            Contributed to <span className="text-white font-medium">{(dev.repositories || []).join(', ')}</span> using {tech1}.
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
