
import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Analytics } from '@vercel/analytics/react';
import Header from './components/Header';
import Navbar from './components/Navbar';
import ParticipantCard from './components/ParticipantCard';
import ProfileModal from './components/ProfileModal';
import AdminConsole from './components/AdminConsole';
import RegistrationForm from './components/RegistrationForm';
import EntryPage from './components/EntryPage';
import MapView from './components/MapView';
import { Participant, ViewMode, Country, LayoutMode } from './types';
import { api } from './services/api';
import { COUNTRY_LIST, ALPHABET_GROUPS } from './constants';
import { sortParticipants, normalizeString, convertDriveUrl, findCountry, processParticipant } from './utils';
import { syncService } from './services/syncService';
import { Search, ShieldCheck, Users, Loader2, LayoutGrid, Moon, Sun, Globe, Building, Briefcase, Rows, Columns, Square, Filter, RefreshCcw, X } from 'lucide-react';

const App: React.FC = () => {
  const { t } = useTranslation();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('directory');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);
  const [layoutMode, setLayoutMode] = useState<LayoutMode>(() => {
    const saved = localStorage.getItem('ls_layout');
    return (saved as LayoutMode) || 'grid4';
  });
  const [darkMode] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return sessionStorage.getItem('esbs_auth') === 'true';
  });

  const [isAdminAuthorized, setIsAdminAuthorized] = useState(() => {
    return sessionStorage.getItem('esbs_admin_auth') === 'true';
  });
  const [activeEditingId, setActiveEditingId] = useState<string | null>(null);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  const [filterCountryCode, setFilterCountryCode] = useState<string>('ALL');
  const [filterMinistry, setFilterMinistry] = useState<string>('ALL');
  const [filterRole, setFilterRole] = useState<string>('ALL');

  const [filterLetter, setFilterLetter] = React.useState<string>('ALL');

  const participantsRef = React.useRef<Participant[]>([]);

  useEffect(() => {
    participantsRef.current = participants;
  }, [participants]);

  useEffect(() => {
    loadData();
    // Initial background sync after a short delay
    const initialSyncTimer = setTimeout(() => {
      performBackgroundSync();
    }, 5000);

    // Periodic sync every 15 minutes
    const interval = setInterval(() => {
      performBackgroundSync();
    }, 15 * 60 * 1000);

    return () => {
      clearTimeout(initialSyncTimer);
      clearInterval(interval);
    };
  }, []);

  const performBackgroundSync = async () => {
    try {
      // 1. Get the latest master sheet URL from Supabase settings
      const settings = await api.getSettings();
      const masterUrl = settings.sheet_url;

      // Prefer master URL, fallback to local (for development/overrides)
      const sheetUrl = masterUrl || localStorage.getItem('ls_sheet_url');

      if (!sheetUrl) return;

      console.log('Starting automated background sync...');
      // 2. Perform efficient batch sync (direct DB upsert)
      await syncService.batchSyncFromSheet(sheetUrl);

      // 3. Reload data locally to reflect changes
      const freshData = await api.getParticipants();

      const processedData = freshData.map(p => processParticipant(p));

      setParticipants(sortParticipants(processedData));
      console.log('Automated sync completed successfully.');

      // If we used a master URL, update local storage to match
      if (masterUrl) localStorage.setItem('ls_sheet_url', masterUrl);
    } catch (err) {
      console.error('Background sync failed:', err);
    }
  };

  useEffect(() => {
    localStorage.setItem('ls_layout', layoutMode);
  }, [layoutMode]);

  useEffect(() => {
    document.documentElement.classList.add('dark');
    localStorage.setItem('ls_theme', 'dark');
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await api.getParticipants();

      // Hotfix: Ensure any existing participants with broken/session-tied Drive links or incorrect country mappings are corrected on-the-fly
      const correctedData = data.map(p => {
        const processed = processParticipant(p);

        // Ensure flag synchronization logic is also applied
        if (processed.country) {
          const fresh = findCountry(processed.country.name);
          if (fresh.code !== '??') processed.country = fresh;
        }

        return processed;
      });

      setParticipants(sortParticipants(correctedData));
    } catch (err) {
      console.error('Core Offline');
    } finally {
      setLoading(false);
    }
  };

  const activeCountries = useMemo(() => {
    const countries = new Map<string, Country>();
    participants.forEach(p => {
      // If valid country info exists, add it to unique filter set
      if (p.country && p.country.code !== '??') {
        countries.set(p.country.code, p.country);
      }
    });
    return Array.from(countries.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [participants]);

  const uniqueMinistries = useMemo(() => Array.from(new Set(participants.map(p => p.organization))).sort(), [participants]);
  const uniqueRoles = useMemo(() => Array.from(new Set(participants.map(p => p.title))).sort(), [participants]);

  const filteredParticipants = useMemo(() => {
    const results = participants.filter(p => {
      const q = normalizeString(searchQuery);
      const matchesSearch = !q || p.searchName.includes(q) || p.searchOrg.includes(q);
      const matchesCountry = filterCountryCode === 'ALL' || p.country.code === filterCountryCode;
      const matchesMinistry = filterMinistry === 'ALL' || p.organization === filterMinistry;
      const matchesRole = filterRole === 'ALL' || p.title === filterRole;

      let matchesLetter = true;
      if (filterLetter !== 'ALL') {
        matchesLetter = (p.searchName || '').charAt(0) === filterLetter;
      }

      return matchesSearch && matchesCountry && matchesMinistry && matchesRole && matchesLetter;
    });
    // Apply sorting to the filtered list
    return sortParticipants(results);
  }, [participants, searchQuery, filterCountryCode, filterMinistry, filterRole, filterLetter]);

  const handleAdd = async (p: Omit<Participant, 'id'>) => {
    const fresh = await api.addParticipant(p);
    setParticipants(prev => sortParticipants([...prev, processParticipant(fresh)]));
  };

  const handleUpdate = async (id: string, updates: Partial<Participant>) => {
    const updated = await api.updateParticipant(id, updates);
    setParticipants(prev => sortParticipants(prev.map(p => p.id === id ? processParticipant(updated) : p)));
  };

  const handleAuthorize = (value: boolean) => {
    setIsAdminAuthorized(value);
    if (value) {
      sessionStorage.setItem('esbs_admin_auth', 'true');
    } else {
      sessionStorage.removeItem('esbs_admin_auth');
    }
  };

  const handleDelete = async (id: string) => {
    await api.deleteParticipant(id);
    setParticipants(prev => prev.filter(p => p.id !== id));
    if (selectedParticipant?.id === id) setSelectedParticipant(null);
  };

  const availableLetters = useMemo(() => {
    const letters = new Set(participants.map(p => (p.searchName || '').charAt(0).toUpperCase()));
    return letters;
  }, [participants]);

  const sortedAlphabet = useMemo(() => {
    return ALPHABET_GROUPS.LATIN.filter(char => availableLetters.has(char));
  }, [availableLetters]);

  const availableCountries = useMemo(() => {
    const countries = new Map<string, Country>();
    participants.forEach(p => {
      if (p.country && p.country.code !== '??') {
        countries.set(p.country.code, p.country);
      }
    });
    return Array.from(countries.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [participants]);

  if (!isAuthenticated) {
    return (
      <>
        <Analytics />
        <EntryPage onAccessGranted={() => {
          sessionStorage.setItem('esbs_auth', 'true');
          setIsAuthenticated(true);
        }} />
      </>
    );
  }

  return (
    <div className="min-h-screen transition-colors duration-500 bg-[var(--bg-surface)] pt-16">
      <h1 className="sr-only">Reaching Germany Retreat '26 Registration</h1>
      <Navbar
        viewMode={viewMode}
        setViewMode={setViewMode}
        darkMode={darkMode}
        isAdminAuthorized={isAdminAuthorized}
      />

      {(viewMode === 'directory' || viewMode === 'map') && <Header darkMode={darkMode} />}

      <main className="max-w-[1400px] mx-auto px-4 md:px-8 py-24 md:py-32">
        <div className="flex flex-col gap-6 md:gap-10 mb-6 md:mb-8">
          {viewMode === 'directory' && (
            <div className="flex flex-col gap-6">
              {/* Refined Control Bar */}
              <div className="flex flex-col xl:flex-row justify-between items-stretch xl:items-center gap-3 md:gap-4 bg-[var(--bg-surface)] p-2 md:p-5 rounded-2xl md:rounded-3xl shadow-neu-flat">
                <div className="relative flex-1 group">
                  <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-heaven-gold group-focus-within:scale-110 transition-transform" />
                  <input
                    type="text"
                    aria-label={t('app.search')}
                    placeholder={t('app.search')}
                    className="w-full bg-[var(--bg-surface)] shadow-neu-pressed rounded-xl md:rounded-2xl p-3 md:p-4 pl-10 md:pl-12 text-sm font-avenir-medium text-white dark:text-black outline-none transition-all placeholder:text-white/20 dark:placeholder:text-black/20 focus:shadow-neu-concave"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <div className="flex flex-wrap items-center justify-center gap-3 h-full px-2 py-4 xl:py-0">
                  <button
                    onClick={() => performBackgroundSync()}
                    title={t('app.sync')}
                    className="p-2 md:p-3 text-brand-heaven-gold/60 hover:text-brand-heaven-gold bg-[var(--bg-surface)] shadow-neu-flat active:shadow-neu-pressed rounded-lg md:rounded-xl transition-all"
                  >
                    <RefreshCcw size={16} className="md:w-[18px] md:h-[18px]" />
                  </button>

                  <div className="w-[1px] h-6 md:h-8 bg-[var(--neu-shadow-dark)] mx-2 hidden xl:block opacity-50 shadow-neu-pressed" />

                  <div className="flex gap-1.5 md:gap-2">
                    <button
                      onClick={() => setLayoutMode('list')}
                      className={`p-2 md:p-3 rounded-lg md:rounded-xl transition-all duration-300 bg-[var(--bg-surface)] ${layoutMode === 'list' ? 'shadow-neu-pressed text-brand-heaven-gold' : 'shadow-neu-flat text-brand-heaven-gold/60 hover:text-brand-heaven-gold active:shadow-neu-pressed'}`}
                      title={t('app.viewList')}
                    >
                      <Square size={16} className="md:w-[20px] md:h-[20px]" />
                    </button>
                    <button
                      onClick={() => setLayoutMode('grid2')}
                      className={`p-2 md:p-3 rounded-lg md:rounded-xl transition-all duration-300 bg-[var(--bg-surface)] ${layoutMode === 'grid2' ? 'shadow-neu-pressed text-brand-heaven-gold' : 'shadow-neu-flat text-brand-heaven-gold/60 hover:text-brand-heaven-gold active:shadow-neu-pressed'}`}
                      title={t('app.viewColumns')}
                    >
                      <Columns size={16} className="md:w-[20px] md:h-[20px]" />
                    </button>
                    <button
                      onClick={() => setLayoutMode('grid4')}
                      className={`p-2 md:p-3 rounded-lg md:rounded-xl transition-all duration-300 bg-[var(--bg-surface)] ${layoutMode === 'grid4' ? 'shadow-neu-pressed text-brand-heaven-gold' : 'shadow-neu-flat text-brand-heaven-gold/60 hover:text-brand-heaven-gold active:shadow-neu-pressed'}`}
                      title={t('app.viewGrid4')}
                    >
                      <LayoutGrid size={16} className="md:w-[20px] md:h-[20px]" />
                    </button>
                  </div>

                  <div className="w-[1px] h-6 md:h-8 bg-[var(--neu-shadow-dark)] mx-3 hidden xl:block opacity-50 shadow-neu-pressed" />

                  <button
                    onClick={() => setIsFilterDrawerOpen(true)}
                    className={`flex items-center gap-2 px-4 py-2 md:px-6 md:py-4 rounded-lg md:rounded-xl font-avenir-bold text-[9px] md:text-[10px] uppercase tracking-[2px] transition-all duration-300 bg-[var(--bg-surface)] ${filterCountryCode !== 'ALL' || filterMinistry !== 'ALL' || filterRole !== 'ALL' || filterLetter !== 'ALL'
                      ? 'shadow-neu-pressed text-brand-heaven-gold'
                      : 'shadow-neu-flat text-brand-heaven-gold/80 hover:text-brand-heaven-gold active:shadow-neu-pressed'
                      }`}
                  >
                    <Filter size={14} />
                    <span>{t('app.filter.label')}</span>
                    {(filterCountryCode !== 'ALL' || filterMinistry !== 'ALL' || filterRole !== 'ALL' || filterLetter !== 'ALL') && (
                      <span className="w-2 h-2 rounded-full bg-brand-heaven-gold shadow-glow" />
                    )}
                  </button>
                </div>
              </div>

              {/* Enhanced Alphabet Scroll */}
              <div className="py-2 mb-4">
                <div className="flex items-center gap-1.5 sm:gap-4 py-2 px-1 flex-wrap justify-center">
                  <button
                    onClick={() => setFilterLetter('ALL')}
                    className={`h-8 sm:h-12 px-4 sm:px-8 flex items-center justify-center text-[8px] sm:text-[10px] font-avenir-bold tracking-[2px] rounded-full transition-all duration-300 bg-[var(--bg-surface)] ${filterLetter === 'ALL' ? 'shadow-neu-pressed text-brand-heaven-gold' : 'shadow-neu-flat text-white/40 dark:text-black/40 hover:text-white dark:hover:text-black active:shadow-neu-pressed'}`}
                  >
                    {t('app.filter.all')}
                  </button>
                  {ALPHABET_GROUPS.LATIN.map(char => {
                    const isAvailable = availableLetters.has(char);
                    return (
                      <button
                        key={char}
                        onClick={() => setFilterLetter(char)}
                        disabled={!isAvailable}
                        className={`w-8 h-8 sm:w-12 sm:h-12 flex items-center justify-center text-[10px] sm:text-[12px] font-avenir-bold rounded-full transition-all duration-300 bg-[var(--bg-surface)] ${filterLetter === char
                          ? 'shadow-neu-pressed text-brand-heaven-gold'
                          : isAvailable
                            ? 'shadow-neu-flat text-white/50 dark:text-black/50 hover:text-white dark:hover:text-black active:shadow-neu-pressed'
                            : 'opacity-0 cursor-not-allowed scale-0 w-0'
                          }`}
                      >
                        {char}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-40">
            <Loader2 className="animate-spin text-brand-heaven-gold mb-4" size={32} />
            <p className="text-[10px] text-brand-heaven-gold uppercase font-avenir-medium tracking-widest">{t('app.syncStatus')}</p>
          </div>
        ) : viewMode === 'map' ? (
          <div className="max-w-[1400px] mx-auto px-4 md:px-8 pb-32 animate-fade-in relative z-20">
            <MapView
              participants={filteredParticipants}
              onSelectCity={(city) => {
                setSearchQuery(city);
                setViewMode('directory');
              }}
            />
          </div>
        ) : viewMode === 'directory' ? (
          <div className="flex flex-col">
            {/* Results Grid - Dynamic Columns */}
            <div className={`grid gap-6 md:gap-10 ${layoutMode === 'grid4' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' :
              layoutMode === 'grid2' ? 'grid-cols-1 sm:grid-cols-2' :
                'grid-cols-1'
              }`}>
              {filteredParticipants.map(p => (
                <ParticipantCard
                  key={p.id}
                  participant={p}
                  onClick={() => setSelectedParticipant(p)}
                  layout={layoutMode === 'list' ? 'list' : 'grid'}
                />
              ))}
            </div>
          </div>
        ) : viewMode === 'admin' ? (
          <AdminConsole
            participants={participants}
            onAdd={handleAdd}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
            isAuthorized={isAdminAuthorized}
            onAuthorize={handleAuthorize}
            editingId={activeEditingId}
            onSetEditingId={setActiveEditingId}
          />
        ) : (
          <RegistrationForm />
        )}
      </main>

      <footer className="mt-40 border-t border-white/5 dark:border-black/5 py-32 bg-[var(--bg-surface)] text-center">
        <div className="max-w-[1400px] mx-auto px-8 space-y-10">
          <p className="font-didot italic text-3xl text-white/30 dark:text-black/20 max-w-3xl mx-auto leading-relaxed">
            {t('footer.vision')}
          </p>
          <div className="text-[10px] font-avenir-bold text-brand-heaven-gold uppercase tracking-[4px]">
            {t('footer.tagline')}
          </div>
        </div>
      </footer>

      <ProfileModal
        participant={selectedParticipant}
        onClose={() => setSelectedParticipant(null)}
        isAdmin={isAdminAuthorized}
        onDelete={handleDelete}
        onEdit={(id) => { setSelectedParticipant(null); setActiveEditingId(id); setViewMode('admin'); }}
      />

      {/* Professional Filter Drawer */}
      <div
        className={`fixed inset-0 z-[200] transition-all duration-500 ${isFilterDrawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      >
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsFilterDrawerOpen(false)} />
        <div className={`absolute right-0 top-0 h-full w-full max-w-sm bg-[var(--bg-surface)] shadow-neu-flat flex flex-col transition-transform duration-500 ease-out ${isFilterDrawerOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="p-8 border-b border-black/5 dark:border-white/5 flex justify-between items-center shadow-neu-flat z-10">
            <h3 className="text-xs font-avenir-bold text-brand-heaven-gold uppercase tracking-[4px]">{t('app.filter.advanced')}</h3>
            <button onClick={() => setIsFilterDrawerOpen(false)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-[var(--bg-surface)] shadow-neu-flat active:shadow-neu-pressed text-brand-heaven-gold transition-all">
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-12">
            <div className="space-y-6">
              <span className="text-[9px] font-avenir-bold text-brand-heaven-gold uppercase flex items-center gap-2 tracking-[2px]">
                <Globe size={14} /> {t('app.filter.geo')}
              </span>
              <div className="flex flex-wrap gap-4">
                <button
                  onClick={() => setFilterCountryCode('ALL')}
                  className={`px-6 py-3 text-[10px] font-avenir-bold uppercase tracking-widest rounded-xl transition-all duration-300 bg-[var(--bg-surface)] ${filterCountryCode === 'ALL' ? 'shadow-neu-pressed text-brand-heaven-gold' : 'shadow-neu-flat text-white/50 dark:text-black/50 active:shadow-neu-pressed'}`}
                >
                  {t('app.filter.global')}
                </button>
                {activeCountries.map(c => (
                  <button
                    key={c.code}
                    onClick={() => setFilterCountryCode(c.code)}
                    className={`px-6 py-3 text-[10px] font-avenir-bold uppercase rounded-xl transition-all duration-300 bg-[var(--bg-surface)] ${filterCountryCode === c.code ? 'shadow-neu-pressed text-brand-heaven-gold' : 'shadow-neu-flat text-white/50 dark:text-black/50 active:shadow-neu-pressed'}`}
                  >
                    {c.code}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <span className="text-[9px] font-avenir-bold text-brand-heaven-gold uppercase flex items-center gap-2 tracking-[2px]">
                <Building size={14} /> {t('app.filter.org')}
              </span>
              <div className="relative rounded-2xl bg-[var(--bg-surface)] shadow-neu-pressed p-1">
                <select
                  value={filterMinistry}
                  onChange={e => setFilterMinistry(e.target.value)}
                  className="w-full bg-transparent border-none p-4 text-xs font-avenir-medium text-white dark:text-black outline-none appearance-none"
                >
                  <option value="ALL">{t('app.filter.allOrg')}</option>
                  {uniqueMinistries.map(m => <option key={m} value={m} className="bg-[var(--bg-surface)]">{m}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-6">
              <span className="text-[9px] font-avenir-bold text-brand-heaven-gold uppercase flex items-center gap-2 tracking-[2px]">
                <Briefcase size={14} /> {t('app.filter.role')}
              </span>
              <div className="relative rounded-2xl bg-[var(--bg-surface)] shadow-neu-pressed p-1">
                <select
                  value={filterRole}
                  onChange={e => setFilterRole(e.target.value)}
                  className="w-full bg-transparent border-none p-4 text-xs font-avenir-medium text-white dark:text-black outline-none appearance-none"
                >
                  <option value="ALL">{t('app.filter.allRole')}</option>
                  {uniqueRoles.map(r => <option key={r} value={r} className="bg-[var(--bg-surface)]">{r}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="p-8 shadow-neu-pressed z-10 space-y-6">
            <button
              onClick={() => {
                setFilterCountryCode('ALL');
                setFilterMinistry('ALL');
                setFilterRole('ALL');
                setFilterLetter('ALL');
                setSearchQuery('');
              }}
              className="w-full py-4 text-[10px] font-avenir-bold text-white/40 dark:text-black/40 uppercase tracking-[3px] hover:text-brand-heaven-gold transition-colors"
            >
              {t('app.filter.clear')}
            </button>
            <button
              onClick={() => setIsFilterDrawerOpen(false)}
              className="w-full py-5 text-brand-heaven-gold font-avenir-bold uppercase text-[10px] tracking-[4px] rounded-2xl bg-[var(--bg-surface)] shadow-neu-flat active:shadow-neu-pressed transition-all"
            >
              {t('app.filter.apply')}
            </button>
          </div>
        </div>
      </div>
      <Analytics />
    </div>
  );
};

export default App;
