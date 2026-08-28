import React from 'react';
import { Link } from 'react-router-dom';

const faqs = [
    {
        question: 'Where does DevGraph data come from?',
        answer:
            'DevGraph uses real public GitHub repository, language, topic, and contributor data to build its graph dataset.',
    },
    {
        question: 'Why does a developer have a technology I do not see on their pinned repositories?',
        answer:
            'Technology Experience is derived from repositories connected to that developer inside the DevGraph dataset. It is not limited to the developer’s pinned repositories.',
    },
    {
        question: 'Does DevGraph represent every GitHub repository?',
        answer:
            'No. The current application uses a curated repository dataset selected to create meaningful relationships between developers and technologies.',
    },
    {
        question: 'Why might two technologies have no developers in common?',
        answer:
            'The intersection is calculated from the repositories and contributors currently represented in the DevGraph graph.',
    },
    {
        question: 'Why is the network graph smaller than GitHub itself?',
        answer:
            'DevGraph visualizes the relationships represented in its current graph dataset rather than attempting to reproduce the entire GitHub network.',
    },
];

const troubleshooting = [
    {
        icon: 'cloud_off',
        title: 'API unavailable',
        text: 'Make sure the DevGraph backend is running and that the API health endpoint reports a connected database.',
    },
    {
        icon: 'search_off',
        title: 'No search results',
        text: 'Try a developer username, repository name, or technology name that exists in the current dataset.',
    },
    {
        icon: 'account_tree',
        title: 'Graph not loading',
        text: 'Refresh the page and verify that the Network API is available. The graph requires data from the backend.',
    },
];

export default function Support() {
    return (
        <main className="min-h-full bg-background text-on-surface px-6 py-8 lg:px-10">
            <div className="max-w-5xl mx-auto">

                {/* Header */}
                <div className="mb-10">
                    <div className="flex items-center gap-2 text-electric-cyan text-xs uppercase tracking-[0.2em] font-bold mb-3">
                        <span className="material-symbols-outlined text-sm">
                            support_agent
                        </span>
                        Support
                    </div>

                    <h1 className="text-3xl lg:text-4xl font-bold tracking-tight">
                        How can we help?
                    </h1>

                    <p className="mt-3 text-on-surface-variant max-w-2xl leading-relaxed">
                        Find answers about DevGraph's data, graph relationships, search,
                        and troubleshooting.
                    </p>
                </div>

                {/* FAQ */}
                <section>
                    <div className="flex items-center gap-3 mb-4">
                        <span className="material-symbols-outlined text-electric-cyan">
                            help
                        </span>
                        <h2 className="text-xl font-semibold">
                            Frequently Asked Questions
                        </h2>
                    </div>

                    <div className="space-y-3">
                        {faqs.map((faq) => (
                            <details
                                key={faq.question}
                                className="group border border-outline-variant/30 bg-surface-container-low rounded-xl"
                            >
                                <summary className="cursor-pointer list-none px-5 py-4 flex items-center justify-between gap-4">
                                    <span className="font-medium text-sm">
                                        {faq.question}
                                    </span>

                                    <span className="material-symbols-outlined text-on-surface-variant group-open:rotate-180 transition-transform">
                                        expand_more
                                    </span>
                                </summary>

                                <div className="px-5 pb-5 text-sm text-on-surface-variant leading-6 border-t border-outline-variant/20 pt-4">
                                    {faq.answer}
                                </div>
                            </details>
                        ))}
                    </div>
                </section>

                {/* Troubleshooting */}
                <section className="mt-10">
                    <div className="flex items-center gap-3 mb-4">
                        <span className="material-symbols-outlined text-electric-cyan">
                            build
                        </span>
                        <h2 className="text-xl font-semibold">
                            Troubleshooting
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {troubleshooting.map((item) => (
                            <div
                                key={item.title}
                                className="border border-outline-variant/30 bg-surface-container-low rounded-xl p-5"
                            >
                                <span className="material-symbols-outlined text-electric-cyan">
                                    {item.icon}
                                </span>

                                <h3 className="font-semibold mt-4">
                                    {item.title}
                                </h3>

                                <p className="text-sm text-on-surface-variant leading-6 mt-2">
                                    {item.text}
                                </p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Useful links */}
                <section className="mt-10 border border-outline-variant/30 bg-surface-container-low rounded-xl p-6">
                    <h2 className="text-lg font-semibold">
                        Quick Links
                    </h2>

                    <div className="mt-5 flex flex-wrap gap-3">
                        <Link
                            to="/docs"
                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-outline-variant/40 hover:border-electric-cyan/50 transition-colors text-sm"
                        >
                            <span className="material-symbols-outlined text-sm">
                                menu_book
                            </span>
                            Documentation
                        </Link>

                        <Link
                            to="/explore"
                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-outline-variant/40 hover:border-electric-cyan/50 transition-colors text-sm"
                        >
                            <span className="material-symbols-outlined text-sm">
                                explore
                            </span>
                            Explore DevGraph
                        </Link>

                        <Link
                            to="/network"
                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-outline-variant/40 hover:border-electric-cyan/50 transition-colors text-sm"
                        >
                            <span className="material-symbols-outlined text-sm">
                                hub
                            </span>
                            Network Explorer
                        </Link>
                    </div>
                </section>

                {/* Issue reporting */}
                <section className="mt-5 mb-8 border border-primary-container/20 bg-primary-container/5 rounded-xl p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-5">
                        <div className="w-11 h-11 shrink-0 rounded-lg bg-primary-container/10 border border-primary-container/20 flex items-center justify-center">
                            <span className="material-symbols-outlined text-electric-cyan">
                                bug_report
                            </span>
                        </div>

                        <div className="flex-1">
                            <h2 className="font-semibold">
                                Found an issue?
                            </h2>
                            <p className="text-sm text-on-surface-variant mt-1">
                                Report bugs or improvements through the project's GitHub
                                repository.
                            </p>
                        </div>

                        <a
                            href="https://github.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-background font-semibold text-sm hover:opacity-90 transition-opacity"
                        >
                            <span className="material-symbols-outlined text-sm">
                                open_in_new
                            </span>
                            Report Issue
                        </a>
                    </div>
                </section>

            </div>
        </main>
    );
}