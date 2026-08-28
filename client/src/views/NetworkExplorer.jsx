import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import NetworkGraph from '../components/NetworkGraph';

export default function NetworkExplorer() {
  const navigate = useNavigate();
  const [networkData, setNetworkData] = useState(null);
  const [filteredData, setFilteredData] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [nodeDetails, setNodeDetails] = useState(null);
  
  // Filters state
  const [showDevs, setShowDevs] = useState(true);
  const [showRepos, setShowRepos] = useState(true);
  const [showTechs, setShowTechs] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Connection explorer state inside drawer
  const [targetUser, setTargetUser] = useState('');
  const [connectionPath, setConnectionPath] = useState(null);
  const [connectionLoading, setConnectionLoading] = useState(false);
  const [connectionError, setConnectionError] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch full network on mount
  useEffect(() => {
    async function loadNetwork() {
      try {
        setLoading(true);
        setError(null);
        const data = await api.getNetwork({ developerLimit: 60, repositoryLimit: 30, technologyLimit: 30 });
        setNetworkData(data);
        setFilteredData(data);
      } catch (err) {
        setError(err.message || 'Failed to load network graph.');
      } finally {
        setLoading(false);
      }
    }
    loadNetwork();
  }, []);

  // Apply filters when settings or search queries change
  useEffect(() => {
    if (!networkData) return;

    // Filter nodes
    const filteredNodes = networkData.nodes.filter(node => {
      if (node.type === 'Developer' && !showDevs) return false;
      if (node.type === 'Repository' && !showRepos) return false;
      if (node.type === 'Technology' && !showTechs) return false;

      if (searchQuery) {
        const name = (node.properties.name || node.properties.username || '').toLowerCase();
        if (!name.includes(searchQuery.toLowerCase())) return false;
      }
      return true;
    });

    const nodeIds = new Set(filteredNodes.map(n => n.id));

    // Filter relationships to only keep connections between active nodes
    const filteredRels = networkData.relationships.filter(rel => {
      return nodeIds.has(rel.startNode) && nodeIds.has(rel.endNode);
    });

    setFilteredData({
      nodes: filteredNodes,
      relationships: filteredRels
    });
  }, [showDevs, showRepos, showTechs, searchQuery, networkData]);

  // Load detailed information when a node is selected
  const handleSelectNode = async (node) => {
    setSelectedNode(node);
    setNodeDetails(null);
    setConnectionPath(null);
    setTargetUser('');
    setConnectionError(null);

    try {
      if (node.type === 'Developer') {
        const username = node.properties.username;
        const [repos, techs, collabs] = await Promise.all([
          api.getDeveloperRepositories(username),
          api.getDeveloperTechnologies(username),
          api.getDeveloperCollaborators(username, 5)
        ]);
        setNodeDetails({
          repos,
          techs,
          collabs
        });
      } else if (node.type === 'Repository') {
        // Show tech list used by this repo from graph nodes
        const techUses = networkData.relationships
          .filter(r => r.startNode === node.id && r.type === 'USES_TECH')
          .map(r => {
            const techNode = networkData.nodes.find(n => n.id === r.endNode);
            return techNode ? techNode.properties.name : null;
          })
          .filter(Boolean);

        setNodeDetails({
          technologies: techUses
        });
      }
    } catch (err) {
      console.error('Error fetching node details:', err);
    }
  };

  // Run shortest path connections finder inside the drawer
  const handleFindConnection = async (e) => {
    e.preventDefault();
    if (!selectedNode || selectedNode.type !== 'Developer' || !targetUser) return;

    try {
      setConnectionLoading(true);
      setConnectionError(null);
      setConnectionPath(null);

      const path = await api.getConnections(selectedNode.properties.username, targetUser);
      setConnectionPath(path);
    } catch (err) {
      setConnectionError(err.message || 'No connection path found between these developers.');
    } finally {
      setConnectionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col h-full bg-background relative animate-pulse">
        <header className="h-16 px-margin-desktop w-full flex items-center justify-between border-b border-outline-variant bg-surface-level-1 shrink-0 z-10">
          <div className="h-6 bg-surface-variant rounded w-48" />
          <div className="h-8 bg-surface-variant rounded w-96" />
        </header>
        <div className="flex-grow bg-surface-dim" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-xl text-center space-y-md">
        <span className="material-symbols-outlined text-error text-5xl">cloud_off</span>
        <h3 className="font-headline-md text-xl text-white font-bold">Network Explorer Connection Error</h3>
        <p className="font-body-lg text-on-surface-variant max-w-[448px]">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex relative w-full h-full">
      {/* Sidebar Filter / Search inside Header of Main Area */}
      <div className="flex-1 flex flex-col h-full bg-background relative overflow-hidden">
        {/* Header toolbar */}
        <header className="h-16 px-margin-desktop w-full flex items-center justify-between border-b border-outline-variant bg-surface-level-1 shrink-0 z-10">
          <h2 className="font-headline-md text-headline-md font-bold text-on-surface hidden md:block">Network Explorer</h2>
          
          <div className="flex items-center gap-md flex-1 justify-end">
            {/* Search filter */}
            <div className="relative w-60 hidden lg:block group">
              <span className="material-symbols-outlined absolute left-2 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">search</span>
              <input 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search node..."
                className="w-full bg-background border border-outline-variant text-on-surface font-body-md py-1.5 pl-8 pr-3 rounded focus:outline-none focus:border-electric-cyan focus:ring-1 focus:ring-electric-cyan transition-shadow"
              />
            </div>

            {/* Filter buttons */}
            <div className="flex items-center gap-sm">
              <button 
                onClick={() => setShowDevs(!showDevs)}
                className={`flex items-center gap-xs px-3 py-1.5 border rounded font-label-md text-label-md transition-colors cursor-pointer ${showDevs ? 'bg-primary/10 border-primary text-primary' : 'bg-background border-outline-variant text-on-surface-variant'}`}
              >
                <span className={`w-2 h-2 rounded-full ${showDevs ? 'bg-electric-cyan' : 'bg-outline-variant'}`} />
                Developers
              </button>
              <button 
                onClick={() => setShowRepos(!showRepos)}
                className={`flex items-center gap-xs px-3 py-1.5 border rounded font-label-md text-label-md transition-colors cursor-pointer ${showRepos ? 'bg-primary/10 border-primary text-primary' : 'bg-background border-outline-variant text-on-surface-variant'}`}
              >
                <span className={`w-2 h-2 rounded-full ${showRepos ? 'bg-electric-cyan' : 'bg-outline-variant'}`} />
                Repositories
              </button>
              <button 
                onClick={() => setShowTechs(!showTechs)}
                className={`flex items-center gap-xs px-3 py-1.5 border rounded font-label-md text-label-md transition-colors cursor-pointer ${showTechs ? 'bg-primary/10 border-primary text-primary' : 'bg-background border-outline-variant text-on-surface-variant'}`}
              >
                <span className={`w-2 h-2 rounded-full ${showTechs ? 'bg-electric-cyan' : 'bg-outline-variant'}`} />
                Technologies
              </button>
            </div>
          </div>
        </header>

        {/* D3 Canvas container */}
        <div className="flex-grow w-full h-full relative" id="network-canvas">
          {filteredData && (
            <NetworkGraph 
              data={filteredData}
              selectedNode={selectedNode}
              onSelectNode={handleSelectNode}
            />
          )}
        </div>
      </div>

      {/* Right Side Drawer Detail Panel */}
      {selectedNode && (
        <aside className="w-80 bg-surface-level-1 border-l border-outline-variant h-full flex flex-col shadow-[-4px_0_12px_rgba(0,0,0,0.2)] z-20 shrink-0">
          {/* Drawer Header */}
          <div className="p-md border-b border-outline-variant flex justify-between items-start">
            <div className="flex items-center gap-sm">
              <div className="w-12 h-12 rounded-full bg-surface border-2 border-electric-cyan flex items-center justify-center shadow-[0_0_10px_rgba(0,218,243,0.2)] font-headline-md text-lg text-electric-cyan font-bold">
                {selectedNode.type === 'Developer' ? (
                  (selectedNode.properties.name || selectedNode.properties.username || 'D').slice(0, 2).toUpperCase()
                ) : selectedNode.type === 'Repository' ? (
                  <span className="material-symbols-outlined text-sm">folder</span>
                ) : (
                  <span className="material-symbols-outlined text-sm">terminal</span>
                )}
              </div>
              <div className="min-w-0">
                <h3 className="font-headline-md text-base font-semibold text-on-surface leading-tight truncate">
                  {selectedNode.properties.name || selectedNode.properties.username || selectedNode.properties.fullName}
                </h3>
                <span className="font-label-md text-[10px] text-on-surface-variant font-mono">
                  {selectedNode.type === 'Developer' ? `@${selectedNode.properties.username}` : selectedNode.type}
                </span>
              </div>
            </div>
            <button 
              onClick={() => setSelectedNode(null)}
              className="text-on-surface-variant hover:text-white transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          </div>

          {/* Drawer Scrollable Content */}
          <div className="flex-grow overflow-y-auto p-md flex flex-col gap-lg">
            
            {/* Conditional Rendering based on node type */}
            {selectedNode.type === 'Developer' ? (
              <>
                {/* Stats */}
                <div className="grid grid-cols-2 gap-sm">
                  <div className="bg-surface border border-outline-variant rounded p-sm flex flex-col items-center justify-center">
                    <span className="font-display-lg text-xl text-white font-bold">{nodeDetails?.repos?.length || 0}</span>
                    <span className="font-label-sm text-[9px] text-on-surface-variant uppercase mt-xs">Repositories</span>
                  </div>
                  <div className="bg-surface border border-[#30363D] rounded p-sm flex flex-col items-center justify-center">
                    <span className="font-display-lg text-xl text-white font-bold">{nodeDetails?.techs?.length || 0}</span>
                    <span className="font-label-sm text-[9px] text-on-surface-variant uppercase mt-xs">Technologies</span>
                  </div>
                </div>

                {/* Details Section */}
                <div>
                  <h4 className="font-label-md text-xs text-on-surface-variant uppercase mb-sm border-b border-[#30363D] pb-xs font-mono">Profile Info</h4>
                  <ul className="flex flex-col gap-xs font-body-md text-xs text-on-surface">
                    <li className="flex justify-between py-1">
                      <span className="text-on-surface-variant">Profile URL</span>
                      <a href={selectedNode.properties.profileUrl} target="_blank" rel="noreferrer" className="text-electric-cyan hover:underline truncate max-w-[120px]">GitHub Link</a>
                    </li>
                    {selectedNode.properties.bio && (
                      <li className="flex flex-col gap-xs py-1">
                        <span className="text-on-surface-variant">Bio</span>
                        <span className="text-secondary leading-relaxed bg-[#1C2128] p-xs rounded border border-[#30363D]">{selectedNode.properties.bio}</span>
                      </li>
                    )}
                  </ul>
                </div>

                {/* Connection Explorer Section */}
                <div>
                  <h4 className="font-label-md text-xs text-on-surface-variant uppercase mb-sm border-b border-[#30363D] pb-xs flex items-center gap-xs font-mono">
                    <span className="material-symbols-outlined text-sm">route</span>
                    Connection Explorer
                  </h4>
                  <form onSubmit={handleFindConnection} className="flex gap-2 mb-md">
                    <input 
                      type="text"
                      value={targetUser}
                      onChange={(e) => setTargetUser(e.target.value)}
                      placeholder="Username (e.g. bob_dev)"
                      className="flex-1 bg-[#0B0E14] border border-[#30363D] rounded text-xs px-2 py-1.5 focus:outline-none focus:border-electric-cyan"
                    />
                    <button 
                      type="submit" 
                      disabled={!targetUser}
                      className="bg-electric-cyan text-[#0B0E14] font-bold text-xs px-3 py-1.5 rounded disabled:opacity-50"
                    >
                      Find Path
                    </button>
                  </form>

                  {/* Render Path Results */}
                  {connectionLoading && <div className="text-xs text-on-surface-variant">Finding path...</div>}
                  {connectionError && <div className="text-xs text-error bg-error/10 border border-error/20 p-2 rounded">{connectionError}</div>}
                  {connectionPath && (
                    <div className="flex flex-col gap-md">
                      <p className="text-[11px] text-on-surface-variant bg-[#1C2128] p-sm rounded border border-[#30363D]">
                        Connected in {connectionPath.hops} {connectionPath.hops === 1 ? 'hop' : 'hops'}.
                      </p>
                      
                      {/* Connection steps */}
                      <div className="relative pl-4 border-l-2 border-dashed border-[#30363D] ml-sm flex flex-col gap-md text-xs">
                        {connectionPath.nodes.map((n, idx) => {
                          const rel = connectionPath.relationships[idx];
                          return (
                            <div key={idx} className="relative">
                              <div className="absolute -left-[23px] top-1 w-2.5 h-2.5 rounded-full bg-[#161B22] border-2 border-electric-cyan z-10" />
                              <div className="bg-[#1C2128] border border-[#30363D] rounded p-2">
                                <div className="font-semibold text-white truncate">{n.properties.username || n.properties.fullName || n.properties.name}</div>
                                <div className="text-[10px] text-on-surface-variant mt-0.5 capitalize">{n.type}</div>
                                {rel && (
                                  <div className="mt-1.5 pt-1.5 border-t border-[#30363D]/50 text-[10px] text-electric-cyan font-mono">
                                    → {rel.type} {rel.properties.role ? `(${rel.properties.role})` : ''}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : selectedNode.type === 'Repository' ? (
              <>
                {/* Stats */}
                <div className="bg-surface border border-outline-variant rounded p-md flex flex-col justify-center">
                  <span className="text-[10px] text-on-surface-variant uppercase tracking-wider font-mono">Repository Stars</span>
                  <span className="font-headline-md text-2xl text-white font-bold flex items-center gap-xs mt-xs">
                    <span className="material-symbols-outlined text-yellow-400" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    {(selectedNode.properties.stars || 0).toLocaleString()}
                  </span>
                </div>

                {/* Details Section */}
                <div>
                  <h4 className="font-label-md text-xs text-on-surface-variant uppercase mb-sm border-b border-[#30363D] pb-xs font-mono">Entity Details</h4>
                  <ul className="flex flex-col gap-xs font-body-md text-xs text-on-surface">
                    <li className="flex justify-between py-1">
                      <span className="text-on-surface-variant">Full Name</span>
                      <span className="truncate max-w-[150px] font-mono">{selectedNode.properties.fullName}</span>
                    </li>
                    <li className="flex justify-between py-1">
                      <span className="text-on-surface-variant">Owner</span>
                      <span>@{selectedNode.properties.owner}</span>
                    </li>
                    {selectedNode.properties.description && (
                      <li className="flex flex-col gap-xs py-1">
                        <span className="text-on-surface-variant">Description</span>
                        <span className="text-secondary leading-relaxed bg-[#1C2128] p-xs rounded border border-[#30363D]">{selectedNode.properties.description}</span>
                      </li>
                    )}
                  </ul>
                </div>

                {/* Techs used */}
                {nodeDetails?.technologies && (
                  <div>
                    <h4 className="font-label-md text-xs text-on-surface-variant uppercase mb-sm border-b border-[#30363D] pb-xs font-mono">Technologies Used</h4>
                    <div className="flex gap-1.5 flex-wrap">
                      {nodeDetails.technologies.map(t => (
                        <span key={t} className="px-2 py-0.5 rounded bg-[#1C2128] border border-[#30363D] text-[10px] text-white font-mono">{t}</span>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              // Technology Node Details
              <>
                <div className="bg-surface border border-outline-variant rounded p-md flex flex-col justify-center">
                  <span className="text-[10px] text-on-surface-variant uppercase tracking-wider font-mono">Category</span>
                  <span className="font-headline-md text-lg text-white font-bold mt-xs uppercase">{selectedNode.properties.category || 'Tech Ecosystem'}</span>
                </div>

                <div>
                  <h4 className="font-label-md text-xs text-on-surface-variant uppercase mb-sm border-b border-[#30363D] pb-xs font-mono">Entity Details</h4>
                  <ul className="flex flex-col gap-xs font-body-md text-xs text-on-surface">
                    <li className="flex justify-between py-1">
                      <span className="text-on-surface-variant">Technology Name</span>
                      <span className="font-bold text-electric-cyan">{selectedNode.properties.name}</span>
                    </li>
                  </ul>
                </div>
              </>
            )}
          </div>
          
          {/* Drawer footer link */}
          {selectedNode.type === 'Developer' && (
            <div className="p-md border-t border-[#30363D] bg-[#161B22]/50">
              <button 
                onClick={() => navigate(`/developers/${selectedNode.properties.username}`)}
                className="w-full bg-[#1C2128] text-white hover:bg-surface-variant border border-[#30363D] py-2 rounded text-xs transition-colors flex justify-center items-center gap-xs font-bold cursor-pointer"
              >
                <span>View Full Profile</span>
                <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
              </button>
            </div>
          )}
        </aside>
      )}
    </div>
  );
}
