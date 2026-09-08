import React, { useState } from 'react';
import {
  BookOpen,
  Plus,
  Search,
  Download,
  Upload,
  Edit2,
  Trash2,
  X,
  CheckCircle2,
  Layers,
  FileSpreadsheet
} from 'lucide-react';
import { VocePrezziario, UnitaMisura } from '../types';
import { formatEuro } from '../utils/calculations';
import { CsvImportModal, DuplicateStrategy } from './CsvImportModal';

interface PrezziarioSectionProps {
  vociPrezziario?: VocePrezziario[];
  onSaveVoce: (voce: VocePrezziario) => void;
  onDeleteVoce: (id: string) => void;
  onImportVoci: (voci: VocePrezziario[], strategy?: DuplicateStrategy) => void;
}

export const PrezziarioSection: React.FC<PrezziarioSectionProps> = ({
  vociPrezziario = [],
  onSaveVoce,
  onDeleteVoce,
  onImportVoci
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoria, setSelectedCategoria] = useState<string>('tutte');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingVoce, setEditingVoce] = useState<VocePrezziario | null>(null);

  const [formData, setFormData] = useState<Partial<VocePrezziario>>({
    codice: '',
    categoria: 'Opere Murarie e Strutturali',
    titolo: '',
    descrizioneBreve: '',
    descrizioneEstesa: '',
    unitaMisura: 'mq',
    prezzoUnitario: 35.0,
    quotaManodopera: 65,
    quotaMateriali: 35
  });

  const categorieDisponibili = Array.from(
    new Set((vociPrezziario || []).map((v) => v.categoria).filter(Boolean))
  );

  const handleOpenModal = (voce?: VocePrezziario) => {
    if (voce) {
      setEditingVoce(voce);
      setFormData(voce);
    } else {
      setEditingVoce(null);
      const nextNum = vociPrezziario.length + 1;
      setFormData({
        codice: `01.EDIL.${String(nextNum).padStart(3, '0')}`,
        categoria: categorieDisponibili[0] || 'Opere Murarie',
        titolo: '',
        descrizioneBreve: '',
        descrizioneEstesa: '',
        unitaMisura: 'mq',
        prezzoUnitario: 30.0,
        quotaManodopera: 60,
        quotaMateriali: 40
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingVoce(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.titolo?.trim() || !formData.codice?.trim()) {
      alert('Codice e Titolo della voce sono obbligatori.');
      return;
    }

    const mano = Math.max(0, Math.min(100, Number(formData.quotaManodopera) || 0));
    const mat = 100 - mano;

    const newVoce: VocePrezziario = {
      id: editingVoce ? editingVoce.id : `prz-${Date.now()}`,
      codice: formData.codice.trim().toUpperCase(),
      categoria: formData.categoria?.trim() || 'Generale',
      titolo: formData.titolo.trim(),
      descrizioneBreve: formData.descrizioneBreve?.trim() || formData.titolo.trim(),
      descrizioneEstesa: formData.descrizioneEstesa?.trim() || formData.titolo.trim(),
      unitaMisura: formData.unitaMisura || 'mq',
      prezzoUnitario: Number(formData.prezzoUnitario) || 0,
      quotaManodopera: mano,
      quotaMateriali: mat,
      note: formData.note?.trim() || ''
    };

    onSaveVoce(newVoce);
    handleCloseModal();
  };

  const handleExportCSV = () => {
    const headers = ['Codice', 'Categoria', 'Titolo', 'Descrizione Breve', 'Unita Misura', 'Prezzo Unitario', 'Quota Manodopera %', 'Quota Materiali %'];
    const rows = vociPrezziario.map((v) => [
      `"${v.codice.replace(/"/g, '""')}"`,
      `"${v.categoria.replace(/"/g, '""')}"`,
      `"${v.titolo.replace(/"/g, '""')}"`,
      `"${v.descrizioneBreve.replace(/"/g, '""')}"`,
      `"${v.unitaMisura}"`,
      v.prezzoUnitario,
      v.quotaManodopera || 0,
      v.quotaMateriali || 0
    ]);

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `prezziario-personalizzato-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredVoci = (vociPrezziario || []).filter((v) => {
    const matchesSearch =
      v.titolo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.codice.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.descrizioneBreve.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.descrizioneEstesa.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.categoria.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategoria = selectedCategoria === 'tutte' || v.categoria === selectedCategoria;

    return matchesSearch && matchesCategoria;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-amber-600" />
            Prezziario Personalizzato (Elenco Prezzi)
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Voci di capitolato complete di codici, descrizioni analitiche, scomposizione manodopera e materiali per computi metrici estimativi.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <button
            onClick={() => setIsImportModalOpen(true)}
            id="btn-importa-csv-prezziario"
            className="inline-flex items-center gap-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 text-sm font-semibold px-3.5 py-2 rounded-lg shadow-xs transition-colors"
            title="Importa massivamente voci di prezziario da file CSV o Excel"
          >
            <Upload className="w-4 h-4 text-amber-700" />
            <span>Importa CSV</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-semibold px-3.5 py-2 rounded-lg shadow-xs transition-colors"
            title="Esporta elenco prezzi in formato CSV compatibile Excel"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Esporta CSV</span>
          </button>

          <button
            id="btn-nuova-voce-prezziario"
            onClick={() => handleOpenModal()}
            className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold px-4 py-2 rounded-lg shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Nuova Voce</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="input-ricerca-prezziario"
            type="text"
            placeholder="Cerca per codice (es. 01.DEM.010), titolo di capitolato o lavorazione..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          <button
            onClick={() => setSelectedCategoria('tutte')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              selectedCategoria === 'tutte'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Tutte ({vociPrezziario.length})
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

      {/* Voci Prezziario List / Table */}
      {filteredVoci.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-700">Nessuna voce di prezziario trovata</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
            {searchTerm || selectedCategoria !== 'tutte'
              ? 'Nessuna voce corrisponde ai criteri di ricerca impostati.'
              : 'Inserisci le voci di capitolato per costruire preventivi precisi in pochi secondi.'}
          </p>
          <button
            onClick={() => handleOpenModal()}
            className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-amber-600 hover:text-amber-700"
          >
            <Plus className="w-4 h-4" /> Aggiungi Voce di Capitolato
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredVoci.map((v) => (
            <div
              key={v.id}
              id={`item-prezziario-${v.id}`}
              className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs hover:border-amber-300 hover:shadow-md transition-all flex flex-col md:flex-row md:items-center md:justify-between gap-4"
            >
              {/* Main Content */}
              <div className="flex-1 space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-bold text-amber-900 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                    {v.codice}
                  </span>
                  <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                    {v.categoria}
                  </span>
                  <span className="text-xs font-medium text-slate-400">
                    U.M.: <strong className="text-slate-700 font-semibold">{v.unitaMisura}</strong>
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 leading-snug">
                  {v.titolo}
                </h3>

                <p className="text-xs text-slate-600 leading-relaxed line-clamp-2 max-w-4xl">
                  {v.descrizioneEstesa || v.descrizioneBreve}
                </p>

                {/* Scomposizione manodopera & materiali */}
                <div className="flex items-center gap-4 text-xs pt-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-400 font-medium">Manodopera:</span>
                    <span className="font-mono font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-sm">
                      {v.quotaManodopera ?? 60}%
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-400 font-medium">Materiali / Noli:</span>
                    <span className="font-mono font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded-sm">
                      {v.quotaMateriali ?? 40}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Price & Actions */}
              <div className="flex items-center justify-between md:justify-end gap-6 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
                <div className="text-left md:text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                    Prezzo Unitario
                  </span>
                  <span className="text-lg sm:text-xl font-mono font-extrabold text-slate-900">
                    {formatEuro(v.prezzoUnitario)}
                  </span>
                  <span className="text-xs text-slate-500 block">/{v.unitaMisura}</span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenModal(v)}
                    className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                    title="Modifica Voce"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Eliminare la voce di prezziario "${v.codice} - ${v.titolo}"?`)) {
                        onDeleteVoce(v.id);
                      }
                    }}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Elimina Voce"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Aggiungi / Modifica Voce Prezziario */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {editingVoce ? 'Modifica Voce di Prezziario' : 'Nuova Voce di Capitolato'}
                  </h3>
                  <p className="text-xs text-slate-500">Definisci il testo di capitolato e i parametri economici</p>
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
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Codice Voce / Articolo *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Es. 01.DEM.010"
                    value={formData.codice || ''}
                    onChange={(e) => setFormData({ ...formData, codice: e.target.value.toUpperCase() })}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm font-mono text-slate-900"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Categoria / Capitolo di Spesa
                  </label>
                  <input
                    type="text"
                    placeholder="Es. Demolizioni e Rimozioni"
                    value={formData.categoria || ''}
                    onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm text-slate-900"
                    list="lista-categorie-prezziario"
                  />
                  <datalist id="lista-categorie-prezziario">
                    <option value="Allestimento Cantiere & Sicurezza" />
                    <option value="Demolizioni e Rimozioni" />
                    <option value="Opere Murarie e Strutturali" />
                    <option value="Cartongesso e Controsoffitti" />
                    <option value="Impianti Elettrici e Speciali" />
                    <option value="Impianti Idraulici e Termici" />
                    <option value="Pavimenti e Rivestimenti" />
                    <option value="Tinteggiature e Verniciature" />
                    <option value="Opere in Ferro e Serramenti" />
                  </datalist>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Titolo Sintetico Voce *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Es. Demolizione tramezzature in laterizio forato sp. 8-12 cm"
                  value={formData.titolo || ''}
                  onChange={(e) => setFormData({ ...formData, titolo: e.target.value })}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Unità di Misura
                  </label>
                  <select
                    value={formData.unitaMisura || 'mq'}
                    onChange={(e) => setFormData({ ...formData, unitaMisura: e.target.value as UnitaMisura })}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 bg-white"
                  >
                    <option value="mq">mq (metri quadri)</option>
                    <option value="ml">ml (metri lineari)</option>
                    <option value="mc">mc (metri cubi)</option>
                    <option value="cad">cad (cadauno)</option>
                    <option value="a corpo">a corpo</option>
                    <option value="kg">kg (chilogrammi)</option>
                    <option value="h">h (ore)</option>
                    <option value="gg">gg (giornate)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Prezzo Unitario (€) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formData.prezzoUnitario ?? 0}
                    onChange={(e) => setFormData({ ...formData, prezzoUnitario: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm font-mono font-bold text-slate-900"
                  />
                </div>
              </div>

              {/* Scomposizione economica % */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <span className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Analisi del Prezzo: Quota Manodopera & Materiali
                </span>
                <p className="text-xs text-slate-500">
                  Utile per evidenziare il costo manodopera per detrazioni fiscali (es. Bonus Ristrutturazione 50%) e redazione PSC.
                </p>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-semibold text-amber-800 mb-1">
                      Quota Manodopera (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={formData.quotaManodopera ?? 60}
                      onChange={(e) => {
                        const val = Math.max(0, Math.min(100, parseInt(e.target.value) || 0));
                        setFormData({
                          ...formData,
                          quotaManodopera: val,
                          quotaMateriali: 100 - val
                        });
                      }}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-sm font-mono text-slate-900 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-blue-800 mb-1">
                      Quota Materiali & Noli (%)
                    </label>
                    <input
                      type="number"
                      readOnly
                      value={100 - (formData.quotaManodopera ?? 60)}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm font-mono text-slate-600 bg-slate-100 cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Descrizione Estesa di Capitolato Tecnico
                </label>
                <textarea
                  rows={4}
                  placeholder="Descrizione completa di modalità esecutive, oneri accessori inclusi, marchi di riferimento, calo in basso e trasporto..."
                  value={formData.descrizioneEstesa || ''}
                  onChange={(e) => setFormData({ ...formData, descrizioneEstesa: e.target.value })}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 leading-relaxed"
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
                  <span>Salva nel Prezziario</span>
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
        type="prezziario"
        onImportConfirmed={(items, strategy) => {
          onImportVoci(items as VocePrezziario[], strategy);
        }}
      />
    </div>
  );
};
