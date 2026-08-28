import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-xl text-center space-y-md min-h-[60vh]">
      {/* Decorative icon */}
      <div className="w-20 h-20 rounded-full bg-[#161B22] border border-[#30363D] flex items-center justify-center mb-sm">
        <span className="material-symbols-outlined text-4xl text-on-surface-variant">explore_off</span>
      </div>

      <div className="space-y-xs">
        <p className="font-mono text-electric-cyan text-sm tracking-widest uppercase">404</p>
        <h1 className="font-headline-md text-2xl md:text-3xl text-white font-bold">Route Not Found</h1>
        <p className="font-body-lg text-on-surface-variant max-w-[448px] mx-auto">
          The page you're looking for doesn't exist in the DevGraph network. It may have been removed or the URL is incorrect.
        </p>
      </div>

      <Link
        to="/"
        className="mt-md inline-flex items-center gap-sm bg-electric-cyan text-[#0B0E14] font-bold py-2.5 px-6 rounded hover:opacity-90 transition-opacity"
      >
        <span className="material-symbols-outlined text-[18px]">home</span>
        Back to Overview
      </Link>
    </div>
  );
}
