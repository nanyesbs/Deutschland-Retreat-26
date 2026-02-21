
import React, { useState, useEffect } from 'react';
import { Participant } from '../types';
import { Building2, ChevronRight } from 'lucide-react';
import { getIdentityPlaceholder, HIGH_QUALITY_PLACEHOLDER } from '../constants';

interface ParticipantCardProps {
  participant: Participant;
  onClick: () => void;
  layout?: 'grid' | 'list';
}

const ParticipantCard: React.FC<ParticipantCardProps> = ({ participant, onClick, layout = 'grid' }) => {
  const [imgSrc, setImgSrc] = useState<string>(participant.photoUrl || getIdentityPlaceholder(participant.name));
  const [fallbackStage, setFallbackStage] = useState<number>(participant.photoUrl ? 0 : 1);

  useEffect(() => {
    setImgSrc(participant.photoUrl || getIdentityPlaceholder(participant.name));
    setFallbackStage(participant.photoUrl ? 0 : 1);
  }, [participant.photoUrl, participant.name]);

  const handleImageError = () => {
    if (fallbackStage === 0) {
      setImgSrc(getIdentityPlaceholder(participant.name));
      setFallbackStage(1);
    } else if (fallbackStage === 1) {
      setImgSrc(HIGH_QUALITY_PLACEHOLDER);
      setFallbackStage(2);
    }
  };

  const showDualFlags = participant.country.code !== participant.nationality.code;

  if (layout === 'list') {
    return (
      <div
        onClick={onClick}
        className="group relative bg-[var(--bg-surface)] transition-all duration-500 cursor-pointer overflow-hidden p-4 sm:p-5 flex items-center gap-6 rounded-2xl shadow-neu-flat hover:-translate-y-1 hover:shadow-neu-convex active:translate-y-0 active:shadow-neu-pressed"
      >
        <div className="relative w-16 h-16 sm:w-20 sm:h-20 shrink-0 rounded-xl overflow-hidden bg-[var(--bg-surface)] shadow-neu-pressed transition-all duration-700">
          <img
            src={imgSrc}
            alt={participant.name}
            onError={handleImageError}
            className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-1000 group-hover:scale-110 ease-out opacity-90 group-hover:opacity-100"
          />
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-t from-brand-heaven-gold/20 via-transparent to-transparent transition-opacity duration-700 pointer-events-none" />
        </div>

        <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="min-w-0">
            <h3 className="text-sm sm:text-base font-avenir-bold text-white dark:text-white mb-1 uppercase tracking-wider group-hover:text-brand-heaven-gold transition-colors line-clamp-1">
              {participant.name}
            </h3>
            <p className="text-[10px] sm:text-xs font-avenir-medium text-brand-heaven-gold uppercase tracking-[2px] opacity-90 group-hover:opacity-100 transition-opacity truncate">
              {participant.title}
            </p>
          </div>

          <div className="flex items-center gap-4 sm:gap-8">
            <div className="hidden lg:flex items-center gap-2 text-xs text-white/50 dark:text-white/50 font-avenir-roman">
              <Building2 size={12} className="text-brand-heaven-gold/60 shrink-0" />
              <span className="truncate max-w-[150px]">{participant.organization}</span>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex gap-2 items-center bg-[var(--bg-surface)] shadow-neu-pressed p-2 px-4 rounded-full">
                <span className="text-lg leading-none shrink-0" title="Residency">{participant.country.flag}</span>
                <span className="text-[10px] font-avenir-bold text-white/50 dark:text-white/50">{participant.country.code}</span>
              </div>
              <ChevronRight size={16} className="text-brand-heaven-gold/40 group-hover:text-brand-heaven-gold group-hover:translate-x-1 transition-all" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className="group relative bg-[var(--bg-surface)] transition-all duration-500 cursor-pointer p-5 md:p-6 flex flex-col items-center text-center rounded-3xl shadow-neu-flat hover:-translate-y-2 hover:shadow-neu-convex active:translate-y-0 active:shadow-neu-pressed"
    >
      {/* 1. Profile Picture (Coloring & Flags) */}
      <div className="relative mb-6 w-full aspect-square max-w-[180px]">
        <div className="w-full h-full rounded-2xl overflow-hidden bg-[var(--bg-surface)] shadow-neu-pressed relative transition-all duration-700">
          <img
            src={imgSrc}
            alt={participant.name}
            onError={handleImageError}
            className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-1000 group-hover:scale-110 ease-out opacity-90 group-hover:opacity-100"
          />

          {/* Inner Glow Overlay */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-t from-brand-heaven-gold/20 via-transparent to-transparent transition-opacity duration-700 pointer-events-none" />

          {/* Flags Overlay - Extruded inside debossed */}
          <div className="absolute bottom-2 right-2 p-2 flex gap-1.5 bg-[var(--bg-surface)] shadow-neu-flat rounded-xl z-10 transition-transform duration-500 group-hover:scale-110">
            {showDualFlags ? (
              <>
                <span className="text-lg leading-none" title="Nationality">{participant.nationality.flag}</span>
                <span className="text-lg leading-none" title="Residency">{participant.country.flag}</span>
              </>
            ) : (
              <span className="text-lg leading-none">{participant.country.flag}</span>
            )}
          </div>
        </div>
      </div>

      <div className="w-full flex flex-col items-center">
        {/* 2. Full Name */}
        <h3 className="text-sm md:text-base font-avenir-bold text-white dark:text-white mb-1.5 uppercase tracking-wider group-hover:text-brand-heaven-gold transition-colors duration-500 line-clamp-1">
          {participant.name}
        </h3>

        {/* 3. Role */}
        <p className="text-[10px] md:text-xs font-avenir-medium text-brand-heaven-gold mb-4 uppercase tracking-[3px] opacity-90 group-hover:opacity-100 transition-opacity">
          {participant.title}
        </p>

        {/* 4. Organization */}
        <div className="flex items-center justify-center gap-2 text-xs md:text-sm text-white/50 dark:text-white/50 font-avenir-roman mb-8 min-h-[1.5rem] w-full px-2">
          <Building2 size={12} className="text-brand-heaven-gold/60 shrink-0" />
          <span className="truncate line-clamp-1 max-w-[90%]">{participant.organization}</span>
        </div>

        {/* 5. View More Button - Neumorphic */}
        <div className="w-full pt-6 flex flex-col items-center mt-2 group-hover:opacity-100 opacity-90 transition-opacity">
          <button className="flex items-center gap-2 px-6 py-3.5 min-h-[44px] bg-[var(--bg-surface)] shadow-neu-flat group-hover:shadow-neu-pressed active:shadow-neu-pressed rounded-xl text-[10px] md:text-xs font-avenir-bold text-brand-heaven-gold uppercase transition-all tracking-[3px]">
            View Profile
            <ChevronRight size={12} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ParticipantCard;
