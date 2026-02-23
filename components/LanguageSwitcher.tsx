import React from 'react';
import { useTranslation } from 'react-i18next';
import { Languages } from 'lucide-react';

interface LanguageSwitcherProps {
    variant?: 'nav' | 'entry';
}

const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ variant = 'nav' }) => {
    const { i18n } = useTranslation();

    const changeLanguage = (lng: string) => {
        i18n.changeLanguage(lng);
    };

    const isEN = i18n.language === 'en';
    const isDE = i18n.language === 'de';

    if (variant === 'entry') {
        return (
            <div className="flex gap-4 items-center">
                <Languages size={20} className="text-brand-heaven-gold/60" />
                <div className="flex bg-[var(--bg-surface)] shadow-neu-flat rounded-2xl p-1.5 gap-1.5 border border-white/5">
                    <button
                        onClick={() => changeLanguage('en')}
                        className={`px-6 py-2.5 text-[11px] uppercase font-avenir-bold rounded-xl transition-all duration-500 ${isEN ? 'bg-brand-heaven-gold text-white shadow-glow-sm' : 'text-brand-heaven-gold/40 hover:text-brand-heaven-gold hover:bg-white/[0.03]'}`}
                    >
                        English
                    </button>
                    <button
                        onClick={() => changeLanguage('de')}
                        className={`px-6 py-2.5 text-[11px] uppercase font-avenir-bold rounded-xl transition-all duration-500 ${isDE ? 'bg-brand-heaven-gold text-white shadow-glow-sm' : 'text-brand-heaven-gold/40 hover:text-brand-heaven-gold hover:bg-white/[0.03]'}`}
                    >
                        Deutsch
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-1.5 bg-[var(--bg-surface)] shadow-neu-flat p-1 rounded-xl border border-white/5">
            <div className="w-8 h-8 flex items-center justify-center text-brand-heaven-gold/40">
                <Languages size={15} />
            </div>
            <div className="flex gap-1">
                <button
                    onClick={() => changeLanguage('en')}
                    className={`text-[10px] font-avenir-bold uppercase px-3 py-1.5 rounded-lg transition-all duration-300 ${isEN ? 'shadow-neu-pressed text-brand-heaven-gold bg-black/10' : 'text-white/40 hover:text-white dark:text-neutral-500 dark:hover:text-black'}`}
                >
                    EN
                </button>
                <div className="w-px h-3 bg-white/10 self-center" />
                <button
                    onClick={() => changeLanguage('de')}
                    className={`text-[10px] font-avenir-bold uppercase px-3 py-1.5 rounded-lg transition-all duration-300 ${isDE ? 'shadow-neu-pressed text-brand-heaven-gold bg-black/10' : 'text-white/40 hover:text-white dark:text-neutral-500 dark:hover:text-black'}`}
                >
                    DE
                </button>
            </div>
        </div>
    );
};

export default LanguageSwitcher;
