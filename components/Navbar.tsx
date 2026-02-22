import React from 'react';
import { LayoutGrid, ShieldCheck, PlusCircle, Link as LinkIcon, Map } from 'lucide-react';
import { ViewMode } from '../types';

interface NavbarProps {
    viewMode: ViewMode;
    setViewMode: (mode: ViewMode) => void;
    darkMode: boolean;
    isAdminAuthorized: boolean;
}

const Navbar: React.FC<NavbarProps> = ({
    viewMode,
    setViewMode,
    darkMode,
    isAdminAuthorized
}) => {
    return (
        <nav className="fixed top-0 left-0 right-0 z-[100] bg-[var(--bg-surface)] backdrop-blur-xl px-4 md:px-8 py-4 shadow-neu-flat">
            <div className="max-w-[1400px] mx-auto flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="h-10 w-auto">
                        <img
                            src="/logo-dark.png"
                            alt="Reaching Germany Retreat Logo"
                            className="h-full w-auto object-contain"
                        />
                    </div>
                    <span className="text-[10px] font-avenir-bold text-white dark:text-white uppercase tracking-[0.3em] hidden sm:block">
                        Europe Shall be Saved
                    </span>
                </div>

                <div className="flex items-center gap-8">
                    <div className="flex gap-6">
                        <button
                            onClick={() => setViewMode('directory')}
                            className={`text-[10px] font-avenir-bold uppercase flex items-center gap-2 transition-all duration-300 px-4 py-2 rounded-lg bg-[var(--bg-surface)] ${viewMode === 'directory' ? 'shadow-neu-pressed text-brand-heaven-gold' : 'shadow-neu-flat text-white/50 dark:text-white/50 hover:text-white dark:hover:text-black active:shadow-neu-pressed'}`}
                        >
                            <LayoutGrid size={14} /> Directory
                        </button>
                        <button
                            onClick={() => setViewMode('map')}
                            className={`text-[10px] font-avenir-bold uppercase flex items-center gap-2 transition-all duration-300 px-4 py-2 rounded-lg bg-[var(--bg-surface)] ${viewMode === 'map' ? 'shadow-neu-pressed text-brand-heaven-gold' : 'shadow-neu-flat text-white/50 dark:text-white/50 hover:text-white dark:hover:text-black active:shadow-neu-pressed'}`}
                        >
                            <Map size={14} /> Map
                        </button>
                        <a
                            href="https://linktr.ee/esbs_leaders_summit_26"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] font-avenir-bold uppercase flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 bg-[var(--bg-surface)] shadow-neu-flat text-white/50 dark:text-white/50 hover:text-white dark:hover:text-black active:shadow-neu-pressed"
                        >
                            <LinkIcon size={14} /> Linktree
                        </a>
                        <button
                            onClick={() => setViewMode('admin')}
                            className={`text-[10px] font-avenir-bold uppercase flex items-center gap-2 transition-all duration-300 px-4 py-2 rounded-lg bg-[var(--bg-surface)] ${viewMode === 'admin' ? 'shadow-neu-pressed text-brand-heaven-gold' : 'shadow-neu-flat text-white/50 dark:text-white/50 hover:text-white dark:hover:text-black active:shadow-neu-pressed'}`}
                        >
                            <ShieldCheck size={14} /> Admin {isAdminAuthorized && <span className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-glow-sm" />}
                        </button>
                        <button
                            onClick={() => setViewMode('registration')}
                            className={`text-[10px] font-avenir-bold uppercase flex items-center gap-2 px-5 py-2 rounded-lg transition-all duration-300 bg-[var(--bg-surface)] ${viewMode === 'registration' ? 'shadow-neu-pressed text-brand-heaven-gold' : 'shadow-neu-flat text-brand-heaven-gold active:shadow-neu-pressed'}`}
                        >
                            <PlusCircle size={14} /> New Bio
                        </button>
                    </div>

                </div>
            </div>
        </nav>
    );
};

export default Navbar;
