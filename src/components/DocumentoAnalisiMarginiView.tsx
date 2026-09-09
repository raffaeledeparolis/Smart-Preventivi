import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart,
  BarChart3,
  Layers,
  AlertTriangle,
  CheckCircle2,
  Sliders,
  Download,
  Printer,
  RefreshCw,
  Search,
  Filter,
  Info,
  Sparkles,
  Percent,
  ArrowUpDown
} from 'lucide-react';
import { Documento, RigaComputo } from '../types';
import {
  calcolaAnalisiMarginiDocumento,
  calcolaAnalisiRiga,
  formatEuro,
  formatNumero
} from '../utils/calculations';

interface DocumentoAnalisiMarginiViewProps {
  documento: Documento;
  onUpdateRiga: (rigaId: string, updates: Partial<RigaComputo>) => void;
  onBatchUpdateRighe?: (updates: { id: string; updates: Partial<RigaComputo> }[]) => void;
}

export const DocumentoAnalisiMarginiView: React.FC<DocumentoAnalisiMarginiViewProps> = ({
  documento,
  onUpdateRiga,
  onBatchUpdateRighe
}) => {
  // Filtri & Ricerca
  const [selectedCapitolo, setSelectedCapitolo] = useState<string>('tutti');
  const [filterStato, setFilterStato] = useState<'tutti' | 'basso' | 'perdita' | 'stima'>('tutti');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'ordine' | 'margine_asc' | 'margine_desc' | 'ricavo_desc'>('ordine');

  // Simulatore di Sensibilità (Stress Test)
  const [simulazioneAttiva, setSimulazioneAttiva] = useState(false);
  const [variazioneMaterialiPerc, setVariazioneMaterialiPerc] = useState(0); // da -10% a +25%
  const [scontoExtraPerc, setScontoExtraPerc] = useState(0); // da 0% a 15%

  // Calcolo analisi completa
  const analisi = useMemo(() => {
    return calcolaAnalisiMarginiDocumento(documento);
  }, [documento]);

  // Calcolo simulazione stress test
  const simulazione = useMemo(() => {
    if (!simulazioneAttiva && variazioneMaterialiPerc === 0 && scontoExtraPerc === 0) {
      return null;
    }

    const matFactor = 1 + variazioneMaterialiPerc / 100;
    const scontoExtraFactor = 1 - scontoExtraPerc / 100;

    const nuovoCostoMateriali = analisi.totaleCostoMateriali * matFactor;
    const nuovoCostoManodopera = analisi.totaleCostoManodopera;
    const nuovoCostoTotale = nuovoCostoMateriali + nuovoCostoManodopera;

    const nuovoRicavoNetto = analisi.ricavoLavoriNetto * scontoExtraFactor;
    const nuovoMargineEuro = nuovoRicavoNetto - nuovoCostoTotale;
    const nuovoMarginePerc = nuovoRicavoNetto > 0 ? (nuovoMargineEuro / nuovoRicavoNetto) * 100 : 0;
    const deltaMargineEuro = nuovoMargineEuro - analisi.margineComplessivoEuro;

    return {
      nuovoRicavoNetto,
      nuovoCostoMateriali,
      nuovoCostoTotale,
      nuovoMargineEuro,
      nuovoMarginePerc,
      deltaMargineEuro
    };
  }, [analisi, simulazioneAttiva, variazioneMaterialiPerc, scontoExtraPerc]);

  // Righe filtrate e ordinate
  const righeFiltrate = useMemo(() => {
    let list = [...analisi.righeDettaglio];

    // Filtro per capitolo
    if (selectedCapitolo !== 'tutti') {
      list = list.filter((r) => r.capitoloId === selectedCapitolo);
    }

    // Filtro per stato margine
    if (filterStato === 'basso') {
      list = list.filter((r) => r.marginePerc < 15);
    } else if (filterStato === 'perdita') {
      list = list.filter((r) => r.marginePerc < 0);
    } else if (filterStato === 'stima') {
      list = list.filter((r) => r.isStimaAutomatica);
    }

    // Filtro per ricerca testo
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (r) =>
          r.descrizione.toLowerCase().includes(q) ||
          (r.codiceVoce && r.codiceVoce.toLowerCase().includes(q))
      );
    }

    // Ordinamento
    if (sortBy === 'margine_asc') {
      list.sort((a, b) => a.marginePerc - b.marginePerc);
    } else if (sortBy === 'margine_desc') {
      list.sort((a, b) => b.marginePerc - a.marginePerc);
    } else if (sortBy === 'ricavo_desc') {
      list.sort((a, b) => b.ricavoTotale - a.ricavoTotale);
    }

    return list;
  }, [analisi.righeDettaglio, selectedCapitolo, filterStato, searchQuery, sortBy]);

  // Azione rapida: Compila tutte le stime automatiche o mancanti con un target margine (es. 30%)
  const handleApplicaMargineStandardATutti = (margineTargetPerc: number = 30) => {
    if (!documento.righe || documento.righe.length === 0) return;

    const updates = documento.righe.map((riga) => {
      const pUnit = Number(riga.prezzoUnitario) || 0;
      const costoTotaleTarget = pUnit * (1 - margineTargetPerc / 100);
      const manoPerc = (riga.quotaManodoperaPerc !== undefined ? Number(riga.quotaManodoperaPerc) : 65) / 100;
      const costoMano = Math.round(costoTotaleTarget * manoPerc * 100) / 100;
      const costoMat = Math.round(costoTotaleTarget * (1 - manoPerc) * 100) / 100;

      return {
        id: riga.id,
        updates: {
          costoMaterialiUnitario: costoMat,
          costoManodoperaUnitario: costoMano
        }
      };
    });

    if (onBatchUpdateRighe) {
      onBatchUpdateRighe(updates);
    } else {
      updates.forEach((u) => onUpdateRiga(u.id, u.updates));
    }
  };

  // Esportazione CSV prospetto analitico
  const handleExportCsv = () => {
    const headers = [
      'Capitolo',
      'Codice Voce',
      'Descrizione',
      'Quantita',
      'Unita Misura',
      'Prezzo Vendita Unitario (€)',
      'Sconto Riga (%)',
      'Ricavo Totale (€)',
      'Costo Materiali Unitario (€)',
      'Costo Manodopera Unitario (€)',
      'Costo Totale Materiali (€)',
      'Costo Totale Manodopera (€)',
      'Costo Totale (€)',
      'Margine Guadagno (€)',
      'Margine (%)',
      'Ricarico (%)',
      'Tipo Valore Costo'
    ];

    const capitoliMap = new Map<string, string>((documento.capitoli || []).map((c) => [c.id, c.titolo]));

    const rows = analisi.righeDettaglio.map((r) => [
      `"${(capitoliMap.get(r.capitoloId) || '').replace(/"/g, '""')}"`,
      `"${r.codiceVoce || ''}"`,
      `"${r.descrizione.replace(/"/g, '""')}"`,
      r.quantita,
      r.unitaMisura,
      r.prezzoUnitario,
      r.scontoPerc,
      r.ricavoTotale,
      r.costoMaterialiUnitario,
      r.costoManodoperaUnitario,
      r.costoMaterialiTotale,
      r.costoManodoperaTotale,
      r.costoTotale,
      r.margineEuro,
      r.marginePerc,
      r.ricaricoPerc,
      r.isStimaAutomatica ? 'Stima Automatica' : 'Inserito da Utente'
    ]);

    const csvContent = [headers.join(';'), ...rows.map((row) => row.join(';'))].join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Analisi_Margini_${documento.numero || 'Preventivo'}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Stampa Prospetto Interno di Cantiere
  const handlePrintAnalitica = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & KPI Cards */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-emerald-100 text-emerald-800 rounded-lg">
                <TrendingUp className="w-5 h-5" />
              </span>
              <h3 className="text-base font-bold text-slate-900">
                Analisi di Redditività & Margine di Commessa
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Valutazione economica preventiva: confronto tra ricavi netti di contratto e costi diretti di cantiere (materiali e manodopera).
            </p>
          </div>

          {/* Quick Action Tools */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSimulazioneAttiva(!simulazioneAttiva)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                simulazioneAttiva
                  ? 'bg-amber-100 border-amber-300 text-amber-900'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Sliders className="w-3.5 h-3.5 text-amber-600" />
              <span>{simulazioneAttiva ? 'Chiudi Simulatore' : 'Simulatore Stress Test'}</span>
            </button>

            <button
              type="button"
              onClick={handleExportCsv}
              className="inline-flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors shadow-xs"
              title="Esporta analisi completa in formato CSV per Excel"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Esporta CSV</span>
            </button>

            <button
              type="button"
              onClick={handlePrintAnalitica}
              className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors shadow-xs"
              title="Stampa prospetto analitico riservato"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Stampa Prospetto</span>
            </button>
          </div>
        </div>

        {/* 5 KPI Cards Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {/* 1. Ricavo Netto */}
          <div className="bg-slate-50/80 rounded-xl p-3.5 border border-slate-200">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Ricavo Netto Lavori
            </span>
            <div className="mt-1 font-mono text-lg sm:text-xl font-extrabold text-slate-900">
              {formatEuro(analisi.ricavoLavoriNetto)}
            </div>
            {analisi.scontoGeneraleValore > 0 && (
              <span className="text-[10px] text-rose-600 block mt-0.5">
                (Sconto gen. -{formatEuro(analisi.scontoGeneraleValore)})
              </span>
            )}
            <span className="text-[10px] text-slate-400 mt-1 block">Imponibile contrattuale</span>
          </div>

          {/* 2. Costi Diretti Totali */}
          <div className="bg-slate-50/80 rounded-xl p-3.5 border border-slate-200">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Costi Diretti Totali
            </span>
            <div className="mt-1 font-mono text-lg sm:text-xl font-extrabold text-slate-800">
              {formatEuro(analisi.totaleCosti)}
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mt-1">
              <span>Mat: {formatEuro(analisi.totaleCostoMateriali)}</span>
              <span>•</span>
              <span>M.O.: {formatEuro(analisi.totaleCostoManodopera)}</span>
            </div>
          </div>

          {/* 3. Margine Lordo Commessa (€) */}
          <div className={`rounded-xl p-3.5 border ${
            analisi.margineComplessivoEuro >= 0
              ? 'bg-emerald-50/70 border-emerald-200'
              : 'bg-rose-50/70 border-rose-200'
          }`}>
            <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">
              Margine di Guadagno (€)
            </span>
            <div className={`mt-1 font-mono text-lg sm:text-xl font-extrabold ${
              analisi.margineComplessivoEuro >= 0 ? 'text-emerald-700' : 'text-rose-700'
            }`}>
              {formatEuro(analisi.margineComplessivoEuro)}
            </div>
            <span className="text-[10px] text-emerald-700/80 mt-1 block">
              Utile lordo stimato (Ricavi - Costi)
            </span>
          </div>

          {/* 4. Margine % sui Ricavi */}
          <div className={`rounded-xl p-3.5 border ${
            analisi.margineComplessivoPerc >= 25
              ? 'bg-emerald-50/70 border-emerald-200'
              : analisi.margineComplessivoPerc >= 15
              ? 'bg-amber-50/70 border-amber-200'
              : 'bg-rose-50/70 border-rose-200'
          }`}>
            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
              Margine % sul Fatturato
            </span>
            <div className={`mt-1 font-mono text-lg sm:text-xl font-extrabold ${
              analisi.margineComplessivoPerc >= 25
                ? 'text-emerald-700'
                : analisi.margineComplessivoPerc >= 15
                ? 'text-amber-700'
                : 'text-rose-700'
            }`}>
              {formatNumero(analisi.margineComplessivoPerc, 1)}%
            </div>
            <span className="text-[10px] font-medium text-slate-600 mt-1 block">
              {analisi.margineComplessivoPerc >= 25
                ? '🟢 Redditività Ottimale'
                : analisi.margineComplessivoPerc >= 15
                ? '🟡 Redditività Media'
                : '🔴 Margine a Rischio'}
            </span>
          </div>

          {/* 5. Markup / Ricarico Medio % */}
          <div className="bg-slate-50/80 rounded-xl p-3.5 border border-slate-200">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Ricarico Medio (Markup)
            </span>
            <div className="mt-1 font-mono text-lg sm:text-xl font-extrabold text-blue-700">
              +{formatNumero(analisi.ricaricoComplessivoPerc, 1)}%
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">
              Ricarico applicato sui costi
            </span>
          </div>
        </div>

        {/* Visual Cost & Margin Breakdown Bar */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <div className="flex justify-between items-center text-xs font-semibold text-slate-700">
            <span>Scomposizione Economica del Ricavo:</span>
            <span className="font-mono text-slate-500">100% dell'importo lavori</span>
          </div>

          {/* 3-Segments Progress Bar */}
          {analisi.ricavoLavoriNetto > 0 && (
            <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden flex border border-slate-200/80">
              {/* Costo Materiali */}
              <div
                style={{
                  width: `${Math.min(100, (analisi.totaleCostoMateriali / analisi.ricavoLavoriNetto) * 100)}%`
                }}
                className="bg-blue-500 h-full transition-all duration-500"
                title={`Materiali: ${formatEuro(analisi.totaleCostoMateriali)} (${formatNumero(
                  (analisi.totaleCostoMateriali / analisi.ricavoLavoriNetto) * 100,
                  1
                )}%)`}
              />
              {/* Costo Manodopera */}
              <div
                style={{
                  width: `${Math.min(100, (analisi.totaleCostoManodopera / analisi.ricavoLavoriNetto) * 100)}%`
                }}
                className="bg-amber-500 h-full transition-all duration-500"
                title={`Manodopera: ${formatEuro(analisi.totaleCostoManodopera)} (${formatNumero(
                  (analisi.totaleCostoManodopera / analisi.ricavoLavoriNetto) * 100,
                  1
                )}%)`}
              />
              {/* Margine Utile */}
              {analisi.margineComplessivoEuro > 0 && (
                <div
                  style={{
                    width: `${Math.min(100, (analisi.margineComplessivoEuro / analisi.ricavoLavoriNetto) * 100)}%`
                  }}
                  className="bg-emerald-500 h-full transition-all duration-500"
                  title={`Margine Utile: ${formatEuro(analisi.margineComplessivoEuro)} (${formatNumero(
                    analisi.margineComplessivoPerc,
                    1
                  )}%)`}
                />
              )}
            </div>
          )}

          {/* Legenda scomposizione */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-1">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-xs bg-blue-500 inline-block" />
                <span className="text-slate-600">Materiali:</span>
                <strong className="font-mono text-slate-800">
                  {formatEuro(analisi.totaleCostoMateriali)} (
                  {formatNumero(
                    analisi.ricavoLavoriNetto > 0 ? (analisi.totaleCostoMateriali / analisi.ricavoLavoriNetto) * 100 : 0,
                    1
                  )}
                  %)
                </strong>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-xs bg-amber-500 inline-block" />
                <span className="text-slate-600">Manodopera:</span>
                <strong className="font-mono text-slate-800">
                  {formatEuro(analisi.totaleCostoManodopera)} (
                  {formatNumero(
                    analisi.ricavoLavoriNetto > 0 ? (analisi.totaleCostoManodopera / analisi.ricavoLavoriNetto) * 100 : 0,
                    1
                  )}
                  %)
                </strong>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-xs bg-emerald-500 inline-block" />
                <span className="text-slate-600">Margine Utile Lordo:</span>
                <strong className="font-mono text-emerald-700">
                  {formatEuro(analisi.margineComplessivoEuro)} ({formatNumero(analisi.margineComplessivoPerc, 1)}%)
                </strong>
              </div>
            </div>

            {/* Indicatori righe a rischio o stimate */}
            <div className="flex items-center gap-3 text-xs">
              {analisi.vociInPerdita > 0 && (
                <span className="inline-flex items-center gap-1 text-rose-700 font-bold bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                  <AlertTriangle className="w-3 h-3" />
                  {analisi.vociInPerdita} {analisi.vociInPerdita === 1 ? 'voce in perdita' : 'voci in perdita'}
                </span>
              )}
              {analisi.vociMargineBasso > 0 && (
                <span className="text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                  {analisi.vociMargineBasso} a margine ridotto (&lt;15%)
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Stress Test / Simulatore Sensibilità (Espandibile) */}
        {simulazioneAttiva && (
          <div className="bg-amber-50/60 rounded-xl p-4 border border-amber-200 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-amber-700" />
                <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                  Simulatore di Sensibilità Economica (Stress Test Prezzi & Costi)
                </h4>
              </div>
              <button
                type="button"
                onClick={() => {
                  setVariazioneMaterialiPerc(0);
                  setScontoExtraPerc(0);
                }}
                className="text-[11px] text-amber-800 hover:underline flex items-center gap-1 font-semibold"
              >
                <RefreshCw className="w-3 h-3" />
                Ripristina Valori Base
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Slider 1: Variazione Costo Materiali */}
              <div className="space-y-1.5 bg-white p-3 rounded-lg border border-amber-200/80">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-slate-700">Inflazione / Rincaro Materiali:</span>
                  <span className="font-mono font-bold text-amber-800">
                    {variazioneMaterialiPerc > 0 ? `+${variazioneMaterialiPerc}%` : `${variazioneMaterialiPerc}%`}
                  </span>
                </div>
                <input
                  type="range"
                  min="-10"
                  max="30"
                  step="1"
                  value={variazioneMaterialiPerc}
                  onChange={(e) => setVariazioneMaterialiPerc(parseInt(e.target.value) || 0)}
                  className="w-full accent-amber-600"
                />
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>-10% (Sconto fornitore)</span>
                  <span>0% (Base)</span>
                  <span>+30% (Forte rincaro)</span>
                </div>
              </div>

              {/* Slider 2: Sconto Commerciale Aggiuntivo Committente */}
              <div className="space-y-1.5 bg-white p-3 rounded-lg border border-amber-200/80">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-slate-700">Ulteriore Sconto Trattativa Committente:</span>
                  <span className="font-mono font-bold text-rose-700">-{scontoExtraPerc}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="20"
                  step="0.5"
                  value={scontoExtraPerc}
                  onChange={(e) => setScontoExtraPerc(parseFloat(e.target.value) || 0)}
                  className="w-full accent-rose-600"
                />
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>0% (Offerta iniziale)</span>
                  <span>5% (Trattativa tipica)</span>
                  <span>20% (Ribasso estremo)</span>
                </div>
              </div>
            </div>

            {/* Risultato Simulazione */}
            {simulazione && (
              <div className="bg-white rounded-lg p-3.5 border border-amber-200 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <span className="text-xs text-slate-500 block">Nuovo Margine Stimato Simulata:</span>
                  <div className="flex items-baseline gap-2">
                    <span className="font-mono text-xl font-black text-slate-900">
                      {formatEuro(simulazione.nuovoMargineEuro)}
                    </span>
                    <span
                      className={`font-mono text-sm font-bold ${
                        simulazione.nuovoMarginePerc >= 20 ? 'text-emerald-600' : 'text-amber-600'
                      }`}
                    >
                      ({formatNumero(simulazione.nuovoMarginePerc, 1)}%)
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-xs text-slate-500 block">Variazione Utile rispetto ad oggi:</span>
                  <span
                    className={`font-mono text-base font-extrabold ${
                      simulazione.deltaMargineEuro >= 0 ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {simulazione.deltaMargineEuro >= 0 ? '+' : ''}
                    {formatEuro(simulazione.deltaMargineEuro)}
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-[11px] text-slate-500 block">Nuovo Punto di Pareggio (Costi):</span>
                  <span className="font-mono text-xs font-bold text-slate-800">
                    {formatEuro(simulazione.nuovoCostoTotale)}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Ripartizione per Capitolo */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-600" />
            <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Redditività per Capitolo di Lavorazione
            </h4>
          </div>
          <span className="text-xs text-slate-500">
            {analisi.capitoliDettaglio.length} {analisi.capitoliDettaglio.length === 1 ? 'capitolo' : 'capitoli'} analizzati
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {analisi.capitoliDettaglio.map((cap) => {
            const isOttimo = cap.marginePerc >= 30;
            const isMedio = cap.marginePerc >= 15 && cap.marginePerc < 30;
            const isRischio = cap.marginePerc < 15;

            return (
              <div
                key={cap.capitoloId}
                className="bg-slate-50/70 hover:bg-slate-50 rounded-xl border border-slate-200 p-3.5 space-y-2.5 transition-colors cursor-pointer"
                onClick={() => setSelectedCapitolo(selectedCapitolo === cap.capitoloId ? 'tutti' : cap.capitoloId)}
              >
                <div className="flex justify-between items-start gap-2">
                  <h5 className="text-xs font-bold text-slate-900 line-clamp-1" title={cap.titolo}>
                    {cap.titolo}
                  </h5>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                      isOttimo
                        ? 'bg-emerald-100 text-emerald-800'
                        : isMedio
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {formatNumero(cap.marginePerc, 1)}%
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Ricavo</span>
                    <span className="font-mono font-bold text-slate-800">{formatEuro(cap.ricavoTotale)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Costi Diretti</span>
                    <span className="font-mono text-slate-600">{formatEuro(cap.costoTotale)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Materiali</span>
                    <span className="font-mono text-slate-600">{formatEuro(cap.costoMaterialiTotale)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Manodopera</span>
                    <span className="font-mono text-slate-600">{formatEuro(cap.costoManodoperaTotale)}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200/80 flex justify-between items-center text-xs">
                  <span className="font-medium text-slate-600">Utile di Capitolo:</span>
                  <span
                    className={`font-mono font-extrabold ${
                      cap.margineEuro >= 0 ? 'text-emerald-700' : 'text-rose-700'
                    }`}
                  >
                    {formatEuro(cap.margineEuro)}
                  </span>
                </div>

                {/* Progress bar capitolo */}
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${
                      isOttimo ? 'bg-emerald-500' : isMedio ? 'bg-amber-500' : 'bg-rose-500'
                    }`}
                    style={{ width: `${Math.max(0, Math.min(100, cap.marginePerc))}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tabella Dettaglio Analitico per Singola Riga */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden space-y-4 p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-amber-600" />
              Dettaglio Analitico per Singola Riga & Modifica Costi
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Inserisci o perfeziona direttamente i costi dei materiali e della manodopera per ogni voce. Il margine si ricalcola istantaneamente.
            </p>
          </div>

          {/* Helper batch button */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleApplicaMargineStandardATutti(30)}
              className="inline-flex items-center gap-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors shadow-xs"
              title="Applica automaticamente una stima con margine del 30% a tutte le voci"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Imposta Margine Target 30% a Tutto</span>
            </button>
          </div>
        </div>

        {/* Toolbar: Ricerca, Filtro Capitolo, Filtro Stato, Ordinamento */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
          {/* Cerca */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cerca per voce o codice..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs text-slate-900 bg-white"
            />
          </div>

          {/* Filtro Capitolo */}
          <div>
            <select
              value={selectedCapitolo}
              onChange={(e) => setSelectedCapitolo(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-800 font-medium"
            >
              <option value="tutti">Tutti i Capitoli</option>
              {(documento.capitoli || []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.titolo}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro Stato Margine */}
          <div>
            <select
              value={filterStato}
              onChange={(e) => setFilterStato(e.target.value as any)}
              className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-800 font-medium"
            >
              <option value="tutti">Tutti i Livelli di Margine</option>
              <option value="basso">⚠️ Solo Margine Basso (&lt; 15%)</option>
              <option value="perdita">🔴 Solo Voci in Perdita (&lt; 0%)</option>
              <option value="stima">ℹ️ Solo Stime Automatiche</option>
            </select>
          </div>

          {/* Ordinamento */}
          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-800 font-medium"
            >
              <option value="ordine">Ordinamento Documento</option>
              <option value="margine_asc">Margine % Crescente (Prima i critici)</option>
              <option value="margine_desc">Margine % Decrescente (Prima i più redditizi)</option>
              <option value="ricavo_desc">Ricavo Decrescente (Importo più alto)</option>
            </select>
          </div>
        </div>

        {/* Tabella Analitica */}
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-bold text-[10px] tracking-wider">
              <tr>
                <th className="py-2.5 px-3">Voce & Lavorazione</th>
                <th className="py-2.5 px-3 text-right">Qtà / UM</th>
                <th className="py-2.5 px-3 text-right">P. Vendita Netto</th>
                <th className="py-2.5 px-3 text-right">Ricavo Totale</th>
                <th className="py-2.5 px-3 text-right bg-blue-50/50">Costo Mat. (€/UM)</th>
                <th className="py-2.5 px-3 text-right bg-amber-50/50">Costo M.O. (€/UM)</th>
                <th className="py-2.5 px-3 text-right">Costo Totale</th>
                <th className="py-2.5 px-3 text-right">Margine (€)</th>
                <th className="py-2.5 px-3 text-center">Margine %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {righeFiltrate.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-500">
                    Nessuna riga corrisponde ai filtri selezionati.
                  </td>
                </tr>
              ) : (
                righeFiltrate.map((r, index) => {
                  const isOttimo = r.marginePerc >= 30;
                  const isMedio = r.marginePerc >= 15 && r.marginePerc < 30;
                  const isRischio = r.marginePerc < 15 && r.marginePerc >= 0;
                  const isInPerdita = r.marginePerc < 0;

                  return (
                    <tr
                      key={r.rigaId}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isInPerdita ? 'bg-rose-50/40' : index % 2 === 1 ? 'bg-slate-50/30' : 'bg-white'
                      }`}
                    >
                      {/* Voce & Descrizione */}
                      <td className="py-2.5 px-3 max-w-[280px]">
                        <div className="flex items-center gap-1.5">
                          {r.codiceVoce && (
                            <span className="font-mono text-[10px] font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded-sm shrink-0">
                              {r.codiceVoce}
                            </span>
                          )}
                          <span className="font-medium text-slate-900 truncate" title={r.descrizione}>
                            {r.descrizione}
                          </span>
                        </div>
                        {r.isStimaAutomatica && (
                          <span className="inline-block text-[9px] text-amber-700 font-semibold bg-amber-50 px-1 rounded-sm border border-amber-200 mt-0.5">
                            Stima automatica (30% margine)
                          </span>
                        )}
                      </td>

                      {/* Quantità & UM */}
                      <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-800 whitespace-nowrap">
                        {formatNumero(r.quantita, 2)} {r.unitaMisura}
                      </td>

                      {/* Prezzo Vendita Netto */}
                      <td className="py-2.5 px-3 text-right font-mono text-slate-700 whitespace-nowrap">
                        {formatEuro(r.ricavoNettoUnitario)}
                        {r.scontoPerc > 0 && (
                          <span className="text-[9px] text-rose-500 block">(-{r.scontoPerc}%)</span>
                        )}
                      </td>

                      {/* Ricavo Totale */}
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                        {formatEuro(r.ricavoTotale)}
                      </td>

                      {/* Costo Materiali Unitario (Editable) */}
                      <td className="py-1.5 px-2 text-right bg-blue-50/30">
                        <div className="inline-flex items-center gap-1 justify-end">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={r.costoMaterialiUnitario}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              onUpdateRiga(r.rigaId, { costoMaterialiUnitario: val });
                            }}
                            className="w-20 px-1.5 py-1 text-right font-mono font-bold text-xs bg-white border border-blue-200 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            title="Modifica costo unitario materiali per questa voce"
                          />
                          <span className="text-[10px] text-slate-400">€</span>
                        </div>
                        <span className="text-[9px] text-slate-500 block text-right pr-3 font-mono">
                          Tot: {formatEuro(r.costoMaterialiTotale)}
                        </span>
                      </td>

                      {/* Costo Manodopera Unitario (Editable) */}
                      <td className="py-1.5 px-2 text-right bg-amber-50/30">
                        <div className="inline-flex items-center gap-1 justify-end">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={r.costoManodoperaUnitario}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              onUpdateRiga(r.rigaId, { costoManodoperaUnitario: val });
                            }}
                            className="w-20 px-1.5 py-1 text-right font-mono font-bold text-xs bg-white border border-amber-200 rounded-md focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                            title="Modifica costo unitario manodopera per questa voce"
                          />
                          <span className="text-[10px] text-slate-400">€</span>
                        </div>
                        <span className="text-[9px] text-slate-500 block text-right pr-3 font-mono">
                          Tot: {formatEuro(r.costoManodoperaTotale)}
                        </span>
                      </td>

                      {/* Costo Totale Riga */}
                      <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-700 whitespace-nowrap">
                        {formatEuro(r.costoTotale)}
                      </td>

                      {/* Margine (€) */}
                      <td
                        className={`py-2.5 px-3 text-right font-mono font-extrabold whitespace-nowrap ${
                          r.margineEuro >= 0 ? 'text-emerald-700' : 'text-rose-700'
                        }`}
                      >
                        {formatEuro(r.margineEuro)}
                      </td>

                      {/* Margine % & Badge */}
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <span
                          className={`inline-block font-mono text-[11px] font-bold px-2 py-0.5 rounded-full ${
                            isInPerdita
                              ? 'bg-rose-100 text-rose-800 border border-rose-300'
                              : isOttimo
                              ? 'bg-emerald-100 text-emerald-800'
                              : isMedio
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-50 text-rose-700'
                          }`}
                        >
                          {formatNumero(r.marginePerc, 1)}%
                        </span>
                        <span className="text-[9px] text-slate-400 block mt-0.5">
                          Markup: +{formatNumero(r.ricaricoPerc, 0)}%
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {/* Table Footer Totals */}
            <tfoot className="bg-slate-100 border-t-2 border-slate-300 font-bold text-slate-900">
              <tr>
                <td colSpan={3} className="py-3 px-3 uppercase text-[11px] tracking-wider">
                  Totale Righe Filtrate ({righeFiltrate.length} voci)
                </td>
                <td className="py-3 px-3 text-right font-mono text-sm">
                  {formatEuro(righeFiltrate.reduce((sum, r) => sum + r.ricavoTotale, 0))}
                </td>
                <td className="py-3 px-3 text-right font-mono text-xs text-blue-800 bg-blue-50/50">
                  {formatEuro(righeFiltrate.reduce((sum, r) => sum + r.costoMaterialiTotale, 0))}
                </td>
                <td className="py-3 px-3 text-right font-mono text-xs text-amber-800 bg-amber-50/50">
                  {formatEuro(righeFiltrate.reduce((sum, r) => sum + r.costoManodoperaTotale, 0))}
                </td>
                <td className="py-3 px-3 text-right font-mono text-sm">
                  {formatEuro(righeFiltrate.reduce((sum, r) => sum + r.costoTotale, 0))}
                </td>
                <td className="py-3 px-3 text-right font-mono text-sm text-emerald-700">
                  {formatEuro(righeFiltrate.reduce((sum, r) => sum + r.margineEuro, 0))}
                </td>
                <td className="py-3 px-3 text-center font-mono text-xs text-slate-700">
                  {formatNumero(
                    (() => {
                      const ric = righeFiltrate.reduce((sum, r) => sum + r.ricavoTotale, 0);
                      const marg = righeFiltrate.reduce((sum, r) => sum + r.margineEuro, 0);
                      return ric > 0 ? (marg / ric) * 100 : 0;
                    })(),
                    1
                  )}
                  %
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
