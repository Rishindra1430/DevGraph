import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';

export default function ConnectionExplorer() {
  const navigate = useNavigate();
  const [developers, setDevelopers] = useState([]);
  const [fromUser, setFromUser] = useState('');
  const [toUser, setToUser] = useState('');
  const [path, setPath] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState(null);

  // Fetch developers to populate select inputs
  useEffect(() => {
    async function loadDevelopers() {
      try {
        const res = await api.getDevelopers({ limit: 100 });
        setDevelopers(res.developers || []);
      } catch (err) {
        console.error('Failed to load developers:', err);
      }
    }
    loadDevelopers();
  }, []);

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!fromUser || !toUser) return;

    if (fromUser === toUser) {
      setError('Source and target developers must be different.');
      setPath(null);
      setSearched(true);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSearched(true);
      const res = await api.getConnections(fromUser, toUser);
      setPath(res);
    } catch (err) {
      setPath(null);
      setError(err.message || 'No connection found between these developers.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-grow p-margin-mobile md:p-margin-desktop max-w-max-width mx-auto w-full pb-24 md:pb-12 space-y-lg">
      {/* Header Section */}
      <div className="mb-10">
        <h1 className="font-display-lg text-display-lg text-white mb-2">Developer Connection Explorer</h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant max-w-3xl">
          Discover the shortest collaboration pathway between two developers in the network. Traverses repositories and technology nodes.
        </p>
      </div>

      {/* Select panel */}
      <form onSubmit={handleSearch} className="bg-[#161B22] rounded-xl p-lg border border-[#30363D] shadow-[0_4px_24px_rgba(0,0,0,0.2)]">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter items-end">
          {/* From User */}
          <div className="flex flex-col gap-2">
            <label className="font-label-md text-label-md text-on-surface-variant uppercase">From Developer</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">person</span>
              <select 
                value={fromUser}
                onChange={(e) => setFromUser(e.target.value)}
                className="w-full bg-[#0B0E14] border border-[#30363D] text-white rounded-DEFAULT py-3 pl-10 pr-4 focus:outline-none focus:border-electric-cyan focus:ring-1 focus:ring-electric-cyan transition-shadow appearance-none"
              >
                <option value="">Select Source Developer</option>
                {developers.map(d => (
                  <option key={d.username} value={d.username}>{d.name || d.username} (@{d.username})</option>
                ))}
              </select>
            </div>
          </div>

          {/* To User */}
          <div className="flex flex-col gap-2 relative">
            <div className="hidden md:flex absolute -left-8 top-1/2 -translate-y-1/2 w-8 justify-center z-10">
              <span className="material-symbols-outlined text-electric-cyan opacity-50">arrow_forward</span>
            </div>
            <label className="font-label-md text-label-md text-on-surface-variant uppercase">To Developer</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">person</span>
              <select 
                value={toUser}
                onChange={(e) => setToUser(e.target.value)}
                className="w-full bg-[#0B0E14] border border-[#30363D] text-white rounded-DEFAULT py-3 pl-10 pr-4 focus:outline-none focus:border-electric-cyan focus:ring-1 focus:ring-electric-cyan transition-shadow appearance-none"
              >
                <option value="">Select Target Developer</option>
                {developers.map(d => (
                  <option key={d.username} value={d.username}>{d.name || d.username} (@{d.username})</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="mt-lg flex justify-end">
          <button 
            type="submit"
            disabled={!fromUser || !toUser}
            className="bg-electric-cyan text-[#0B0E14] font-bold rounded-DEFAULT py-3 px-8 flex items-center gap-2 hover:opacity-90 disabled:opacity-50 transition-opacity cursor-pointer"
          >
            <span className="material-symbols-outlined">route</span>
            Calculate Connection
          </button>
        </div>
      </form>

      {/* Results View */}
      {searched && (
        <>
          <div className="mb-6 border-b border-[#30363D] pb-4">
            <h2 className="font-headline-md text-headline-md text-on-surface">
              {loading ? 'Analyzing Graph Paths...' : 'Connection Discovery Analysis'}
            </h2>
          </div>

          {error && (
            <div className="p-xl border border-dashed border-[#30363D] rounded-lg text-center flex flex-col items-center justify-center">
              <span className="material-symbols-outlined text-error text-4xl mb-sm">route</span>
              <h3 className="font-headline-md text-lg text-white font-semibold mb-xs">Path Disconnected</h3>
              <p className="font-body-md text-on-surface-variant max-w-[448px]">{error}</p>
            </div>
          )}

          {loading ? (
            <div className="bg-[#161B22] border border-[#30363D] rounded-lg p-lg space-y-4 animate-pulse">
              <div className="h-6 bg-surface-variant rounded w-1/4" />
              <div className="h-24 bg-surface-variant rounded" />
            </div>
          ) : (
            path && (
              <div className="bg-[#161B22] border border-[#30363D] rounded-lg p-lg shadow-lg">
                <div className="flex items-center gap-3 border-b border-[#30363D] pb-4 mb-6">
                  <div className="w-8 h-8 rounded-full bg-electric-cyan/10 border border-electric-cyan flex items-center justify-center text-electric-cyan">
                    <span className="material-symbols-outlined text-sm">hub</span>
                  </div>
                  <div>
                    <h3 className="font-body-lg text-white font-semibold">Shortest Connection Path Found</h3>
                    <p className="text-xs text-on-surface-variant font-mono">Requires {path.hops} {path.hops === 1 ? 'hop' : 'hops'} between developer nodes</p>
                  </div>
                </div>

                {/* Path visualizer */}
                <div className="relative pl-8 border-l-2 border-dashed border-[#30363D] ml-sm flex flex-col gap-6 max-w-2xl mx-auto my-6">
                  {path.nodes.map((node, index) => {
                    const rel = path.relationships[index];
                    return (
                      <div key={index} className="relative">
                        {/* Dot indicator */}
                        <div className="absolute -left-[37px] top-1.5 w-3 h-3 rounded-full bg-[#161B22] border-2 border-electric-cyan z-10" />

                        {/* Node Card */}
                        <div className="bg-[#1C2128] border border-[#30363D] rounded-lg p-md flex items-center justify-between hover:border-electric-cyan transition-colors">
                          <div className="flex items-center gap-4">
                            {/* Avatar or Type Indicator */}
                            <div className="w-12 h-12 rounded bg-surface border border-[#30363D] flex items-center justify-center text-electric-cyan shrink-0">
                              {node.type === 'Developer' ? (
                                <img 
                                  className="w-full h-full rounded object-cover" 
                                  src={node.properties.avatar || 'https://lh3.googleusercontent.com/aida-public/AB6AXuCbrjo3jdCnLk_QbpKcnOJ-RhA5MKXkZ9UZphjYypwGQG_G_SS5oCwo0urruz_f2KHUQJ_3OUHKUpBuVZIyykPqwjOnxMMpI7dqzOdb8O8oPiZvZVwVZaEUmzQG9NEtuVutV8Pa6sbllQIwne5dhHqWXAnz5JieIHjYdljg4Hg_xBFSuVJKaAP8dZHLYO8VUygwEehropx-cZVEFTv7d6yzFLgPMmxvDya7seovc0CGSmzVopazrOWJ'} 
                                  alt={node.properties.username} 
                                />
                              ) : node.type === 'Repository' ? (
                                <span className="material-symbols-outlined">folder</span>
                              ) : (
                                <span className="material-symbols-outlined">terminal</span>
                              )}
                            </div>
                            <div>
                              <h4 className="font-body-lg font-semibold text-white truncate max-w-[200px] md:max-w-[448px]">
                                {node.properties.name || node.properties.username || node.properties.fullName}
                              </h4>
                              <p className="font-label-sm text-[10px] text-on-surface-variant uppercase tracking-wider">{node.type}</p>
                            </div>
                          </div>

                          {/* Profile redirect for developer nodes */}
                          {node.type === 'Developer' && (
                            <button 
                              onClick={() => navigate(`/developers/${node.properties.username}`)}
                              className="text-[10px] font-mono text-electric-cyan border border-[#30363D] px-2 py-1 rounded hover:bg-[#161B22] transition-colors"
                            >
                              Profile
                            </button>
                          )}
                        </div>

                        {/* Relationship connector display */}
                        {rel && (
                          <div className="my-2 py-1 pl-4 flex items-center gap-xs font-mono text-[10px] text-electric-cyan bg-[#161B22]/50 border border-[#30363D]/40 rounded w-fit">
                            <span className="material-symbols-outlined text-[12px]">commit</span>
                            <span>{rel.type}</span>
                            {rel.properties.role && <span className="text-on-surface-variant font-sans">({rel.properties.role})</span>}
                            {rel.properties.commits && <span className="text-on-surface-variant font-sans">| {rel.properties.commits} commits</span>}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )
          )}
        </>
      )}
    </div>
  );
}
