import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api/client';

export default function TechnologyDetail() {
  const { name } = useParams();
  const navigate = useNavigate();
  const [technology, setTechnology] = useState(null);
  const [developers, setDevelopers] = useState([]);
  const [repositories, setRepositories] = useState([]);
  const [relatedTechs, setRelatedTechs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadTechnologyData() {
      try {
        setLoading(true);
        setError(null);

        const [techInfo, techDevs, techRepos, related] = await Promise.all([
          api.getTechnology(name),
          api.getTechnologyDevelopers(name, 10),
          api.getTechnologyRepositories(name, 10),
          api.getRelatedTechnologies(name, 6)
        ]);

        if (!techInfo) {
          throw new Error(`Technology "${name}" does not exist.`);
        }

        setTechnology(techInfo);
        setDevelopers(techDevs || []);
        setRepositories(techRepos || []);
        setRelatedTechs(related || []);
      } catch (err) {
        setError(err.message || 'Failed to load technology details.');
      } finally {
        setLoading(false);
      }
    }

    loadTechnologyData();
  }, [name]);

  if (loading) {
    return (
      <div className="p-margin-mobile md:p-margin-desktop space-y-lg animate-pulse max-w-[1440px] mx-auto w-full">
        <div className="h-6 bg-surface-variant rounded w-32" />
        <div className="flex gap-md items-center pt-4">
          <div className="w-16 h-16 rounded bg-surface-variant" />
          <div className="space-y-2 flex-grow">
            <div className="h-8 bg-surface-variant rounded w-48" />
            <div className="h-4 bg-surface-variant rounded w-96" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg pt-6">
          <div className="h-60 bg-surface-variant rounded lg:col-span-1" />
          <div className="h-60 bg-surface-variant rounded lg:col-span-2" />
        </div>
      </div>
    );
  }

  if (error || !technology) {
    return (
      <div className="p-margin-mobile md:p-margin-desktop flex flex-col items-center justify-center min-h-[50vh] text-center space-y-md">
        <span className="material-symbols-outlined text-error text-5xl">terminal</span>
        <h3 className="font-headline-md text-xl text-white font-bold">Technology Load Error</h3>
        <p className="font-body-lg text-on-surface-variant max-w-[448px]">{error}</p>
        <button 
          onClick={() => navigate('/technologies')}
          className="bg-[#1C2128] border border-[#30363D] text-white font-bold py-2 px-6 rounded hover:bg-surface-container-high transition-colors cursor-pointer"
        >
          Back to Technologies
        </button>
      </div>
    );
  }

  return (
    <div className="flex-grow p-margin-mobile md:p-margin-desktop max-w-[1440px] mx-auto w-full pb-24 md:pb-12 space-y-lg">
      {/* Header back button */}
      <button 
        onClick={() => navigate('/technologies')}
        className="flex items-center gap-xs text-on-surface-variant hover:text-on-surface transition-colors w-fit group cursor-pointer"
      >
        <span className="material-symbols-outlined text-[18px] group-hover:-translate-x-1 transition-transform">arrow_back</span>
        <span className="font-label-md text-label-md">Back to Technologies</span>
      </button>

      {/* Tech Brand Header */}
      <div className="flex items-center gap-4 bg-[#161B22] border border-[#30363D] rounded-lg p-lg">
        <div className="w-16 h-16 rounded bg-surface border-2 border-electric-cyan flex items-center justify-center text-electric-cyan shrink-0">
          <span className="material-symbols-outlined text-3xl">code</span>
        </div>
        <div>
          <h1 className="font-display-lg text-headline-lg md:text-display-lg text-white font-bold leading-tight">{technology.name}</h1>
          <span className="bg-[#1c2128] text-primary border border-[#30363D] px-2 py-0.5 rounded font-label-sm text-xs mt-1 inline-block uppercase">
            {technology.category || 'Tech Ecosystem'}
          </span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-sm md:gap-md">
        <div className="bg-[#161B22] border border-[#30363D] p-md rounded-lg flex flex-col justify-center">
          <span className="text-[10px] text-on-surface-variant uppercase tracking-wider font-mono">Active Contributors</span>
          <span className="font-headline-lg text-headline-lg text-electric-cyan font-bold">{technology.developerCount || 0}</span>
        </div>
        <div className="bg-[#161B22] border border-[#30363D] p-md rounded-lg flex flex-col justify-center">
          <span className="text-[10px] text-on-surface-variant uppercase tracking-wider font-mono">Repositories Using Tech</span>
          <span className="font-headline-lg text-headline-lg text-electric-cyan font-bold">{technology.repositoryCount || 0}</span>
        </div>
        <div className="bg-[#161B22] border border-[#30363D] p-md rounded-lg flex flex-col justify-center col-span-2 md:col-span-1">
          <span className="text-[10px] text-on-surface-variant uppercase tracking-wider font-mono">Related Connections</span>
          <span className="font-headline-lg text-headline-lg text-electric-cyan font-bold">{relatedTechs.length}</span>
        </div>
      </div>

      {/* Lists Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg">
        {/* Left Column: Related Techs & Top Contributors */}
        <div className="flex flex-col gap-lg lg:col-span-1">
          {/* Related Techs list */}
          <section className="bg-[#161B22] border border-[#30363D] rounded-lg flex flex-col">
            <div className="p-md border-b border-[#30363D] flex justify-between items-center">
              <h2 className="font-headline-md text-body-lg font-semibold text-white font-mono uppercase">Related Technologies</h2>
              <span className="material-symbols-outlined text-on-surface-variant">terminal</span>
            </div>
            <div className="p-sm flex flex-col gap-xs">
              {relatedTechs.length === 0 ? (
                <div className="p-md text-center text-on-surface-variant text-sm">No related technologies found in same repositories.</div>
              ) : (
                relatedTechs.map((t) => (
                  <div 
                    key={t.technology}
                    onClick={() => navigate(`/technologies/${encodeURIComponent(t.technology)}`)}
                    className="flex items-center justify-between p-sm hover:bg-[#1C2128] rounded transition-colors group cursor-pointer"
                  >
                    <div className="flex items-center gap-sm">
                      <div className="w-2 h-2 rounded-full bg-electric-cyan"></div>
                      <span className="font-body-md text-body-md text-on-surface group-hover:text-electric-cyan transition-colors">{t.technology}</span>
                    </div>
                    <span className="font-label-sm text-label-sm text-outline-variant uppercase text-[10px]">
                      {t.category || 'Tech'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Top Contributors list */}
          <section className="bg-[#161B22] border border-[#30363D] rounded-lg flex flex-col">
            <div className="p-md border-b border-[#30363D] flex justify-between items-center">
              <h2 className="font-headline-md text-body-lg font-semibold text-white font-mono uppercase">Top Contributors</h2>
              <span className="material-symbols-outlined text-on-surface-variant">groups</span>
            </div>
            <div className="p-md flex flex-col gap-sm">
              {developers.length === 0 ? (
                <div className="p-md text-center text-on-surface-variant text-sm">No contributors found for this technology.</div>
              ) : (
                developers.map((dev) => (
                  <div 
                    key={dev.username}
                    onClick={() => navigate(`/developers/${dev.username}`)}
                    className="flex items-center gap-md p-sm hover:bg-[#1C2128] rounded transition-colors cursor-pointer border border-transparent hover:border-[#30363D]"
                  >
                    <img 
                      className="w-10 h-10 rounded-full object-cover border border-[#30363D]"
                      src={dev.avatar || 'https://lh3.googleusercontent.com/aida-public/AB6AXuCbrjo3jdCnLk_QbpKcnOJ-RhA5MKXkZ9UZphjYypwGQG_G_SS5oCwo0urruz_f2KHUQJ_3OUHKUpBuVZIyykPqwjOnxMMpI7dqzOdb8O8oPiZvZVwVZaEUmzQG9NEtuVutV8Pa6sbllQIwne5dhHqWXAnz5JieIHjYdljg4Hg_xBFSuVJKaAP8dZHLYO8VUygwEehropx-cZVEFTv7d6yzFLgPMmxvDya7seovc0CGSmzVopazrOWJ'} 
                      alt={dev.name} 
                    />
                    <div className="flex flex-col min-w-0">
                      <span className="font-body-md text-body-md font-medium text-on-surface truncate">{dev.name || dev.username}</span>
                      <span className="font-label-sm text-label-sm text-on-surface-variant font-mono">@{dev.username}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        {/* Right Column: Repositories list using this tech */}
        <div className="flex flex-col gap-lg lg:col-span-2 animate-fade-in">
          <section className="flex flex-col gap-md">
            <h2 className="font-headline-md text-body-lg font-semibold text-white font-mono uppercase pl-2">Repositories Using Technology</h2>
            {repositories.length === 0 ? (
              <div className="bg-[#161B22] border border-[#30363D] p-lg rounded-lg text-center text-on-surface-variant text-sm">
                No repositories in our database currently use this technology.
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
                        <h3 className="font-body-lg text-body-lg font-semibold text-[#9cf0ff] group-hover:text-electric-cyan transition-colors font-mono truncate max-w-[85%]">{repo.name}</h3>
                        <span className="material-symbols-outlined text-on-surface-variant text-[18px]">public</span>
                      </div>
                      <p className="font-body-md text-xs text-on-surface-variant line-clamp-2 h-10 mb-4">
                        {repo.description || 'No description provided by the repository.'}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-[#30363D] flex items-center justify-between text-xs text-on-surface-variant">
                      <div className="flex items-center gap-1.5 bg-[#1C2128] border border-[#30363D] px-2 py-0.5 rounded text-electric-cyan">
                        <span className="material-symbols-outlined text-[12px]">groups</span>
                        <span className="font-bold">{repo.contributorCount || 0} contributors</span>
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
