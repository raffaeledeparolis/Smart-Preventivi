import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  Save,
  Printer,
  ArrowLeft,
  Plus,
  Trash2,
  Copy,
  ChevronDown,
  ChevronUp,
  FolderPlus,
  BookOpen,
  Wrench,
  Package,
  Calculator,
  Building2,
  Calendar,
  Layers,
  Euro,
  Info,
  CheckCircle2,
  Percent,
  Search,
  X,
  BookmarkPlus,
  TrendingUp,
  BarChart3
} from 'lucide-react';
import {
  Documento,
  Cliente,
  VocePrezziario,
  Prestazione,
  Materiale,
  CapitoloDocumento,
  RigaComputo,
  TipoDocumento,
  StatoDocumento,
  UnitaMisura,
  ModelloDocumentoPreset
} from '../types';
import {
  calcolaQuantitaRiga,
  calcolaSubtotaleRiga,
  calcolaTotaliDocumento,
  calcolaAnalisiMarginiDocumento,
  calcolaAnalisiRiga,
  formatEuro,
  formatNumero
} from '../utils/calculations';
import { SaveTemplateModal } from './SaveTemplateModal';
import { DocumentoAnalisiMarginiView } from './DocumentoAnalisiMarginiView';

interface DocumentEditorProps {
  documento: Documento;
  clienti?: Cliente[];
  vociPrezziario?: VocePrezziario[];
  prestazioni?: Prestazione[];
  materiali?: Materiale[];
  onSave: (doc: Documento) => void;
  onOpenPrint: (doc: Documento) => void;
  onClose: () => void;
  onSaveTemplate?: (preset: ModelloDocumentoPreset) => void;
  onNavigateToGeneratore?: () => void;
  existingCategories?: string[];
}

