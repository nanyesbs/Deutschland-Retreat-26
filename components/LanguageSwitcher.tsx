import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

interface LanguageSwitcherProps {
    variant?: 'nav' | 'entry';
}

const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ variant = 'nav' }) => {
    const { i18n } = useTranslation();

    const setLanguage = (lang: string) => {
        i18n.changeLanguage(lang);
    };

    const isEN = i18n.language?.startsWith('en');

    if (variant === 'entry') {
        return (
            <div className="flex gap-4 items-center scale-110 lg:scale-125">
                <Globe size={24} className="text-brand-heaven-gold animate-pulse-slow font-bold" />
                <div className="flex bg-[var(--bg-surface)] shadow-neu-pressed rounded-full p-1.5 gap-2 border border-brand-heaven-gold/20">
                    <button
                        onClick={() => setLanguage('en')}
                        className={`px-8 py-3 text-[12px] uppercase font-avenir-black rounded-full transition-all duration-500 ${isEN ? 'bg-brand-heaven-gold text-white shadow-glow-md scale-105' : 'text-brand-heaven-gold/30 hover:text-brand-heaven-gold hover:bg-white/[0.05]'}`}
                    >
                        English
                    </button>
                    <button
                        onClick={() => setLanguage('de')}
                        className={`px-8 py-3 text-[12px] uppercase font-avenir-black rounded-full transition-all duration-500 ${!isEN ? 'bg-brand-heaven-gold text-white shadow-glow-md scale-105' : 'text-brand-heaven-gold/30 hover:text-brand-heaven-gold hover:bg-white/[0.05]'}`}
                    >
                        Deutsch
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div
            className="flex items-center gap-3 bg-[var(--bg-surface)] shadow-neu-flat hover:shadow-neu-pressed p-1.5 px-3 rounded-full border border-white/10 dark:border-white/20 transition-all duration-500 cursor-pointer group"
            onClick={() => setLanguage(isEN ? 'de' : 'en')}
        >
            <div className="flex items-center justify-center w-7 h-7 rounded-full bg-[var(--bg-surface)] shadow-neu-pressed text-brand-heaven-gold group-hover:scale-110 transition-transform">
                <Globe size={16} className="animate-pulse-slow" />
            </div>
            <div className="flex gap-2 items-center">
                <span
                    className={`text-[10px] font-avenir-black uppercase tracking-widest transition-all duration-300 ${isEN ? 'text-brand-heaven-gold scale-110' : 'text-white/30 hover:text-white/60'}`}
                >
                    EN
                </span>
                <div className="w-[1px] h-3 bg-white/10" />
                <span
                    className={`text-[10px] font-avenir-black uppercase tracking-widest transition-all duration-300 ${!isEN ? 'text-brand-heaven-gold scale-110' : 'text-white/30 hover:text-white/60'}`}
                >
                    DE
                </span>
            </div>
        </div>
    );
};

export default LanguageSwitcher;
