import React from 'react';
import { useTranslation } from 'react-i18next';
import { Languages } from 'lucide-react';

interface LanguageSwitcherProps {
    variant?: 'nav' | 'entry';
}

const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ variant = 'nav' }) => {
    const { i18n } = useTranslation();

    const toggleLanguage = () => {
        const nextLang = i18n.language === 'en' ? 'de' : 'en';
        i18n.changeLanguage(nextLang);
    };

    const isEN = i18n.language === 'en';

    if (variant === 'entry') {
        return (
            <div className="flex gap-4 items-center">
                <Languages size={20} className="text-brand-heaven-gold/60" />
                <div className="flex bg-[var(--bg-surface)] shadow-neu-flat rounded-2xl p-1.5 gap-1.5 border border-white/5">
                    <button
                        onClick={() => i18n.changeLanguage('en')}
                        className={`px-6 py-2.5 text-[11px] uppercase font-avenir-bold rounded-xl transition-all duration-500 ${isEN ? 'bg-brand-heaven-gold text-white shadow-glow-sm' : 'text-brand-heaven-gold/40 hover:text-brand-heaven-gold hover:bg-white/[0.03]'}`}
                    >
                        English
                    </button>
                    <button
                        onClick={() => i18n.changeLanguage('de')}
                        className={`px-6 py-2.5 text-[11px] uppercase font-avenir-bold rounded-xl transition-all duration-500 ${i18n.language === 'de' ? 'bg-brand-heaven-gold text-white shadow-glow-sm' : 'text-brand-heaven-gold/40 hover:text-brand-heaven-gold hover:bg-white/[0.03]'}`}
                    >
                        Deutsch
                    </button>
                </div>
            </div>
        );
    }

    return (
        <button
            onClick={toggleLanguage}
            className="group flex items-center gap-3 bg-[var(--bg-surface)] shadow-neu-flat hover:shadow-neu-pressed p-2 pr-4 rounded-xl border border-white/5 transition-all duration-300 active:scale-95"
            title={isEN ? "Mudar para Alemão" : "Switch to English"}
        >
            <div className={`w-8 h-8 flex items-center justify-center rounded-lg bg-[var(--bg-surface)] shadow-neu-pressed text-brand-heaven-gold transition-colors group-hover:bg-brand-heaven-gold group-hover:text-white`}>
                <Languages size={15} />
            </div>
            <div className="flex flex-col items-start leading-tight">
                <span className="text-[9px] font-avenir-bold text-brand-heaven-gold uppercase tracking-widest leading-none mb-0.5">
                    {isEN ? 'EN' : 'DE'}
                </span>
                <span className="text-[7px] text-white/30 uppercase font-avenir-medium tracking-tighter">
                    {isEN ? '/ DE' : '/ EN'}
                </span>
            </div>
        </button>
    );
};

export default LanguageSwitcher;
