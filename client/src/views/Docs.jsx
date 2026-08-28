import React from 'react';
import { Link } from 'react-router-dom';

const sections = [
    {
        icon: 'hub',
        title: 'What is DevGraph?',
        text: 'DevGraph is a developer network visualization tool that connects developers, repositories, and technologies into an interactive graph.',
    },
    {
        icon: 'account_tree',
        title: 'How the graph works',
        text: 'Developers contribute to repositories, while repositories use technologies. These relationships allow DevGraph to discover shared expertise, collaboration networks, and technology intersections.',
    },
    {
        icon: 'database',
        title: 'Data model',
        code: `(:Developer)
      -[:CONTRIBUTED_TO]->
(:Repository)
      -[:USES_TECH]->
(:Technology)`,
    },
    {
        icon: 'github',
        title: 'GitHub data',
        text: 'DevGraph seeds its graph using real public GitHub repository, language, topic, and contributor data. The current dataset uses a curated collection of repositories.',
    },
    {
        icon: 'filter_alt',
        title: 'Technology normalization',
        text: 'GitHub languages and repository topics are normalized into consistent Technology nodes such as React, TypeScript, Python, Docker, Neo4j, and Node.js.',
    },
    {
        icon: 'explore',
        title: 'Explore',
        text: 'Use Explore to find developers associated with one technology or developers who have experience across two technologies.',
    },
    {
        icon: 'hub',
        title: 'Network Explorer',
        text: 'Network Explorer visualizes relationships between developers, repositories, and technologies. Select nodes to inspect their connected data.',
    },
    {
        icon: 'route',
        title: 'Connection Explorer',
        text: 'Connection Explorer finds a path between two developers through the repository collaboration graph.',
    },
];

const apiEndpoints = [
    ['GET', '/api/health', 'Check API and database connectivity'],
    ['GET', '/api/developers', 'List developers'],
    ['GET', '/api/developers/:username', 'Get a developer profile'],
    ['GET', '/api/technologies', 'List technologies'],
    ['GET', '/api/technologies/:name', 'Get technology details'],
    ['GET', '/api/explore', 'Find developers by technology intersection'],
    ['GET', '/api/network', 'Get the network graph'],
    ['GET', '/api/connections', 'Find a connection path between developers'],
];

export default function Docs() {
    return (
        <main className="min-h-full bg-background text-on-surface px-6 py-8 lg:px-10">
            <div className="max-w-6xl mx-auto">

                {/* Header */}
                <div className="mb-10">
                    <div className="flex items-center gap-2 text-electric-cyan text-xs uppercase tracking-[0.2em] font-bold mb-3">
                        <span className="material-symbols-outlined text-sm">menu_book</span>
                        Documentation
                    </div>

                    <h1 className="text-3xl lg:text-4xl font-bold tracking-tight">
                        DevGraph Documentation
                    </h1>

                    <p className="mt-3 text-on-surface-variant max-w-2xl leading-relaxed">
                        Learn how DevGraph transforms GitHub contribution data into an
                        interactive developer and technology network.
                    </p>
                </div>

                {/* Quick navigation */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
                    <Link
                        to="/explore"
                        className="group border border-outline-variant/30 bg-surface-container-low p-5 rounded-xl hover:border-electric-cyan/40 transition-colors"
                    >
                        <span className="material-symbols-outlined text-electric-cyan">
                            explore
                        </span>
                        <h3 className="font-semibold mt-3">Explore Data</h3>
                        <p className="text-sm text-on-surface-variant mt-1">
                            Find developers by technology.
                        </p>
                    </Link>

                    <Link
                        to="/network"
                        className="group border border-outline-variant/30 bg-surface-container-low p-5 rounded-xl hover:border-electric-cyan/40 transition-colors"
                    >
                        <span className="material-symbols-outlined text-electric-cyan">
                            hub
                        </span>
                        <h3 className="font-semibold mt-3">Network Explorer</h3>
                        <p className="text-sm text-on-surface-variant mt-1">
                            Explore the developer graph.
                        </p>
                    </Link>

                    <Link
                        to="/connections"
                        className="group border border-outline-variant/30 bg-surface-container-low p-5 rounded-xl hover:border-electric-cyan/40 transition-colors"
                    >
                        <span className="material-symbols-outlined text-electric-cyan">
                            route
                        </span>
                        <h3 className="font-semibold mt-3">Connections</h3>
                        <p className="text-sm text-on-surface-variant mt-1">
                            Find paths between developers.
                        </p>
                    </Link>
                </div>

                {/* Main documentation */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    {sections.map((section) => (
                        <section
                            key={section.title}
                            className="border border-outline-variant/30 bg-surface-container-low rounded-xl p-6"
                        >
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 shrink-0 rounded-lg bg-primary-container/10 border border-primary-container/20 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-electric-cyan">
                                        {section.icon}
                                    </span>
                                </div>

                                <div className="min-w-0">
                                    <h2 className="font-semibold text-lg">
                                        {section.title}
                                    </h2>

                                    {section.code ? (
                                        <pre className="mt-4 p-4 rounded-lg bg-[#05080D] border border-outline-variant/30 overflow-x-auto text-sm text-electric-cyan font-mono leading-relaxed">
                                            {section.code}
                                        </pre>
                                    ) : (
                                        <p className="mt-2 text-sm text-on-surface-variant leading-6">
                                            {section.text}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </section>
                    ))}
                </div>

                {/* API Reference */}
                <section className="mt-8 border border-outline-variant/30 bg-surface-container-low rounded-xl overflow-hidden">
                    <div className="p-6 border-b border-outline-variant/30">
                        <div className="flex items-center gap-3">
                            <span className="material-symbols-outlined text-electric-cyan">
                                api
                            </span>
                            <div>
                                <h2 className="text-lg font-semibold">API Reference</h2>
                                <p className="text-sm text-on-surface-variant mt-1">
                                    Core endpoints exposed by the DevGraph backend.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="divide-y divide-outline-variant/20">
                        {apiEndpoints.map(([method, endpoint, description]) => (
                            <div
                                key={endpoint}
                                className="px-6 py-4 flex flex-col sm:flex-row sm:items-center gap-3"
                            >
                                <span className="w-fit text-[10px] font-bold tracking-wider px-2 py-1 rounded bg-primary-container/10 border border-primary-container/20 text-electric-cyan">
                                    {method}
                                </span>

                                <code className="font-mono text-sm text-on-surface">
                                    {endpoint}
                                </code>

                                <span className="text-sm text-on-surface-variant sm:ml-auto">
                                    {description}
                                </span>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Footer */}
                <div className="mt-8 pb-8 text-center text-xs text-on-surface-variant">
                    DevGraph · Developer Network Visualization
                </div>
            </div>
        </main>
    );
}