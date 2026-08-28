import React, { useState, useEffect, useRef } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import devgraphLogo from '../assets/devgraph_logo_symbol_clean.png';

// ── Navigation items ──────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { to: '/', label: 'Overview', icon: 'dashboard' },
  { to: '/explore', label: 'Explore', icon: 'explore' },
  { to: '/developers', label: 'Developers', icon: 'groups' },
  { to: '/technologies', label: 'Technologies', icon: 'terminal' },
  { to: '/network', label: 'Network', icon: 'hub' },
  { to: '/connections', label: 'Connections', icon: 'route' },
];

// Class helper — matches the existing Stitch active / inactive styles exactly
function navClass({ isActive }) {
  return isActive
    ? 'bg-[#1C2128] text-electric-cyan rounded-lg px-4 py-2 flex items-center gap-3 border border-[#30363D]/30 shadow-[0_4px_12px_rgba(0,0,0,0.1)] transition-all'
    : 'text-on-surface-variant hover:bg-[#1C2128] hover:text-on-surface transition-all rounded-lg px-4 py-2 flex items-center gap-3 group cursor-pointer';
}

export default function AppLayout() {
  const navigate = useNavigate();

  // ── States
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [globalSearchResults, setGlobalSearchResults] = useState([]);
  const [globalSearchLoading, setGlobalSearchLoading] = useState(false);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Dropdown states for inline desktop search
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);

  // Refs for focusing & click-outside
  const searchContainerRef = useRef(null);
  const desktopInputRef = useRef(null);
  const modalInputRef = useRef(null);

  // ── Global search debounce ───────────────────────────────────────────────────
  useEffect(() => {
    if (!globalSearchQuery.trim()) {
      setGlobalSearchResults([]);
      setGlobalSearchLoading(false);
      return;
    }

    const query = globalSearchQuery.trim();

    const timer = setTimeout(async () => {
      try {
        setGlobalSearchLoading(true);

        const [devRes, techRes, repoRes] = await Promise.all([
          api.getDevelopers({
            search: query,
            limit: 5,
          }),

          api.getTechnologies({
            search: query,
            limit: 5,
          }),

          api.getRepositories({
            search: query,
            limit: 5,
          }),
        ]);

        const devs = (devRes?.developers || []).map((d) => ({
          type: 'developer',
          id: d.username,
          name: d.name || d.username,
          subtitle: `@${d.username}`,
          avatar: d.avatar,
          route: `/developers/${encodeURIComponent(d.username)}`,
        }));

        const techs = (techRes?.technologies || []).map((t) => ({
          type: 'technology',
          id: t.name,
          name: t.name,
          subtitle: t.category || 'Technology',
          avatar: null,
          route: `/technologies/${encodeURIComponent(t.name)}`,
        }));

        const repos = (repoRes?.repositories || []).map((r) => ({
          type: 'repository',
          id: r.id,
          name: r.name,
          subtitle: r.fullName || 'Repository',
          avatar: null,
          route: r.url || null,
        }));

        setGlobalSearchResults([
          ...devs,
          ...techs,
          ...repos,
        ]);

        setFocusedIndex(-1);
      } catch (err) {
        console.error('Global search error:', err);
        setGlobalSearchResults([]);
      } finally {
        setGlobalSearchLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [globalSearchQuery]);
  // ── Cmd/Ctrl+K shortcut
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (window.innerWidth >= 768) {
          if (desktopInputRef.current) {
            desktopInputRef.current.focus();
            setDropdownOpen(true);
          }
        } else {
          setSearchModalOpen(true);
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // ── Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setDropdownOpen(false);
        setFocusedIndex(-1);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ── Handle item selection
  const handleSelectItem = (item) => {
    if (!item) return;

    // Repository results open the actual GitHub repository
    if (item.type === 'repository' && item.route) {
      window.open(item.route, '_blank', 'noopener,noreferrer');
    } else if (item.route) {
      // Developers and technologies use React Router
      navigate(item.route);
    }

    setSearchModalOpen(false);
    setDropdownOpen(false);
    setGlobalSearchQuery('');
    setMobileMenuOpen(false);
    setFocusedIndex(-1);
  };

  // ── Keyboard navigation helper
  const handleKeyDown = (e, items) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedIndex(prev => (prev < items.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedIndex(prev => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (focusedIndex >= 0 && focusedIndex < items.length) {
        handleSelectItem(items[focusedIndex]);
      }
    } else if (e.key === 'Escape') {
      setDropdownOpen(false);
      setSearchModalOpen(false);
      setFocusedIndex(-1);
      e.target.blur();
    }
  };

  return (
    <div className="bg-[#0B0E14] text-on-surface font-body-md antialiased flex h-screen w-screen overflow-hidden select-none">

      {/* ── DESKTOP SIDEBAR ─────────────────────────────────────────────────── */}
      <aside className="hidden md:flex flex-col bg-[#161B22] border-r border-[#30363D] h-screen w-64 fixed left-0 top-0 p-md gap-sm z-40 shrink-0">
        {/* Brand */}
        <div className="flex items-center gap-3 px-4 py-6 mb-4 select-none">
          <img
            src={devgraphLogo}
            alt="DevGraph"
            className="w-10 h-10 object-contain shrink-0"
          />

          <div>
            <h1 className="font-headline-md text-headline-md font-bold text-electric-cyan tracking-tight leading-none">
              DevGraph
            </h1>

            <p className="font-label-sm text-label-sm text-on-surface-variant/70 uppercase text-[9px] mt-1 tracking-wider">
              Intelligence Platform
            </p>
          </div>
        </div>

        {/* Nav links */}
        <nav className="flex-grow flex flex-col gap-xs font-label-md text-label-md">
          {NAV_ITEMS.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={navClass}
            >
              <span className="material-symbols-outlined">{icon}</span>
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="mt-auto space-y-4 pt-4 border-t border-[#30363D]">
          <div className="flex flex-col gap-xs font-label-md text-label-md">
            <NavLink
              to="/docs"
              className={({ isActive }) =>
                `text-on-surface-variant hover:text-on-surface px-4 py-1.5 flex items-center gap-3 ${isActive ? 'text-electric-cyan' : ''
                }`
              }
            >
              <span className="material-symbols-outlined text-sm">description</span>
              Docs
            </NavLink>
            <NavLink
              to="/support"
              className={({ isActive }) =>
                `text-on-surface-variant hover:text-on-surface px-4 py-1.5 flex items-center gap-3 ${isActive ? 'text-electric-cyan' : ''
                }`
              }
            >
              <span className="material-symbols-outlined text-sm">support_agent</span>
              Support
            </NavLink>
          </div>
          <button
            onClick={() => setUpgradeModalOpen(true)}
            className="w-full bg-electric-cyan text-[#0B0E14] font-bold py-2 px-4 rounded hover:opacity-90 transition-opacity cursor-pointer text-sm"
          >
            Upgrade Plan
          </button>
        </div>
      </aside>

      {/* ── MOBILE TOP NAVBAR ────────────────────────────────────────────────── */}
      <nav className="md:hidden flex justify-between items-center h-16 px-margin-mobile w-full bg-[#161B22] border-b border-[#30363D] fixed top-0 z-50">
        <div className="flex items-center gap-sm">
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-on-surface p-1">
            <span className="material-symbols-outlined">{mobileMenuOpen ? 'close' : 'menu'}</span>
          </button>
          <span className="font-headline-md text-headline-md font-bold text-electric-cyan leading-none">DevGraph</span>
        </div>
        <div className="flex items-center gap-md">
          <button onClick={() => setSearchModalOpen(true)} className="p-2 text-on-surface hover:text-electric-cyan transition-colors">
            <span className="material-symbols-outlined">search</span>
          </button>
          <img
            onClick={() => setUpgradeModalOpen(true)}
            className="w-8 h-8 rounded-full object-cover border border-[#30363D] cursor-pointer"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCbrjo3jdCnLk_QbpKcnOJ-RhA5MKXkZ9UZphjYypwGQG_G_SS5oCwo0urruz_f2KHUQJ_3OUHKUpBuVZIyykPqwjOnxMMpI7dqzOdb8O8oPiZvZVwVZaEUmzQG9NEtuVutV8Pa6sbllQIwne5dhHqWXAnz5JieIHjYdljg4Hg_xBFSuVJKaAP8dZHLYO8VUygwEehropx-cZVEFTv7d6yzFLgPMmxvDya7seovc0CGSmzVopazrOWJ"
            alt="Profile"
          />
        </div>
      </nav>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 top-16 bg-[#0B0E14] z-40 md:hidden flex flex-col p-lg gap-sm animate-fade-in border-t border-[#30363D]">
          <nav className="flex flex-col gap-sm">
            {NAV_ITEMS.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `py-3 px-4 rounded text-left ${isActive ? 'text-electric-cyan bg-[#161B22]' : 'text-on-surface-variant'}`
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>
        </div>
      )}

      {/* ── MAIN CONTENT AREA ────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col md:ml-64 mt-16 md:mt-0 h-screen bg-[#0B0E14] overflow-y-auto">

        {/* Desktop header */}
        <header className="hidden md:flex justify-between items-center h-16 px-margin-desktop w-full border-b border-[#30363D] shrink-0 z-30 sticky top-0 bg-[#0B0E14]/80 backdrop-blur">
          {/* Top Search Bar (Inline input + command palette dropdown) */}
          <div ref={searchContainerRef} className="relative w-full max-w-[448px]">
            <div className="flex items-center w-full relative group">
              <span className="material-symbols-outlined absolute left-3 text-outline">search</span>
              <input
                type="text"
                ref={desktopInputRef}
                value={globalSearchQuery}
                onChange={(e) => {
                  setGlobalSearchQuery(e.target.value);
                  setDropdownOpen(true);
                }}
                onFocus={() => setDropdownOpen(true)}
                onKeyDown={(e) => handleKeyDown(e, globalSearchResults)}
                placeholder="Search developers, repositories, technologies..."
                className="w-full bg-[#0B0E14] border border-[#30363D] text-white rounded-DEFAULT py-2 pl-10 pr-16 text-on-surface-variant/80 font-body-md focus:outline-none focus:border-electric-cyan focus:ring-1 focus:ring-electric-cyan placeholder:truncate placeholder:whitespace-nowrap"
              />
              <div className="absolute right-3 flex gap-1 pointer-events-none items-center">
                <kbd className="font-label-sm text-[10px] text-outline-variant bg-[#161B22] border border-[#30363D] px-1.5 py-0.5 rounded">Ctrl</kbd>
                <kbd className="font-label-sm text-[10px] text-outline-variant bg-[#161B22] border border-[#30363D] px-1.5 py-0.5 rounded">K</kbd>
              </div>
            </div>

            {/* Command Palette Dropdown */}
            {dropdownOpen && (globalSearchQuery || globalSearchLoading || globalSearchResults.length > 0) && (
              <div className="absolute top-full left-0 w-full mt-2 bg-[#161B22] border border-[#30363D] rounded-lg shadow-2xl z-50 overflow-hidden max-h-96 overflow-y-auto">
                {globalSearchLoading ? (
                  <div className="p-md text-xs text-on-surface-variant text-center flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4 text-electric-cyan" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Searching...</span>
                  </div>
                ) : globalSearchResults.length === 0 ? (
                  <div className="p-md text-xs text-on-surface-variant text-center">
                    No results found for "{globalSearchQuery}"
                  </div>
                ) : (
                  <div className="p-sm flex flex-col gap-xs">
                    {globalSearchResults.map((item, idx) => {
                      const isFocused = idx === focusedIndex;
                      return (
                        <div
                          key={`${item.type}-${item.id}`}
                          onClick={() => handleSelectItem(item)}
                          onMouseEnter={() => setFocusedIndex(idx)}
                          className={`flex items-center gap-sm p-sm rounded cursor-pointer group transition-colors ${isFocused ? 'bg-[#1C2128] text-electric-cyan' : 'hover:bg-[#1C2128]'}`}
                        >
                          {item.type === 'developer' ? (
                            <img
                              className="w-8 h-8 rounded-full object-cover border border-[#30363D]"
                              src={item.avatar || 'https://lh3.googleusercontent.com/aida-public/AB6AXuCbrjo3jdCnLk_QbpKcnOJ-RhA5MKXkZ9UZphjYypwGQG_G_SS5oCwo0urruz_f2KHUQJ_3OUHKUpBuVZIyykPqwjOnxMMpI7dqzOdb8O8oPiZvZVwVZaEUmzQG9NEtuVutV8Pa6sbllQIwne5dhHqWXAnz5JieIHjYdljg4Hg_xBFSuVJKaAP8dZHLYO8VUygwEehropx-cZVEFTv7d6yzFLgPMmxvDya7seovc0CGSmzVopazrOWJ'}
                              alt={item.name}
                            />
                          ) : (
                            <div className="w-8 h-8 rounded bg-surface-variant border border-[#30363D] flex items-center justify-center text-electric-cyan">
                              <span className="material-symbols-outlined text-sm">code</span>
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className={`font-semibold truncate text-sm ${isFocused ? 'text-electric-cyan' : 'text-white group-hover:text-electric-cyan'}`}>
                              {item.name}
                            </div>
                            <div className="text-[10px] text-on-surface-variant font-mono">{item.subtitle}</div>
                          </div>
                          <div className="flex items-center gap-xs shrink-0">
                            <span className={`text-[9px] px-1.5 py-0.5 rounded border uppercase ${item.type === 'developer' ? 'bg-[#1C2128] border-[#30363D] text-on-surface-variant' : 'bg-primary-container/10 border-primary-container/20 text-electric-cyan'}`}>
                              {item.type}
                            </span>
                            <span className="material-symbols-outlined text-outline-variant text-[14px]">arrow_forward</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                <div className="p-xs bg-[#0B0E14] border-t border-[#30363D] flex justify-between text-[10px] text-on-surface-variant px-sm font-mono select-none">
                  <span>↑↓ to navigate</span>
                  <span>Esc to close</span>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-md">
            <button
              onClick={() => setUpgradeModalOpen(true)}
              className="p-2 text-on-surface hover:text-electric-cyan transition-colors rounded-full relative"
            >
              <span className="material-symbols-outlined">notifications</span>
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-electric-cyan rounded-full border border-[#0B0E14]" />
            </button>
            <div className="h-8 w-px bg-[#30363D] mx-2" />
            <img
              onClick={() => setUpgradeModalOpen(true)}
              className="w-8 h-8 rounded-full border border-[#30363D] object-cover cursor-pointer hover:border-electric-cyan"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCbrjo3jdCnLk_QbpKcnOJ-RhA5MKXkZ9UZphjYypwGQG_G_SS5oCwo0urruz_f2KHUQJ_3OUHKUpBuVZIyykPqwjOnxMMpI7dqzOdb8O8oPiZvZVwVZaEUmzQG9NEtuVutV8Pa6sbllQIwne5dhHqWXAnz5JieIHjYdljg4Hg_xBFSuVJKaAP8dZHLYO8VUygwEehropx-cZVEFTv7d6yzFLgPMmxvDya7seovc0CGSmzVopazrOWJ"
              alt="Profile avatar"
            />
          </div>
        </header>

        {/* Routed page content */}
        <div className="flex-grow flex flex-col relative w-full h-full">
          <Outlet />
        </div>
      </main>

      {/* ── CMD+K SEARCH MODAL (Mobile Search Experience) ────────────────────── */}
      {searchModalOpen && (
        <div className="fixed inset-0 bg-[#0B0E14]/80 backdrop-blur-sm z-50 flex items-center justify-center p-md">
          <div className="bg-[#161B22] border border-[#30363D] w-full max-w-lg rounded-lg shadow-2xl overflow-hidden animate-scale-up">
            <div className="p-md border-b border-[#30363D] flex items-center justify-between">
              <span className="material-symbols-outlined text-outline">search</span>
              <input
                type="text"
                ref={modalInputRef}
                autoFocus
                value={globalSearchQuery}
                onChange={(e) => setGlobalSearchQuery(e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, globalSearchResults)}
                placeholder="Search developers or technologies..."
                className="flex-1 bg-transparent border-none outline-none text-white text-md px-3 placeholder-on-surface-variant/40"
              />
              <button
                onClick={() => { setSearchModalOpen(false); setGlobalSearchQuery(''); }}
                className="text-on-surface-variant hover:text-white"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="max-h-72 overflow-y-auto p-sm">
              {globalSearchLoading ? (
                <div className="p-md text-xs text-on-surface-variant text-center flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-electric-cyan" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Searching...</span>
                </div>
              ) : globalSearchResults.length === 0 ? (
                <div className="p-md text-xs text-on-surface-variant text-center">
                  {globalSearchQuery ? 'No matching results found.' : 'Type to search the developer network.'}
                </div>
              ) : (
                <div className="flex flex-col gap-xs">
                  {globalSearchResults.map((item, idx) => {
                    const isFocused = idx === focusedIndex;
                    return (
                      <div
                        key={`${item.type}-${item.id}`}
                        onClick={() => handleSelectItem(item)}
                        onMouseEnter={() => setFocusedIndex(idx)}
                        className={`flex items-center gap-sm p-sm rounded cursor-pointer group transition-colors ${isFocused ? 'bg-[#1C2128] text-electric-cyan' : 'hover:bg-[#1C2128]'}`}
                      >
                        {item.type === 'developer' ? (
                          <img
                            className="w-8 h-8 rounded-full object-cover border border-[#30363D]"
                            src={item.avatar || 'https://lh3.googleusercontent.com/aida-public/AB6AXuCbrjo3jdCnLk_QbpKcnOJ-RhA5MKXkZ9UZphjYypwGQG_G_SS5oCwo0urruz_f2KHUQJ_3OUHKUpBuVZIyykPqwjOnxMMpI7dqzOdb8O8oPiZvZVwVZaEUmzQG9NEtuVutV8Pa6sbllQIwne5dhHqWXAnz5JieIHjYdljg4Hg_xBFSuVJKaAP8dZHLYO8VUygwEehropx-cZVEFTv7d6yzFLgPMmxvDya7seovc0CGSmzVopazrOWJ'}
                            alt={item.name}
                          />
                        ) : (
                          <div className="w-8 h-8 rounded bg-surface-variant border border-[#30363D] flex items-center justify-center text-electric-cyan">
                            <span className="material-symbols-outlined text-sm">code</span>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className={`font-semibold truncate text-sm ${isFocused ? 'text-electric-cyan' : 'text-white group-hover:text-electric-cyan'}`}>
                            {item.name}
                          </div>
                          <div className="text-[10px] text-on-surface-variant font-mono">{item.subtitle}</div>
                        </div>
                        <div className="flex items-center gap-xs shrink-0">
                          <span className={`text-[9px] px-1.5 py-0.5 rounded border uppercase ${item.type === 'developer' ? 'bg-[#1C2128] border-[#30363D] text-on-surface-variant' : 'bg-primary-container/10 border-primary-container/20 text-electric-cyan'}`}>
                            {item.type}
                          </span>
                          <span className="material-symbols-outlined text-outline-variant text-[14px]">arrow_forward</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="p-xs bg-[#0B0E14] border-t border-[#30363D] flex justify-between text-[10px] text-on-surface-variant px-sm font-mono select-none">
              <span>↑↓ to navigate</span>
              <span>ESC to close</span>
            </div>
          </div>
        </div>
      )}

      {/* ── UPGRADE MODAL ────────────────────────────────────────────────────── */}
      {upgradeModalOpen && (
        <div className="fixed inset-0 bg-[#0B0E14]/80 backdrop-blur-sm z-50 flex items-center justify-center p-md">
          <div className="bg-[#161B22] border border-[#30363D] w-full max-w-[448px] rounded-lg shadow-2xl p-lg space-y-md animate-scale-up text-center relative">
            <button
              onClick={() => setUpgradeModalOpen(false)}
              className="absolute top-4 right-4 text-on-surface-variant hover:text-white"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
            <div className="w-12 h-12 rounded-full bg-electric-cyan/10 border border-electric-cyan mx-auto flex items-center justify-center text-electric-cyan">
              <span className="material-symbols-outlined text-2xl">bolt</span>
            </div>
            <h3 className="font-headline-md text-xl text-white font-bold">Unlock Advanced Graph Queries</h3>
            <p className="font-body-md text-sm text-on-surface-variant">
              Get access to real-time GitHub integration, 10-hop connection path calculations, and advanced AI collaborator recommendations.
            </p>
            <div className="bg-[#1C2128] border border-[#30363D] rounded p-md flex justify-between items-center text-left">
              <div>
                <div className="font-bold text-white text-md">Enterprise Plan</div>
                <div className="text-xs text-on-surface-variant mt-0.5">Unlimited graph queries &amp; exports</div>
              </div>
              <div className="text-right">
                <div className="font-bold text-electric-cyan text-lg">$49/mo</div>
                <div className="text-[10px] text-on-surface-variant">per developer seat</div>
              </div>
            </div>
            <button
              onClick={() => setUpgradeModalOpen(false)}
              className="w-full bg-electric-cyan text-[#0B0E14] font-bold py-2.5 rounded hover:opacity-90 transition-opacity"
            >
              Subscribe Now
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
