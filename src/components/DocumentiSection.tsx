import React, { useState } from 'react';
import {
  FileText,
  Plus,
  Search,
  Printer,
  Copy,
  Trash2,
  Edit3,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  Building2,
  Calendar,
  Layers,
  Sparkles
} from 'lucide-react';
import { Documento, TipoDocumento, StatoDocumento } from '../types';
import { calcolaTotaliDocumento, formatEuro, formatDataItaliana } from '../utils/calculations';

interface DocumentiSectionProps {
  documenti?: Documento[];
  onOpenEditor: (doc: Documento) => void;
  onOpenPrint: (doc: Documento) => void;
  onNuovoDocumento: () => void;
  onOpenGeneratore: () => void;
  onDuplicateDocumento: (doc: Documento) => void;
  onDeleteDocumento: (id: string) => void;
  onUpdateStato: (id: string, stato: StatoDocumento) => void;
}

export const DocumentiSection: React.FC<DocumentiSectionProps> = ({
  documenti = [],
  onOpenEditor,
  onOpenPrint,
  onNuovoDocumento,
  onOpenGeneratore,
  onDuplicateDocumento,
  onDeleteDocumento,
  onUpdateStato
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState<string>('tutti');
  const [filterStato, setFilterStato] = useState<string>('tutti');

  const safeDocumenti = documenti || [];

  // Calcolo statistiche rapide
  const totaliPreventivati = safeDocumenti.reduce((acc, doc) => {
    const tot = calcolaTotaliDocumento(doc);
    return acc + tot.totaleComplessivo;
  }, 0);

  const approvatiCount = safeDocumenti.filter((d) => d.stato === 'approvato').length;
  const inAttesaCount = safeDocumenti.filter((d) => d.stato === 'inviato' || d.stato === 'bozza').length;

  const filteredDocumenti = safeDocumenti.filter((d) => {
    const matchesSearch =
      d.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.titolo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (d.clienteSnapshot?.ragioneSociale &&
        d.clienteSnapshot.ragioneSociale.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (d.cantiere?.oggetto && d.cantiere.oggetto.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (d.cantiere?.citta && d.cantiere.citta.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesTipo = filterTipo === 'tutti' || d.tipo === filterTipo;
    const matchesStato = filterStato === 'tutti' || d.stato === filterStato;

    return matchesSearch && matchesTipo && matchesStato;
  });

  const getTipoLabel = (tipo: TipoDocumento) => {
    switch (tipo) {
      case 'computo_metrico':
        return 'Computo Metrico';
      case 'fattura_proforma':
        return 'Fattura Proforma';
      default:
        return 'Preventivo';
    }
  };

  const getStatoBadge = (stato: StatoDocumento) => {
    switch (stato) {
      case 'approvato':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" /> Approvato
          </span>
        );
      case 'inviato':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
            <Clock className="w-3 h-3" /> Inviato
          </span>
        );
      case 'rifiutato':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
            <AlertCircle className="w-3 h-3" /> Rifiutato
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
            Bozza
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Volume Preventivato</p>
            <p className="text-xl sm:text-2xl font-mono font-extrabold text-slate-900 mt-0.5">
              {formatEuro(totaliPreventivati)}
            </p>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Lavori Approvati</p>
            <p className="text-xl sm:text-2xl font-mono font-extrabold text-slate-900 mt-0.5">
              {approvatiCount} <span className="text-xs font-normal text-slate-500">commesse</span>
            </p>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">In Valutazione / Bozza</p>
            <p className="text-xl sm:text-2xl font-mono font-extrabold text-slate-900 mt-0.5">
              {inAttesaCount} <span className="text-xs font-normal text-slate-500">offerte</span>
            </p>
          </div>
        </div>
      </div>

      {/* Main Header with Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <FileText className="w-6 h-6 text-amber-600" />
            Preventivi & Computi Metrici Estimativi
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Redazione di offerte economiche, scomposizione capitoli, formule metriche e generazione PDF.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            id="btn-apri-generatore-auto"
            onClick={onOpenGeneratore}
            className="inline-flex items-center gap-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-sm font-semibold px-3.5 py-2 rounded-lg transition-colors shadow-xs"
          >
            <Sparkles className="w-4 h-4 text-amber-600" />
            <span>Generatore Automatico</span>
          </button>

          <button
            id="btn-nuovo-preventivo-vuoto"
            onClick={onNuovoDocumento}
            className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold px-4 py-2 rounded-lg shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Nuovo Documento</span>
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="input-ricerca-documenti"
            type="text"
            placeholder="Cerca per numero (PREV-...), titolo, committente, cantiere..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Filter Tipo */}
          <select
            value={filterTipo}
            onChange={(e) => setFilterTipo(e.target.value)}
            className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 bg-slate-50 focus:bg-white"
          >
            <option value="tutti">Tutti i Tipi</option>
            <option value="preventivo">Preventivi</option>
            <option value="computo_metrico">Computi Metrici</option>
            <option value="fattura_proforma">Fatture Proforma</option>
          </select>

          {/* Filter Stato */}
          <select
            value={filterStato}
            onChange={(e) => setFilterStato(e.target.value)}
            className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 bg-slate-50 focus:bg-white"
          >
            <option value="tutti">Tutti gli Stati</option>
            <option value="bozza">Bozza</option>
            <option value="inviato">Inviato</option>
            <option value="approvato">Approvato</option>
            <option value="rifiutato">Rifiutato</option>
          </select>
        </div>
      </div>

      {/* Document List Cards */}
      {filteredDocumenti.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-700">Nessun documento trovato</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
            {searchTerm || filterTipo !== 'tutti' || filterStato !== 'tutti'
              ? 'Nessun preventivo o computo corrisponde ai filtri attuali.'
              : 'Inizia creando un nuovo preventivo oppure usa il Generatore Automatico con modelli preimpostati.'}
          </p>
          <div className="mt-4 flex items-center justify-center gap-3">
            <button
              onClick={onOpenGeneratore}
              className="inline-flex items-center gap-2 text-sm font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 px-4 py-2 rounded-lg"
            >
              <Sparkles className="w-4 h-4 text-amber-600" /> Usa Generatore Automatico
            </button>
            <button
              onClick={onNuovoDocumento}
              className="inline-flex items-center gap-2 text-sm font-semibold text-white bg-amber-600 hover:bg-amber-700 px-4 py-2 rounded-lg"
            >
              <Plus className="w-4 h-4" /> Nuovo da Zero
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredDocumenti.map((doc) => {
            const totali = calcolaTotaliDocumento(doc);
            return (
              <div
                key={doc.id}
                id={`card-documento-${doc.id}`}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-amber-300 hover:shadow-md transition-all flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
              >
                {/* Left Info */}
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-extrabold text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-200">
                      {doc.numero}
                    </span>
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-md ${
                        doc.tipo === 'computo_metrico'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : doc.tipo === 'fattura_proforma'
                          ? 'bg-purple-50 text-purple-700 border border-purple-200'
                          : 'bg-amber-50 text-amber-800 border border-amber-200'
                      }`}
                    >
                      {getTipoLabel(doc.tipo)}
                    </span>
                    {getStatoBadge(doc.stato)}
                  </div>

                  <h3
                    onClick={() => onOpenEditor(doc)}
                    className="text-base sm:text-lg font-bold text-slate-900 leading-snug hover:text-amber-600 cursor-pointer transition-colors"
                  >
                    {doc.titolo}
                  </h3>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                    <span className="flex items-center gap-1 font-medium">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      Committente: <strong className="text-slate-800">{doc.clienteSnapshot?.ragioneSociale || 'Non assegnato'}</strong>
                    </span>

                    {doc.cantiere?.citta && (
                      <span className="text-slate-500">
                        Cantiere: {doc.cantiere.citta} {doc.cantiere.indirizzo && `(${doc.cantiere.indirizzo})`}
                      </span>
                    )}

                    <span className="flex items-center gap-1 text-slate-400">
                      <Calendar className="w-3.5 h-3.5" />
                      Data: {formatDataItaliana(doc.data)}
                    </span>

                    <span className="text-slate-400">
                      Capitoli: <strong className="text-slate-700">{doc.capitoli.length}</strong> | Voci:{' '}
                      <strong className="text-slate-700">{doc.righe.length}</strong>
                    </span>
                  </div>
                </div>

                {/* Right Economics & Actions */}
                <div className="flex flex-wrap items-center justify-between lg:justify-end gap-4 sm:gap-6 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                  <div className="text-left lg:text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                      Totale Imponibile
                    </span>
                    <span className="text-lg sm:text-xl font-mono font-extrabold text-slate-900">
                      {formatEuro(totali.totaleComplessivo)}
                    </span>
                    <span className="text-[11px] text-slate-500 block">
                      (IVA {doc.ivaPerc}% inc.: {formatEuro(totali.ivaValore)})
                    </span>
                  </div>

                  {/* Actions buttons */}
                  <div className="flex items-center gap-1.5">
                    {/* Stampa / PDF */}
                    <button
                      id={`btn-stampa-doc-${doc.id}`}
                      onClick={() => onOpenPrint(doc)}
                      className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors shadow-xs"
                      title="Stampa o Salva PDF"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>PDF / Stampa</span>
                    </button>

                    {/* Modifica */}
                    <button
                      id={`btn-modifica-doc-${doc.id}`}
                      onClick={() => onOpenEditor(doc)}
                      className="inline-flex items-center gap-1 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-semibold px-3 py-2 rounded-lg transition-colors border border-amber-200"
                      title="Modifica Preventivo"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Modifica</span>
                    </button>

                    {/* Duplica */}
                    <button
                      onClick={() => onDuplicateDocumento(doc)}
                      className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                      title="Duplica come nuovo preventivo"
                    >
                      <Copy className="w-4 h-4" />
                    </button>

                    {/* Elimina */}
                    <button
                      onClick={() => {
                        if (confirm(`Sei sicuro di voler eliminare il documento "${doc.numero} - ${doc.titolo}"?`)) {
                          onDeleteDocumento(doc.id);
                        }
                      }}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Elimina Documento"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
