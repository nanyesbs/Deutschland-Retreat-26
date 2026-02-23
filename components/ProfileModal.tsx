
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Participant } from '../types';
import { X, Mail, Globe, Phone, User, Sparkles, Shield, Building2, Info, Maximize2, MessageCircle, ExternalLink, Instagram, Facebook, Youtube, Linkedin, Twitter } from 'lucide-react';
import { getIdentityPlaceholder, HIGH_QUALITY_PLACEHOLDER, SOCIAL_PLATFORMS } from '../constants';

interface ProfileModalProps {
  participant: Participant | null;
  onClose: () => void;
  isAdmin?: boolean;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ participant, onClose, isAdmin, onEdit, onDelete }) => {
  const { t } = useTranslation();
  const [isShowingPromo, setIsShowingPromo] = useState(false);
  const [imgSrc, setImgSrc] = useState<string>('');
  const [fallbackStage, setFallbackStage] = useState<number>(0);

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  useEffect(() => {
    if (participant) {
      const initialUrl = isShowingPromo && participant.promoPhotoUrl ? participant.promoPhotoUrl : participant.photoUrl;
      setImgSrc(initialUrl || getIdentityPlaceholder(participant.name));
      setFallbackStage(initialUrl ? 0 : 1);
    }
  }, [participant, isShowingPromo]);

  if (!participant) return null;

  const handleImageError = () => {
    if (fallbackStage === 0) {
      setImgSrc(getIdentityPlaceholder(participant.name));
      setFallbackStage(1);
    } else if (fallbackStage === 1) {
      setImgSrc(HIGH_QUALITY_PLACEHOLDER);
      setFallbackStage(2);
    }
  };

  const isEvangelist = participant.title?.toLowerCase().includes('evangelist');
  const themeText = isEvangelist ? 'text-[#A53E23]' : 'text-brand-heaven-gold';

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-4 md:p-10 bg-black/90 dark:bg-black/95 backdrop-blur-2xl animate-fade-in"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative w-full max-w-5xl h-[95vh] sm:h-auto sm:max-h-[90vh] bg-[var(--bg-surface)] shadow-neu-flat flex flex-col rounded-t-3xl sm:rounded-3xl md:rounded-[2.5rem] transition-all duration-500 overflow-hidden">

        <button
          onClick={onClose}
          className={`absolute top-4 right-4 md:top-6 md:right-6 z-[120] w-10 h-10 md:w-12 md:h-12 flex items-center justify-center bg-black/40 backdrop-blur-md sm:bg-[var(--bg-surface)] shadow-neu-flat active:shadow-neu-pressed rounded-full ${themeText} hover:scale-110 hover:rotate-90 transition-all group`}
        >
          <X size={20} className="text-white sm:text-inherit" />
        </button>

        <div className="flex flex-col md:flex-row w-full h-full overflow-hidden">
          {/* Mobile Profile Header (Creative Approach) */}
          <div className="md:hidden relative w-full aspect-[4/3] min-h-[250px] flex-shrink-0">
            {/* Banner Background */}
            <div className="absolute inset-0 overflow-hidden">
              <img
                src={participant.promoPhotoUrl || participant.photoUrl || getIdentityPlaceholder(participant.name)}
                className="w-full h-full object-cover blur-sm brightness-50 scale-110"
                alt={t('profile.banner')}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-black/20" />
            </div>

            {/* Profile Info Overlap */}
            <div className="absolute bottom-6 left-6 right-6 flex items-end gap-5">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-tr from-brand-heaven-gold to-white/20 rounded-2xl blur opacity-20 group-hover:opacity-40 transition" />
                <div className="relative w-32 h-32 rounded-2xl overflow-hidden border-2 border-brand-heaven-gold/30 shadow-2xl">
                  <img
                    src={participant.photoUrl || getIdentityPlaceholder(participant.name)}
                    className="w-full h-full object-cover"
                    alt={participant.name}
                  />
                </div>
              </div>
              <div className="flex-1 pb-2">
                <div className="px-2 py-1 bg-brand-heaven-gold/20 backdrop-blur-md rounded-lg border border-brand-heaven-gold/30 w-fit mb-2">
                  <p className="text-[10px] font-avenir-bold text-brand-heaven-gold uppercase tracking-[2px] flex items-center gap-1">
                    {participant.country.flag} {participant.country.name}
                  </p>
                </div>
                <h2 className="text-xl md:text-2xl font-extrabold text-white uppercase tracking-tighter leading-tight drop-shadow-lg">
                  {participant.name}
                </h2>
              </div>
            </div>
          </div>

          {/* Desktop Visual Column (Left Area) */}
          <div className="hidden md:flex w-full md:w-[35%] bg-[var(--bg-surface)] shadow-neu-pressed flex flex-col flex-shrink-0 p-8 md:overflow-y-auto custom-scrollbar h-full relative z-10">
            {/* Profile Frame */}
            <div className="relative w-full aspect-[4/5] rounded-[2rem] overflow-hidden shadow-neu-pressed bg-[var(--bg-surface)] mb-8 group">
              <img
                src={participant.photoUrl || getIdentityPlaceholder(participant.name)}
                alt={participant.name}
                onError={handleImageError}
                className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-1000 opacity-90 group-hover:opacity-100"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 group-hover:opacity-100 transition-opacity" />

              <div className="absolute bottom-6 left-6 right-6">
                <p className={`text-[10px] font-avenir-bold ${themeText} uppercase tracking-[4px] mb-2`}>{participant.country.name} Host</p>
                <div className={`w-12 h-[2px] ${isEvangelist ? 'bg-[#A53E23]' : 'bg-brand-heaven-gold'} shadow-glow-sm`} />
              </div>
            </div>

            {/* Promo Frame */}
            {participant.promoPhotoUrl && (
              <div className="space-y-4 group/promo">
                <div className="flex justify-between items-center px-2">
                  <span className={`text-[9px] font-avenir-bold ${themeText} uppercase tracking-[3px] opacity-80 flex items-center gap-2`}>
                    <Sparkles size={12} /> Visual Intelligence
                  </span>
                </div>
                <div
                  className="relative w-full aspect-video rounded-2xl overflow-hidden shadow-neu-pressed bg-[var(--bg-surface)] cursor-zoom-in transition-all"
                  onClick={() => window.open(participant.promoPhotoUrl, '_blank')}
                >
                  <img
                    src={participant.promoPhotoUrl}
                    alt="Promotion"
                    className="w-full h-full object-cover opacity-80 group-hover/promo:opacity-100 group-hover/promo:scale-110 transition-all duration-700 hover:grayscale-0 grayscale"
                  />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/promo:opacity-100 transition-opacity bg-black/40 backdrop-blur-[4px]">
                    <div className="flex flex-col items-center gap-2">
                      <Maximize2 size={32} className="text-white" />
                      <span className="text-[10px] font-avenir-bold text-white uppercase tracking-widest">{t('profile.expandVision')}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-auto pt-10 flex flex-col items-center gap-4 opacity-50">
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full border border-brand-heaven-gold/40 flex items-center justify-center">
                  <Shield size={14} className="text-brand-heaven-gold" />
                </div>
                <span className="text-[9px] font-avenir-bold text-white dark:text-white uppercase tracking-[3px]">{t('profile.secureLocation')}</span>
              </div>
              <p className="text-[8px] font-avenir-roman text-center max-w-[150px] leading-relaxed">{t('profile.verified')}</p>
            </div>
          </div>

          {/* Info Column (Right Area) - Organized & Premium */}
          <div className="w-full md:w-[65%] flex-1 flex flex-col bg-[var(--bg-surface)] shadow-neu-flat md:overflow-hidden relative z-20">
            <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-10 md:px-20 md:py-20 space-y-16">

              {/* Header Info (Desktop Only) */}
              <div className="hidden md:block">
                <div className="flex flex-col lg:flex-row lg:items-center gap-6 mb-10">
                  <div className="flex items-center gap-4">
                    <div className="px-5 py-2.5 bg-brand-heaven-gold/5 border border-brand-heaven-gold/20 rounded-full flex items-center gap-3 shadow-sm transition-all hover:bg-brand-heaven-gold/10">
                      <span className="text-2xl leading-none">{participant.country.flag}</span>
                      <span className={`text-[11px] font-avenir-bold ${themeText} uppercase tracking-[3px]`}>{participant.country.name}</span>
                    </div>
                  </div>
                  {participant.nationality.code !== participant.country.code && (
                    <div className="px-5 py-2.5 bg-white/[0.03] border border-white/10 rounded-full flex items-center gap-3 shadow-sm transition-all hover:bg-white/[0.06]">
                      <span className="text-2xl leading-none">{participant.nationality.flag}</span>
                      <span className="text-[11px] font-avenir-bold text-white/40 dark:text-gray-500 uppercase tracking-[3px]">{t('profile.heritage')}</span>
                    </div>
                  )}
                </div>

                <h2 className="text-6xl lg:text-8xl font-extrabold text-white dark:text-neutral-900 leading-[0.85] mb-12 uppercase tracking-tighter">
                  {participant.name}
                </h2>

                <div className="flex flex-wrap items-center gap-8">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-avenir-bold text-brand-heaven-gold uppercase tracking-[4px] mb-2">{t('profile.titleLabel')}</span>
                    <p className="text-2xl lg:text-3xl font-didot italic text-brand-heaven-gold leading-none">{participant.title}</p>
                  </div>
                  <div className="w-px h-12 bg-white/10 hidden lg:block" />
                  <div className="flex flex-col">
                    <span className="text-[10px] font-avenir-bold text-white/30 dark:text-gray-400 uppercase tracking-[4px] mb-2">{t('profile.orgLabel')}</span>
                    <p className="text-sm lg:text-base font-avenir-bold text-white/70 dark:text-neutral-700 uppercase tracking-widest leading-none">{participant.organization}</p>
                  </div>
                </div>
              </div>

              {/* Mobile Info (Mobile Only) */}
              <div className="md:hidden space-y-6">
                <div>
                  <p className="text-2xl font-didot italic text-brand-heaven-gold mb-2">{participant.title}</p>
                  <p className="text-[13px] font-avenir-bold text-white/60 dark:text-neutral-600 uppercase tracking-widest leading-relaxed">
                    {participant.organization}
                  </p>
                  {participant.nationality.code !== participant.country.code && (
                    <div className="mt-4 pt-4 border-t border-white/5 flex items-center gap-3">
                      <span className="text-xl">{participant.nationality.flag}</span>
                      <span className="text-[11px] font-avenir-bold text-white/30 uppercase tracking-[2px]">
                        {t('profile.heritage')}: {participant.nationality.name}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Main Content Grid */}
              <div className="grid grid-cols-1 gap-20">
                {/* Bio Section */}
                <div className="space-y-8">
                  <div className="flex items-center gap-5">
                    <div className="w-12 h-12 rounded-2xl bg-brand-heaven-gold/5 flex items-center justify-center border border-brand-heaven-gold/20 shadow-glow-sm">
                      <Sparkles size={24} className="text-brand-heaven-gold" />
                    </div>
                    <h4 className="text-[13px] font-avenir-bold text-brand-heaven-gold uppercase tracking-[6px]">{t('profile.bioLabel')}</h4>
                  </div>
                  <div className="relative pl-6 md:pl-10">
                    <div className="absolute left-0 top-2 bottom-2 w-px bg-gradient-to-b from-brand-heaven-gold/50 via-brand-heaven-gold/20 to-transparent" />
                    <p className="text-[16px] md:text-[19px] font-avenir-roman leading-relaxed text-white/80 dark:text-neutral-700 first-letter:text-6xl first-letter:font-didot first-letter:mr-4 first-letter:float-left first-letter:text-brand-heaven-gold first-letter:leading-[0.7] first-letter:pt-2">
                      {participant.testimony}
                    </p>
                  </div>
                </div>

                {/* Organization Details (Expanded) */}
                {participant.orgDescription && (
                  <div className="space-y-8">
                    <div className="flex items-center gap-5">
                      <div className="w-12 h-12 rounded-2xl bg-white/[0.03] flex items-center justify-center border border-white/10 shadow-sm">
                        <Building2 size={24} className="text-brand-heaven-gold" />
                      </div>
                      <h4 className="text-[13px] font-avenir-bold text-white/40 dark:text-gray-500 uppercase tracking-[6px]">{t('profile.orgDescription')}</h4>
                    </div>
                    <div className="p-8 md:p-12 bg-white/[0.02] dark:bg-neutral-50 rounded-[2rem] border border-white/5 relative overflow-hidden group transition-all hover:bg-white/[0.04]">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-brand-heaven-gold/5 rounded-full blur-3xl -mr-16 -mt-16 transition-all group-hover:scale-150" />
                      <p className="relative z-10 text-[15px] md:text-[17px] font-avenir-roman leading-relaxed text-white/90 dark:text-neutral-800 italic">
                        "{participant.orgDescription}"
                      </p>
                    </div>
                  </div>
                )}

                {/* Contacts & Social Media (Integrated View) */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                  {/* Digital Presence (Social Media) */}
                  <div className="space-y-8">
                    <div className="flex items-center gap-5">
                      <div className="w-10 h-10 rounded-xl bg-brand-heaven-gold/5 flex items-center justify-center border border-brand-heaven-gold/10">
                        <Globe size={18} className="text-brand-heaven-gold" />
                      </div>
                      <h4 className="text-[11px] font-avenir-bold text-brand-heaven-gold uppercase tracking-[5px]">{t('profile.socialMedia')}</h4>
                    </div>

                    <div className="flex flex-wrap gap-4">
                      {participant.socialMedia && participant.socialMedia.length > 0 ? (
                        participant.socialMedia.map((acc, i) => {
                          const platform = SOCIAL_PLATFORMS.find(p => p.id === acc.platform);
                          const url = platform ? platform.urlTemplate(acc.handle) : acc.handle;

                          // Dynamic Icon Picker
                          const getIcon = () => {
                            const p = acc.platform.toLowerCase();
                            if (p.includes('instagram')) return <Instagram size={20} />;
                            if (p.includes('facebook')) return <Facebook size={20} />;
                            if (p.includes('youtube')) return <Youtube size={20} />;
                            if (p.includes('linkedin')) return <Linkedin size={20} />;
                            if (p.includes('twitter') || p.includes('x')) return <Twitter size={20} />;
                            return <Globe size={20} />;
                          };

                          return (
                            <a
                              key={i}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center text-white/50 hover:text-brand-heaven-gold hover:border-brand-heaven-gold/40 hover:bg-brand-heaven-gold/5 transition-all duration-300 shadow-sm hover:scale-110 group relative"
                              title={`${acc.platform}: ${acc.handle}`}
                            >
                              {getIcon()}
                              <span className="absolute -bottom-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-black/80 backdrop-blur-md rounded text-[8px] uppercase tracking-widest text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                                {acc.platform}
                              </span>
                            </a>
                          );
                        })
                      ) : (
                        <div className="flex items-center gap-3 text-white/20 uppercase text-[10px] tracking-widest p-4 border border-dashed border-white/10 rounded-2xl w-full">
                          <Info size={14} /> {t('profile.offline')}
                        </div>
                      )}

                      {/* Website as a special social icon if present */}
                      {participant.website && (
                        <a
                          href={participant.website.startsWith('http') ? participant.website : `https://${participant.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center text-white/50 hover:text-brand-heaven-gold hover:border-brand-heaven-gold/40 hover:bg-brand-heaven-gold/5 transition-all duration-300 shadow-sm hover:scale-110 group relative"
                        >
                          <Globe size={20} />
                          <span className="absolute -bottom-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-black/80 backdrop-blur-md rounded text-[8px] uppercase tracking-widest text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                            Website
                          </span>
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Quick Connect (Comms) */}
                  <div className="space-y-8">
                    <div className="flex items-center gap-5">
                      <div className="w-10 h-10 rounded-xl bg-brand-heaven-gold/5 flex items-center justify-center border border-brand-heaven-gold/10">
                        <MessageCircle size={18} className="text-brand-heaven-gold" />
                      </div>
                      <h4 className="text-[11px] font-avenir-bold text-brand-heaven-gold uppercase tracking-[5px]">{t('profile.contactLabel') || 'Quick Connect'}</h4>
                    </div>

                    <div className="space-y-4">
                      {/* Phone / Whatsapp */}
                      <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/10 transition-all hover:bg-white/[0.06] group">
                        <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-white/40 group-hover:text-brand-heaven-gold transition-colors">
                          <Phone size={18} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[9px] font-avenir-bold text-white/30 uppercase tracking-widest mb-1">{t('profile.phone')}</p>
                          <a href={`tel:${participant.phone}`} className="text-[14px] font-avenir-medium text-white/80 block truncate">
                            {participant.phone || t('profile.commPending')}
                          </a>
                        </div>
                        {participant.isWhatsapp && participant.phone && (
                          <a
                            href={`https://wa.me/${participant.phone.replace(/[^0-9]/g, '')}`}
                            target="_blank" rel="noopener noreferrer"
                            className="w-10 h-10 rounded-full border border-[#25D366]/30 flex items-center justify-center text-[#25D366] hover:bg-[#25D366] hover:text-white transition-all shadow-glow-sm"
                          >
                            <MessageCircle size={18} />
                          </a>
                        )}
                      </div>

                      {/* Email */}
                      <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/10 transition-all hover:bg-white/[0.06] group">
                        <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-white/40 group-hover:text-brand-heaven-gold transition-colors">
                          <Mail size={18} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[9px] font-avenir-bold text-white/30 uppercase tracking-widest mb-1">{t('profile.email')}</p>
                          <a href={`mailto:${participant.email}`} className="text-[14px] font-avenir-medium text-white/80 block truncate">
                            {participant.email}
                          </a>
                        </div>
                        <a href={`mailto:${participant.email}`} className="w-10 h-10 rounded-lg flex items-center justify-center text-white/20 hover:text-brand-heaven-gold transition-colors">
                          <ExternalLink size={16} />
                        </a>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Meta Info Footer */}
                <div className="pt-10 border-t border-white/5 flex flex-wrap gap-8 items-center opacity-40">
                  <div className="flex items-center gap-3">
                    <User size={14} className="text-brand-heaven-gold" />
                    <span className="text-[10px] font-avenir-bold uppercase tracking-widest">{t('profile.participantID') || 'ID'}: {participant.id.slice(0, 8)}</span>
                  </div>
                  {participant.otherInfo && (
                    <div className="flex items-center gap-3">
                      <Info size={14} className="text-brand-heaven-gold" />
                      <span className="text-[10px] font-avenir-roman uppercase tracking-widest">{participant.otherInfo}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Admin Secure Overlay */}
              {isAdmin && (
                <div className="mt-20 pt-10 border-t border-white/10 dark:border-black/5 flex flex-col sm:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-4 py-3 px-6 bg-red-500/5 rounded-full border border-red-500/10">
                    <Shield size={18} className="text-red-500" />
                    <span className="text-[11px] font-avenir-bold uppercase text-red-500 tracking-[4px]">{t('profile.controlsActive')}</span>
                  </div>
                  <div className="flex gap-4 w-full sm:w-auto">
                    <button onClick={() => onEdit?.(participant.id)} className="flex-1 sm:flex-initial px-10 py-4 bg-brand-heaven-gold/10 hover:bg-brand-heaven-gold text-brand-heaven-gold hover:text-white border border-brand-heaven-gold/30 rounded-2xl text-[11px] font-avenir-bold uppercase transition-all shadow-glow-hover">{t('profile.edit')}</button>
                    <button onClick={() => onDelete?.(participant.id)} className="flex-1 sm:flex-initial px-10 py-4 bg-red-600/10 hover:bg-red-600 text-red-600 hover:text-white border border-red-600/30 rounded-2xl text-[11px] font-avenir-bold uppercase transition-all">{t('profile.deactivate')}</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div >
  );
};

export default ProfileModal;
