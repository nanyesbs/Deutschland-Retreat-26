import React, { useState, useRef, useEffect } from 'react';
import { Participant, Country } from '../types';
import { ADMIN_PASSWORD, COUNTRY_LIST, getIdentityPlaceholder, SOCIAL_PLATFORMS } from '../constants';
import * as XLSX from 'xlsx';
import { api } from '../services/api';
import { syncService } from '../services/syncService';
import { sortParticipants, fixEncoding, processParticipant, normalizeString, stripEmojis, findCountry } from '../utils';
import {
  Lock, Edit2, Trash2, X, ShieldCheck,
  Image as ImageIcon, UploadCloud, Camera, History,
  RefreshCw, Loader2, FileSpreadsheet, CheckCircle2,
  Upload, Sparkles, AlertCircle, Search, Calendar,
  Filter, ChevronDown, ChevronUp, Users, Plus, Globe
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface AdminConsoleProps {
  participants: Participant[];
  onAdd: (p: Omit<Participant, 'id'>) => Promise<void>;
  onUpdate: (id: string, p: Partial<Participant>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  isAuthorized: boolean;
  onAuthorize: (v: boolean) => void;
  editingId: string | null;
  onSetEditingId: (id: string | null) => void;
}

interface ImportReport {
  total: number;
  imported: number;
  duplicates: number;
  issues: { name: string; email: string; fields: string[] }[];
}

const AdminConsole: React.FC<AdminConsoleProps> = ({
  participants, onAdd, onUpdate, onDelete,
  isAuthorized, onAuthorize, editingId, onSetEditingId
}) => {
  const { t } = useTranslation();
  const [password, setPassword] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState<Partial<Participant>>({});
  const [isUploading, setIsUploading] = useState<Record<string, boolean>>({});
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState('');
  const [importReport, setImportReport] = useState<ImportReport | null>(null);
  const [pendingData, setPendingData] = useState<{ p: Omit<Participant, 'id'>, id?: string }[]>([]);
  const [sheetUrl, setSheetUrl] = useState(() => localStorage.getItem('ls_sheet_url') || '');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilterStart, setDateFilterStart] = useState('');
  const [dateFilterEnd, setDateFilterEnd] = useState('');
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [showFilteredParticipants, setShowFilteredParticipants] = useState(false);

  const filteredByDate = participants.filter(p => {
    if (!dateFilterStart && !dateFilterEnd) return true;
    if (!p.createdAt) return false;

    // Create dates in local time for comparison
    const pDate = new Date(p.createdAt);
    const pTime = pDate.getTime();

    let start = -Infinity;
    if (dateFilterStart) {
      const startDate = new Date(dateFilterStart);
      startDate.setHours(0, 0, 0, 0);
      start = startDate.getTime();
    }

    let end = Infinity;
    if (dateFilterEnd) {
      const endDate = new Date(dateFilterEnd);
      endDate.setHours(23, 59, 59, 999);
      end = endDate.getTime();
    }

    return pTime >= start && pTime <= end;
  });

  const importInputRef = useRef<HTMLInputElement>(null);
  const profileFileRef = useRef<HTMLInputElement>(null);
  const promoFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingId) {
      const p = participants.find(part => part.id === editingId);
      if (p) {
        setFormData(p);
        setIsAdding(true);
      }
    }
  }, [editingId, participants]);

  const selectCountry = (field: 'country' | 'nationality', code: string) => {
    const country = COUNTRY_LIST.find(c => c.code === code);
    if (country) {
      setFormData(prev => ({ ...prev, [field]: country }));
    }
  };

  useEffect(() => {
    if (sheetUrl) {
      localStorage.setItem('ls_sheet_url', sheetUrl);
    }
  }, [sheetUrl]);

  const handleSave = async () => {
    if (!formData.name) return alert(t('admin.nameRequired'));
    try {
      const processed = processParticipant(formData);
      console.log('Attempting to sync identity:', processed);

      if (editingId) {
        console.log('Update Mode: Target ID', editingId);
        await onUpdate(editingId, processed);
      } else {
        console.log('Creation Mode: New Entry');
        await onAdd(processed as Omit<Participant, 'id'>);
      }

      setFormData({});
      onSetEditingId(null);
      setIsAdding(false);
      alert(t('admin.syncSuccess'));
    } catch (err: any) {
      console.error('Critical Sync Failure:', err);
      alert(`${t('admin.syncFailure')}: ${err.message || 'Check console logs for stack trace.'}`);
    }
  };


  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportReport(null);
    setPendingData([]);
    setImportProgress('Syncing Manifest...');

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const arrayBuffer = evt.target?.result as ArrayBuffer;
        const wb = XLSX.read(arrayBuffer, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(ws) as any[];

        const report = syncService.processDataRows(data, participants);
        setPendingData(report.valid);
        setImportReport({
          total: report.total,
          imported: report.valid.length,
          duplicates: report.duplicateCount,
          issues: []
        });
      } catch (err) {
        alert('Data corruption in file.');
      } finally {
        setIsImporting(false);
        if (importInputRef.current) importInputRef.current.value = '';
      }
    };
    reader.readAsArrayBuffer(file);
  };


  const handleCloudSync = async () => {
    if (!sheetUrl) return alert('Enter Sheet URL');
    setIsImporting(true);
    setImportProgress('Fetching Cloud Data...');

    try {
      const results = await syncService.fetchFromSheet(sheetUrl, participants);
      setPendingData(results.valid);
      setImportReport({
        total: results.total,
        imported: results.valid.length,
        duplicates: results.duplicateCount,
        issues: []
      });
      setImportProgress('Ready to Commit');
    } catch (err) {
      alert('Cloud sync failed. Ensure the sheet is "Published to web" as CSV or set to "Anyone with link can view".');
    } finally {
      setIsImporting(false);
    }
  };

  const confirmImport = async () => {
    setIsImporting(true);
    try {
      await syncService.performSync(
        pendingData,
        (msg) => setImportProgress(msg),
        onAdd,
        onUpdate
      );
      setPendingData([]); setImportReport(null);
      alert('Sync successful.');
    } catch {
      alert('Partial sync failure.');
    } finally {
      setIsImporting(false);
    }
  };

  const resizeImage = (base64Str: string, maxWidth = 800, maxHeight = 800): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width; let height = img.height;
        if (width > height) { if (width > maxWidth) { height *= maxWidth / width; width = maxWidth; } }
        else { if (height > maxHeight) { width *= maxHeight / height; height = maxHeight; } }
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext('2d'); ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'photoUrl' | 'promoPhotoUrl') => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(prev => ({ ...prev, [field]: true }));
      const reader = new FileReader();
      reader.onload = async (event) => {
        const resized = await resizeImage(event.target?.result as string);
        setFormData(prev => ({ ...prev, [field]: resized }));
        setIsUploading(prev => ({ ...prev, [field]: false }));
      };
      reader.readAsDataURL(file);
    }
  };

  const [showPassword, setShowPassword] = useState(false);

  if (!isAuthorized) {
    return (
      <div className="flex flex-col items-center justify-center p-8 md:p-12 bg-[var(--bg-surface)] shadow-neu-flat rounded-[2.5rem] mt-10 max-w-lg mx-auto border border-white/5">
        <div className="w-20 h-20 bg-[var(--bg-surface)] shadow-neu-pressed rounded-full flex items-center justify-center mb-10 border border-brand-heaven-gold/10">
          <Lock size={32} className="text-brand-heaven-gold animate-pulse" />
        </div>

        <h2 className="text-sm font-avenir-bold uppercase text-white dark:text-white mb-2 tracking-[4px] text-center">
          {t('admin.authRequired')}
        </h2>
        <p className="text-[10px] font-avenir-medium uppercase text-brand-heaven-gold/50 mb-10 tracking-[2px] text-center">
          Identity Verification Required
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (password === ADMIN_PASSWORD) {
              onAuthorize(true);
            } else {
              alert('DENIED: Access Code Rejected');
              setPassword('');
            }
          }}
          className="flex flex-col items-center w-full space-y-8"
        >
          <div className="w-full relative group">
            <input
              type={showPassword ? "text" : "password"}
              placeholder={t('admin.secureCode')}
              className="w-full bg-[var(--bg-surface)] shadow-neu-pressed focus:shadow-neu-concave p-5 rounded-2xl text-center outline-none text-white dark:text-white text-sm tracking-[0.5em] transition-all border border-transparent focus:border-brand-heaven-gold/20"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-brand-heaven-gold/40 hover:text-brand-heaven-gold transition-colors"
            >
              {showPassword ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>

          <button className="w-full py-5 bg-[var(--bg-surface)] shadow-neu-flat active:shadow-neu-pressed text-brand-heaven-gold font-avenir-bold uppercase rounded-2xl hover:text-white transition-all text-[11px] tracking-[4px] border border-white/5 active:scale-[0.98] duration-300">
            {t('admin.authorize')}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="mt-10 space-y-10 pb-24 animate-fade-in text-white transition-colors">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-avenir-bold text-white dark:text-white uppercase tracking-tight">{t('admin.title')}</h2>
        <button onClick={() => onAuthorize(false)} className="px-6 py-3 bg-[var(--bg-surface)] shadow-neu-flat active:shadow-neu-pressed text-red-500 rounded-xl text-[10px] font-avenir-bold uppercase transition-all flex items-center gap-2">{t('admin.secureLogout')}</button>
      </div>

      {/* Dashboard Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Total Registrations Card */}
        <div className="bg-[var(--bg-surface)] shadow-neu-flat p-8 rounded-[2rem] relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-heaven-gold/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-brand-heaven-gold/20 rounded-full flex items-center justify-center">
                  <ShieldCheck size={24} className="text-brand-heaven-gold" />
                </div>
                <div>
                  <p className="text-[9px] font-avenir-bold text-brand-heaven-gold/60 uppercase tracking-[3px]">{t('admin.totalRegistrations')}</p>
                </div>
              </div>
              <button
                onClick={() => setShowDateFilter(!showDateFilter)}
                className={`p-3 rounded-xl transition-all ${showDateFilter ? 'bg-[var(--bg-surface)] shadow-neu-pressed text-brand-heaven-gold' : 'bg-[var(--bg-surface)] shadow-neu-flat active:shadow-neu-pressed text-brand-heaven-gold/60 hover:text-brand-heaven-gold'}`}
                title={t('admin.filterByDate')}
              >
                <Filter size={16} />
              </button>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-avenir-bold text-brand-heaven-gold">
                {showDateFilter && (dateFilterStart || dateFilterEnd) ? filteredByDate.length : participants.length}
              </span>
              <span className="text-sm text-white/40 dark:text-white/40 font-avenir-roman uppercase tracking-wider">
                {showDateFilter && (dateFilterStart || dateFilterEnd) ? t('admin.filteredResults') : t('app.participants')}
              </span>
            </div>

            {showDateFilter && (
              <div className="mt-6 p-6 bg-[var(--bg-surface)] shadow-neu-pressed rounded-2xl space-y-5 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[8px] font-avenir-bold text-brand-heaven-gold/60 uppercase tracking-widest pl-1">{t('admin.startDate')}</label>
                    <input
                      type="date"
                      className="w-full bg-[var(--bg-surface)] shadow-neu-pressed focus:shadow-neu-concave p-3 rounded-xl text-[10px] text-white dark:text-white outline-none transition-all"
                      value={dateFilterStart}
                      onChange={(e) => setDateFilterStart(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[8px] font-avenir-bold text-brand-heaven-gold/60 uppercase tracking-widest pl-1">{t('admin.endDate')}</label>
                    <input
                      type="date"
                      className="w-full bg-[var(--bg-surface)] shadow-neu-pressed focus:shadow-neu-concave p-3 rounded-xl text-[10px] text-white dark:text-white outline-none transition-all"
                      value={dateFilterEnd}
                      onChange={(e) => setDateFilterEnd(e.target.value)}
                    />
                  </div>
                </div>

                {(dateFilterStart || dateFilterEnd) && (
                  <div className="flex gap-4">
                    <button
                      onClick={() => { setDateFilterStart(''); setDateFilterEnd(''); }}
                      className="flex-1 py-3 bg-[var(--bg-surface)] shadow-neu-flat active:shadow-neu-pressed text-[9px] font-avenir-bold uppercase rounded-xl text-white/40 hover:text-white/60 transition-all"
                    >
                      {t('admin.clearFilters')}
                    </button>
                    <button
                      onClick={() => setShowFilteredParticipants(!showFilteredParticipants)}
                      className="flex-[2] py-3 bg-[var(--bg-surface)] shadow-neu-flat active:shadow-neu-pressed text-brand-heaven-gold text-[9px] font-avenir-bold uppercase rounded-xl transition-all flex items-center justify-center gap-2"
                    >
                      {showFilteredParticipants ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                      {showFilteredParticipants ? t('app.hideResults') : `${t('app.view')} ${filteredByDate.length} ${t('app.participants')}`}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {showFilteredParticipants && (dateFilterStart || dateFilterEnd) && (
            <div className="mt-6 max-h-[200px] overflow-y-auto custom-scrollbar pr-2 space-y-3 animate-in fade-in slide-in-from-top-1">
              {filteredByDate.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-[10px] text-white/30 italic">{t('app.noResults')}</p>
                </div>
              ) : (
                filteredByDate.map(p => (
                  <div key={p.id} className="flex items-center gap-4 p-3 bg-[var(--bg-surface)] shadow-neu-flat rounded-xl">
                    <img src={p.photoUrl || getIdentityPlaceholder(p.name)} alt={`${p.name} photo`} className="w-8 h-8 rounded-full object-cover shadow-neu-pressed" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-avenir-bold text-white dark:text-white truncate uppercase">{p.name}</p>
                      <p className="text-[8px] text-white/40 dark:text-stone-500 uppercase">{new Date(p.createdAt!).toLocaleDateString('pt-BR')}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Daily Registrations Card */}
        <div className="bg-[var(--bg-surface)] shadow-neu-flat p-8 rounded-[2rem]">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-[var(--bg-surface)] shadow-neu-pressed rounded-full flex items-center justify-center">
              <History size={24} className="text-brand-heaven-gold" />
            </div>
            <div>
              <p className="text-[9px] font-avenir-bold text-brand-heaven-gold/60 uppercase tracking-[3px]">{t('admin.registrationActivity') || 'Registration Activity'}</p>
            </div>
          </div>
          <div className="space-y-4 max-h-[140px] overflow-y-auto custom-scrollbar pr-2">
            {(() => {
              // Group participants by registration date
              const dateGroups: Record<string, number> = {};
              participants.forEach(p => {
                const dateStr = p.createdAt
                  ? new Date(p.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
                  : 'Unknown';
                dateGroups[dateStr] = (dateGroups[dateStr] || 0) + 1;
              });

              // Sort by date (most recent first)
              const sortedDates = Object.entries(dateGroups)
                .filter(([date]) => date !== 'Unknown')
                .sort((a, b) => {
                  const [dayA, monthA, yearA] = a[0].split('/').map(Number);
                  const [dayB, monthB, yearB] = b[0].split('/').map(Number);
                  return new Date(yearB, monthB - 1, dayB).getTime() - new Date(yearA, monthA - 1, dayA).getTime();
                });

              // Add unknown at the end if exists
              if (dateGroups['Unknown']) {
                sortedDates.push(['Unknown', dateGroups['Unknown']]);
              }

              if (sortedDates.length === 0) {
                return (
                  <div className="text-center py-6">
                    <p className="text-[11px] text-white/30 dark:text-stone-400 italic font-avenir-roman">No registration data available</p>
                  </div>
                );
              }

              return sortedDates.map(([date, count]) => (
                <div key={date} className="flex items-center justify-between p-4 bg-[var(--bg-surface)] shadow-neu-flat hover:shadow-neu-pressed transition-all duration-300 rounded-xl">
                  <span className="text-[11px] font-avenir-bold text-white dark:text-white tracking-widest">{date}</span>
                  <span className="px-4 py-1.5 bg-[var(--bg-surface)] shadow-neu-pressed text-brand-heaven-gold text-[10px] font-avenir-bold rounded-full tracking-widest uppercase">
                    {count} {count === 1 ? t('registration.label') : t('registration.label') + 's'}
                  </span>
                </div>
              ));
            })()}
          </div>
        </div>
      </div>

      {/* Import Section */}
      <section className="bg-[var(--bg-surface)] shadow-neu-flat p-8 md:p-10 rounded-[2rem] relative overflow-hidden">
        {isImporting && (
          <div className="absolute inset-0 z-50 bg-brand-heaven-gold/90 flex flex-col items-center justify-center text-white backdrop-blur-sm">
            <Loader2 className="animate-spin mb-4" size={32} />
            <p className="text-[12px] font-avenir-bold uppercase tracking-[4px]">{importProgress}</p>
          </div>
        )}
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 md:gap-12">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-[var(--bg-surface)] shadow-neu-pressed rounded-full flex items-center justify-center text-brand-heaven-gold"><FileSpreadsheet size={32} /></div>
            <div>
              <h3 className="text-xl font-avenir-bold text-white dark:text-white uppercase tracking-wide">{t('admin.cloudSync')}</h3>
              <p className="text-[10px] text-brand-heaven-gold mt-2 uppercase tracking-[3px]">{t('admin.cloudSyncDesc')}</p>
            </div>
          </div>
          <div className="flex flex-col md:flex-row gap-6 w-full md:w-auto flex-1 justify-end">
            <div className="flex flex-col sm:flex-row gap-4 flex-1 max-w-lg">
              <input
                type="text"
                placeholder={t('admin.sheetUrl')}
                className="w-full bg-[var(--bg-surface)] shadow-neu-pressed py-4 px-6 rounded-2xl text-[11px] outline-none focus:shadow-neu-concave text-white dark:text-white transition-all"
                value={sheetUrl}
                onChange={(e) => setSheetUrl(e.target.value)}
              />
              <button
                onClick={handleCloudSync}
                className="px-8 py-4 bg-[var(--bg-surface)] shadow-neu-flat active:shadow-neu-pressed text-brand-heaven-gold rounded-2xl text-[10px] font-avenir-bold uppercase transition-all flex items-center justify-center whitespace-nowrap gap-3 shrink-0"
              >
                <Sparkles size={16} /> {t('admin.fetchCloud')}
              </button>
            </div>
            <div className="flex gap-4 min-w-[200px]">
              {pendingData.length > 0 ? (
                <button onClick={confirmImport} className="w-full py-4 bg-[var(--bg-surface)] shadow-neu-flat active:shadow-neu-pressed text-green-500 hover:text-green-400 text-[10px] font-avenir-bold uppercase rounded-2xl flex items-center justify-center gap-3 animate-pulse">
                  <CheckCircle2 size={18} /> {t('admin.readyToCommit')} ({pendingData.length})
                </button>
              ) : (
                <button onClick={() => importInputRef.current?.click()} className="w-full py-4 bg-[var(--bg-surface)] shadow-neu-flat active:shadow-neu-pressed text-white/80 hover:text-brand-heaven-gold dark:text-white/80 dark:hover:text-brand-heaven-gold text-[10px] font-avenir-bold uppercase rounded-2xl flex items-center justify-center gap-3 transition-all shrink-0">
                  <Upload size={18} /> {t('admin.importFile')}
                </button>
              )}
            </div>
            <input type="file" ref={importInputRef} className="hidden" accept=".xlsx, .xls, .csv" onChange={handleFileImport} />
          </div>
        </div>
      </section>

      <div className="flex flex-col lg:flex-row gap-10 relative items-start">
        {/* Ledger List */}
        <div className="flex-1 bg-[var(--bg-surface)] shadow-neu-flat p-8 rounded-[2.5rem] w-full">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
            <h3 className="text-sm font-avenir-bold uppercase text-white dark:text-white flex items-center gap-3 tracking-[3px]">
              <History size={16} className="text-brand-heaven-gold" /> {t('admin.identityLedger') || 'Identity Ledger'}
            </h3>
            <div className="flex flex-col sm:flex-row gap-6 w-full md:w-auto">
              <div className="flex items-center gap-6 sm:justify-end">
                <button onClick={async () => { if (confirm(t('admin.warnReset'))) { await api.resetData(); window.location.reload(); } }} className="text-[9px] font-avenir-bold text-red-500/50 uppercase hover:text-red-500 transition-colors tracking-widest">{t('admin.factoryReset') || 'Factory Reset'}</button>
                <button onClick={() => { setIsAdding(true); onSetEditingId(null); setFormData({}); }} className="text-[9px] font-avenir-bold text-brand-heaven-gold uppercase hover:brightness-125 transition-colors tracking-widest bg-[var(--bg-surface)] shadow-neu-flat active:shadow-neu-pressed px-5 py-3 rounded-xl flex items-center gap-2">{t('admin.manualInit') || 'Manual Initialization'} <span className="text-xs leading-none">+</span></button>
              </div>
              <div className="relative w-full sm:w-64">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-heaven-gold/50" />
                <input
                  type="text"
                  placeholder={t('app.searchName')}
                  className="w-full bg-[var(--bg-surface)] shadow-neu-pressed focus:shadow-neu-concave p-3 pl-12 rounded-2xl text-[11px] text-white dark:text-white outline-none transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>
          <div className="space-y-4 max-h-[700px] overflow-y-auto pr-4 custom-scrollbar">
            {sortParticipants<Participant>(
              filteredByDate.filter(p =>
                !searchTerm ||
                p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.organization.toLowerCase().includes(searchTerm.toLowerCase())
              )
            ).map(p => (
              <div key={p.id} className="flex items-center justify-between p-5 bg-[var(--bg-surface)] shadow-neu-flat hover:shadow-neu-convex rounded-2xl transition-all duration-300 group">
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 rounded-xl bg-[var(--bg-surface)] shadow-neu-pressed p-1 flex shrink-0 border border-brand-heaven-gold/10">
                    <img src={p.photoUrl || getIdentityPlaceholder(p.name)} alt={t('admin.photoAlt', { name: p.name }) || `${p.name} profile`} className="w-full h-full rounded-lg object-cover" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[12px] font-avenir-bold text-white dark:text-white uppercase tracking-wider truncate">{p.name}</div>
                    <div className="text-[9px] text-white/40 dark:text-stone-400 uppercase tracking-widest truncate">{p.country.code} • {p.title}</div>
                  </div>
                </div>
                <div className="flex gap-3 ml-4">
                  <button onClick={() => onSetEditingId(p.id)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-[var(--bg-surface)] shadow-neu-flat active:shadow-neu-pressed text-brand-heaven-gold/70 hover:text-brand-heaven-gold transition-all shrink-0"><Edit2 size={16} /></button>
                  <button onClick={() => onDelete(p.id)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-[var(--bg-surface)] shadow-neu-flat active:shadow-neu-pressed text-red-500/50 hover:text-red-500 transition-all shrink-0"><Trash2 size={16} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Editor Form Modal */}
        {isAdding && (
          <div className="w-full lg:w-[600px] bg-[var(--bg-surface)] shadow-neu-flat rounded-[3rem] flex flex-col max-h-[85vh] overflow-hidden animate-fade-in sticky top-24 z-50">
            <div className="flex justify-between items-center px-10 py-8 bg-[var(--bg-surface)] shadow-neu-pressed">
              <h4 className="text-[11px] font-avenir-bold text-brand-heaven-gold uppercase tracking-[0.3em]">
                {editingId ? t('admin.editEntry') : t('admin.newEntry')}
              </h4>
              <button onClick={() => { setIsAdding(false); onSetEditingId(null); setFormData({}); }} className="w-12 h-12 flex items-center justify-center rounded-full bg-[var(--bg-surface)] shadow-neu-flat active:shadow-neu-pressed hover:text-brand-heaven-gold transition-all"><X size={18} className="text-white/60 dark:text-stone-400" /></button>
            </div>

            <div className="p-10 overflow-y-auto custom-scrollbar space-y-10">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 p-6 bg-[var(--bg-surface)] shadow-neu-pressed rounded-3xl">
                <div className="space-y-4">
                  <label className="text-[9px] font-avenir-bold text-brand-heaven-gold uppercase tracking-[0.2em] pl-2">{t('admin.portrait')} (URL / File)</label>
                  <div className="flex flex-col gap-3">
                    <input
                      type="text"
                      placeholder="Paste URL..."
                      className="w-full bg-[var(--bg-surface)] shadow-neu-pressed focus:shadow-neu-concave p-4 rounded-xl text-xs text-white dark:text-white outline-none transition-all"
                      value={formData.photoUrl || ''}
                      onChange={e => setFormData({ ...formData, photoUrl: e.target.value })}
                    />
                    <div onClick={() => profileFileRef.current?.click()} className="py-4 px-4 bg-[var(--bg-surface)] shadow-neu-flat active:shadow-neu-pressed rounded-xl cursor-pointer flex items-center justify-center gap-3 text-[10px] uppercase font-avenir-bold text-white/50 hover:text-brand-heaven-gold transition-all">
                      <UploadCloud size={16} /> Upload JPG/PNG
                    </div>
                  </div>
                  {formData.photoUrl && (
                    <div className="aspect-square rounded-2xl bg-[var(--bg-surface)] shadow-neu-pressed overflow-hidden relative p-1 mt-4">
                      <img src={formData.photoUrl} alt={t('admin.previewAlt') || "Profile preview"} className="w-full h-full object-cover rounded-xl" />
                    </div>
                  )}
                  <input type="file" ref={profileFileRef} className="hidden" accept="image/*" onChange={e => handleFileUpload(e, 'photoUrl')} />
                </div>
                <div className="space-y-4">
                  <label className="text-[9px] font-avenir-bold text-brand-heaven-gold uppercase tracking-[0.2em] pl-2">{t('admin.promotional')} (URL / File)</label>
                  <div className="flex flex-col gap-3">
                    <input
                      type="text"
                      placeholder="Paste URL..."
                      className="w-full bg-[var(--bg-surface)] shadow-neu-pressed focus:shadow-neu-concave p-4 rounded-xl text-xs text-white dark:text-white outline-none transition-all"
                      value={formData.promoPhotoUrl || ''}
                      onChange={e => setFormData({ ...formData, promoPhotoUrl: e.target.value })}
                    />
                    <div onClick={() => promoFileRef.current?.click()} className="py-4 px-4 bg-[var(--bg-surface)] shadow-neu-flat active:shadow-neu-pressed rounded-xl cursor-pointer flex items-center justify-center gap-3 text-[10px] uppercase font-avenir-bold text-white/50 hover:text-brand-heaven-gold transition-all">
                      <UploadCloud size={16} /> Upload JPG/PNG
                    </div>
                  </div>
                  {formData.promoPhotoUrl && (
                    <div className="aspect-square rounded-2xl bg-[var(--bg-surface)] shadow-neu-pressed overflow-hidden relative p-1 mt-4">
                      <img src={formData.promoPhotoUrl} alt={t('admin.promoPreviewAlt') || "Promotional preview"} className="w-full h-full object-cover rounded-xl" />
                    </div>
                  )}
                  <input type="file" ref={promoFileRef} className="hidden" accept="image/*" onChange={e => handleFileUpload(e, 'promoPhotoUrl')} />
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-avenir-bold text-brand-heaven-gold tracking-widest pl-2">{t('registration.step1.fullName')}</label>
                  <input className="w-full bg-[var(--bg-surface)] shadow-neu-pressed focus:shadow-neu-concave p-5 rounded-2xl text-[13px] text-white dark:text-white outline-none transition-all" value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-avenir-bold text-brand-heaven-gold tracking-widest pl-2">{t('registration.step1.country')}</label>
                    <select className="w-full bg-[var(--bg-surface)] shadow-neu-pressed focus:shadow-neu-concave p-5 rounded-2xl text-[12px] font-avenir-bold text-white dark:text-white outline-none transition-all appearance-none" value={formData.country?.code || ''} onChange={(e) => { selectCountry('country', e.target.value); setFormData(p => ({ ...p, state: '', city: '' })); }}>
                      <option value="">{t('registration.step1.selectCountry')} (Optional)</option>
                      {COUNTRY_LIST.map(c => <option key={c.code} value={c.code}>{c.flag} {c.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-avenir-bold text-brand-heaven-gold tracking-widest pl-2">{t('registration.step1.state')}</label>
                    <input className="w-full bg-[var(--bg-surface)] shadow-neu-pressed focus:shadow-neu-concave p-5 rounded-2xl text-[12px] font-avenir-bold text-white dark:text-white outline-none transition-all" value={formData.state || ''} onChange={e => setFormData({ ...formData, state: e.target.value })} placeholder="State" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-avenir-bold text-brand-heaven-gold tracking-widest pl-2">{t('registration.step1.city')}</label>
                    <input className="w-full bg-[var(--bg-surface)] shadow-neu-pressed focus:shadow-neu-concave p-5 rounded-2xl text-[12px] font-avenir-bold text-white dark:text-white outline-none transition-all" value={formData.city || ''} onChange={e => setFormData({ ...formData, city: e.target.value })} placeholder="City" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-avenir-bold text-brand-heaven-gold tracking-widest pl-2">Nationality</label>
                  <select className="w-full bg-[var(--bg-surface)] shadow-neu-pressed focus:shadow-neu-concave p-5 rounded-2xl text-[12px] font-avenir-bold text-white dark:text-white outline-none transition-all appearance-none" value={formData.nationality?.code || ''} onChange={(e) => selectCountry('nationality', e.target.value)}>
                    <option value="">{t('registration.step1.selectCountry')} (Optional)</option>
                    {COUNTRY_LIST.map(c => <option key={c.code} value={c.code}>{c.flag} {c.name}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-avenir-bold text-brand-heaven-gold tracking-widest pl-2">{t('registration.step1.bio')}</label>
                  <textarea className="w-full bg-[var(--bg-surface)] shadow-neu-pressed focus:shadow-neu-concave p-5 rounded-2xl text-[13px] min-h-[120px] text-white dark:text-white outline-none transition-all resize-none leading-relaxed" value={formData.testimony || ''} onChange={e => setFormData({ ...formData, testimony: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-avenir-bold text-brand-heaven-gold tracking-widest pl-2">{t('registration.step2.orgName')}</label>
                    <input className="w-full bg-[var(--bg-surface)] shadow-neu-pressed focus:shadow-neu-concave p-5 rounded-2xl text-[13px] text-white dark:text-white outline-none transition-all" value={formData.organization || ''} onChange={e => setFormData({ ...formData, organization: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-avenir-bold text-brand-heaven-gold tracking-widest pl-2">{t('profile.edit')}</label>
                    <input className="w-full bg-[var(--bg-surface)] shadow-neu-pressed focus:shadow-neu-concave p-5 rounded-2xl text-[13px] text-white dark:text-white outline-none transition-all" value={formData.title || ''} onChange={e => setFormData({ ...formData, title: e.target.value })} />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-avenir-bold text-brand-heaven-gold tracking-widest pl-2">{t('registration.step2.desc')}</label>
                  <textarea className="w-full bg-[var(--bg-surface)] shadow-neu-pressed focus:shadow-neu-concave p-5 rounded-2xl text-[13px] min-h-[100px] text-white dark:text-white outline-none transition-all resize-none leading-relaxed" value={formData.orgDescription || ''} onChange={e => setFormData({ ...formData, orgDescription: e.target.value })} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-avenir-bold text-brand-heaven-gold tracking-widest pl-2">Login Email</label>
                    <input type="email" className="w-full bg-[var(--bg-surface)] shadow-neu-pressed focus:shadow-neu-concave p-5 rounded-2xl text-[13px] text-white dark:text-white outline-none transition-all" value={formData.email || ''} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-avenir-bold text-brand-heaven-gold tracking-widest pl-2">{t('registration.step3.contactEmail')}</label>
                    <input type="email" className="w-full bg-[var(--bg-surface)] shadow-neu-pressed focus:shadow-neu-concave p-5 rounded-2xl text-[13px] text-white dark:text-white outline-none transition-all" value={formData.contactEmail || ''} onChange={e => setFormData({ ...formData, contactEmail: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-avenir-bold text-brand-heaven-gold tracking-widest pl-2">{t('registration.step3.phone')}</label>
                    <div className="flex items-center gap-4">
                      <input className="w-full bg-[var(--bg-surface)] shadow-neu-pressed focus:shadow-neu-concave p-5 rounded-2xl text-[13px] text-white dark:text-white outline-none transition-all" value={formData.phone || ''} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                      <label className="flex items-center gap-2 cursor-pointer shrink-0">
                        <input type="checkbox" checked={formData.isWhatsapp || false} onChange={e => setFormData({ ...formData, isWhatsapp: e.target.checked })} className="w-4 h-4 rounded border-white/20" />
                        <span className="text-[10px] font-avenir-bold text-brand-heaven-gold uppercase tracking-widest">WhatsApp</span>
                      </label>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-avenir-bold text-brand-heaven-gold tracking-widest pl-2">Website</label>
                    <input className="w-full bg-[var(--bg-surface)] shadow-neu-pressed focus:shadow-neu-concave p-5 rounded-2xl text-[13px] text-white dark:text-white outline-none transition-all" value={formData.website || ''} onChange={e => setFormData({ ...formData, website: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-avenir-bold text-brand-heaven-gold tracking-widest pl-2">Other Info</label>
                    <input className="w-full bg-[var(--bg-surface)] shadow-neu-pressed focus:shadow-neu-concave p-5 rounded-2xl text-[13px] text-white dark:text-white outline-none transition-all" value={formData.otherInfo || ''} onChange={e => setFormData({ ...formData, otherInfo: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-avenir-bold text-brand-heaven-gold tracking-widest pl-2">{t('registration.step4.diet')}</label>
                    <input className="w-full bg-[var(--bg-surface)] shadow-neu-pressed focus:shadow-neu-concave p-5 rounded-2xl text-[13px] text-white dark:text-white outline-none transition-all" value={formData.dietaryRestrictions || ''} onChange={e => setFormData({ ...formData, dietaryRestrictions: e.target.value })} />
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] uppercase font-avenir-bold text-brand-heaven-gold tracking-widest pl-2 flex items-center gap-2">
                    <Globe size={12} /> {t('registration.step3.socialMedia')}
                  </label>
                  <div className="space-y-3">
                    {(formData.socialMedia || []).map((acc, idx) => {
                      const platform = SOCIAL_PLATFORMS.find(p => p.id === acc.platform);
                      return (
                        <div key={idx} className="flex flex-col gap-2 p-4 rounded-2xl bg-[var(--bg-surface)] shadow-neu-pressed">
                          <div className="flex items-center gap-3">
                            <select
                              value={acc.platform}
                              onChange={(e) => setFormData(prev => ({ ...prev, socialMedia: (prev.socialMedia || []).map((a, i) => i === idx ? { ...a, platform: e.target.value, handle: '' } : a) }))}
                              className="bg-transparent border-b border-white/20 py-2 text-[12px] text-white/70 outline-none focus:border-brand-heaven-gold transition-all appearance-none flex-1"
                            >
                              {SOCIAL_PLATFORMS.map(p => <option key={p.id} value={p.id} className="bg-[#050505]">{p.label}</option>)}
                            </select>
                            <div className="flex rounded-full border border-white/10 overflow-hidden text-[8px] font-avenir-bold shrink-0">
                              <button type="button" onClick={() => setFormData(prev => ({ ...prev, socialMedia: (prev.socialMedia || []).map((a, i) => i === idx ? { ...a, type: 'personal' } : a) }))}
                                className={`px-3 py-1.5 uppercase tracking-wider transition-colors ${acc.type === 'personal' ? 'bg-brand-heaven-gold/20 text-brand-heaven-gold' : 'text-white/30 hover:text-white/60'}`}>
                                {t('registration.step3.personal')}
                              </button>
                              <button type="button" onClick={() => setFormData(prev => ({ ...prev, socialMedia: (prev.socialMedia || []).map((a, i) => i === idx ? { ...a, type: 'ministerial' } : a) }))}
                                className={`px-3 py-1.5 uppercase tracking-wider transition-colors ${acc.type === 'ministerial' ? 'bg-brand-heaven-gold/20 text-brand-heaven-gold' : 'text-white/30 hover:text-white/60'}`}>
                                {t('registration.step3.ministry')}
                              </button>
                            </div>
                            <button type="button" onClick={() => setFormData(prev => ({ ...prev, socialMedia: (prev.socialMedia || []).filter((_, i) => i !== idx) }))}
                              className="p-1.5 rounded-full hover:bg-red-500/20 text-white/30 hover:text-red-400 transition-colors shrink-0">
                              <X size={12} />
                            </button>
                          </div>
                          <input
                            value={acc.handle}
                            onChange={(e) => setFormData(prev => ({ ...prev, socialMedia: (prev.socialMedia || []).map((a, i) => i === idx ? { ...a, handle: e.target.value } : a) }))}
                            placeholder={platform?.placeholder || '@handle'}
                            className="bg-transparent border-b border-white/10 py-2 text-[14px] text-white outline-none focus:border-brand-heaven-gold transition-all placeholder:text-white/15"
                          />
                        </div>
                      );
                    })}
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, socialMedia: [...(prev.socialMedia || []), { platform: 'instagram', handle: '', type: 'personal' }] }))}
                      className="flex items-center gap-2 text-[9px] text-white/40 hover:text-brand-heaven-gold uppercase tracking-widest font-avenir-bold transition-colors py-2 px-1"
                    >
                      <Plus size={12} /> {t('registration.step3.addSocial')}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-avenir-bold text-brand-heaven-gold tracking-widest pl-2">{t('registration.step4.events')}</label>
                  <textarea className="w-full bg-[var(--bg-surface)] shadow-neu-pressed focus:shadow-neu-concave p-5 rounded-2xl text-[13px] min-h-[100px] text-white dark:text-white outline-none transition-all resize-none leading-relaxed" value={formData.upcomingEvents || ''} onChange={e => setFormData({ ...formData, upcomingEvents: e.target.value })} />
                </div>
              </div>

              <button onClick={handleSave} className="w-full py-6 mt-4 bg-[var(--bg-surface)] shadow-neu-flat active:shadow-neu-pressed text-brand-heaven-gold font-avenir-bold uppercase rounded-3xl hover:text-[#D3B962] transition-all flex items-center justify-center gap-4 text-sm tracking-widest">
                <RefreshCw size={18} /> {t('admin.syncNow')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminConsole;
