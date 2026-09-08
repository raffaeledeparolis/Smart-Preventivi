import React, { useState } from 'react';
import {
  FileText,
  Users,
  Wrench,
  Package,
  BookOpen,
  Sparkles,
  Building2,
  Download,
  Upload,
  RotateCcw,
  Plus
} from 'lucide-react';
import { DatiAzienda } from '../types';

export type ActiveTab = 'documenti' | 'generatore' | 'prezziario' | 'prestazioni' | 'materiali' | 'clienti';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  azienda: DatiAzienda;
  onOpenAziendaModal: () => void;
  onNuovoDocumento: () => void;
  onExportBackup: () => void;
  onImportBackup: (file: File) => void;
  onResetData: () => void;
  documentiCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  azienda,
  onOpenAziendaModal,
  onNuovoDocumento,
  onExportBackup,
  onImportBackup,
  onResetData,
  documentiCount
}) => {
  const [showToolsMenu, setShowToolsMenu] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportBackup(file);
      setShowToolsMenu(false);
    }
  };

  return (
    <header className="no-print bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('documenti')}>
            {azienda.logoUrl ? (
              <div className="w-10 h-10 rounded-lg border border-slate-200 bg-white p-1 flex items-center justify-center shadow-xs shrink-0 overflow-hidden">
                <img
                  src={azienda.logoUrl}
                  alt={`Logo ${azienda.ragioneSociale || 'Azienda'}`}
                  className="max-h-full max-w-full object-contain"
                />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-lg bg-amber-600 flex items-center justify-center text-white shadow-xs font-extrabold text-base tracking-tight shrink-0">
                PS
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-900 tracking-tight text-lg">Preventivi Smart</span>
                <span className="text-[11px] font-semibold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Computo & PDF
                </span>
              </div>
              <p className="text-xs text-slate-500 truncate max-w-[210px] sm:max-w-xs font-medium">
                {azienda.ragioneSociale || 'Configura la tua impresa'}
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            <button
              id="nav-tab-documenti"
              onClick={() => setActiveTab('documenti')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'documenti'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Preventivi & Computi</span>
              {documentiCount > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                  activeTab === 'documenti' ? 'bg-slate-700 text-amber-300' : 'bg-slate-200 text-slate-700'
                }`}>
                  {documentiCount}
                </span>
              )}
            </button>

            <button
              id="nav-tab-generatore"
              onClick={() => setActiveTab('generatore')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'generatore'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-amber-700 bg-amber-50 hover:bg-amber-100'
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-400 fill-amber-400" />
              <span>Generatore Documenti</span>
              <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.2 bg-white/25 rounded-sm">
                Auto
              </span>
            </button>

            <button
              id="nav-tab-prezziario"
              onClick={() => setActiveTab('prezziario')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'prezziario'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Prezziario</span>
            </button>

            <button
              id="nav-tab-prestazioni"
              onClick={() => setActiveTab('prestazioni')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'prestazioni'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Wrench className="w-4 h-4" />
              <span>Prestazioni</span>
            </button>

            <button
              id="nav-tab-materiali"
              onClick={() => setActiveTab('materiali')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'materiali'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>Materiali</span>
            </button>

            <button
              id="nav-tab-clienti"
              onClick={() => setActiveTab('clienti')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'clienti'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Clienti</span>
            </button>
          </nav>

          {/* Right Action buttons */}
          <div className="flex items-center gap-2">
            <button
              id="btn-nuovo-documento-rapido"
              onClick={onNuovoDocumento}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-3.5 py-2 rounded-lg shadow-xs transition-colors"
              title="Crea un nuovo preventivo o computo metrico"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Nuovo Documento</span>
            </button>

            {/* Tools Menu (Impostazioni azienda, Backup, Reset) */}
            <div className="relative">
              <button
                id="btn-menu-impostazioni"
                onClick={() => setShowToolsMenu(!showToolsMenu)}
                className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
                title="Dati Impresa, Logo e Backup"
              >
                {azienda.logoUrl ? (
                  <img src={azienda.logoUrl} alt="Logo" className="w-5 h-5 object-contain rounded" />
                ) : (
                  <Building2 className="w-5 h-5 text-slate-700" />
                )}
              </button>

              {showToolsMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowToolsMenu(false)} />
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-4 py-2 border-b border-slate-100">
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Azienda & Dati</p>
                      <p className="text-sm font-bold text-slate-800 truncate">{azienda.ragioneSociale || 'Dati Azienda'}</p>
                    </div>

                    <button
                      id="menu-item-dati-azienda"
                      onClick={() => {
                        setShowToolsMenu(false);
                        onOpenAziendaModal();
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 font-medium"
                    >
                      <Building2 className="w-4 h-4 text-amber-600" />
                      <span>Dati Impresa & Logo Aziendale</span>
                    </button>

                    <button
                      id="menu-item-export-backup"
                      onClick={() => {
                        setShowToolsMenu(false);
                        onExportBackup();
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2.5"
                    >
                      <Download className="w-4 h-4 text-slate-500" />
                      <span>Esporta Backup (JSON)</span>
                    </button>

                    <label className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 cursor-pointer">
                      <Upload className="w-4 h-4 text-slate-500" />
                      <span>Importa Backup (JSON)</span>
                      <input
                        type="file"
                        accept=".json"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                    </label>

                    <div className="border-t border-slate-100 my-1" />

                    <button
                      id="menu-item-reset-database"
                      onClick={() => {
                        setShowToolsMenu(false);
                        if (confirm('Sei sicuro di voler ripristinare i dati iniziali di esempio? I dati attuali verranno sovrascritti.')) {
                          onResetData();
                        }
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 flex items-center gap-2.5"
                    >
                      <RotateCcw className="w-4 h-4 text-rose-500" />
                      <span>Ripristina Dati Esempio</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Sub-Navigation Bar */}
        <div className="flex md:hidden items-center gap-1 overflow-x-auto py-2 border-t border-slate-100 scrollbar-none">
          <button
            onClick={() => setActiveTab('documenti')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${
              activeTab === 'documenti' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Preventivi ({documentiCount})
          </button>
          <button
            onClick={() => setActiveTab('generatore')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap flex items-center gap-1 ${
              activeTab === 'generatore' ? 'bg-amber-600 text-white' : 'text-amber-700 bg-amber-50'
            }`}
          >
            <Sparkles className="w-3 h-3" />
            Generatore
          </button>
          <button
            onClick={() => setActiveTab('prezziario')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${
              activeTab === 'prezziario' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Prezziario
          </button>
          <button
            onClick={() => setActiveTab('prestazioni')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${
              activeTab === 'prestazioni' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Prestazioni
          </button>
          <button
            onClick={() => setActiveTab('materiali')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${
              activeTab === 'materiali' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Materiali
          </button>
          <button
            onClick={() => setActiveTab('clienti')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${
              activeTab === 'clienti' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Clienti
          </button>
        </div>
      </div>
    </header>
  );
};