export const DocumentEditor: React.FC<DocumentEditorProps> = ({
  documento: initialDoc,
  clienti = [],
  vociPrezziario = [],
  prestazioni = [],
  materiali = [],
  onSave,
  onOpenPrint,
  onClose,
  onSaveTemplate,
  onNavigateToGeneratore,
  existingCategories = []
}) => {
  const [doc, setDoc] = useState<Documento>(() => {
    const copy = JSON.parse(JSON.stringify(initialDoc));
    return {
      ...copy,
      capitoli: copy.capitoli || [],
      righe: copy.righe || []
    };
  });
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaveTemplateOpen, setIsSaveTemplateOpen] = useState(false);
  const [activeEditorTab, setActiveEditorTab] = useState<'computo' | 'analitica'>('computo');
  const [activeCapitoloId, setActiveCapitoloId] = useState<string>(
    initialDoc.capitoli[0]?.id || ''
  );

  // Picker Modal State (per inserire voci dal prezziario o dai cataloghi)
  const [pickerModal, setPickerModal] = useState<{
    open: boolean;
    capitoloId: string;
    source: 'prezziario' | 'prestazioni' | 'materiali';
    searchTerm: string;
  }>({
    open: false,
    capitoloId: '',
    source: 'prezziario',
    searchTerm: ''
  });

  // Aggiorna flag modifiche non salvate
  const updateDoc = (updater: (prev: Documento) => Documento) => {
    setDoc((prev) => {
      const next = updater(prev);
      next.dataAggiornamento = new Date().toISOString().split('T')[0];
      return next;
    });
    setHasUnsavedChanges(true);
  };

  // Selettore cliente: aggiorna snapshot e cantiere se vuoto
  const handleSelectCliente = (clienteId: string) => {
    const selected = clienti.find((c) => c.id === clienteId);
    if (!selected) return;

    updateDoc((prev) => ({
      ...prev,
      clienteId: selected.id,
      clienteSnapshot: selected,
      cantiere: {
        ...prev.cantiere,
        indirizzo: prev.cantiere.indirizzo || selected.indirizzo || '',
        citta: prev.cantiere.citta || selected.citta || '',
        cap: prev.cantiere.cap || selected.cap || '',
        provincia: prev.cantiere.provincia || selected.provincia || ''
      }
    }));
  };

  // Aggiungi Capitolo
  const handleAddCapitolo = () => {
    const nextNum = doc.capitoli.length + 1;
    const newCap: CapitoloDocumento = {
      id: `cap-${Date.now()}`,
      titolo: `Capitolo ${nextNum} - Nuova Categoria Lavori`,
      ordine: nextNum,
      descrizione: ''
    };
    updateDoc((prev) => ({
      ...prev,
      capitoli: [...prev.capitoli, newCap]
    }));
    setActiveCapitoloId(newCap.id);
  };

  // Rimuovi Capitolo
  const handleRemoveCapitolo = (capId: string) => {
    if (doc.capitoli.length <= 1) {
      alert('Il documento deve contenere almeno un capitolo.');
      return;
    }
    if (confirm('Rimuovere questo capitolo e tutte le sue voci di computo?')) {
      updateDoc((prev) => ({
        ...prev,
        capitoli: prev.capitoli.filter((c) => c.id !== capId),
        righe: prev.righe.filter((r) => r.capitoloId !== capId)
      }));
      const remaining = doc.capitoli.filter((c) => c.id !== capId);
      if (remaining.length > 0) {
        setActiveCapitoloId(remaining[0].id);
      }
    }
  };

  // Aggiungi Riga vuota nel capitolo attivo
  const handleAddRigaLibera = (capId: string) => {
    const newRiga: RigaComputo = {
      id: `riga-${Date.now()}`,
      capitoloId: capId,
      codiceVoce: '',
      descrizione: 'Nuova voce di lavoro o fornitura',
      unitaMisura: 'mq',
      usaFormulaMetrica: doc.tipo === 'computo_metrico',
      partiUguali: 1,
      lunghezza: 1,
      larghezza: 1,
      altezza: 1,
      quantita: 1,
      prezzoUnitario: 0,
      scontoPerc: 0,
      subtotale: 0,
      quotaManodoperaPerc: 60
    };
    updateDoc((prev) => ({
      ...prev,
      righe: [...prev.righe, newRiga]
    }));
  };

  // Inserisci riga da Prezziario
  const handleInsertFromPrezziario = (voce: VocePrezziario, capId: string) => {
    const newRiga: RigaComputo = {
      id: `riga-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      capitoloId: capId,
      codiceVoce: voce.codice,
      descrizione: voce.descrizioneEstesa || voce.titolo,
      unitaMisura: voce.unitaMisura,
      usaFormulaMetrica: doc.tipo === 'computo_metrico',
      partiUguali: 1,
      lunghezza: 1,
      larghezza: 1,
      altezza: 1,
      quantita: 1,
      prezzoUnitario: voce.prezzoUnitario,
      scontoPerc: 0,
      subtotale: voce.prezzoUnitario,
      quotaManodoperaPerc: voce.quotaManodopera ?? 60
    };

    updateDoc((prev) => ({
      ...prev,
      righe: [...prev.righe, newRiga]
    }));
  };

  // Inserisci riga da Prestazione
  const handleInsertFromPrestazione = (prest: Prestazione, capId: string) => {
    const newRiga: RigaComputo = {
      id: `riga-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      capitoloId: capId,
      codiceVoce: prest.codice,
      descrizione: `${prest.titolo}${prest.note ? ` - ${prest.note}` : ''}`,
      unitaMisura: prest.unitaMisura,
      usaFormulaMetrica: false,
      quantita: 1,
      prezzoUnitario: prest.prezzoConsigliato,
      scontoPerc: 0,
      subtotale: prest.prezzoConsigliato,
      quotaManodoperaPerc: 90
    };

    updateDoc((prev) => ({
      ...prev,
      righe: [...prev.righe, newRiga]
    }));
  };

  // Inserisci riga da Materiale
  const handleInsertFromMateriale = (mat: Materiale, capId: string) => {
    const newRiga: RigaComputo = {
      id: `riga-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      capitoloId: capId,
      codiceVoce: mat.codice,
      descrizione: `Fornitura ${mat.nome}${mat.marca ? ` (${mat.marca})` : ''}`,
      unitaMisura: mat.unitaMisura,
      usaFormulaMetrica: false,
      quantita: 1,
      prezzoUnitario: mat.prezzoVendita,
      scontoPerc: 0,
      subtotale: mat.prezzoVendita,
      quotaManodoperaPerc: 0
    };

    updateDoc((prev) => ({
      ...prev,
      righe: [...prev.righe, newRiga]
    }));
  };

  // Aggiorna campi riga e ricalcola subtotale
  const handleUpdateRiga = (rigaId: string, updates: Partial<RigaComputo>) => {
    updateDoc((prev) => {
      const newRighe = prev.righe.map((r) => {
        if (r.id !== rigaId) return r;

        const merged: RigaComputo = { ...r, ...updates };

        // Se usa formula metrica, ricalcola quantita
        if (merged.usaFormulaMetrica) {
          merged.quantita = calcolaQuantitaRiga(merged);
        }

        // Ricalcola subtotale
        merged.subtotale = calcolaSubtotaleRiga(
          merged.quantita,
          merged.prezzoUnitario,
          merged.scontoPerc
        );

        return merged;
      });

      return {
        ...prev,
        righe: newRighe
      };
    });
  };

  // Duplica riga
  const handleDuplicateRiga = (riga: RigaComputo) => {
    const clone: RigaComputo = {
      ...riga,
      id: `riga-${Date.now()}`
    };
    updateDoc((prev) => ({
      ...prev,
      righe: [...prev.righe, clone]
    }));
  };

  // Elimina riga
  const handleRemoveRiga = (rigaId: string) => {
    updateDoc((prev) => ({
      ...prev,
      righe: prev.righe.filter((r) => r.id !== rigaId)
    }));
  };

  // Salva Documento
  const handleSave = () => {
    onSave(doc);
    setHasUnsavedChanges(false);
  };

  // Aggiornamento multiplo di righe (per batch tools di redditività)
  const handleBatchUpdateRighe = (updates: { id: string; updates: Partial<RigaComputo> }[]) => {
    updateDoc((prev) => {
      const updateMap = new Map(updates.map((u) => [u.id, u.updates]));
      const newRighe = prev.righe.map((r) => {
        const u = updateMap.get(r.id);
        if (!u) return r;
        return { ...r, ...u };
      });
      return { ...prev, righe: newRighe };
    });
  };

  // Quadro economico calcolato
  const totali = calcolaTotaliDocumento(doc);

  // Analisi margini di commessa calcolata
  const analisiMargini = useMemo(() => {
    return calcolaAnalisiMarginiDocumento(doc);
  }, [doc]);

  return (
    <div className="space-y-6 pb-16">
      {/* Top Floating Action Bar */}
      <div className="bg-white border-b border-slate-200 sticky top-16 z-30 shadow-xs -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            title="Torna all'elenco"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-extrabold bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200 text-slate-900">
                {doc.numero}
              </span>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 truncate max-w-[200px] sm:max-w-md">
                {doc.titolo || 'Preventivo Senza Titolo'}
              </h2>
              {hasUnsavedChanges && (
                <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                  Modifiche non salvate
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Switcher Vista Computo / Vista Analitica Margini */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              id="tab-editor-computo"
              type="button"
              onClick={() => setActiveEditorTab('computo')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeEditorTab === 'computo'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-amber-600" />
              <span>Computo & Voci</span>
            </button>

            <button
              id="tab-editor-analitica"
              type="button"
              onClick={() => setActiveEditorTab('analitica')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeEditorTab === 'analitica'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
              <span>Vista Analitica Margini</span>
              <span className="ml-1 bg-emerald-100 text-emerald-800 text-[10px] px-1.5 py-0.5 rounded-full font-mono">
                {formatNumero(analisiMargini.margineComplessivoPerc, 1)}%
              </span>
            </button>
          </div>

          {onSaveTemplate && (
            <button
              id="btn-salva-template-editor"
              type="button"
              onClick={() => setIsSaveTemplateOpen(true)}
              className="inline-flex items-center gap-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-semibold px-3 py-2 rounded-lg transition-colors shadow-xs"
              title="Salva questo documento come modello preconfezionato"
            >
              <BookmarkPlus className="w-4 h-4 text-amber-600" />
              <span className="hidden sm:inline">Salva come Modello</span>
              <span className="sm:hidden">Modello</span>
            </button>
          )}

          <button
            id="btn-stampa-editor"
            onClick={() => onOpenPrint(doc)}
            className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold px-3.5 py-2 rounded-lg transition-colors"
            title="Anteprima e stampa PDF"
          >
            <Printer className="w-4 h-4" />
            <span>Anteprima & PDF</span>
          </button>

          <button
            id="btn-salva-documento"
            onClick={handleSave}
            className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-xs transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>Salva Documento</span>
          </button>
        </div>
      </div>

      {/* Main Content Area: Computo vs Analisi Margini */}
      {activeEditorTab === 'computo' ? (
        /* Main Grid: Document Settings & Chapters */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Main Document Form & Rows */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header Card: Metadati Documento & Cliente */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-600" />
              Dati del Documento & Committente
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Tipo Documento */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Tipo Documento
                </label>
                <select
                  value={doc.tipo}
                  onChange={(e) => updateDoc((prev) => ({ ...prev, tipo: e.target.value as TipoDocumento }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold bg-white text-slate-900"
                >
                  <option value="preventivo">Preventivo Lavori</option>
                  <option value="computo_metrico">Computo Metrico Estimativo</option>
                  <option value="fattura_proforma">Fattura Proforma / Ordine</option>
                </select>
              </div>

              {/* Numero Documento */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Numero Progressivo
                </label>
                <input
                  type="text"
                  value={doc.numero}
                  onChange={(e) => updateDoc((prev) => ({ ...prev, numero: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900"
                />
              </div>

              {/* Stato */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Stato Avanzamento
                </label>
                <select
                  value={doc.stato}
                  onChange={(e) => updateDoc((prev) => ({ ...prev, stato: e.target.value as StatoDocumento }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold bg-white text-slate-900"
                >
                  <option value="bozza">Bozza di lavoro</option>
                  <option value="inviato">Inviato al Committente</option>
                  <option value="approvato">Approvato / Confermato</option>
                  <option value="rifiutato">Rifiutato</option>
                  <option value="completato">Lavori Completati</option>
                </select>
              </div>
            </div>

            {/* Titolo Oggetto */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Oggetto / Titolo dei Lavori *
              </label>
              <input
                type="text"
                value={doc.titolo}
                onChange={(e) => updateDoc((prev) => ({ ...prev, titolo: e.target.value }))}
                placeholder="Es. Ristrutturazione Completa Appartamento Residenziale - Via Garibaldi 14"
                className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm font-semibold text-slate-900"
              />
            </div>

            {/* Date */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Data Emissione
                </label>
                <input
                  type="date"
                  value={doc.data}
                  onChange={(e) => updateDoc((prev) => ({ ...prev, data: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Data di Scadenza Offerta
                </label>
                <input
                  type="date"
                  value={doc.dataScadenza}
                  onChange={(e) => updateDoc((prev) => ({ ...prev, dataScadenza: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Validità (Giorni)
                </label>
                <input
                  type="number"
                  min="1"
                  value={doc.validitaGiorni}
                  onChange={(e) => updateDoc((prev) => ({ ...prev, validitaGiorni: parseInt(e.target.value) || 30 }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900"
                />
              </div>
            </div>

            {/* Committente Selector */}
            <div className="pt-2 border-t border-slate-100">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Seleziona Committente (Anagrafica)
              </label>
              <select
                value={doc.clienteId}
                onChange={(e) => handleSelectCliente(e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm bg-white font-medium text-slate-900"
              >
                <option value="">-- Seleziona un cliente esistente --</option>
                {clienti.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.ragioneSociale} ({c.codiceFiscale || c.piva}) - {c.citta}
                  </option>
                ))}
              </select>

              {doc.clienteSnapshot?.ragioneSociale && (
                <div className="mt-2 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200/80 flex flex-wrap justify-between gap-2">
                  <div>
                    <strong>{doc.clienteSnapshot.ragioneSociale}</strong>
                    {doc.clienteSnapshot.referente && ` (Rif: ${doc.clienteSnapshot.referente})`}
                    <div>{doc.clienteSnapshot.indirizzo}, {doc.clienteSnapshot.citta} ({doc.clienteSnapshot.provincia})</div>
                  </div>
                  <div className="text-right">
                    <div>C.F.: <span className="font-mono">{doc.clienteSnapshot.codiceFiscale}</span></div>
                    {doc.clienteSnapshot.piva && <div>P.IVA: <span className="font-mono">{doc.clienteSnapshot.piva}</span></div>}
                  </div>
                </div>
              )}
            </div>

            {/* Dati Cantiere */}
            <div className="pt-2 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Luogo e Indirizzo del Cantiere
                </label>
                <input
                  type="text"
                  placeholder="Es. Via Montenapoleone 12 - Scala B Piano 3"
                  value={doc.cantiere.indirizzo}
                  onChange={(e) =>
                    updateDoc((prev) => ({
                      ...prev,
                      cantiere: { ...prev.cantiere, indirizzo: e.target.value }
                    }))
                  }
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Città e Provincia Cantiere
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Comune"
                    value={doc.cantiere.citta}
                    onChange={(e) =>
                      updateDoc((prev) => ({
                        ...prev,
                        cantiere: { ...prev.cantiere, citta: e.target.value }
                      }))
                    }
                    className="flex-1 px-3 py-1.5 border border-slate-300 rounded-lg text-xs text-slate-900"
                  />
                  <input
                    type="text"
                    maxLength={2}
                    placeholder="PR"
                    value={doc.cantiere.provincia}
                    onChange={(e) =>
                      updateDoc((prev) => ({
                        ...prev,
                        cantiere: { ...prev.cantiere, provincia: e.target.value.toUpperCase() }
                      }))
                    }
                    className="w-14 px-3 py-1.5 border border-slate-300 rounded-lg text-xs text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Direttore Lavori / Responsabile
                </label>
                <input
                  type="text"
                  placeholder="Es. Arch. Rossi / Geom. Bianchi"
                  value={doc.cantiere.responsabile || ''}
                  onChange={(e) =>
                    updateDoc((prev) => ({
                      ...prev,
                      cantiere: { ...prev.cantiere, responsabile: e.target.value }
                    }))
                  }
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs text-slate-900"
                />
              </div>
            </div>
          </div>

          {/* Capitoli e Voci di Computo Metrico */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Layers className="w-5 h-5 text-amber-600" />
                Capitoli di Lavoro & Voci di Computo
              </h3>

              <button
                id="btn-aggiungi-capitolo"
                onClick={handleAddCapitolo}
                className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-xs transition-colors"
              >
                <FolderPlus className="w-4 h-4" />
                <span>Aggiungi Capitolo</span>
              </button>
            </div>

            {/* Elenco Capitoli Accordion */}
            {(doc.capitoli || []).map((cap, capIndex) => {
              const capRighe = (doc.righe || []).filter((r) => r.capitoloId === cap.id);
              const capTotale = capRighe.reduce((acc, r) => acc + (Number(r.subtotale) || 0), 0);
              const isActive = activeCapitoloId === cap.id;

              return (
                <div
                  key={cap.id}
                  id={`capitolo-${cap.id}`}
                  className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden transition-all"
                >
                  {/* Capitolo Header */}
                  <div
                    className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b ${
                      isActive ? 'bg-amber-50/40 border-amber-200' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div
                      className="flex-1 flex items-center gap-3 cursor-pointer"
                      onClick={() => setActiveCapitoloId(isActive ? '' : cap.id)}
                    >
                      <button className="text-slate-400 hover:text-slate-600">
                        {isActive ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </button>

                      <div className="flex-1">
                        <input
                          type="text"
                          value={cap.titolo}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => {
                            const newTitolo = e.target.value;
                            updateDoc((prev) => ({
                              ...prev,
                              capitoli: prev.capitoli.map((c) => (c.id === cap.id ? { ...c, titolo: newTitolo } : c))
                            }));
                          }}
                          className="font-bold text-slate-900 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-amber-500 focus:bg-white px-1 py-0.5 rounded-xs text-sm sm:text-base w-full max-w-lg"
                        />
                        <p className="text-xs text-slate-500 px-1">
                          {capRighe.length} {capRighe.length === 1 ? 'voce' : 'voci di lavoro'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 pl-8 sm:pl-0">
                      <div className="text-right">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Subtotale Capitolo</span>
                        <span className="text-sm font-mono font-bold text-slate-900">
                          {formatEuro(capTotale)}
                        </span>
                      </div>

                      <button
                        onClick={() => handleRemoveCapitolo(cap.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                        title="Elimina capitolo"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Capitolo Body (Righe di Computo) */}
                  {isActive && (
                    <div className="p-4 space-y-4">
                      {/* Voci List */}
                      {capRighe.length === 0 ? (
                        <div className="border border-dashed border-slate-200 rounded-lg p-6 text-center text-xs text-slate-400">
                          Nessuna voce in questo capitolo. Aggiungi voci dal prezziario, prestazioni o riga libera.
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {capRighe.map((riga, rIndex) => (
                            <div
                              key={riga.id}
                              className="bg-slate-50/70 rounded-xl border border-slate-200 p-3.5 space-y-3 hover:border-amber-200 transition-colors"
                            >
                              {/* Row Top: Codice, Descrizione, U.M., Modalità Metrica */}
                              <div className="flex flex-col sm:flex-row gap-2 sm:items-start">
                                <div className="w-full sm:w-28 shrink-0">
                                  <input
                                    type="text"
                                    placeholder="Cod. Voce"
                                    value={riga.codiceVoce || ''}
                                    onChange={(e) => handleUpdateRiga(riga.id, { codiceVoce: e.target.value.toUpperCase() })}
                                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-800"
                                  />
                                </div>

                                <div className="flex-1">
                                  <textarea
                                    rows={2}
                                    placeholder="Descrizione dettagliata della lavorazione, materiali, prescrizioni..."
                                    value={riga.descrizione}
                                    onChange={(e) => handleUpdateRiga(riga.id, { descrizione: e.target.value })}
                                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 leading-relaxed resize-y"
                                  />
                                </div>

                                <div className="flex items-center gap-1 self-end sm:self-start">
                                  <button
                                    onClick={() => handleDuplicateRiga(riga)}
                                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-white rounded-md transition-colors"
                                    title="Duplica riga"
                                  >
                                    <Copy className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleRemoveRiga(riga.id)}
                                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                                    title="Elimina riga"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>

                              {/* Row Calculations & Metric Formula */}
                              <div className="bg-white rounded-lg p-3 border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                                {/* Toggle Metrico */}
                                <label className="inline-flex items-center gap-1.5 cursor-pointer select-none">
                                  <input
                                    type="checkbox"
                                    checked={riga.usaFormulaMetrica}
                                    onChange={(e) =>
                                      handleUpdateRiga(riga.id, { usaFormulaMetrica: e.target.checked })
                                    }
                                    className="rounded-sm border-slate-300 text-amber-600 focus:ring-amber-500"
                                  />
                                  <span className="font-semibold text-slate-700">Misure Metriche (L x P x H)</span>
                                </label>

                                {/* Colonne dimensionali se usa formula metrica */}
                                {riga.usaFormulaMetrica ? (
                                  <div className="flex flex-wrap items-center gap-2 bg-amber-50/50 p-1.5 rounded-lg border border-amber-200">
                                    <div className="flex items-center gap-1">
                                      <span className="text-[10px] uppercase font-bold text-slate-400">P.U.:</span>
                                      <input
                                        type="number"
                                        step="1"
                                        min="1"
                                        title="Parti Uguali"
                                        value={riga.partiUguali ?? 1}
                                        onChange={(e) =>
                                          handleUpdateRiga(riga.id, { partiUguali: parseFloat(e.target.value) || 1 })
                                        }
                                        className="w-12 px-1.5 py-1 border border-slate-300 rounded-sm text-xs font-mono text-center bg-white"
                                      />
                                    </div>
                                    <span>×</span>
                                    <div className="flex items-center gap-1">
                                      <span className="text-[10px] uppercase font-bold text-slate-400">Lung:</span>
                                      <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        title="Lunghezza (metri)"
                                        value={riga.lunghezza ?? 1}
                                        onChange={(e) =>
                                          handleUpdateRiga(riga.id, { lunghezza: parseFloat(e.target.value) || 1 })
                                        }
                                        className="w-16 px-1.5 py-1 border border-slate-300 rounded-sm text-xs font-mono text-center bg-white"
                                      />
                                    </div>
                                    <span>×</span>
                                    <div className="flex items-center gap-1">
                                      <span className="text-[10px] uppercase font-bold text-slate-400">Larg:</span>
                                      <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        title="Larghezza (metri)"
                                        value={riga.larghezza ?? 1}
                                        onChange={(e) =>
                                          handleUpdateRiga(riga.id, { larghezza: parseFloat(e.target.value) || 1 })
                                        }
                                        className="w-16 px-1.5 py-1 border border-slate-300 rounded-sm text-xs font-mono text-center bg-white"
                                      />
                                    </div>
                                    <span>×</span>
                                    <div className="flex items-center gap-1">
                                      <span className="text-[10px] uppercase font-bold text-slate-400">Alt:</span>
                                      <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        title="Altezza (metri)"
                                        value={riga.altezza ?? 1}
                                        onChange={(e) =>
                                          handleUpdateRiga(riga.id, { altezza: parseFloat(e.target.value) || 1 })
                                        }
                                        className="w-16 px-1.5 py-1 border border-slate-300 rounded-sm text-xs font-mono text-center bg-white"
                                      />
                                    </div>
                                  </div>
                                ) : null}

                                {/* Quantità Risultante */}
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-slate-600">Qtà:</span>
                                  <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    disabled={riga.usaFormulaMetrica}
                                    value={riga.quantita}
                                    onChange={(e) =>
                                      handleUpdateRiga(riga.id, { quantita: parseFloat(e.target.value) || 0 })
                                    }
                                    className={`w-20 px-2 py-1 border border-slate-300 rounded-md text-xs font-mono font-bold text-slate-900 ${
                                      riga.usaFormulaMetrica ? 'bg-slate-100 text-slate-600' : 'bg-white'
                                    }`}
                                  />
                                  <select
                                    value={riga.unitaMisura}
                                    onChange={(e) =>
                                      handleUpdateRiga(riga.id, { unitaMisura: e.target.value as UnitaMisura })
                                    }
                                    className="px-2 py-1 border border-slate-300 rounded-md text-xs bg-white font-semibold"
                                  >
                                    <option value="mq">mq</option>
                                    <option value="ml">ml</option>
                                    <option value="mc">mc</option>
                                    <option value="cad">cad</option>
                                    <option value="a corpo">a corpo</option>
                                    <option value="kg">kg</option>
                                    <option value="sacco">sacco</option>
                                    <option value="h">h</option>
                                    <option value="gg">gg</option>
                                  </select>
                                </div>

                                {/* Prezzo Unitario & Sconto */}
                                <div className="flex items-center gap-3">
                                  <div className="flex items-center gap-1">
                                    <span className="text-slate-500">Prezzo:</span>
                                    <input
                                      type="number"
                                      step="0.01"
                                      min="0"
                                      value={riga.prezzoUnitario}
                                      onChange={(e) =>
                                        handleUpdateRiga(riga.id, { prezzoUnitario: parseFloat(e.target.value) || 0 })
                                      }
                                      className="w-20 px-2 py-1 border border-slate-300 rounded-md text-xs font-mono font-bold text-slate-900"
                                    />
                                    <span>€</span>
                                  </div>

                                  <div className="flex items-center gap-1">
                                    <span className="text-slate-500">Sc%:</span>
                                    <input
                                      type="number"
                                      step="1"
                                      min="0"
                                      max="100"
                                      value={riga.scontoPerc}
                                      onChange={(e) =>
                                        handleUpdateRiga(riga.id, { scontoPerc: parseFloat(e.target.value) || 0 })
                                      }
                                      className="w-14 px-2 py-1 border border-slate-300 rounded-md text-xs font-mono"
                                    />
                                  </div>

                                  {/* Subtotale */}
                                  <div className="text-right pl-2">
                                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Totale</span>
                                    <span className="font-mono font-extrabold text-sm text-slate-900">
                                      {formatEuro(riga.subtotale)}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Barra Costi Diretti e Margine di Riga */}
                              <div className="mt-2.5 pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs bg-slate-50/70 p-2 rounded-lg">
                                <div className="flex flex-wrap items-center gap-3">
                                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                    Costi Diretti (€/UM):
                                  </span>
                                  {/* Costo Materiali */}
                                  <div className="flex items-center gap-1">
                                    <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                                      Mat:
                                    </span>
                                    <input
                                      type="number"
                                      step="0.01"
                                      min="0"
                                      value={riga.costoMaterialiUnitario !== undefined ? riga.costoMaterialiUnitario : ''}
                                      placeholder="€"
                                      onChange={(e) => {
                                        const val = e.target.value === '' ? undefined : parseFloat(e.target.value) || 0;
                                        handleUpdateRiga(riga.id, { costoMaterialiUnitario: val });
                                      }}
                                      className="w-16 px-1.5 py-0.5 border border-slate-300 rounded text-xs font-mono font-bold text-slate-800 bg-white"
                                      title="Costo unitario materiali sostenuto (€/UM)"
                                    />
                                    <span className="text-[10px] text-slate-400">€/{riga.unitaMisura}</span>
                                  </div>

                                  {/* Costo Manodopera */}
                                  <div className="flex items-center gap-1">
                                    <span className="text-[10px] font-semibold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                                      M.O.:
                                    </span>
                                    <input
                                      type="number"
                                      step="0.01"
                                      min="0"
                                      value={riga.costoManodoperaUnitario !== undefined ? riga.costoManodoperaUnitario : ''}
                                      placeholder="€"
                                      onChange={(e) => {
                                        const val = e.target.value === '' ? undefined : parseFloat(e.target.value) || 0;
                                        handleUpdateRiga(riga.id, { costoManodoperaUnitario: val });
                                      }}
                                      className="w-16 px-1.5 py-0.5 border border-slate-300 rounded text-xs font-mono font-bold text-slate-800 bg-white"
                                      title="Costo unitario manodopera sostenuto (€/UM)"
                                    />
                                    <span className="text-[10px] text-slate-400">€/{riga.unitaMisura}</span>
                                  </div>
                                </div>

                                {/* Live Margine Badge */}
                                {(() => {
                                  const rAnalisi = calcolaAnalisiRiga(riga);
                                  const isOttimo = rAnalisi.marginePerc >= 30;
                                  const isMedio = rAnalisi.marginePerc >= 15 && rAnalisi.marginePerc < 30;
                                  const isInPerdita = rAnalisi.marginePerc < 0;

                                  return (
                                    <div className="flex items-center gap-2">
                                      <span
                                        className={`inline-flex items-center gap-1 text-[11px] font-mono font-bold px-2 py-0.5 rounded-full ${
                                          isInPerdita
                                            ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                            : isOttimo
                                            ? 'bg-emerald-100 text-emerald-800'
                                            : isMedio
                                            ? 'bg-amber-100 text-amber-800'
                                            : 'bg-rose-50 text-rose-700'
                                        }`}
                                        title={`Ricavo: ${formatEuro(rAnalisi.ricavoTotale)} | Costo Tot: ${formatEuro(rAnalisi.costoTotale)} | Utile: ${formatEuro(rAnalisi.margineEuro)}`}
                                      >
                                        Margine: {formatEuro(rAnalisi.margineEuro)} ({formatNumero(rAnalisi.marginePerc, 1)}%)
                                      </span>
                                    </div>
                                  );
                                })()}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Action Bar per aggiungere righe nel capitolo */}
                      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200">
                        <button
                          onClick={() => handleAddRigaLibera(cap.id)}
                          className="inline-flex items-center gap-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors shadow-xs"
                        >
                          <Plus className="w-3.5 h-3.5 text-slate-500" />
                          <span>Riga Libera</span>
                        </button>

                        <button
                          onClick={() =>
                            setPickerModal({
                              open: true,
                              capitoloId: cap.id,
                              source: 'prezziario',
                              searchTerm: ''
                            })
                          }
                          className="inline-flex items-center gap-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                        >
                          <BookOpen className="w-3.5 h-3.5 text-amber-600" />
                          <span>Da Prezziario</span>
                        </button>

                        <button
                          onClick={() =>
                            setPickerModal({
                              open: true,
                              capitoloId: cap.id,
                              source: 'prestazioni',
                              searchTerm: ''
                            })
                          }
                          className="inline-flex items-center gap-1 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                        >
                          <Wrench className="w-3.5 h-3.5 text-blue-600" />
                          <span>Da Prestazioni</span>
                        </button>

                        <button
                          onClick={() =>
                            setPickerModal({
                              open: true,
                              capitoloId: cap.id,
                              source: 'materiali',
                              searchTerm: ''
                            })
                          }
                          className="inline-flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                        >
                          <Package className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Da Materiali</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Condizioni Contrattuali e Note Finali */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Info className="w-4 h-4 text-amber-600" />
              Condizioni Contrattuali, Pagamento & Clausole
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Condizioni di Pagamento
                </label>
                <input
                  type="text"
                  placeholder="Es. 30% all'accettazione, 40% a SAL, 30% a saldo con bonifico bancario"
                  value={doc.condizioniPagamento}
                  onChange={(e) => updateDoc((prev) => ({ ...prev, condizioniPagamento: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Tempi di Inizio ed Esecuzione Lavori
                </label>
                <input
                  type="text"
                  placeholder="Es. Inizio entro 10 gg lavorativi; durata prevista 30 giorni consecutivi"
                  value={doc.tempiEsecuzione}
                  onChange={(e) => updateDoc((prev) => ({ ...prev, tempiEsecuzione: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Opere Escluse dall'Offerta
                </label>
                <input
                  type="text"
                  placeholder="Es. Fornitura corpi illuminanti e piastrelle a carico committente (posa inclusa)"
                  value={doc.esclusioni}
                  onChange={(e) => updateDoc((prev) => ({ ...prev, esclusioni: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Note di Chiusura / Riferimento Detrazioni Fiscali
                </label>
                <textarea
                  rows={2}
                  placeholder="Diciture di legge per detrazioni 50%, IVA agevolata o conformità impianti..."
                  value={doc.noteFinali}
                  onChange={(e) => updateDoc((prev) => ({ ...prev, noteFinali: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right 1 Column: Sticky Economic Framework & Tax Setup */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs sticky top-36 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Calculator className="w-4 h-4 text-amber-600" />
                Quadro Economico
              </h3>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                {doc.tipo === 'computo_metrico' ? 'Computo' : 'Preventivo'}
              </span>
            </div>

            {/* Imponibile Lavori */}
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Imponibile Lavori (Lordo):</span>
                <span className="font-mono font-bold text-slate-800">{formatEuro(totali.imponibileLavoriLordo)}</span>
              </div>

              {/* Sconto Generale */}
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1">
                  <span className="text-slate-500">Sconto Generale:</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={doc.scontoGeneralePerc}
                    onChange={(e) =>
                      updateDoc((prev) => ({ ...prev, scontoGeneralePerc: parseFloat(e.target.value) || 0 }))
                    }
                    className="w-12 px-1.5 py-0.5 border border-slate-300 rounded-sm text-xs font-mono text-center"
                  />
                  <span>%</span>
                </div>
                <span className="font-mono text-rose-600">
                  -{formatEuro(totali.scontoGeneraleValore)}
                </span>
              </div>

              <div className="flex justify-between items-center font-semibold pt-1 border-t border-slate-100">
                <span className="text-slate-700">Lavori al Netto dello Sconto:</span>
                <span className="font-mono text-slate-900">{formatEuro(totali.imponibileLavoriNetto)}</span>
              </div>

              {/* Oneri per la Sicurezza */}
              <div className="pt-2 border-t border-slate-100 space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-slate-700 font-semibold">Oneri di Sicurezza:</span>
                  <span className="font-mono font-bold text-slate-900">{formatEuro(totali.oneriSicurezza)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={doc.oneriSicurezzaTipo}
                    onChange={(e) =>
                      updateDoc((prev) => ({ ...prev, oneriSicurezzaTipo: e.target.value as 'percentuale' | 'fisso' }))
                    }
                    className="px-2 py-1 border border-slate-200 rounded-md text-xs bg-slate-50"
                  >
                    <option value="percentuale">% sui lavori</option>
                    <option value="fisso">Importo fisso (€)</option>
                  </select>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={doc.oneriSicurezzaValore}
                    onChange={(e) =>
                      updateDoc((prev) => ({ ...prev, oneriSicurezzaValore: parseFloat(e.target.value) || 0 }))
                    }
                    className="flex-1 px-2 py-1 border border-slate-300 rounded-md text-xs font-mono text-right"
                  />
                </div>
                <p className="text-[10px] text-slate-400">Non soggetti a ribasso contrattuale (D.Lgs 81/08)</p>
              </div>

              {/* Cassa Previdenziale (se attiva) */}
              <div className="pt-2 border-t border-slate-100 space-y-1.5">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="flex items-center gap-1.5 font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={doc.cassaPrevidenzialeAttiva}
                      onChange={(e) => updateDoc((prev) => ({ ...prev, cassaPrevidenzialeAttiva: e.target.checked }))}
                      className="rounded-sm border-slate-300 text-amber-600"
                    />
                    Cassa Previdenziale
                  </span>
                  {doc.cassaPrevidenzialeAttiva && (
                    <span className="font-mono font-bold text-slate-800">{formatEuro(totali.cassaPrevidenziale)}</span>
                  )}
                </label>

                {doc.cassaPrevidenzialeAttiva && (
                  <div className="space-y-2 pl-5 pt-1">
                    <input
                      type="text"
                      placeholder="Nome Cassa (es. Cassa Edile, Inarcassa 4%, CIPAG)"
                      value={doc.cassaPrevidenzialeNome}
                      onChange={(e) => updateDoc((prev) => ({ ...prev, cassaPrevidenzialeNome: e.target.value }))}
                      className="w-full px-2 py-1 border border-slate-300 rounded-md text-xs"
                    />
                    <div className="flex items-center gap-2">
                      <select
                        value={doc.cassaPrevidenzialeTipo || 'percentuale'}
                        onChange={(e) => {
                          const newTipo = e.target.value as 'percentuale' | 'fisso';
                          updateDoc((prev) => ({
                            ...prev,
                            cassaPrevidenzialeTipo: newTipo
                          }));
                        }}
                        className="px-2 py-1 border border-slate-200 rounded-md text-xs bg-slate-50"
                      >
                        <option value="percentuale">% su imponibile</option>
                        <option value="fisso">Importo fisso (€)</option>
                      </select>
                      <div className="flex-1 relative flex items-center">
                        <input
                          type="number"
                          step={(doc.cassaPrevidenzialeTipo || 'percentuale') === 'fisso' ? '0.01' : '0.1'}
                          min="0"
                          value={
                            doc.cassaPrevidenzialeValore !== undefined
                              ? doc.cassaPrevidenzialeValore
                              : doc.cassaPrevidenzialePerc ?? 0
                          }
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            updateDoc((prev) => ({
                              ...prev,
                              cassaPrevidenzialeValore: val,
                              cassaPrevidenzialePerc: (prev.cassaPrevidenzialeTipo || 'percentuale') === 'percentuale' ? val : prev.cassaPrevidenzialePerc
                            }));
                          }}
                          className="w-full px-2 py-1 border border-slate-300 rounded-md text-xs font-mono text-right pr-6"
                        />
                        <span className="absolute right-2 text-xs text-slate-500 font-semibold pointer-events-none">
                          {(doc.cassaPrevidenzialeTipo || 'percentuale') === 'percentuale' ? '%' : '€'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Imponibile IVA */}
              <div className="pt-2 border-t border-slate-100 flex justify-between items-center font-bold text-slate-800">
                <span>Imponibile Fiscale:</span>
                <span className="font-mono text-sm">{formatEuro(totali.totaleImponibileFiscale)}</span>
              </div>

              {/* Aliquota IVA */}
              <div className="pt-2 border-t border-slate-100 space-y-1.5">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-700">Aliquota IVA:</span>
                    <select
                      value={doc.ivaPerc}
                      onChange={(e) => updateDoc((prev) => ({ ...prev, ivaPerc: parseInt(e.target.value) || 0 }))}
                      className="px-2 py-1 border border-slate-300 rounded-md text-xs font-semibold bg-white"
                    >
                      <option value="10">10% (Ristrutturazioni)</option>
                      <option value="22">22% (Ordinaria)</option>
                      <option value="4">4% (Prima Casa)</option>
                      <option value="0">0% (Esente / Reverse Charge)</option>
                    </select>
                  </div>
                  <span className="font-mono font-bold text-slate-900">{formatEuro(totali.ivaValore)}</span>
                </div>

                {doc.ivaPerc === 0 && (
                  <input
                    type="text"
                    placeholder="Causale esenzione (es. Reverse Charge Art. 17 o Forfettario)"
                    value={doc.ivaEsenzioneTesto || ''}
                    onChange={(e) => updateDoc((prev) => ({ ...prev, ivaEsenzioneTesto: e.target.value }))}
                    className="w-full px-2.5 py-1 border border-slate-300 rounded-md text-xs text-slate-700 bg-amber-50/50"
                  />
                )}
              </div>

              {/* Ritenuta d'acconto (se professionista) */}
              <div className="pt-2 border-t border-slate-100 space-y-1.5">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="flex items-center gap-1.5 font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={doc.ritenutaAccontoAttiva}
                      onChange={(e) => updateDoc((prev) => ({ ...prev, ritenutaAccontoAttiva: e.target.checked }))}
                      className="rounded-sm border-slate-300 text-amber-600"
                    />
                    Ritenuta d'Acconto (es. 20%)
                  </span>
                  {doc.ritenutaAccontoAttiva && (
                    <span className="font-mono font-bold text-rose-600">
                      -{formatEuro(totali.ritenutaAccontoValore)}
                    </span>
                  )}
                </label>
              </div>

              {/* Totale Complessivo Documento */}
              <div className="pt-4 border-t-2 border-slate-900 space-y-1">
                <div className="flex justify-between items-baseline">
                  <span className="text-xs uppercase font-extrabold text-slate-900 tracking-wider">
                    Totale Complessivo
                  </span>
                  <span className="font-mono text-xl sm:text-2xl font-extrabold text-amber-600">
                    {formatEuro(totali.totaleComplessivo)}
                  </span>
                </div>

                {doc.ritenutaAccontoAttiva && (
                  <div className="flex justify-between items-center pt-1 text-slate-600 text-xs">
                    <span>Netto a Pagare:</span>
                    <span className="font-mono font-bold text-slate-900">{formatEuro(totali.totaleNettoDaPagare)}</span>
                  </div>
                )}
              </div>

              {/* Dettaglio Manodopera per Detrazioni */}
              <div className="mt-4 bg-amber-50/60 p-3 rounded-lg border border-amber-200/80 space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-amber-900 font-semibold">Quota Manodopera Stimata:</span>
                  <span className="font-mono font-bold text-amber-950">{formatEuro(totali.totaleManodopera)}</span>
                </div>
                <p className="text-[10px] text-amber-800">
                  Dato rilevante per detrazioni fiscali (Bonus Casa 50%) e costi di sicurezza aziendali.
                </p>
              </div>

              {/* Stima Redditività & Margine di Guadagno nel Quadro Economico */}
              <div className="mt-3 bg-emerald-50/70 p-3 rounded-lg border border-emerald-200 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-emerald-900 font-bold flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-700" />
                    Margine Stimato:
                  </span>
                  <span className="font-mono font-black text-emerald-800 text-sm">
                    {formatEuro(analisiMargini.margineComplessivoEuro)}
                  </span>
                </div>

                <div className="flex justify-between items-center text-[11px] text-emerald-800/90 pt-1 border-t border-emerald-200/60">
                  <span>Margine % sul Fatturato:</span>
                  <span className="font-mono font-bold">{formatNumero(analisiMargini.margineComplessivoPerc, 1)}%</span>
                </div>

                <div className="flex justify-between items-center text-[10px] text-slate-600">
                  <span>Costi Tot. (Mat + M.O.):</span>
                  <span className="font-mono font-semibold">{formatEuro(analisiMargini.totaleCosti)}</span>
                </div>

                <button
                  id="btn-apri-vista-analitica-quadro"
                  type="button"
                  onClick={() => setActiveEditorTab('analitica')}
                  className="w-full mt-1 flex items-center justify-center gap-1.5 bg-white hover:bg-emerald-100/60 text-emerald-800 font-semibold py-1.5 rounded-md border border-emerald-300 transition-colors text-[11px] shadow-2xs"
                >
                  <BarChart3 className="w-3 h-3 text-emerald-700" />
                  Apri Vista Analitica Dettagliata
                </button>
              </div>

              {/* Pulsante Salva & Stampa Rapidi */}
              <div className="pt-4 space-y-2">
                <button
                  onClick={handleSave}
                  className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-lg shadow-xs transition-colors text-xs uppercase tracking-wider"
                >
                  <Save className="w-4 h-4" />
                  Salva Documento
                </button>

                <button
                  onClick={() => onOpenPrint(doc)}
                  className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-lg shadow-xs transition-colors text-xs uppercase tracking-wider"
                >
                  <Printer className="w-4 h-4" />
                  Stampa / Esporta PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      ) : (
        <DocumentoAnalisiMarginiView
          documento={doc}
          onUpdateRiga={handleUpdateRiga}
          onBatchUpdateRighe={handleBatchUpdateRighe}
        />
      )}

      {/* MODAL PICKER: Inserisci da Prezziario, Prestazioni o Materiali */}
      {pickerModal.open && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {pickerModal.source === 'prezziario' && 'Seleziona da Prezziario Personalizzato'}
                    {pickerModal.source === 'prestazioni' && 'Seleziona da Catalogo Prestazioni'}
                    {pickerModal.source === 'materiali' && 'Seleziona da Catalogo Materiali'}
                  </h3>
                  <p className="text-xs text-slate-500">Clicca su una voce per aggiungerla al capitolo attivo</p>
                </div>
              </div>
              <button
                onClick={() => setPickerModal({ ...pickerModal, open: false })}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search Input */}
            <div className="p-4 border-b border-slate-100 bg-slate-50">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  autoFocus
                  placeholder="Filtra voci per codice, descrizione, categoria..."
                  value={pickerModal.searchTerm}
                  onChange={(e) => setPickerModal({ ...pickerModal, searchTerm: e.target.value })}
                  className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>
            </div>

            {/* List Body */}
            <div className="p-4 overflow-y-auto space-y-2 flex-1">
              {pickerModal.source === 'prezziario' && (
                <>
                  {(vociPrezziario || [])
                    .filter(
                      (v) =>
                        v.titolo.toLowerCase().includes(pickerModal.searchTerm.toLowerCase()) ||
                        v.codice.toLowerCase().includes(pickerModal.searchTerm.toLowerCase()) ||
                        v.descrizioneBreve.toLowerCase().includes(pickerModal.searchTerm.toLowerCase())
                    )
                    .map((v) => (
                      <div
                        key={v.id}
                        onClick={() => {
                          handleInsertFromPrezziario(v, pickerModal.capitoloId);
                          setPickerModal({ ...pickerModal, open: false });
                        }}
                        className="p-3 bg-white border border-slate-200 rounded-xl hover:border-amber-400 hover:bg-amber-50/40 cursor-pointer transition-all flex items-center justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-amber-900 bg-amber-50 px-1.5 py-0.5 rounded-sm border border-amber-200">
                              {v.codice}
                            </span>
                            <span className="text-xs font-semibold text-slate-500">{v.categoria}</span>
                          </div>
                          <p className="text-sm font-bold text-slate-900">{v.titolo}</p>
                          <p className="text-xs text-slate-500 line-clamp-1">{v.descrizioneBreve}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-sm font-mono font-extrabold text-slate-900">
                            {formatEuro(v.prezzoUnitario)}
                          </span>
                          <span className="text-xs text-slate-400 block">/{v.unitaMisura}</span>
                        </div>
                      </div>
                    ))}
                </>
              )}

              {pickerModal.source === 'prestazioni' && (
                <>
                  {(prestazioni || [])
                    .filter(
                      (p) =>
                        p.titolo.toLowerCase().includes(pickerModal.searchTerm.toLowerCase()) ||
                        p.codice.toLowerCase().includes(pickerModal.searchTerm.toLowerCase()) ||
                        p.categoria.toLowerCase().includes(pickerModal.searchTerm.toLowerCase())
                    )
                    .map((p) => (
                      <div
                        key={p.id}
                        onClick={() => {
                          handleInsertFromPrestazione(p, pickerModal.capitoloId);
                          setPickerModal({ ...pickerModal, open: false });
                        }}
                        className="p-3 bg-white border border-slate-200 rounded-xl hover:border-blue-400 hover:bg-blue-50/40 cursor-pointer transition-all flex items-center justify-between gap-3"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-blue-900 bg-blue-50 px-1.5 py-0.5 rounded-sm">
                              {p.codice}
                            </span>
                            <span className="text-xs text-slate-500">{p.categoria}</span>
                          </div>
                          <p className="text-sm font-bold text-slate-900 mt-1">{p.titolo}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-sm font-mono font-extrabold text-slate-900">
                            {formatEuro(p.prezzoConsigliato)}
                          </span>
                          <span className="text-xs text-slate-400 block">/{p.unitaMisura}</span>
                        </div>
                      </div>
                    ))}
                </>
              )}

              {pickerModal.source === 'materiali' && (
                <>
                  {(materiali || [])
                    .filter(
                      (m) =>
                        m.nome.toLowerCase().includes(pickerModal.searchTerm.toLowerCase()) ||
                        m.codice.toLowerCase().includes(pickerModal.searchTerm.toLowerCase()) ||
                        m.categoria.toLowerCase().includes(pickerModal.searchTerm.toLowerCase())
                    )
                    .map((m) => (
                      <div
                        key={m.id}
                        onClick={() => {
                          handleInsertFromMateriale(m, pickerModal.capitoloId);
                          setPickerModal({ ...pickerModal, open: false });
                        }}
                        className="p-3 bg-white border border-slate-200 rounded-xl hover:border-emerald-400 hover:bg-emerald-50/40 cursor-pointer transition-all flex items-center justify-between gap-3"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-emerald-900 bg-emerald-50 px-1.5 py-0.5 rounded-sm">
                              {m.codice}
                            </span>
                            <span className="text-xs text-slate-500">{m.categoria}</span>
                          </div>
                          <p className="text-sm font-bold text-slate-900 mt-1">
                            {m.nome} {m.marca && `(${m.marca})`}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-sm font-mono font-extrabold text-slate-900">
                            {formatEuro(m.prezzoVendita)}
                          </span>
                          <span className="text-xs text-slate-400 block">/{m.unitaMisura}</span>
                        </div>
                      </div>
                    ))}
                </>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Modal Salva come Template / Modello Preconfezionato */}
      {isSaveTemplateOpen && onSaveTemplate && (
        <SaveTemplateModal
          documento={doc}
          isOpen={isSaveTemplateOpen}
          onClose={() => setIsSaveTemplateOpen(false)}
          onSaveTemplate={(preset) => {
            onSaveTemplate(preset);
          }}
          onNavigateToGeneratore={onNavigateToGeneratore}
          existingCategories={existingCategories}
        />
      )}
    </div>
  );
};
