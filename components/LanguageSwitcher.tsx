import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

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

    const baseClass = "text-[10px] font-avenir-bold uppercase px-3 py-1.5 rounded-lg transition-all duration-300 bg-[var(--bg-surface)]";
    const activeClass = "shadow-neu-pressed text-brand-heaven-gold";
    const inactiveClass = "shadow-neu-flat text-brand-heaven-gold/50 hover:text-brand-heaven-gold active:shadow-neu-pressed";

    if (variant === 'entry') {
        return (
            <div className="flex gap-4 items-center">
                <Globe size={14} className="text-brand-heaven-gold/40" />
                <div className="flex bg-[var(--bg-surface)] shadow-neu-flat rounded-xl p-1 gap-1">
                    <button
                        onClick={() => changeLanguage('en')}
                        className={`px-4 py-2 text-[10px] uppercase font-avenir-bold rounded-lg transition-all ${isEN ? 'bg-brand-heaven-gold text-white shadow-glow' : 'text-brand-heaven-gold/60 hover:text-brand-heaven-gold'}`}
                    >
                        English
                    </button>
                    <button
                        onClick={() => changeLanguage('de')}
                        className={`px-4 py-2 text-[10px] uppercase font-avenir-bold rounded-lg transition-all ${isDE ? 'bg-brand-heaven-gold text-white shadow-glow' : 'text-brand-heaven-gold/60 hover:text-brand-heaven-gold'}`}
                    >
                        Deutsch
                    </button>
                </div>
            </div>
        );
    }

    const navButtonClass = "text-[10px] font-avenir-bold uppercase flex items-center gap-2 transition-all duration-300 px-4 py-2 rounded-lg bg-[var(--bg-surface)]";

    return (
        <>
            <button
                onClick={() => changeLanguage('en')}
                className={`${navButtonClass} ${isEN ? 'shadow-neu-pressed text-brand-heaven-gold' : 'shadow-neu-flat text-white/50 dark:text-white/50 hover:text-white active:shadow-neu-pressed'}`}
            >
                <Globe size={13} /> EN
            </button>
            <button
                onClick={() => changeLanguage('de')}
                className={`${navButtonClass} ${isDE ? 'shadow-neu-pressed text-brand-heaven-gold' : 'shadow-neu-flat text-white/50 dark:text-white/50 hover:text-white active:shadow-neu-pressed'}`}
            >
                <Globe size={13} /> DE
            </button>
        </>
    );
};

export default LanguageSwitcher;
