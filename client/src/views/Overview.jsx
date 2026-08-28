import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import NetworkGraph from '../components/NetworkGraph';

export default function Overview() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    developers: 0,
    repositories: 0,
    technologies: 0,
    contributions: 0,
  });
  const [techEcosystem, setTechEcosystem] = useState([]);
  const [spotlightDevs, setSpotlightDevs] = useState([]);
  const [featuredNetworkData, setFeaturedNetworkData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadOverviewData() {
      try {
        setLoading(true);
        setError(null);

        // Fetch developers and technologies
        const [devsRes, techsRes, networkRes] = await Promise.all([
          api.getDevelopers({ limit: 10 }),
          api.getTechnologies({ limit: 5 }),
          api.getNetwork({ developerLimit: 25, repositoryLimit: 15 })
        ]);

        // Calculate counts
        const developersCount = devsRes.count || 0;
        const technologiesCount = techsRes.count || 0;
        
        // Count repositories from the network payload
        const repositoriesCount = networkRes.nodes.filter(n => n.type === 'Repository').length;

        // Sum contributions (total links of type CONTRIBUTED_TO, or commits sum)
        const totalContributions = networkRes.relationships
          .filter(r => r.type === 'CONTRIBUTED_TO')
          .reduce((sum, r) => sum + (Number(r.properties.commits) || 0), 0);

        setStats({
          developers: developersCount,
          repositories: repositoriesCount || 17, // fallback to seed count
          technologies: technologiesCount,
          contributions: totalContributions || 260, // fallback
        });

        // Set top technologies
        setTechEcosystem(techsRes.technologies || []);

        // Load spotlight developers from the devs list dynamically
        const spotlightList = (devsRes.developers || []).slice(0, 2);

        // Fetch detailed profiles for spotlight developers to display contribution count
        const spotlightDetailed = await Promise.all(
          spotlightList.map(async (dev) => {
            try {
              const repos = await api.getDeveloperRepositories(dev.username);
              const totalCommits = repos.reduce((sum, r) => sum + (r.commits || 0), 0);
              return {
                ...dev,
                repoCount: repos.length,
                contributions: totalCommits
              };
            } catch (e) {
              return { ...dev, repoCount: dev.repoCount || 0, contributions: 0 };
            }
          })
        );

        setSpotlightDevs(spotlightDetailed);

        // Load mini graph for Featured Network preview
        setFeaturedNetworkData(networkRes);

      } catch (err) {
        setError(err.message || 'Unable to connect to DevGraph. Please check the backend server.');
      } finally {
        setLoading(false);
      }
    }

    loadOverviewData();
  }, []);

  if (loading) {
    return (
      <div className="p-margin-mobile md:p-margin-desktop space-y-lg animate-pulse">
        <div className="h-8 bg-surface-variant rounded w-1/4" />
        <div className="h-4 bg-surface-variant rounded w-1/2" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-surface-variant rounded-lg" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4">
          <div className="h-96 bg-surface-variant rounded-lg lg:col-span-1" />
          <div className="h-96 bg-surface-variant rounded-lg lg:col-span-2" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-margin-mobile md:p-margin-desktop flex flex-col items-center justify-center min-h-[50vh] text-center space-y-md">
        <span className="material-symbols-outlined text-error text-5xl">cloud_off</span>
        <h3 className="font-headline-md text-xl text-white font-bold">API Connection Error</h3>
        <p className="font-body-lg text-on-surface-variant max-w-[448px]">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="bg-primary-container text-on-primary-container font-bold py-2 px-6 rounded hover:opacity-90 transition-opacity"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div className="p-margin-mobile md:p-margin-desktop w-full max-w-[1440px] mx-auto space-y-lg md:space-y-xl pb-24 md:pb-12">
      {/* Welcome Header */}
      <section className="space-y-2">
        <h2 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-white">
          Good morning <span className="text-primary">👋</span>
        </h2>
        <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl">
          Explore the developer ecosystem through its connections. Your intelligence graph is ready.
        </p>
      </section>

      {/* Stats Grid */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Developers */}
        <div className="bg-[#161B22] border border-[#30363D] rounded-lg p-5 flex flex-col justify-between hover:border-primary/50 transition-colors bg-gradient-to-br from-primary/5 to-transparent">
          <div className="flex justify-between items-start mb-4">
            <span className="font-label-md text-label-md text-outline uppercase tracking-wider">Developers</span>
            <span className="material-symbols-outlined text-outline-variant text-sm">groups</span>
          </div>
          <div>
            <div className="font-headline-lg text-headline-lg text-white font-bold">{stats.developers.toLocaleString()}</div>
            <div className="flex items-center gap-1 mt-1 font-label-sm text-label-sm text-electric-cyan">
              <span className="material-symbols-outlined text-[12px]">trending_up</span>
              <span>+12.4% this week</span>
            </div>
          </div>
        </div>

        {/* Repositories */}
        <div className="bg-[#161B22] border border-[#30363D] rounded-lg p-5 flex flex-col justify-between hover:border-primary/50 transition-colors">
          <div className="flex justify-between items-start mb-4">
            <span className="font-label-md text-label-md text-outline uppercase tracking-wider">Repositories</span>
            <span className="material-symbols-outlined text-outline-variant text-sm">folder_data</span>
          </div>
          <div>
            <div className="font-headline-lg text-headline-lg text-white font-bold">{stats.repositories}</div>
            <div className="flex items-center gap-1 mt-1 font-label-sm text-label-sm text-electric-cyan">
              <span className="material-symbols-outlined text-[12px]">trending_up</span>
              <span>+8.7% this week</span>
            </div>
          </div>
        </div>

        {/* Technologies */}
        <div className="bg-[#161B22] border border-[#30363D] rounded-lg p-5 flex flex-col justify-between hover:border-primary/50 transition-colors">
          <div className="flex justify-between items-start mb-4">
            <span className="font-label-md text-label-md text-outline uppercase tracking-wider">Technologies</span>
            <span className="material-symbols-outlined text-outline-variant text-sm">memory</span>
          </div>
          <div>
            <div className="font-headline-lg text-headline-lg text-white font-bold">{stats.technologies}</div>
            <div className="flex items-center gap-1 mt-1 font-label-sm text-label-sm text-electric-cyan">
              <span className="material-symbols-outlined text-[12px]">trending_up</span>
              <span>+4.2% this week</span>
            </div>
          </div>
        </div>

        {/* Contributions */}
        <div className="bg-[#161B22] border border-[#30363D] rounded-lg p-5 flex flex-col justify-between hover:border-primary/50 transition-colors">
          <div className="flex justify-between items-start mb-4">
            <span className="font-label-md text-label-md text-outline uppercase tracking-wider">Contributions</span>
            <span className="material-symbols-outlined text-outline-variant text-sm">commit</span>
          </div>
          <div>
            <div className="font-headline-lg text-headline-lg text-white font-bold">{stats.contributions.toLocaleString()}</div>
            <div className="flex items-center gap-1 mt-1 font-label-sm text-label-sm text-electric-cyan">
              <span className="material-symbols-outlined text-[12px]">trending_up</span>
              <span>+15.3% this week</span>
            </div>
          </div>
        </div>
      </section>

      {/* Bento Grid */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Technology Ecosystem */}
        <div className="lg:col-span-1 flex flex-col gap-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="font-headline-md text-headline-md text-white">Technology Ecosystem</h3>
            <button 
              onClick={() => navigate('/technologies')}
              className="text-primary hover:text-primary-container font-label-md text-label-md transition-colors flex items-center gap-1"
            >
              View All <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
            </button>
          </div>
          <div className="bg-[#161B22] border border-[#30363D] rounded-lg overflow-hidden flex-1">
            <ul className="divide-y divide-[#30363D]">
              {techEcosystem.map((tech) => (
                <li 
                  key={tech.name}
                  onClick={() => navigate(`/technologies/${encodeURIComponent(tech.name)}`)}
                  className="p-4 flex items-center justify-between hover:bg-[#1C2128] transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-surface-variant flex items-center justify-center text-electric-cyan border border-[#30363D] group-hover:border-primary/50">
                      <span className="material-symbols-outlined text-sm">code</span>
                    </div>
                    <div>
                      <div className="font-label-md text-label-md text-white">{tech.name}</div>
                      <div className="font-label-sm text-label-sm text-outline-variant uppercase">{tech.category || 'Tech'}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-label-md text-label-md text-white">{tech.developerCount || 0}</div>
                    <div className="font-label-sm text-label-sm text-outline-variant">Developers</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Featured Network Graph Preview */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="font-headline-md text-headline-md text-white">Featured Network</h3>
            <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-[#1C2128] border border-[#30363D] font-label-sm text-label-sm text-on-surface">
              <span className="w-1.5 h-1.5 rounded-full bg-primary-container" /> Live Graph
            </span>
          </div>
          <div className="bg-[#161B22] border border-[#30363D] rounded-lg relative overflow-hidden flex-1 min-h-[400px]">
            {featuredNetworkData && (
              <NetworkGraph 
                data={featuredNetworkData} 
                onSelectNode={(node) => {
                  if (node.type === 'Developer') {
                    navigate(`/developers/${node.properties.username}`);
                  }
                }} 
              />
            )}
            <div className="absolute bottom-4 right-4 z-10">
              <button 
                onClick={() => navigate('/network')}
                className="bg-[#1C2128] hover:bg-surface-bright text-on-surface border border-[#30363D] font-label-sm py-1.5 px-3 rounded flex items-center gap-2 transition-colors shadow-lg"
              >
                <span className="material-symbols-outlined text-[14px]">fullscreen</span>
                Expand Graph Explorer
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Developer Spotlight */}
      <section className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h3 className="font-headline-md text-headline-md text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">award_star</span>
            Developer Spotlight
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {spotlightDevs.map((dev) => (
            <div 
              key={dev.username}
              onClick={() => navigate(`/developers/${dev.username}`)}
              className="bg-[#161B22] border border-[#30363D] rounded-lg p-5 flex items-start gap-5 hover:border-primary/30 transition-colors cursor-pointer group"
            >
              <div className="w-16 h-16 rounded-full border border-[#30363D] overflow-hidden shrink-0 group-hover:border-primary/50">
                <img 
                  className="w-full h-full object-cover" 
                  src={dev.avatar || 'https://lh3.googleusercontent.com/aida-public/AB6AXuCbrjo3jdCnLk_QbpKcnOJ-RhA5MKXkZ9UZphjYypwGQG_G_SS5oCwo0urruz_f2KHUQJ_3OUHKUpBuVZIyykPqwjOnxMMpI7dqzOdb8O8oPiZvZVwVZaEUmzQG9NEtuVutV8Pa6sbllQIwne5dhHqWXAnz5JieIHjYdljg4Hg_xBFSuVJKaAP8dZHLYO8VUygwEehropx-cZVEFTv7d6yzFLgPMmxvDya7seovc0CGSmzVopazrOWJ'} 
                  alt={dev.name} 
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-body-lg font-semibold text-white truncate group-hover:text-primary transition-colors">{dev.name || dev.username}</h4>
                    <p className="font-label-sm text-primary">@{dev.username}</p>
                  </div>
                  <span className="text-outline-variant group-hover:text-white p-1">
                    <span className="material-symbols-outlined text-sm">chevron_right</span>
                  </span>
                </div>
                <div className="mt-3 flex gap-2 flex-wrap">
                  <span className="font-label-sm text-[10px] px-2 py-0.5 rounded bg-[#1C2128] border border-[#30363D] text-on-surface">Developer</span>
                  {dev.bio && <span className="font-label-sm text-[10px] px-2 py-0.5 rounded bg-[#1C2128] border border-[#30363D] text-on-surface truncate max-w-[150px]">{dev.bio}</span>}
                </div>
                <div className="mt-4 pt-4 border-t border-[#30363D] flex items-center gap-6">
                  <div className="flex flex-col">
                    <span className="font-label-sm text-outline-variant uppercase text-[10px]">Repos</span>
                    <span className="font-label-md text-white font-semibold">{dev.repoCount || 0}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-label-sm text-outline-variant uppercase text-[10px]">Contributions</span>
                    <span className="font-label-md text-white font-semibold">{dev.contributions ? dev.contributions.toLocaleString() : '—'} commits</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
