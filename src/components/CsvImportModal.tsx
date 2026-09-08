import React, { useState, useRef } from 'react';
import {
  Upload,
  Download,
  AlertCircle,
  CheckCircle2,
  X,
  FileSpreadsheet,
  AlertTriangle,
  RefreshCw,
  Check
} from 'lucide-react';
import {
  parseCSV,
  getPrezziarioCsvTemplate,
  getPrestazioniCsvTemplate,
  getMaterialiCsvTemplate,
  parsePrezziarioRows,
  parsePrestazioniRows,
  parseMaterialiRows,
  downloadCsvFile,
  ParsedPrezziarioItem,
  ParsedPrestazioneItem,
  ParsedMaterialeItem
} from '../utils/csvImport';
import { formatEuro } from '../utils/calculations';

export type ImportType = 'prezziario' | 'prestazioni' | 'materiali';
export type DuplicateStrategy = 'overwrite' | 'skip' | 'append';

interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: ImportType;
  onImportConfirmed: (items: any[], strategy: DuplicateStrategy) => void;
}

export const CsvImportModal: React.FC<CsvImportModalProps> = ({
  isOpen,
  onClose,
  type,
  onImportConfirmed
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string>('');
  const [fileSize, setFileSize] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const [duplicateStrategy, setDuplicateStrategy] = useState<DuplicateStrategy>('overwrite');
  const [activeFilter, setActiveFilter] = useState<'all' | 'valid' | 'invalid'>('all');

  // Parsed records
  const [prezziarioRows, setPrezziarioRows] = useState<ParsedPrezziarioItem[]>([]);
  const [prestazioniRows, setPrestazioniRows] = useState<ParsedPrestazioneItem[]>([]);
  const [materialiRows, setMaterialiRows] = useState<ParsedMaterialeItem[]>([]);
  const [parsingError, setParsingError] = useState<string | null>(null);

  if (!isOpen) return null;

  const getTitleAndDesc = () => {
    switch (type) {
      case 'prezziario':
        return {
          title: 'Caricamento Massivo Voci Prezziario (CSV)',
          subtitle: 'Importa elenchi prezzi, capitoli di spesa, quote manodopera e materiali da file Excel o CSV.',
          filename: 'modello-prezziario-edilizia.csv'
        };
      case 'prestazioni':
        return {
          title: 'Caricamento Massivo Prestazioni & Manodopera (CSV)',
          subtitle: 'Importa le tariffe orarie, figure professionali e lavorazioni con ricarico aziendale.',
          filename: 'modello-prestazioni-manodopera.csv'
        };
      case 'materiali':
        return {
          title: 'Caricamento Massivo Catalogo Materiali (CSV)',
          subtitle: 'Importa articoli di fornitura, costi d’acquisto, prezzi al cliente, marche e giacenze.',
          filename: 'modello-materiali-forniture.csv'
        };
    }
  };

  const meta = getTitleAndDesc();

  const handleDownloadTemplate = () => {
    let content = '';
    if (type === 'prezziario') content = getPrezziarioCsvTemplate();
    else if (type === 'prestazioni') content = getPrestazioniCsvTemplate();
    else if (type === 'materiali') content = getMaterialiCsvTemplate();

    downloadCsvFile(content, meta.filename);
  };

  const processFile = (file: File) => {
    setParsingError(null);
    setFileName(file.name);
    const kb = (file.size / 1024).toFixed(1);
    setFileSize(`${kb} KB`);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        if (!text) {
          setParsingError('Il file caricato è vuoto.');
          return;
        }

        const matrix = parseCSV(text);
        if (matrix.length < 2) {
          setParsingError('Il file non contiene righe di dati valide (è presente solo l’intestazione o nessuna riga).');
          return;
        }

        if (type === 'prezziario') {
          const parsed = parsePrezziarioRows(matrix);
          setPrezziarioRows(parsed);
        } else if (type === 'prestazioni') {
          const parsed = parsePrestazioniRows(matrix);
          setPrestazioniRows(parsed);
        } else if (type === 'materiali') {
          const parsed = parseMaterialiRows(matrix);
          setMaterialiRows(parsed);
        }
      } catch (err: any) {
        setParsingError(`Errore durante la lettura del file CSV: ${err.message || 'Formato non supportato'}`);
      }
    };
    reader.onerror = () => {
      setParsingError('Impossibile leggere il file selezionato.');
    };
    reader.readAsText(file, 'UTF-8');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleReset = () => {
    setFileName('');
    setFileSize('');
    setPrezziarioRows([]);
    setPrestazioniRows([]);
    setMaterialiRows([]);
    setParsingError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Statistiche
  let currentRows: { isValid: boolean; errors: string[] }[] = [];
  if (type === 'prezziario') currentRows = prezziarioRows;
  else if (type === 'prestazioni') currentRows = prestazioniRows;
  else if (type === 'materiali') currentRows = materialiRows;

  const totalCount = currentRows.length;
  const validCount = currentRows.filter((r) => r.isValid).length;
  const invalidCount = totalCount - validCount;

  const handleConfirmImport = () => {
    if (validCount === 0) return;

    if (type === 'prezziario') {
      const validItems = prezziarioRows
        .filter((r) => r.isValid)
        .map((r) => ({
          id: `voce-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          codice: r.codice,
          categoria: r.categoria,
          titolo: r.titolo,
          descrizioneBreve: r.descrizioneBreve,
          descrizioneEstesa: r.descrizioneEstesa,
          unitaMisura: r.unitaMisura,
          prezzoUnitario: r.prezzoUnitario,
          quotaManodopera: r.quotaManodopera,
          quotaMateriali: r.quotaMateriali,
          note: r.note
        }));
      onImportConfirmed(validItems, duplicateStrategy);
    } else if (type === 'prestazioni') {
      const validItems = prestazioniRows
        .filter((r) => r.isValid)
        .map((r) => ({
          id: `pres-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          codice: r.codice,
          titolo: r.titolo,
          categoria: r.categoria,
          unitaMisura: r.unitaMisura,
          costoOrario: r.costoOrario,
          ricaricoPerc: r.ricaricoPerc,
          prezzoConsigliato: r.prezzoConsigliato,
          note: r.note
        }));
      onImportConfirmed(validItems, duplicateStrategy);
    } else if (type === 'materiali') {
      const validItems = materialiRows
        .filter((r) => r.isValid)
        .map((r) => ({
          id: `mat-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          codice: r.codice,
          nome: r.nome,
          categoria: r.categoria,
          marca: r.marca,
          fornitore: r.fornitore,
          unitaMisura: r.unitaMisura,
          prezzoAcquisto: r.prezzoAcquisto,
          ricaricoPerc: r.ricaricoPerc,
          prezzoVendita: r.prezzoVendita,
          scorta: r.scorta,
          note: r.note
        }));
      onImportConfirmed(validItems, duplicateStrategy);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in duration-200">
        
        {/* Header Modal */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-100 text-amber-800 rounded-xl">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">{meta.title}</h2>
              <p className="text-xs text-slate-500">{meta.subtitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* Top Info & Template Download Banner */}
          <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm font-semibold text-amber-950">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <span>Usa il modello CSV preimpostato</span>
              </div>
              <p className="text-xs text-amber-800 leading-relaxed">
                Puoi compilare o incollare i tuoi dati su Excel o LibreOffice. Il sistema supporta sia il separatore punto e virgola (<code className="font-mono bg-amber-100/80 px-1 rounded">;</code>) che la virgola (<code className="font-mono bg-amber-100/80 px-1 rounded">,</code>).
              </p>
            </div>
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="inline-flex items-center gap-2 bg-white border border-amber-300 text-amber-900 hover:bg-amber-100 text-xs font-semibold px-3.5 py-2 rounded-lg shadow-2xs whitespace-nowrap transition-colors"
            >
              <Download className="w-4 h-4 text-amber-700" />
              <span>Scarica File Esempio (.csv)</span>
            </button>
          </div>

          {/* Upload Drop Area */}
          {totalCount === 0 ? (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 ${
                isDragging
                  ? 'border-amber-500 bg-amber-50/50 scale-[0.99]'
                  : 'border-slate-300 hover:border-amber-500 hover:bg-slate-50/60'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv,text/plain"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shadow-xs">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  Trascina qui il tuo file CSV oppure <span className="text-amber-600 underline">sfoglia dal computer</span>
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Compatibile con file generati da Microsoft Excel, Google Sheets o gestionali tecnici (.csv, .txt)
                </p>
              </div>
            </div>
          ) : (
            /* File Loaded Bar & Summary Stats */
            <div className="space-y-4">
              <div className="bg-slate-100 border border-slate-200 rounded-xl p-3.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-lg text-emerald-600 shadow-2xs">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-slate-900">{fileName}</span>
                    <span className="text-xs text-slate-500 ml-2">({fileSize})</span>
                  </div>
                </div>
                <button
                  onClick={handleReset}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-red-600 hover:bg-white px-2.5 py-1.5 rounded-md transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Carica un altro file</span>
                </button>
              </div>

              {/* Stats badges & preview filter */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveFilter('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      activeFilter === 'all'
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    Tutti ({totalCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveFilter('valid')}
                    className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      activeFilter === 'valid'
                        ? 'bg-emerald-700 text-white'
                        : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Pronti all'importazione ({validCount})</span>
                  </button>
                  {invalidCount > 0 && (
                    <button
                      type="button"
                      onClick={() => setActiveFilter('invalid')}
                      className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                        activeFilter === 'invalid'
                          ? 'bg-amber-600 text-white'
                          : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                      }`}
                    >
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Con errori o avvisi ({invalidCount})</span>
                    </button>
                  )}
                </div>

                {/* Duplicate Strategy Option */}
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-500 font-medium">Se il codice esiste già:</span>
                  <select
                    value={duplicateStrategy}
                    onChange={(e) => setDuplicateStrategy(e.target.value as DuplicateStrategy)}
                    className="bg-white border border-slate-300 rounded-md px-2.5 py-1 text-slate-800 font-semibold focus:outline-hidden focus:border-amber-500"
                  >
                    <option value="overwrite">Aggiorna / Sovrascrivi dati</option>
                    <option value="skip">Salta riga (Non modificare)</option>
                    <option value="append">Aggiungi comunque con nuovo ID</option>
                  </select>
                </div>
              </div>

              {/* Interactive Table Preview */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs max-h-64 overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 sticky top-0 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-2.5">Stato</th>
                      <th className="p-2.5">Codice</th>
                      <th className="p-2.5">
                        {type === 'materiali' ? 'Nome Materiale' : 'Titolo Lavorazione'}
                      </th>
                      <th className="p-2.5">Categoria</th>
                      <th className="p-2.5 text-center">U.M.</th>
                      <th className="p-2.5 text-right">Prezzo Unitario</th>
                      <th className="p-2.5">Dettagli / Errori</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {type === 'prezziario' &&
                      prezziarioRows
                        .filter((r) => {
                          if (activeFilter === 'valid') return r.isValid;
                          if (activeFilter === 'invalid') return !r.isValid;
                          return true;
                        })
                        .map((r, idx) => (
                          <tr key={idx} className={r.isValid ? 'hover:bg-slate-50/80' : 'bg-amber-50/40'}>
                            <td className="p-2.5">
                              {r.isValid ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                                  <Check className="w-3 h-3" /> Valido
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                                  <AlertCircle className="w-3 h-3" /> Da correggere
                                </span>
                              )}
                            </td>
                            <td className="p-2.5 font-mono font-semibold text-slate-800">{r.codice}</td>
                            <td className="p-2.5 font-medium text-slate-900 max-w-xs truncate" title={r.titolo}>
                              {r.titolo}
                            </td>
                            <td className="p-2.5 text-slate-600">{r.categoria}</td>
                            <td className="p-2.5 text-center font-mono text-slate-700">{r.unitaMisura}</td>
                            <td className="p-2.5 text-right font-semibold text-slate-900">
                              {formatEuro(r.prezzoUnitario)}
                            </td>
                            <td className="p-2.5 text-slate-500">
                              {r.errors.length > 0 ? (
                                <span className="text-red-600">{r.errors.join(', ')}</span>
                              ) : (
                                <span>Manodopera: {r.quotaManodopera || 0}% / Materiali: {r.quotaMateriali || 0}%</span>
                              )}
                            </td>
                          </tr>
                        ))}

                    {type === 'prestazioni' &&
                      prestazioniRows
                        .filter((r) => {
                          if (activeFilter === 'valid') return r.isValid;
                          if (activeFilter === 'invalid') return !r.isValid;
                          return true;
                        })
                        .map((r, idx) => (
                          <tr key={idx} className={r.isValid ? 'hover:bg-slate-50/80' : 'bg-amber-50/40'}>
                            <td className="p-2.5">
                              {r.isValid ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                                  <Check className="w-3 h-3" /> Valido
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                                  <AlertCircle className="w-3 h-3" /> Da correggere
                                </span>
                              )}
                            </td>
                            <td className="p-2.5 font-mono font-semibold text-slate-800">{r.codice}</td>
                            <td className="p-2.5 font-medium text-slate-900 max-w-xs truncate" title={r.titolo}>
                              {r.titolo}
                            </td>
                            <td className="p-2.5 text-slate-600">{r.categoria}</td>
                            <td className="p-2.5 text-center font-mono text-slate-700">{r.unitaMisura}</td>
                            <td className="p-2.5 text-right font-semibold text-slate-900">
                              {formatEuro(r.prezzoConsigliato)}
                            </td>
                            <td className="p-2.5 text-slate-500">
                              {r.errors.length > 0 ? (
                                <span className="text-red-600">{r.errors.join(', ')}</span>
                              ) : (
                                <span>Costo base: {formatEuro(r.costoOrario)} (+{r.ricaricoPerc}%)</span>
                              )}
                            </td>
                          </tr>
                        ))}

                    {type === 'materiali' &&
                      materialiRows
                        .filter((r) => {
                          if (activeFilter === 'valid') return r.isValid;
                          if (activeFilter === 'invalid') return !r.isValid;
                          return true;
                        })
                        .map((r, idx) => (
                          <tr key={idx} className={r.isValid ? 'hover:bg-slate-50/80' : 'bg-amber-50/40'}>
                            <td className="p-2.5">
                              {r.isValid ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                                  <Check className="w-3 h-3" /> Valido
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                                  <AlertCircle className="w-3 h-3" /> Da correggere
                                </span>
                              )}
                            </td>
                            <td className="p-2.5 font-mono font-semibold text-slate-800">{r.codice}</td>
                            <td className="p-2.5 font-medium text-slate-900 max-w-xs truncate" title={r.nome}>
                              {r.nome}
                            </td>
                            <td className="p-2.5 text-slate-600">{r.categoria}</td>
                            <td className="p-2.5 text-center font-mono text-slate-700">{r.unitaMisura}</td>
                            <td className="p-2.5 text-right font-semibold text-slate-900">
                              {formatEuro(r.prezzoVendita)}
                            </td>
                            <td className="p-2.5 text-slate-500">
                              {r.errors.length > 0 ? (
                                <span className="text-red-600">{r.errors.join(', ')}</span>
                              ) : (
                                <span>
                                  Acquisto: {formatEuro(r.prezzoAcquisto)} | {r.marca ? `${r.marca}` : 'No marca'}
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {parsingError && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3.5 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{parsingError}</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200/70 rounded-lg transition-colors"
          >
            Annulla
          </button>

          <button
            type="button"
            onClick={handleConfirmImport}
            disabled={validCount === 0}
            className={`inline-flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-bold shadow-xs transition-colors ${
              validCount > 0
                ? 'bg-amber-600 hover:bg-amber-700 text-white'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>
              {validCount > 0
                ? `Importa ${validCount} ${validCount === 1 ? 'elemento' : 'elementi'}`
                : 'Carica un file valido'}
            </span>
          </button>
        </div>

      </div>
    </div>
  );
};
