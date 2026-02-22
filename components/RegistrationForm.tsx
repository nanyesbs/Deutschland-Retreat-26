
import React, { useState, useMemo } from 'react';
import { api } from '../services/api';
import { COUNTRY_LIST, ROLE_OPTIONS, SOCIAL_PLATFORMS, COUNTRY_CALLING_CODES } from '../constants';
import { Country, State, City } from 'country-state-city';
import { findCountry, processParticipant } from '../utils';
import { ChevronRight, ChevronLeft, Save, Send, Camera, Sparkles, User, Mail, Globe, Phone, Building2, Info, Loader2, CheckCircle2, Plus, X, MessageCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { SocialAccount } from '../types';

const RegistrationForm: React.FC = () => {
    const { t } = useTranslation();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<'idle' | 'saving' | 'submitting' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');

    const [formData, setFormData] = useState({
        // Step 1: Identity
        email: '',
        fullName: '',
        residentCountry: '',
        state: '',
        city: '',
        nationality: '',
        shortBio: '',
        // Step 2: Ministry
        profilePicture: null as File | null,
        ministryName: '',
        ministryDescription: '',
        promoPicture: null as File | null,
        // Step 3: Contact & Extras
        phoneCountryCode: 'DE',
        phone: '',
        isWhatsapp: false,
        contactEmail: '',
        otherContact: '',
        // Step 4: Testimony & Dietary
        testimony: '',
        upcomingEvents: '',
        dietaryRestrictions: '',
    });

    const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
    const [socialAccounts, setSocialAccounts] = useState<SocialAccount[]>([]);
    const [openCategories, setOpenCategories] = useState<string[]>([]);
    const [dddSearch, setDddSearch] = useState('');
    const [showDddDropdown, setShowDddDropdown] = useState(false);

    const [previewUrls, setPreviewUrls] = useState({
        profile: '',
        promo: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, files } = e.target;
        if (files && files[0]) {
            const file = files[0];
            setFormData(prev => ({ ...prev, [name]: file }));

            const url = URL.createObjectURL(file);
            setPreviewUrls(prev => ({
                ...prev,
                [name === 'profilePicture' ? 'profile' : 'promo']: url
            }));
        }
    };

    const availableStates = formData.residentCountry ? State.getStatesOfCountry(formData.residentCountry) : [];
    const availableCities = formData.state ? City.getCitiesOfState(formData.residentCountry, formData.state) : [];
    // Memoize the full country list to avoid 1-2s INP block on every render
    const allCountries = useMemo(() => Country.getAllCountries(), []);

    const handleNext = () => setStep(prev => Math.min(prev + 1, 4));
    const handleBack = () => setStep(prev => Math.max(prev - 1, 1));

    const prepareParticipantData = async () => {
        let photoUrl = '';
        let promoPhotoUrl = '';

        if (formData.profilePicture) {
            photoUrl = await api.uploadImage(formData.profilePicture, `profile-${formData.email}`);
        }

        if (formData.promoPicture) {
            promoPhotoUrl = await api.uploadImage(formData.promoPicture, `promo-${formData.email}`);
        }

        const rawParticipant = {
            name: formData.fullName,
            email: formData.email,
            title: selectedRoles.join(', '),
            organization: formData.ministryName,
            orgDescription: formData.ministryDescription,
            country: findCountry(formData.residentCountry),
            state: availableStates.find(s => s.isoCode === formData.state)?.name || formData.state,
            city: formData.city,
            nationality: findCountry(formData.nationality),
            shortBio: formData.shortBio,
            testimony: formData.testimony,
            phone: formData.phone ? `${COUNTRY_CALLING_CODES[formData.phoneCountryCode] || ''}${formData.phone.replace(/^0+/, '')}` : '',
            isWhatsapp: formData.isWhatsapp,
            website: socialAccounts.find(s => s.platform === 'website')?.handle || '',
            socialMedia: socialAccounts,
            photoUrl: photoUrl,
            promoPhotoUrl: promoPhotoUrl,
            otherInfo: formData.otherContact,
            upcomingEvents: formData.upcomingEvents,
            contactEmail: formData.contactEmail,
            dietaryRestrictions: formData.dietaryRestrictions
        };

        return processParticipant(rawParticipant);
    };

    const handleSave = async (isSubmit = false) => {
        setLoading(true);
        setStatus(isSubmit ? 'submitting' : 'saving');
        setErrorMessage('');

        try {
            const processedData = await prepareParticipantData();
            await api.saveLeader(processedData);

            if (isSubmit) {
                setStatus('success');
            } else {
                setStatus('idle');
                alert('Draft saved successfully!');
            }
        } catch (err: any) {
            console.error(err);
            setStatus('error');
            setErrorMessage(err.message || 'Error synchronization payload');
        } finally {
            setLoading(false);
        }
    };

    if (status === 'success') {
        return (
            <div className="flex flex-col items-center justify-center py-32 animate-fade-in text-center px-4">
                <div className="w-24 h-24 bg-brand-heaven-gold/20 rounded-full flex items-center justify-center mb-8 border border-brand-heaven-gold/40 shadow-glow">
                    <CheckCircle2 size={48} className="text-brand-heaven-gold" />
                </div>
                <h2 className="text-3xl md:text-5xl font-extrabold text-white dark:text-white uppercase tracking-tighter mb-4 italic">{t('registration.completeTitle')}</h2>
                <p className="text-white/60 dark:text-white/60 font-avenir-roman max-w-md mx-auto mb-12">{t('registration.completeDesc')}</p>
                <button
                    onClick={() => window.location.reload()}
                    className="px-10 py-4 min-h-[44px] bg-brand-heaven-gold text-white dark:text-white rounded-button font-avenir-bold uppercase text-sm md:text-base tracking-widest hover:scale-105 transition-all shadow-glow"
                >
                    {t('registration.returnDir')}
                </button>
            </div>
        );
    }

    return (
        <div className="w-full max-w-4xl mx-auto animate-fade-in">
            {/* Header Section */}
            <div className="mb-16 text-center">
                <h2 className="text-xs font-avenir-bold text-brand-heaven-gold uppercase tracking-[0.4em] mb-4">{t('registration.protocol')}</h2>
                <h1 className="text-3xl md:text-6xl font-extrabold text-white dark:text-white uppercase tracking-tighter leading-none italic mb-6">{t('registration.title')}</h1>
                <div className="max-w-3xl mx-auto mt-8 relative">
                    <div className="flex items-center justify-between mb-12 px-2 md:px-6 relative z-10">
                        {[1, 2, 3, 4].map(num => (
                            <div key={num} className="flex flex-col items-center gap-3 relative z-10 group">
                                <div className={`w-10 h-10 md:w-14 md:h-14 rounded-full flex items-center justify-center text-[10px] md:text-[12px] font-avenir-bold transition-all duration-500 ease-out focus-outline border-2 ${step === num ? 'bg-white dark:bg-[#050505] border border-stone-200 dark:border-stone-800 border-brand-heaven-gold text-brand-heaven-gold scale-110' :
                                    step > num ? 'bg-white dark:bg-[#050505] border border-stone-200 dark:border-stone-800 border-transparent text-white/50 dark:text-white/50 hover:shadow-neu-pressed' :
                                        'bg-white dark:bg-[#050505] border border-stone-200 dark:border-stone-800 border-transparent text-white/20 dark:text-white/20'
                                    }`}>
                                    {step > num ? <CheckCircle2 size={16} className="text-brand-heaven-gold/50" /> : `0${num}`}
                                </div>
                                <span className={`text-[8px] md:text-[10px] uppercase tracking-[3px] font-avenir-bold transition-all duration-300 absolute -bottom-6 w-max text-center ${step === num ? 'text-brand-heaven-gold translate-y-0 opacity-100' : 'text-white/20 dark:text-white/20 translate-y-1 opacity-0 group-hover:opacity-100'}`}>
                                    {num === 1 ? t('registration.welcome.title').split('\\n')[0] : num === 2 ? t('registration.step2.label').split(' ')[1] : num === 3 ? t('registration.step3.label').split(' ')[1] : t('registration.step4.label').split(' ')[1]}
                                </span>
                            </div>
                        ))}
                        <div className="absolute top-1/2 md:top-7 left-10 md:left-14 right-10 md:right-14 h-[2px] bg-white dark:bg-[#050505] border border-stone-200 dark:border-stone-800 -z-10 rounded-full" />
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-[#050505] border border-stone-200 dark:border-stone-800 rounded-2xl sm:rounded-3xl md:rounded-[3rem] p-5 sm:p-8 md:p-12 mb-10 overflow-visible relative transition-all duration-500">
                <div className="absolute top-0 right-0 w-64 h-64 bg-brand-heaven-gold/5 blur-[100px] pointer-events-none" />

                <form onSubmit={(e) => e.preventDefault()} className="space-y-10 relative">

                    {/* STEP 1: ATTENDING LEADERS */}
                    {step === 1 && (
                        <div className="animate-slide-up space-y-8">
                            <div className="border-l-2 border-brand-heaven-gold pl-6 space-y-4">
                                <h2 className="text-xs md:text-sm font-avenir-bold text-brand-heaven-gold uppercase tracking-[0.3em] md:tracking-[0.4em] mb-2">{t('registration.step1.label')}</h2>
                                <h3 className="text-xl md:text-2xl font-avenir-bold text-white dark:text-white uppercase tracking-wider mb-2">
                                    <span className="text-brand-heaven-gold mr-3">{t('registration.step1.label')}</span><br className="md:hidden" />
                                    {t('registration.step1.title')}
                                </h3>
                                <div className="text-xs md:text-sm text-white/60 dark:text-white/60 font-avenir-roman space-y-4 leading-relaxed max-w-2xl">
                                    <p>{t('registration.step1.p1')}</p>
                                    <p>{t('registration.step1.p2')}</p>
                                    <p>{t('registration.step1.p3')}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <label className="text-xs md:text-sm font-avenir-bold text-brand-heaven-gold uppercase tracking-wide md:tracking-widest pl-2 flex items-center gap-2">
                                        <Mail size={12} /> {t('registration.step1.email')}
                                    </label>
                                    <input
                                        type="email" name="email" value={formData.email} onChange={handleChange} required
                                        placeholder={t('registration.step1.emailPlaceholder')}
                                        className="w-full bg-white dark:bg-[#050505] border border-stone-200 dark:border-stone-800 px-0 py-3 text-[16px] text-white dark:text-white outline-none border-b border-white/20 dark:border-black/20 focus:border-brand-heaven-gold dark:focus:border-brand-heaven-gold bg-transparent transition-all placeholder:text-white/20 dark:placeholder:text-black/20"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-avenir-bold text-brand-heaven-gold uppercase tracking-widest pl-2">{t('registration.step1.fullName')}</label>
                                    <input
                                        type="text" name="fullName" value={formData.fullName} onChange={handleChange} required
                                        placeholder={t('registration.step1.fullNamePlaceholder')}
                                        className="w-full bg-white dark:bg-[#050505] border border-stone-200 dark:border-stone-800 px-0 py-3 text-[16px] text-white dark:text-white outline-none border-b border-white/20 dark:border-black/20 focus:border-brand-heaven-gold dark:focus:border-brand-heaven-gold bg-transparent transition-all placeholder:text-white/20 dark:placeholder:text-black/20"
                                    />
                                    <p className="text-[10px] md:text-xs text-brand-heaven-gold/50 font-avenir-bold uppercase tracking-[0.05em] md:tracking-[0.1em] pl-2 mt-2">{t('registration.step1.nameNote')}</p>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-avenir-bold text-brand-heaven-gold uppercase tracking-widest pl-2 flex items-center gap-2">
                                        <Globe size={12} /> {t('registration.step1.country')}
                                    </label>
                                    <div className="relative">
                                        <select
                                            name="residentCountry"
                                            value={formData.residentCountry}
                                            onChange={(e) => {
                                                setFormData(prev => ({
                                                    ...prev,
                                                    residentCountry: e.target.value,
                                                    state: '',
                                                    city: ''
                                                }));
                                            }}
                                            className="w-full bg-white dark:bg-[#050505] border border-stone-200 dark:border-stone-800 px-0 py-3 text-[16px] text-white dark:text-white outline-none border-b border-white/20 dark:border-black/20 focus:border-brand-heaven-gold dark:focus:border-brand-heaven-gold bg-transparent transition-all appearance-none"
                                        >
                                            <option value="" disabled className="bg-white dark:bg-[#050505] border border-stone-200 dark:border-stone-800">{t('registration.step1.selectCountry')} (Optional)</option>
                                            {allCountries.map(c => (
                                                <option key={c.isoCode} value={c.isoCode} className="bg-white dark:bg-[#050505] border border-stone-200 dark:border-stone-800">{c.flag} {c.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-avenir-bold text-brand-heaven-gold uppercase tracking-widest pl-2">State / Province</label>
                                    <div className="relative">
                                        <select
                                            name="state"
                                            value={formData.state}
                                            onChange={(e) => {
                                                setFormData(prev => ({
                                                    ...prev,
                                                    state: e.target.value,
                                                    city: ''
                                                }));
                                            }}
                                            disabled={!formData.residentCountry || availableStates.length === 0}
                                            required={availableStates.length > 0}
                                            className="w-full bg-white dark:bg-[#050505] border border-stone-200 dark:border-stone-800 px-0 py-3 text-[16px] text-white dark:text-white outline-none border-b border-white/20 dark:border-black/20 focus:border-brand-heaven-gold dark:focus:border-brand-heaven-gold bg-transparent transition-all appearance-none disabled:opacity-50"
                                        >
                                            <option value="" disabled className="bg-white dark:bg-[#050505] border border-stone-200 dark:border-stone-800">Select State / Province</option>
                                            {availableStates.map(s => (
                                                <option key={s.isoCode} value={s.isoCode} className="bg-white dark:bg-[#050505] border border-stone-200 dark:border-stone-800">
                                                    {s.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-avenir-bold text-brand-heaven-gold uppercase tracking-widest pl-2">City (Primary Location)</label>
                                    <div className="relative">
                                        <select
                                            name="city" value={formData.city} onChange={handleChange} required
                                            disabled={!formData.state || availableCities.length === 0}
                                            className="w-full bg-white dark:bg-[#050505] border border-stone-200 dark:border-stone-800 px-0 py-3 text-[16px] text-white dark:text-white outline-none border-b border-white/20 dark:border-black/20 focus:border-brand-heaven-gold dark:focus:border-brand-heaven-gold bg-transparent transition-all appearance-none disabled:opacity-50"
                                        >
                                            <option value="" disabled className="bg-white dark:bg-[#050505] border border-stone-200 dark:border-stone-800">Select City</option>
                                            {availableCities.map(c => (
                                                <option key={c.name} value={c.name} className="bg-white dark:bg-[#050505] border border-stone-200 dark:border-stone-800">
                                                    {c.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-avenir-bold text-brand-heaven-gold uppercase tracking-widest pl-2">{t('registration.step1.nationality')}</label>
                                    <div className="relative">
                                        <select
                                            name="nationality" value={formData.nationality} onChange={handleChange} required
                                            className="w-full bg-white dark:bg-[#050505] border border-stone-200 dark:border-stone-800 px-0 py-3 text-[16px] text-white dark:text-white outline-none border-b border-white/20 dark:border-black/20 focus:border-brand-heaven-gold dark:focus:border-brand-heaven-gold bg-transparent transition-all appearance-none"
                                        >
                                            <option value="" disabled className="bg-white dark:bg-[#050505] border border-stone-200 dark:border-stone-800">{t('registration.step1.selectCountry')}</option>
                                            {COUNTRY_LIST.map(c => (
                                                <option key={c.code} value={c.name} className="bg-white dark:bg-[#050505] border border-stone-200 dark:border-stone-800">{c.flag} {c.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-avenir-bold text-brand-heaven-gold uppercase tracking-widest pl-2">{t('registration.step1.bio')}</label>
                                <textarea
                                    name="shortBio" value={formData.shortBio} onChange={handleChange} required
                                    rows={4}
                                    placeholder={t('registration.step1.bioPlaceholder')}
                                    className="w-full bg-white dark:bg-[#050505] border border-stone-200 dark:border-stone-800 px-0 py-3 text-[16px] text-white dark:text-white outline-none border-b border-white/20 dark:border-black/20 focus:border-brand-heaven-gold dark:focus:border-brand-heaven-gold bg-transparent transition-all resize-none min-h-[140px] leading-relaxed placeholder:text-white/20 dark:placeholder:text-black/20"
                                />
                            </div>
                        </div>
                    )}

                    {/* STEP 2: MINISTRY INFORMATION */}
                    {step === 2 && (
                        <div className="animate-slide-up space-y-10">
                            <div className="border-l-2 border-brand-heaven-gold pl-6 space-y-2">
                                <h2 className="text-[10px] font-avenir-bold text-brand-heaven-gold uppercase tracking-[0.4em] mb-2">{t('registration.step2.label')}</h2>
                                <h3 className="text-xl md:text-2xl font-avenir-bold text-white dark:text-white uppercase tracking-wider mb-2">
                                    <span className="text-brand-heaven-gold mr-3">{t('registration.step2.label')}</span><br className="md:hidden" />
                                    {t('registration.step2.title')}
                                </h3>
                                <p className="text-[10px] text-white/40 dark:text-white/40 uppercase tracking-widest leading-relaxed">{t('registration.step2.consent')}</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-avenir-bold text-brand-heaven-gold uppercase tracking-widest pl-2 flex items-center gap-2">
                                            <Building2 size={12} /> {t('registration.step2.orgName')}
                                        </label>
                                        <input
                                            type="text" name="ministryName" value={formData.ministryName} onChange={handleChange} required
                                            placeholder={t('registration.step2.orgPlaceholder')}
                                            className="w-full bg-white dark:bg-[#050505] border border-stone-200 dark:border-stone-800 px-0 py-3 text-[16px] text-white dark:text-white outline-none border-b border-white/20 dark:border-black/20 focus:border-brand-heaven-gold dark:focus:border-brand-heaven-gold bg-transparent transition-all placeholder:text-white/20 dark:placeholder:text-black/20"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-avenir-bold text-brand-heaven-gold uppercase tracking-widest pl-2">{t('registration.step2.roles')} (max 5)</label>
                                        <p className="text-[8px] text-white/30 uppercase tracking-[0.15em] pl-2 pb-2">Click a category to expand and select roles</p>
                                        {/* Collapsible Category groups */}
                                        {Array.from(new Set(ROLE_OPTIONS.map(r => r.category))).map(cat => {
                                            const isOpen = openCategories.includes(cat);
                                            const catRoles = ROLE_OPTIONS.filter(r => r.category === cat);
                                            const selectedInCat = catRoles.filter(r => selectedRoles.includes(r.label)).length;
                                            return (
                                                <div key={cat} className="border-b border-white/5 last:border-0">
                                                    <button
                                                        type="button"
                                                        onClick={() => setOpenCategories(p => p.includes(cat) ? p.filter(c => c !== cat) : [...p, cat])}
                                                        className="w-full flex items-center justify-between py-3 px-2 text-left hover:bg-white/[0.02] rounded-xl transition-colors group"
                                                    >
                                                        <span className="flex items-center gap-2">
                                                            <span className={`text-[10px] font-avenir-bold uppercase tracking-wider transition-colors ${isOpen ? 'text-brand-heaven-gold' : 'text-white/50 group-hover:text-white/80'}`}>
                                                                — {cat}
                                                            </span>
                                                            {selectedInCat > 0 && (
                                                                <span className="text-[8px] bg-brand-heaven-gold/20 text-brand-heaven-gold px-2 py-0.5 rounded-full font-avenir-bold">
                                                                    {selectedInCat}/4
                                                                </span>
                                                            )}
                                                        </span>
                                                        <ChevronRight size={12} className={`text-white/20 transition-transform ${isOpen ? 'rotate-90 text-brand-heaven-gold' : ''}`} />
                                                    </button>
                                                    {isOpen && (
                                                        <div className="flex flex-wrap gap-2 px-2 pb-4">
                                                            {catRoles.map(role => {
                                                                const isSelected = selectedRoles.includes(role.label);
                                                                const isDisabled = !isSelected && selectedInCat >= 4;
                                                                return (
                                                                    <button
                                                                        key={role.label}
                                                                        type="button"
                                                                        disabled={isDisabled}
                                                                        onClick={() => {
                                                                            if (isSelected) {
                                                                                setSelectedRoles(p => p.filter(r => r !== role.label));
                                                                            } else if (selectedInCat < 4) {
                                                                                setSelectedRoles(p => [...p, role.label]);
                                                                            }
                                                                        }}
                                                                        className={`px-3 py-1.5 rounded-full text-[9px] font-avenir-bold uppercase tracking-wider transition-all border ${isSelected
                                                                            ? 'bg-brand-heaven-gold/20 border-brand-heaven-gold text-brand-heaven-gold'
                                                                            : isDisabled
                                                                                ? 'border-white/5 text-white/10 cursor-not-allowed'
                                                                                : 'border-white/10 text-white/50 hover:border-brand-heaven-gold/50 hover:text-white/80'
                                                                            }`}
                                                                    >
                                                                        {isSelected && <span className="mr-1">✓</span>}
                                                                        {role.label}
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                        {/* Selected roles summary */}
                                        {selectedRoles.length > 0 && (
                                            <div className="flex flex-wrap gap-1.5 pt-3 px-2">
                                                {selectedRoles.map(r => (
                                                    <span key={r} className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-heaven-gold/15 border border-brand-heaven-gold/30 text-[8px] text-brand-heaven-gold font-avenir-bold uppercase tracking-wider">
                                                        {r}
                                                        <button type="button" onClick={() => setSelectedRoles(p => p.filter(x => x !== r))} className="hover:text-white transition-colors">
                                                            <X size={9} />
                                                        </button>
                                                    </span>
                                                ))}
                                                <span className="text-[8px] text-white/25 pl-1 self-center">{selectedRoles.length}/5</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-avenir-bold text-brand-heaven-gold uppercase tracking-widest pl-2">{t('registration.step2.desc')}</label>
                                        <textarea
                                            name="ministryDescription" value={formData.ministryDescription} onChange={handleChange}
                                            rows={4}
                                            className="w-full bg-white dark:bg-[#050505] border border-stone-200 dark:border-stone-800 px-0 py-3 text-[16px] text-white dark:text-white outline-none border-b border-white/20 dark:border-black/20 focus:border-brand-heaven-gold dark:focus:border-brand-heaven-gold bg-transparent transition-all resize-none min-h-[140px] leading-relaxed placeholder:text-white/20 dark:placeholder:text-black/20"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-8">
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-avenir-bold text-brand-heaven-gold uppercase tracking-widest flex items-center gap-2">
                                            <Camera size={14} /> Profile Picture of You *
                                        </label>
                                        <p className="text-[8px] text-white/30 dark:text-white/40 uppercase tracking-[0.1em] px-1 leading-normal">This photo will help other leaders to recognize you after the event. Please only upload a photo of yourself. This photo will appear in the Leaders' Brochure.</p>
                                        <div className="relative group">
                                            <div className="w-full aspect-square bg-white dark:bg-[#050505] border border-stone-200 dark:border-stone-800 rounded-[2rem] flex flex-col items-center justify-center overflow-hidden transition-all border border-white/20 dark:border-black/20 hover:border-brand-heaven-gold dark:hover:border-brand-heaven-gold">
                                                {previewUrls.profile ? (
                                                    <img src={previewUrls.profile} className="w-full h-full object-cover" alt="Profile preview" />
                                                ) : (
                                                    <>
                                                        <User size={32} className="text-brand-heaven-gold/50 mb-4" />
                                                        <span className="text-[10px] text-white/40 dark:text-white/40 uppercase tracking-widest font-avenir-bold">Upload JPG/PNG</span>
                                                    </>
                                                )}
                                                <input
                                                    type="file" name="profilePicture" onChange={handleFileChange} accept="image/*" required
                                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <label className="text-[10px] font-avenir-bold text-brand-heaven-gold uppercase tracking-widest flex items-center gap-2">
                                            <Sparkles size={14} /> Promotional Picture
                                        </label>
                                        <p className="text-[8px] text-white/30 dark:text-white/40 uppercase tracking-[0.1em] px-1 leading-normal">If you would like to promote an event, initiative or your ministry, you are welcome to add it to this brochure.</p>
                                        <div className="relative group">
                                            <div className="w-full aspect-video bg-white dark:bg-[#050505] border border-stone-200 dark:border-stone-800 rounded-[2rem] flex flex-col items-center justify-center overflow-hidden transition-all border border-white/20 dark:border-black/20 hover:border-brand-heaven-gold dark:hover:border-brand-heaven-gold">
                                                {previewUrls.promo ? (
                                                    <img src={previewUrls.promo} className="w-full h-full object-cover" alt="Promo preview" />
                                                ) : (
                                                    <>
                                                        <Camera size={32} className="text-brand-heaven-gold/50 mb-4" />
                                                        <span className="text-[10px] text-white/40 dark:text-white/40 uppercase tracking-widest font-avenir-bold">Company Flyer / Logo / Promo</span>
                                                    </>
                                                )}
                                                <input
                                                    type="file" name="promoPicture" onChange={handleFileChange} accept="image/*"
                                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 3: CONTACT INFO */}
                    {step === 3 && (
                        <div className="animate-slide-up space-y-8">
                            <div className="border-l-2 border-brand-heaven-gold pl-6 space-y-2">
                                <h2 className="text-[10px] font-avenir-bold text-brand-heaven-gold uppercase tracking-[0.4em] mb-2">{t('registration.step3.label')}</h2>
                                <h3 className="text-xl md:text-2xl font-avenir-bold text-white dark:text-white uppercase tracking-wider mb-2">
                                    {t('registration.step3.title')}
                                </h3>
                                <div className="text-[10px] text-white/40 dark:text-white/40 uppercase tracking-widest leading-relaxed">
                                    <p>{t('registration.step3.publicNote')}</p>
                                    <p>{t('registration.step3.privacyNote')}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Phone with country code */}
                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-[10px] font-avenir-bold text-brand-heaven-gold uppercase tracking-widest pl-2 flex items-center gap-2">
                                        <Phone size={12} /> {t('registration.step3.phone')} <span className="text-white/30">(E.164)</span>
                                    </label>
                                    <div className="flex gap-3 items-end">
                                        {/* Searchable DDD / Country Code */}
                                        <div className="relative w-28 sm:w-44 shrink-0">
                                            <input
                                                type="text"
                                                value={dddSearch || (COUNTRY_CALLING_CODES[formData.phoneCountryCode] ? `${allCountries.find(c => c.isoCode === formData.phoneCountryCode)?.flag || ''} ${COUNTRY_CALLING_CODES[formData.phoneCountryCode]}` : '')}
                                                onFocus={() => { setDddSearch(''); setShowDddDropdown(true); }}
                                                onBlur={() => setTimeout(() => { setShowDddDropdown(false); setDddSearch(''); }, 150)}
                                                onChange={(e) => { setDddSearch(e.target.value); setShowDddDropdown(true); }}
                                                placeholder="🌐 +49"
                                                className="w-full bg-transparent border-b border-white/20 py-3 text-[14px] text-white/80 outline-none focus:border-brand-heaven-gold transition-all placeholder:text-white/30"
                                            />
                                            {showDddDropdown && (
                                                <div className="absolute z-50 top-full left-0 mt-1 w-64 max-h-52 overflow-y-auto bg-[#111] border border-white/10 rounded-2xl shadow-2xl custom-scrollbar">
                                                    {allCountries
                                                        .filter(c => {
                                                            const code = COUNTRY_CALLING_CODES[c.isoCode] || '';
                                                            const q = dddSearch.replace('+', '').toLowerCase();
                                                            return !q || c.name.toLowerCase().includes(q) || code.includes(q);
                                                        })
                                                        .map(c => (
                                                            <button
                                                                key={c.isoCode}
                                                                type="button"
                                                                onMouseDown={() => {
                                                                    setFormData(prev => ({ ...prev, phoneCountryCode: c.isoCode }));
                                                                    setDddSearch('');
                                                                    setShowDddDropdown(false);
                                                                }}
                                                                className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-brand-heaven-gold/10 transition-colors"
                                                            >
                                                                <span className="text-base">{c.flag}</span>
                                                                <span className="text-[11px] text-white/80 font-avenir-bold flex-1 truncate">{c.name}</span>
                                                                <span className="text-[11px] text-brand-heaven-gold font-avenir-bold shrink-0">{COUNTRY_CALLING_CODES[c.isoCode] || ''}</span>
                                                            </button>
                                                        ))
                                                    }
                                                </div>
                                            )}
                                        </div>
                                        <input
                                            type="tel" name="phone" value={formData.phone} onChange={handleChange}
                                            placeholder="123 456 7890"
                                            className="flex-1 bg-transparent border-b border-white/20 py-3 text-[16px] text-white outline-none focus:border-brand-heaven-gold transition-all placeholder:text-white/20"
                                        />
                                    </div>
                                    <label className="flex items-center gap-3 pl-1 pt-3 cursor-pointer group">
                                        <div
                                            onClick={() => setFormData(p => ({ ...p, isWhatsapp: !p.isWhatsapp }))}
                                            className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${formData.isWhatsapp ? 'bg-[#25D366] border-[#25D366]' : 'border-white/20 group-hover:border-[#25D366]/50'
                                                }`}
                                        >
                                            {formData.isWhatsapp && <CheckCircle2 size={12} className="text-white" />}
                                        </div>
                                        <span className="text-[10px] font-avenir-bold uppercase tracking-widest text-white/50 group-hover:text-white/80 transition-colors flex items-center gap-2">
                                            <MessageCircle size={12} className="text-[#25D366]" />
                                            This number is on WhatsApp
                                        </span>
                                    </label>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-avenir-bold text-brand-heaven-gold uppercase tracking-widest pl-2">{t('registration.step3.contactEmail')}</label>
                                    <input
                                        type="email" name="contactEmail" value={formData.contactEmail} onChange={handleChange}
                                        placeholder={t('registration.step3.contactEmailPlaceholder')}
                                        className="w-full bg-white dark:bg-[#050505] border border-stone-200 dark:border-stone-800 px-0 py-3 text-[16px] text-white dark:text-white outline-none border-b border-white/20 dark:border-black/20 focus:border-brand-heaven-gold dark:focus:border-brand-heaven-gold bg-transparent transition-all placeholder:text-white/20 dark:placeholder:text-black/20"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-avenir-bold text-brand-heaven-gold uppercase tracking-widest pl-2">{t('registration.step3.other')}</label>
                                    <input
                                        type="text" name="otherContact" value={formData.otherContact} onChange={handleChange}
                                        placeholder={t('registration.step3.otherPlaceholder')}
                                        className="w-full bg-white dark:bg-[#050505] border border-stone-200 dark:border-stone-800 px-0 py-3 text-[16px] text-white dark:text-white outline-none border-b border-white/20 dark:border-black/20 focus:border-brand-heaven-gold dark:focus:border-brand-heaven-gold bg-transparent transition-all placeholder:text-white/20 dark:placeholder:text-black/20"
                                    />
                                </div>

                                {/* Social Media Builder */}
                                <div className="space-y-4 md:col-span-2">
                                    <label className="text-[10px] font-avenir-bold text-brand-heaven-gold uppercase tracking-widest pl-2 flex items-center gap-2">
                                        <Globe size={12} /> Social Media
                                    </label>
                                    <div className="space-y-3">
                                        {socialAccounts.map((acc, idx) => {
                                            const platform = SOCIAL_PLATFORMS.find(p => p.id === acc.platform);
                                            return (
                                                <div key={idx} className="flex flex-col gap-2 p-4 rounded-2xl border border-white/10 bg-white/[0.02]">
                                                    <div className="flex items-center gap-3">
                                                        <select
                                                            value={acc.platform}
                                                            onChange={(e) => setSocialAccounts(prev => prev.map((a, i) => i === idx ? { ...a, platform: e.target.value, handle: '' } : a))}
                                                            className="bg-transparent border-b border-white/20 py-2 text-[12px] text-white/70 outline-none focus:border-brand-heaven-gold transition-all appearance-none flex-1"
                                                        >
                                                            {SOCIAL_PLATFORMS.map(p => <option key={p.id} value={p.id} className="bg-[#050505]">{p.label}</option>)}
                                                        </select>
                                                        {/* Personal / Ministerial toggle */}
                                                        <div className="flex rounded-full border border-white/10 overflow-hidden text-[8px] font-avenir-bold shrink-0">
                                                            <button type="button" onClick={() => setSocialAccounts(prev => prev.map((a, i) => i === idx ? { ...a, type: 'personal' } : a))}
                                                                className={`px-3 py-1.5 uppercase tracking-wider transition-colors ${acc.type === 'personal' ? 'bg-brand-heaven-gold/20 text-brand-heaven-gold' : 'text-white/30 hover:text-white/60'}`}>
                                                                Personal
                                                            </button>
                                                            <button type="button" onClick={() => setSocialAccounts(prev => prev.map((a, i) => i === idx ? { ...a, type: 'ministerial' } : a))}
                                                                className={`px-3 py-1.5 uppercase tracking-wider transition-colors ${acc.type === 'ministerial' ? 'bg-brand-heaven-gold/20 text-brand-heaven-gold' : 'text-white/30 hover:text-white/60'}`}>
                                                                Ministry
                                                            </button>
                                                        </div>
                                                        <button type="button" onClick={() => setSocialAccounts(prev => prev.filter((_, i) => i !== idx))}
                                                            className="p-1.5 rounded-full hover:bg-red-500/20 text-white/30 hover:text-red-400 transition-colors shrink-0">
                                                            <X size={12} />
                                                        </button>
                                                    </div>
                                                    <input
                                                        value={acc.handle}
                                                        onChange={(e) => setSocialAccounts(prev => prev.map((a, i) => i === idx ? { ...a, handle: e.target.value } : a))}
                                                        placeholder={platform?.placeholder || '@handle'}
                                                        className="bg-transparent border-b border-white/10 py-2 text-[14px] text-white outline-none focus:border-brand-heaven-gold transition-all placeholder:text-white/15"
                                                    />
                                                </div>
                                            );
                                        })}
                                        <button
                                            type="button"
                                            onClick={() => setSocialAccounts(prev => [...prev, { platform: 'instagram', handle: '', type: 'personal' }])}
                                            className="flex items-center gap-2 text-[9px] text-white/40 hover:text-brand-heaven-gold uppercase tracking-widest font-avenir-bold transition-colors py-2 px-1"
                                        >
                                            <Plus size={12} /> Add Social Media
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 4: TESTIMONIES & EXTRAS */}
                    {step === 4 && (
                        <div className="animate-slide-up space-y-8">
                            <div className="border-l-2 border-brand-heaven-gold pl-6 space-y-2">
                                <h2 className="text-[10px] font-avenir-bold text-brand-heaven-gold uppercase tracking-[0.4em] mb-2">{t('registration.step4.label')}</h2>
                                <h3 className="text-xl md:text-2xl font-avenir-bold text-white dark:text-white uppercase tracking-wider mb-2">
                                    <span className="text-brand-heaven-gold mr-3">{t('registration.step4.label')}</span><br className="md:hidden" />
                                    {t('registration.step4.title')}
                                </h3>
                                <p className="text-[10px] text-white/40 dark:text-white/40 uppercase tracking-widest leading-relaxed">{t('registration.step4.testimonyNote')}</p>
                            </div>

                            <div className="space-y-8">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-avenir-bold text-brand-heaven-gold uppercase tracking-widest pl-2">Testimony *</label>
                                    <textarea
                                        name="testimony" value={formData.testimony} onChange={handleChange} required
                                        rows={5}
                                        placeholder={t('registration.step4.testimonyPlaceholder')}
                                        className="w-full bg-white dark:bg-[#050505] border border-stone-200 dark:border-stone-800 px-0 py-3 text-[16px] text-white dark:text-white outline-none border-b border-white/20 dark:border-black/20 focus:border-brand-heaven-gold dark:focus:border-brand-heaven-gold bg-transparent transition-all resize-none min-h-[140px] leading-relaxed placeholder:text-white/20 dark:placeholder:text-black/20"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-avenir-bold text-brand-heaven-gold uppercase tracking-widest pl-2">{t('registration.step4.events')}</label>
                                    <p className="text-[8px] text-white/30 dark:text-white/40 uppercase tracking-[0.1em] mb-2 pl-2">{t('registration.step4.eventsNote')}</p>
                                    <textarea
                                        name="upcomingEvents" value={formData.upcomingEvents} onChange={handleChange}
                                        rows={3}
                                        placeholder={t('registration.step4.eventsPlaceholder')}
                                        className="w-full bg-white dark:bg-[#050505] border border-stone-200 dark:border-stone-800 px-0 py-3 text-[16px] text-white dark:text-white outline-none border-b border-white/20 dark:border-black/20 focus:border-brand-heaven-gold dark:focus:border-brand-heaven-gold bg-transparent transition-all resize-none min-h-[100px] leading-relaxed placeholder:text-white/20 dark:placeholder:text-black/20"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-avenir-bold text-brand-heaven-gold uppercase tracking-widest pl-2">{t('registration.step4.diet')} *</label>
                                    <input
                                        type="text" name="dietaryRestrictions" value={formData.dietaryRestrictions} onChange={handleChange} required
                                        placeholder={t('registration.step4.dietPlaceholder')}
                                        className="w-full bg-white dark:bg-[#050505] border border-stone-200 dark:border-stone-800 px-0 py-3 text-[16px] text-white dark:text-white outline-none border-b border-white/20 dark:border-black/20 focus:border-brand-heaven-gold dark:focus:border-brand-heaven-gold bg-transparent transition-all placeholder:text-white/20 dark:placeholder:text-black/20"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ACTIONS */}
                    <div className="pt-10 mt-10 border-t-2 border-[var(--bg-surface)] flex flex-col sm:flex-row items-center justify-between gap-6 relative z-10 w-full">
                        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[var(--bg-surface)] to-transparent -mt-[2px]" />
                        <div className="flex items-center gap-4 w-full sm:w-auto">
                            {step > 1 && (
                                <button
                                    type="button"
                                    onClick={handleBack}
                                    className="px-6 py-4 bg-white dark:bg-[#050505] border border-stone-200 dark:border-stone-800 active:text-white/50 dark:text-white/50 rounded-2xl font-avenir-bold uppercase text-[10px] tracking-widest hover:text-white dark:hover:text-black transition-all flex items-center gap-2 flex-1 sm:flex-none justify-center"
                                >
                                    <ChevronLeft size={16} /> {t('registration.actions.prev')}
                                </button>
                            )}
                            {step < 4 && (
                                <button
                                    type="button"
                                    onClick={handleNext}
                                    className="px-8 py-4 bg-white dark:bg-[#050505] border border-stone-200 dark:border-stone-800 active:text-brand-heaven-gold rounded-2xl font-avenir-bold uppercase text-[10px] tracking-widest hover:text-[#D3B962] transition-all flex items-center gap-2 flex-1 sm:flex-none justify-center"
                                >
                                    {t('registration.actions.next')} <ChevronRight size={16} />
                                </button>
                            )}
                        </div>

                        <div className="flex items-center gap-4 w-full sm:w-auto">
                            <button
                                type="button"
                                onClick={() => handleSave(false)}
                                disabled={loading}
                                className="px-6 py-4 bg-white dark:bg-[#050505] border border-stone-200 dark:border-stone-800 active:text-white/70 dark:text-white/70 rounded-2xl font-avenir-bold uppercase text-[10px] tracking-widest hover:text-white dark:hover:text-black transition-all flex items-center gap-2 flex-1 sm:flex-none justify-center"
                            >
                                {status === 'saving' ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                Save Draft
                            </button>
                            {step === 4 && (
                                <button
                                    type="button"
                                    onClick={() => handleSave(true)}
                                    disabled={loading}
                                    className="px-10 py-4 bg-white dark:bg-[#050505] border border-stone-200 dark:border-stone-800 active:text-brand-heaven-gold rounded-2xl font-avenir-bold uppercase text-[10px] tracking-widest hover:text-[#D3B962] hover:scale-105 transition-all flex items-center gap-2 flex-1 sm:flex-none justify-center font-bold"
                                >
                                    {status === 'submitting' ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                                    {t('registration.actions.submit')}
                                </button>
                            )}
                        </div>
                    </div>

                    {status === 'error' && (
                        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-button text-red-500 text-[10px] font-avenir-medium uppercase tracking-widest text-center animate-pulse">
                            Transmit Identity failed: {errorMessage}
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
};

export default RegistrationForm;
