import React, { useState } from 'react';
import { BookmarkPlus, Check, X, Layers, Shield, FileText, Sparkles, ArrowRight } from 'lucide-react';
import { Documento, ModelloDocumentoPreset } from '../types';
import { convertDocumentoToPreset } from '../utils/storage';

interface SaveTemplateModalProps {
  documento: Documento;
  isOpen: boolean;
  onClose: () => void;
  onSaveTemplate: (preset: ModelloDocumentoPreset) => void;
  onNavigateToGeneratore?: () => void;
  existingCategories?: string[];
}

const CATEGORIE_SUGGERITE = [
  'I MIEI MODELLI',
  'GESTIONE DI PROGETTO',
  'RISTRUTTURAZIONE',
  'IMPIANTISTICA',
  'BAGNO & FINITURE',
  'EDILIZIA & STRUTTURE',
  'EFFICIENTAMENTO ENERGETICO',
  'MANUTENZIONI ORDINARIE'
];

export const SaveTemplateModal: React.FC<SaveTemplateModalProps> = ({
  documento,
  isOpen,
  onClose,
  onSaveTemplate,
  onNavigateToGeneratore,
  existingCategories = []
}) => {
  const [titolo, setTitolo] = useState<string>(documento.titolo || `Modello ${documento.numero}`);
  const [categoria, setCategoria] = useState<string>('I MIEI MODELLI');
  const [customCategoria, setCustomCategoria] = useState<string>('');
  const [isCustomCategory, setIsCustomCategory] = useState<boolean>(false);
  const [descrizione, setDescrizione] = useState<string>(
    documento.cantiere?.oggetto ||
      `Modello preconfezionato basato su ${documento.numero} con ${documento.capitoli.length} capitoli e ${documento.righe.length} voci.`
  );
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  // Unione categorie suggerite ed esistenti
  const allCategories = Array.from(
    new Set([...CATEGORIE_SUGGERITE, ...existingCategories.filter(Boolean)])
  );

  const handleCategorySelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === '__custom__') {
      setIsCustomCategory(true);
      setCustomCategoria('');
    } else {
      setIsCustomCategory(false);
      setCategoria(val);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titolo.trim()) return;

    const finalCategory = isCustomCategory
      ? (customCategoria.trim() || 'I MIEI MODELLI').toUpperCase()
      : categoria.toUpperCase();

    const newPreset = convertDocumentoToPreset(
      documento,
      titolo,
      finalCategory,
      descrizione
    );

    onSaveTemplate(newPreset);
    setSavedSuccess(true);
  };

  const handleResetAndClose = () => {
    setSavedSuccess(false);
    onClose();
  };

  const totalVoci = documento.righe?.length || 0;
  const totalCapitoli = documento.capitoli?.length || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-salva-template-title"
      >
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-amber-500 to-amber-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/20 rounded-lg">
              <BookmarkPlus className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 id="modal-salva-template-title" className="text-base font-bold">
                Salva come Modello Preconfezionato
              </h2>
              <p className="text-xs text-amber-100">
                Riutilizzabile in qualsiasi momento nel Generatore Documenti
              </p>
            </div>
          </div>
          <button
            onClick={handleResetAndClose}
            className="p-1.5 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {savedSuccess ? (
          <div className="p-8 text-center space-y-5">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <Check className="w-8 h-8 stroke-[2.5]" />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-bold text-slate-900">
                Modello Salvato con Successo!
              </h3>
              <p className="text-sm text-slate-600 max-w-md mx-auto">
                Il documento <strong className="text-slate-800">"{titolo}"</strong> è ora disponibile
                tra i <strong>Modelli Preconfezionati</strong> del Generatore Automatico con tutti i capitoli, misurazioni e condizioni contrattuali.
              </p>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={handleResetAndClose}
                className="w-full sm:w-auto px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition-colors"
              >
                Chiudi e Continua
              </button>

              {onNavigateToGeneratore && (
                <button
                  type="button"
                  onClick={() => {
                    handleResetAndClose();
                    onNavigateToGeneratore();
                  }}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold rounded-xl shadow-xs transition-colors"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Vai al Generatore Documenti</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
            {/* Titolo Template */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Nome del Modello <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={titolo}
                onChange={(e) => setTitolo(e.target.value)}
                placeholder="Es. Ristrutturazione Completa 90mq - Finiture Medie"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
              />
            </div>

            {/* Categoria */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Categoria Modello
                </label>
                <select
                  value={isCustomCategory ? '__custom__' : categoria}
                  onChange={handleCategorySelect}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                >
                  {allCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                  <option value="__custom__">+ Nuova Categoria Personalizzata...</option>
                </select>
              </div>

              {isCustomCategory && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Nome Nuova Categoria
                  </label>
                  <input
                    type="text"
                    required={isCustomCategory}
                    value={customCategoria}
                    onChange={(e) => setCustomCategoria(e.target.value)}
                    placeholder="Es. SERRAMENTI & INFISSI"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                  />
                </div>
              )}
            </div>

            {/* Descrizione */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Descrizione & Oggetto del Template
              </label>
              <textarea
                rows={3}
                value={descrizione}
                onChange={(e) => setDescrizione(e.target.value)}
                placeholder="Descrivi brevemente lo scopo del modello e la tipologia di intervento a cui è destinato..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
              />
            </div>

            {/* Scheda Riepilogo Contenuti Inclusi */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 uppercase tracking-wider">
                <span className="flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-amber-600" />
                  Elementi Inclusi nel Template
                </span>
                <span className="text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md font-mono font-bold">
                  {totalCapitoli} Capitoli • {totalVoci} Voci
                </span>
              </div>

              {/* Lista Capitoli */}
              <div className="max-h-32 overflow-y-auto space-y-1.5 pr-1">
                {documento.capitoli.map((cap, idx) => {
                  const numVociCap = (documento.righe || []).filter((r) => r.capitoloId === cap.id).length;
                  return (
                    <div
                      key={cap.id}
                      className="text-xs bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 flex items-center justify-between"
                    >
                      <span className="font-medium text-slate-800 truncate max-w-[320px]">
                        {idx + 1}. {cap.titolo}
                      </span>
                      <span className="text-slate-500 font-mono text-[11px] shrink-0">
                        {numVociCap} {numVociCap === 1 ? 'voce' : 'voci'}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Note e Condizioni Economiche Preservate */}
              <div className="pt-2 border-t border-slate-200 grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] text-slate-600">
                <div className="flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5 text-slate-400" />
                  <span>Oneri Sicurezza: <strong>{documento.oneriSicurezzaValore}{documento.oneriSicurezzaTipo === 'percentuale' ? '%' : '€'}</strong></span>
                </div>
                <div className="flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                  <span>IVA: <strong>{documento.ivaPerc}%</strong></span>
                </div>
                {documento.cassaPrevidenzialeAttiva && (
                  <div className="flex items-center gap-1 col-span-2 sm:col-span-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    <span>Cassa: <strong>{documento.cassaPrevidenzialeValore ?? documento.cassaPrevidenzialePerc}%</strong></span>
                  </div>
                )}
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleResetAndClose}
                className="px-4 py-2.5 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl text-sm font-semibold transition-colors"
              >
                Annulla
              </button>
              <button
                type="submit"
                id="btn-conferma-salva-template"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-sm font-semibold shadow-xs transition-colors"
              >
                <BookmarkPlus className="w-4 h-4" />
                <span>Salva nei Modelli Preconfezionati</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
