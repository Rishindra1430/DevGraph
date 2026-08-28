import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api/client';

export default function DeveloperProfile() {
  const { username } = useParams();
  const navigate = useNavigate();
  const [developer, setDeveloper] = useState(null);
  const [repositories, setRepositories] = useState([]);
  const [technologies, setTechnologies] = useState([]);
  const [collaborators, setCollaborators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadProfile() {
      try {
        setLoading(true);
        setError(null);

        // Fetch developer metadata and associated data in parallel
        const [devInfo, devRepos, devTechs, devCollabs] = await Promise.all([
          api.getDeveloper(username),
          api.getDeveloperRepositories(username),
          api.getDeveloperTechnologies(username),
          api.getDeveloperCollaborators(username, 5)
        ]);

        if (!devInfo) {
          throw new Error(`Developer "${username}" does not exist.`);
        }

        setDeveloper(devInfo);
        setRepositories(devRepos || []);
        setTechnologies(devTechs || []);
        setCollaborators(devCollabs || []);
      } catch (err) {
        setError(err.message || 'Failed to load developer profile.');
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [username]);

  if (loading) {
    return (
      <div className="p-margin-mobile md:p-margin-desktop space-y-lg animate-pulse max-w-[1440px] mx-auto w-full">
        <div className="h-6 bg-surface-variant rounded w-32" />
        <div className="flex gap-md items-center pt-4">
          <div className="w-24 h-24 rounded-full bg-surface-variant" />
          <div className="space-y-2 flex-grow">
            <div className="h-8 bg-surface-variant rounded w-48" />
            <div className="h-4 bg-surface-variant rounded w-96" />
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-sm pt-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 bg-surface-variant rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !developer) {
    return (
      <div className="p-margin-mobile md:p-margin-desktop flex flex-col items-center justify-center min-h-[50vh] text-center space-y-md">
        <span className="material-symbols-outlined text-error text-5xl">person_off</span>
        <h3 className="font-headline-md text-xl text-white font-bold">Profile Load Error</h3>
        <p className="font-body-lg text-on-surface-variant max-w-[448px]">{error}</p>
        <button 
          onClick={() => navigate('/developers')}
          className="bg-[#1C2128] border border-[#30363D] text-white font-bold py-2 px-6 rounded hover:bg-surface-container-high transition-colors cursor-pointer"
        >
          Back to Directory
        </button>
      </div>
    );
  }

  const totalCommits = repositories.reduce((sum, r) => sum + (r.commits || 0), 0);

  return (
    <div className="flex-1 p-margin-mobile md:p-margin-desktop bg-background flex flex-col gap-lg max-w-[1440px] mx-auto w-full pb-24 md:pb-12">
      {/* Header Section */}
      <header className="flex flex-col gap-md">
        <button 
          onClick={() => navigate('/developers')}
          className="flex items-center gap-xs text-on-surface-variant hover:text-on-surface transition-colors w-fit group cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px] group-hover:-translate-x-1 transition-transform">arrow_back</span>
          <span className="font-label-md text-label-md">Back to Directory</span>
        </button>
        
        <div className="flex flex-col md:flex-row items-start md:items-center gap-lg">
          <div className="relative group">
            <img 
              className="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover border-2 border-electric-cyan p-1" 
              src={developer.avatar || 'https://lh3.googleusercontent.com/aida-public/AB6AXuCbrjo3jdCnLk_QbpKcnOJ-RhA5MKXkZ9UZphjYypwGQG_G_SS5oCwo0urruz_f2KHUQJ_3OUHKUpBuVZIyykPqwjOnxMMpI7dqzOdb8O8oPiZvZVwVZaEUmzQG9NEtuVutV8Pa6sbllQIwne5dhHqWXAnz5JieIHjYdljg4Hg_xBFSuVJKaAP8dZHLYO8VUygwEehropx-cZVEFTv7d6yzFLgPMmxvDya7seovc0CGSmzVopazrOWJ'} 
              alt={developer.name || developer.username} 
            />
            <div className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-primary-container flex items-center justify-center border-2 border-background" title="Verified Member">
              <span className="material-symbols-outlined text-[14px] text-on-primary-container">star</span>
            </div>
          </div>
          <div className="flex flex-col gap-xs flex-1">
            <div className="flex items-center gap-sm">
              <h1 className="font-display-lg text-headline-lg md:text-display-lg text-white font-bold">{developer.name || developer.username}</h1>
              <span className="bg-[#1C2128] border border-[#30363D] px-2 py-0.5 rounded font-mono text-label-sm text-secondary-fixed">@{developer.username}</span>
            </div>
            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl">
              {developer.bio || 'Full-stack developer focused on modern web ecosystems and open-source contribution.'}
            </p>
            <div className="flex gap-sm mt-sm">
              <a 
                href={developer.profileUrl || '#'} 
                target="_blank"
                rel="noreferrer"
                className="bg-primary-container text-[#0B0E14] font-label-md text-label-md px-4 py-2 rounded hover:bg-primary-fixed transition-colors flex items-center gap-xs font-bold"
              >
                <span className="material-symbols-outlined text-[16px]">public</span> GitHub Profile
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Stats Bento */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-sm md:gap-md">
        <div className="bg-[#161B22] border border-[#30363D] p-md rounded-lg flex flex-col gap-xs">
          <span className="font-label-md text-label-md text-on-surface-variant uppercase font-mono flex items-center gap-xs">
            <span className="material-symbols-outlined text-[16px]">folder_copy</span> Repositories
          </span>
          <span className="font-headline-lg text-headline-lg text-[#9cf0ff]">{repositories.length}</span>
        </div>
        <div className="bg-[#161B22] border border-[#30363D] p-md rounded-lg flex flex-col gap-xs">
          <span className="font-label-md text-label-md text-on-surface-variant uppercase font-mono flex items-center gap-xs">
            <span className="material-symbols-outlined text-[16px]">commit</span> Total Commits
          </span>
          <span className="font-headline-lg text-headline-lg text-[#9cf0ff]">{totalCommits.toLocaleString()}</span>
        </div>
        <div className="bg-[#161B22] border border-[#30363D] p-md rounded-lg flex flex-col gap-xs">
          <span className="font-label-md text-label-md text-on-surface-variant uppercase font-mono flex items-center gap-xs">
            <span className="material-symbols-outlined text-[16px]">terminal</span> Technologies
          </span>
          <span className="font-headline-lg text-headline-lg text-[#9cf0ff]">{technologies.length}</span>
        </div>
        <div className="bg-[#161B22] border border-[#30363D] p-md rounded-lg flex flex-col gap-xs">
          <span className="font-label-md text-label-md text-on-surface-variant uppercase font-mono flex items-center gap-xs">
            <span className="material-symbols-outlined text-[16px]">group</span> Collaborators
          </span>
          <span className="font-headline-lg text-headline-lg text-[#9cf0ff]">{collaborators.length}</span>
        </div>
      </section>

      {/* Main content columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg">
        {/* Left Column: Tech & Collaborators */}
        <div className="flex flex-col gap-lg lg:col-span-1">
          {/* Technology Experience */}
          <section className="bg-[#161B22] border border-[#30363D] rounded-lg flex flex-col h-fit">
            <div className="p-md border-b border-[#30363D] flex justify-between items-center">
              <h2 className="font-headline-md text-body-lg font-semibold text-white font-mono uppercase">Technology Experience</h2>
              <span className="material-symbols-outlined text-on-surface-variant">terminal</span>
            </div>
            <div className="p-sm flex flex-col gap-xs">
              {technologies.length === 0 ? (
                <div className="p-md text-center text-on-surface-variant text-sm">No technologies mapped yet.</div>
              ) : (
                technologies.map((t) => (
                  <div 
                    key={t.technology}
                    onClick={() => navigate(`/technologies/${encodeURIComponent(t.technology)}`)}
                    className="flex items-center justify-between p-sm hover:bg-[#1C2128] rounded transition-colors group cursor-pointer"
                  >
                    <div className="flex items-center gap-sm">
                      <div className="w-2 h-2 rounded-full bg-electric-cyan"></div>
                      <span className="font-body-md text-body-md text-on-surface group-hover:text-electric-cyan transition-colors">{t.technology}</span>
                    </div>
                    <span className="font-label-sm text-label-sm text-primary-container bg-primary-container/10 px-2 py-0.5 rounded border border-primary-container/20">
                      {t.repositoryCount} {t.repositoryCount === 1 ? 'repo' : 'repos'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Collaborators */}
          <section className="bg-[#161B22] border border-[#30363D] rounded-lg flex flex-col h-fit">
            <div className="p-md border-b border-[#30363D] flex justify-between items-center">
              <h2 className="font-headline-md text-body-lg font-semibold text-white font-mono uppercase">Top Collaborators</h2>
              <span className="material-symbols-outlined text-on-surface-variant">group_work</span>
            </div>
            <div className="p-md flex flex-col gap-sm">
              {collaborators.length === 0 ? (
                <div className="p-md text-center text-on-surface-variant text-sm">No collaborators found.</div>
              ) : (
                collaborators.map((c) => (
                  <div 
                    key={c.username}
                    onClick={() => navigate(`/developers/${c.username}`)}
                    className="flex items-center gap-md p-sm hover:bg-[#1C2128] rounded transition-colors cursor-pointer border border-transparent hover:border-[#30363D]"
                  >
                    <img 
                      className="w-10 h-10 rounded-full object-cover border border-[#30363D]"
                      src={c.avatar || 'https://lh3.googleusercontent.com/aida-public/AB6AXuCbrjo3jdCnLk_QbpKcnOJ-RhA5MKXkZ9UZphjYypwGQG_G_SS5oCwo0urruz_f2KHUQJ_3OUHKUpBuVZIyykPqwjOnxMMpI7dqzOdb8O8oPiZvZVwVZaEUmzQG9NEtuVutV8Pa6sbllQIwne5dhHqWXAnz5JieIHjYdljg4Hg_xBFSuVJKaAP8dZHLYO8VUygwEehropx-cZVEFTv7d6yzFLgPMmxvDya7seovc0CGSmzVopazrOWJ'} 
                      alt={c.name} 
                    />
                    <div className="flex flex-col min-w-0">
                      <span className="font-body-md text-body-md font-medium text-on-surface truncate">{c.name || c.username}</span>
                      <span className="font-label-sm text-label-sm text-on-surface-variant font-mono">@{c.username}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        {/* Right Column: Repositories & Graph Activity mock */}
        <div className="flex flex-col gap-lg lg:col-span-2">
          {/* Contribution Heatmap Mock */}
          <section className="bg-[#161B22] border border-[#30363D] rounded-lg p-md flex flex-col gap-md">
            <div className="flex justify-between items-center">
              <h2 className="font-headline-md text-body-lg font-semibold text-white font-mono uppercase">Contribution Activity</h2>
              <span className="font-label-md text-label-md text-on-surface-variant font-mono">Last 90 Days</span>
            </div>
            {/* Heatmap Container */}
            <div className="bg-[#0B0E14] p-md rounded border border-[#30363D]/50 overflow-x-auto">
              <div className="flex flex-col gap-1 min-w-max">
                {[...Array(7)].map((_, i) => (
                  <div key={i} className="flex gap-1">
                    {[...Array(25)].map((_, j) => {
                      const lvl = Math.floor(Math.random() * 5); // 0-4
                      const colors = [
                        'bg-[#273647]', // Less
                        'bg-[#006875]', 
                        'bg-[#00daf3]', 
                        'bg-[#00e5ff]', 
                        'bg-[#c3f5ff]'  // More
                      ];
                      return (
                        <div 
                          key={j} 
                          className={`w-3 h-3 rounded-[2px] ${colors[lvl]} transition-colors hover:scale-110`} 
                          title={`${lvl * 3} commits`}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
              <div className="flex justify-end gap-sm mt-sm items-center text-xs text-on-surface-variant">
                <span>Less</span>
                <div className="flex gap-1">
                  <div className="w-3 h-3 rounded-[2px] bg-[#273647]" />
                  <div className="w-3 h-3 rounded-[2px] bg-[#006875]" />
                  <div className="w-3 h-3 rounded-[2px] bg-[#00daf3]" />
                  <div className="w-3 h-3 rounded-[2px] bg-[#c3f5ff]" />
                </div>
                <span>More</span>
              </div>
            </div>
          </section>

          {/* Repositories */}
          <section className="flex flex-col gap-md">
            <h2 className="font-headline-md text-body-lg font-semibold text-white font-mono uppercase pl-2">Top Repositories</h2>
            {repositories.length === 0 ? (
              <div className="bg-[#161B22] border border-[#30363D] p-lg rounded-lg text-center text-on-surface-variant text-sm">
                No repositories found.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                {repositories.map((repo) => (
                  <div 
                    key={repo.id}
                    className="bg-[#161B22] border border-[#30363D] p-md rounded-lg flex flex-col justify-between hover:bg-[#1C2128] transition-all group"
                  >
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-body-lg text-body-lg font-semibold text-[#9cf0ff] group-hover:text-electric-cyan transition-colors font-mono truncate max-w-[80%]">{repo.name}</h3>
                        <span className="material-symbols-outlined text-on-surface-variant text-[18px]">public</span>
                      </div>
                      <p className="font-body-md text-xs text-on-surface-variant line-clamp-2 h-10 mb-4">
                        {repo.description || 'No description provided by the repository.'}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-[#30363D] flex items-center justify-between text-xs text-on-surface-variant">
                      <div className="flex items-center gap-1.5 bg-[#1C2128] border border-[#30363D] px-2 py-0.5 rounded text-electric-cyan">
                        <span className="material-symbols-outlined text-[12px]">commit</span>
                        <span className="font-bold">{repo.commits} commits</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[12px] text-yellow-400" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                        <span>{repo.stars || 0}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
