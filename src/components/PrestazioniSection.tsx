import React, { useState } from 'react';
import {
  Wrench,
  Plus,
  Search,
  Tag,
  Edit2,
  Trash2,
  X,
  CheckCircle2,
  Clock,
  Euro,
  Download,
  Upload,
  FileSpreadsheet
} from 'lucide-react';
import { Prestazione, UnitaMisura } from '../types';
import { formatEuro } from '../utils/calculations';
import { downloadCsvFile } from '../utils/csvImport';
import { CsvImportModal, DuplicateStrategy } from './CsvImportModal';

interface PrestazioniSectionProps {
  prestazioni?: Prestazione[];
  onSavePrestazione: (prestazione: Prestazione) => void;
  onDeletePrestazione: (id: string) => void;
  onImportPrestazioni?: (prestazioni: Prestazione[], strategy?: DuplicateStrategy) => void;
}

export const PrestazioniSection: React.FC<PrestazioniSectionProps> = ({
  prestazioni = [],
  onSavePrestazione,
  onDeletePrestazione,
  onImportPrestazioni
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoria, setSelectedCategoria] = useState<string>('tutte');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingPrestazione, setEditingPrestazione] = useState<Prestazione | null>(null);

  const [formData, setFormData] = useState<Partial<Prestazione>>({
    codice: '',
    titolo: '',
    categoria: 'Opere Murarie',
    unitaMisura: 'h',
    costoOrario: 30,
    ricaricoPerc: 30,
    prezzoConsigliato: 39,
    note: ''
  });

  const categorieDisponibili = Array.from(
    new Set((prestazioni || []).map((p) => p.categoria).filter(Boolean))
  );

  const handleOpenModal = (prestazione?: Prestazione) => {
    if (prestazione) {
      setEditingPrestazione(prestazione);
      setFormData(prestazione);
    } else {
      setEditingPrestazione(null);
      const nextNum = prestazioni.length + 1;
      setFormData({
        codice: `OP-${String(nextNum).padStart(2, '0')}`,
        titolo: '',
        categoria: categorieDisponibili[0] || 'Opere Murarie',
        unitaMisura: 'h',
        costoOrario: 30,
        ricaricoPerc: 30,
        prezzoConsigliato: 39,
        note: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingPrestazione(null);
  };

  const handleCostoOrarioChange = (costo: number) => {
    const ricarico = Number(formData.ricaricoPerc) || 0;
    const consigliato = Math.round(costo * (1 + ricarico / 100) * 100) / 100;
    setFormData({
      ...formData,
      costoOrario: costo,
      prezzoConsigliato: consigliato
    });
  };

  const handleRicaricoChange = (ricarico: number) => {
    const costo = Number(formData.costoOrario) || 0;
    const consigliato = Math.round(costo * (1 + ricarico / 100) * 100) / 100;
    setFormData({
      ...formData,
      ricaricoPerc: ricarico,
      prezzoConsigliato: consigliato
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.titolo?.trim()) {
      alert('Il titolo della prestazione è obbligatorio.');
      return;
    }

    const newPrest: Prestazione = {
      id: editingPrestazione ? editingPrestazione.id : `prs-${Date.now()}`,
      codice: formData.codice?.trim() || `OP-${Date.now().toString().slice(-4)}`,
      titolo: formData.titolo.trim(),
      categoria: formData.categoria?.trim() || 'Generale',
      unitaMisura: formData.unitaMisura || 'h',
      costoOrario: Number(formData.costoOrario) || 0,
      ricaricoPerc: Number(formData.ricaricoPerc) || 0,
      prezzoConsigliato: Number(formData.prezzoConsigliato) || 0,
      note: formData.note?.trim() || ''
    };

    onSavePrestazione(newPrest);
    handleCloseModal();
  };

  const handleExportCSV = () => {
    const headers = ['Codice', 'Categoria', 'Titolo', 'Unita Misura', 'Costo Base / Orario €', 'Ricarico %', 'Prezzo Consigliato €', 'Note'];
    const rows = (prestazioni || []).map((p) => [
      `"${p.codice.replace(/"/g, '""')}"`,
      `"${p.categoria.replace(/"/g, '""')}"`,
      `"${p.titolo.replace(/"/g, '""')}"`,
      `"${p.unitaMisura}"`,
      p.costoOrario,
      p.ricaricoPerc,
      p.prezzoConsigliato,
      `"${(p.note || '').replace(/"/g, '""')}"`
    ]);
    const csvContent = [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\r\n');
    downloadCsvFile(csvContent, `prestazioni-manodopera-${new Date().toISOString().split('T')[0]}.csv`);
  };

  const filteredPrestazioni = (prestazioni || []).filter((p) => {
    const matchesSearch =
      p.titolo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.codice.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.categoria.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.note && p.note.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategoria = selectedCategoria === 'tutte' || p.categoria === selectedCategoria;

    return matchesSearch && matchesCategoria;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Wrench className="w-6 h-6 text-amber-600" />
            Gestione Prestazioni & Manodopera
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Configura le lavorazioni a tariffa oraria, a corpo o a misura, calcolando i margini di ricarico aziendali.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <button
            onClick={() => setIsImportModalOpen(true)}
            id="btn-importa-csv-prestazioni"
            className="inline-flex items-center gap-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 text-sm font-semibold px-3.5 py-2 rounded-lg shadow-xs transition-colors"
            title="Importa massivamente prestazioni da file CSV o Excel"
          >
            <Upload className="w-4 h-4 text-amber-700" />
            <span>Importa CSV</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-semibold px-3.5 py-2 rounded-lg shadow-xs transition-colors"
            title="Esporta catalogo prestazioni in formato CSV compatibile Excel"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Esporta CSV</span>
          </button>

          <button
            id="btn-nuova-prestazione"
            onClick={() => handleOpenModal()}
            className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold px-4 py-2 rounded-lg shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Nuova Prestazione</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="input-ricerca-prestazioni"
            type="text"
            placeholder="Cerca prestazione per codice, titolo, lavorazione..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
          />
        </div>

        {/* Categorie Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          <button
            onClick={() => setSelectedCategoria('tutte')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              selectedCategoria === 'tutte'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Tutte ({prestazioni.length})
          </button>
          {categorieDisponibili.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategoria(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedCategoria === cat
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid Cards */}
      {filteredPrestazioni.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center">
          <Wrench className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-700">Nessuna prestazione trovata</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
            {searchTerm || selectedCategoria !== 'tutte'
              ? 'Nessun elemento corrisponde ai filtri di ricerca impostati.'
              : 'Inserisci le tariffe per manodopera, lavorazioni a corpo e servizi tecnici.'}
          </p>
          <button
            onClick={() => handleOpenModal()}
            className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-amber-600 hover:text-amber-700"
          >
            <Plus className="w-4 h-4" /> Aggiungi Prestazione
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPrestazioni.map((p) => (
            <div
              key={p.id}
              id={`card-prestazione-${p.id}`}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-amber-300 hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="font-mono text-xs font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                    {p.codice}
                  </span>
                  <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                    {p.categoria}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 leading-snug">{p.titolo}</h3>

                {p.note && (
                  <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                    {p.note}
                  </p>
                )}

                {/* Economics Box */}
                <div className="mt-4 bg-slate-50 rounded-lg p-3 border border-slate-100 grid grid-cols-3 gap-2 text-center">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 block">
                      Costo Base
                    </span>
                    <span className="text-xs font-mono font-medium text-slate-700">
                      {formatEuro(p.costoOrario)}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 block">
                      Ricarico
                    </span>
                    <span className="text-xs font-mono font-semibold text-emerald-600">
                      +{p.ricaricoPerc}%
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 block">
                      Vendita /{p.unitaMisura}
                    </span>
                    <span className="text-sm font-mono font-bold text-slate-900">
                      {formatEuro(p.prezzoConsigliato)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  Unità: <strong className="text-slate-700 font-semibold">{p.unitaMisura}</strong>
                </span>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenModal(p)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
                    title="Modifica"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Eliminare la prestazione "${p.titolo}"?`)) {
                        onDeletePrestazione(p.id);
                      }
                    }}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                    title="Elimina"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Aggiungi / Modifica Prestazione */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
                  <Wrench className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {editingPrestazione ? 'Modifica Prestazione' : 'Nuova Prestazione'}
                  </h3>
                  <p className="text-xs text-slate-500">Definisci i parametri di costo e tariffa per i preventivi</p>
                </div>
              </div>
              <button
                onClick={handleCloseModal}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Codice Prestazione
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Es. OP-DEM-01"
                    value={formData.codice || ''}
                    onChange={(e) => setFormData({ ...formData, codice: e.target.value.toUpperCase() })}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm font-mono text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Unità di Misura
                  </label>
                  <select
                    value={formData.unitaMisura || 'h'}
                    onChange={(e) => setFormData({ ...formData, unitaMisura: e.target.value as UnitaMisura })}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 bg-white"
                  >
                    <option value="h">h (ore manodopera)</option>
                    <option value="a corpo">a corpo (forfettario)</option>
                    <option value="mq">mq (metri quadri)</option>
                    <option value="ml">ml (metri lineari)</option>
                    <option value="mc">mc (metri cubi)</option>
                    <option value="cad">cad (cadauno / pezzo)</option>
                    <option value="gg">gg (giornate lavorative)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Titolo Lavorazione *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Es. Demolizione pareti in laterizio forato"
                  value={formData.titolo || ''}
                  onChange={(e) => setFormData({ ...formData, titolo: e.target.value })}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Categoria / Settore
                </label>
                <input
                  type="text"
                  placeholder="Es. Opere Murarie, Demolizioni, Impianti Elettrici..."
                  value={formData.categoria || ''}
                  onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm text-slate-900"
                  list="lista-categorie-prestazioni"
                />
                <datalist id="lista-categorie-prestazioni">
                  <option value="Demolizioni & Rimozioni" />
                  <option value="Opere Murarie" />
                  <option value="Cartongessi & Isolamenti" />
                  <option value="Tinteggiature & Finiture" />
                  <option value="Pavimenti & Rivestimenti" />
                  <option value="Impianti Elettrici" />
                  <option value="Impianti Idraulici" />
                  <option value="Servizi Tecnici & Sicurezza" />
                </datalist>
              </div>

              {/* Cost Calculation Box */}
              <div className="bg-amber-50/60 p-4 rounded-xl border border-amber-200/80 space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-amber-950 uppercase tracking-wider">
                  <span>Calcolo Prezzo di Vendita</span>
                  <Euro className="w-4 h-4 text-amber-700" />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Costo Aziendale (€)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.costoOrario ?? 0}
                      onChange={(e) => handleCostoOrarioChange(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-sm font-mono text-slate-900 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Ricarico (%)
                    </label>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      value={formData.ricaricoPerc ?? 0}
                      onChange={(e) => handleRicaricoChange(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-sm font-mono text-slate-900 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-amber-900 mb-1">
                      Prezzo Vendita (€)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.prezzoConsigliato ?? 0}
                      onChange={(e) => setFormData({ ...formData, prezzoConsigliato: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-1.5 border border-amber-400 bg-amber-100/50 rounded-lg text-sm font-mono font-bold text-amber-950"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Note Operative e Dettagli
                </label>
                <textarea
                  rows={2}
                  placeholder="Specifiche dei macchinari inclusi, oneri compresi, prescrizioni..."
                  value={formData.note || ''}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm text-slate-900"
                />
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-semibold shadow-xs"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Salva Prestazione</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal Importazione Massiva CSV */}
      <CsvImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        type="prestazioni"
        onImportConfirmed={(items, strategy) => {
          if (onImportPrestazioni) {
            onImportPrestazioni(items as Prestazione[], strategy);
          }
        }}
      />
    </div>
  );
};
