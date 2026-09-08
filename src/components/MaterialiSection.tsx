import React, { useState } from 'react';
import {
  Package,
  Plus,
  Search,
  Tag,
  Edit2,
  Trash2,
  X,
  CheckCircle2,
  Euro,
  Boxes,
  Truck,
  Download,
  Upload,
  FileSpreadsheet
} from 'lucide-react';
import { Materiale, UnitaMisura } from '../types';
import { formatEuro } from '../utils/calculations';
import { downloadCsvFile } from '../utils/csvImport';
import { CsvImportModal, DuplicateStrategy } from './CsvImportModal';

interface MaterialiSectionProps {
  materiali?: Materiale[];
  onSaveMateriale: (materiale: Materiale) => void;
  onDeleteMateriale: (id: string) => void;
  onImportMateriali?: (materiali: Materiale[], strategy?: DuplicateStrategy) => void;
}

export const MaterialiSection: React.FC<MaterialiSectionProps> = ({
  materiali = [],
  onSaveMateriale,
  onDeleteMateriale,
  onImportMateriali
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoria, setSelectedCategoria] = useState<string>('tutte');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingMateriale, setEditingMateriale] = useState<Materiale | null>(null);

  const [formData, setFormData] = useState<Partial<Materiale>>({
    codice: '',
    nome: '',
    categoria: 'Leganti & Inerti',
    marca: '',
    unitaMisura: 'sacco',
    prezzoAcquisto: 5,
    ricaricoPerc: 35,
    prezzoVendita: 6.75,
    fornitore: '',
    scorta: 10,
    note: ''
  });

  const categorieDisponibili = Array.from(
    new Set((materiali || []).map((m) => m.categoria).filter(Boolean))
  );

  const handleOpenModal = (materiale?: Materiale) => {
    if (materiale) {
      setEditingMateriale(materiale);
      setFormData(materiale);
    } else {
      setEditingMateriale(null);
      const nextNum = materiali.length + 1;
      setFormData({
        codice: `MAT-${String(nextNum).padStart(2, '0')}`,
        nome: '',
        categoria: categorieDisponibili[0] || 'Leganti & Inerti',
        marca: '',
        unitaMisura: 'mq',
        prezzoAcquisto: 10,
        ricaricoPerc: 35,
        prezzoVendita: 13.5,
        fornitore: '',
        scorta: 20,
        note: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingMateriale(null);
  };

  const handlePrezzoAcquistoChange = (prezzo: number) => {
    const ricarico = Number(formData.ricaricoPerc) || 0;
    const vendita = Math.round(prezzo * (1 + ricarico / 100) * 100) / 100;
    setFormData({
      ...formData,
      prezzoAcquisto: prezzo,
      prezzoVendita: vendita
    });
  };

  const handleRicaricoChange = (ricarico: number) => {
    const acquisto = Number(formData.prezzoAcquisto) || 0;
    const vendita = Math.round(acquisto * (1 + ricarico / 100) * 100) / 100;
    setFormData({
      ...formData,
      ricaricoPerc: ricarico,
      prezzoVendita: vendita
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nome?.trim()) {
      alert('Il nome del materiale è obbligatorio.');
      return;
    }

    const newMat: Materiale = {
      id: editingMateriale ? editingMateriale.id : `mat-${Date.now()}`,
      codice: formData.codice?.trim() || `MAT-${Date.now().toString().slice(-4)}`,
      nome: formData.nome.trim(),
      categoria: formData.categoria?.trim() || 'Varie',
      marca: formData.marca?.trim() || '',
      unitaMisura: formData.unitaMisura || 'pz',
      prezzoAcquisto: Number(formData.prezzoAcquisto) || 0,
      ricaricoPerc: Number(formData.ricaricoPerc) || 0,
      prezzoVendita: Number(formData.prezzoVendita) || 0,
      fornitore: formData.fornitore?.trim() || '',
      scorta: Number(formData.scorta) || 0,
      note: formData.note?.trim() || ''
    };

    onSaveMateriale(newMat);
    handleCloseModal();
  };

  const handleExportCSV = () => {
    const headers = [
      'Codice',
      'Nome Materiale',
      'Categoria',
      'Marca',
      'Fornitore',
      'Unita Misura',
      'Prezzo Acquisto €',
      'Ricarico %',
      'Prezzo Vendita €',
      'Scorta Minima',
      'Note'
    ];
    const rows = (materiali || []).map((m) => [
      `"${m.codice.replace(/"/g, '""')}"`,
      `"${m.nome.replace(/"/g, '""')}"`,
      `"${m.categoria.replace(/"/g, '""')}"`,
      `"${(m.marca || '').replace(/"/g, '""')}"`,
      `"${(m.fornitore || '').replace(/"/g, '""')}"`,
      `"${m.unitaMisura}"`,
      m.prezzoAcquisto,
      m.ricaricoPerc,
      m.prezzoVendita,
      m.scorta || 0,
      `"${(m.note || '').replace(/"/g, '""')}"`
    ]);
    const csvContent = [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\r\n');
    downloadCsvFile(csvContent, `materiali-costruzione-${new Date().toISOString().split('T')[0]}.csv`);
  };

  const filteredMateriali = (materiali || []).filter((m) => {
    const matchesSearch =
      m.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.codice.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.marca && m.marca.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (m.fornitore && m.fornitore.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategoria = selectedCategoria === 'tutte' || m.categoria === selectedCategoria;

    return matchesSearch && matchesCategoria;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Package className="w-6 h-6 text-amber-600" />
            Gestione Materiali da Costruzione
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Catalogo articoli, costi d'acquisto da fornitore, percentuali di ricarico e prezzi di vendita al committente.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <button
            onClick={() => setIsImportModalOpen(true)}
            id="btn-importa-csv-materiali"
            className="inline-flex items-center gap-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 text-sm font-semibold px-3.5 py-2 rounded-lg shadow-xs transition-colors"
            title="Importa massivamente articoli e materiali da file CSV o Excel"
          >
            <Upload className="w-4 h-4 text-amber-700" />
            <span>Importa CSV</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-semibold px-3.5 py-2 rounded-lg shadow-xs transition-colors"
            title="Esporta catalogo materiali in formato CSV compatibile Excel"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Esporta CSV</span>
          </button>

          <button
            id="btn-nuovo-materiale"
            onClick={() => handleOpenModal()}
            className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold px-4 py-2.5 rounded-lg shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Nuovo Materiale</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="input-ricerca-materiali"
            type="text"
            placeholder="Cerca per nome materiale, marca, codice, fornitore..."
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
            Tutti ({materiali.length})
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

      {/* Grid of Materials */}
      {filteredMateriali.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center">
          <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-700">Nessun materiale trovato</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
            {searchTerm || selectedCategoria !== 'tutte'
              ? 'Nessun articolo corrisponde ai criteri di ricerca impostati.'
              : 'Aggiungi i materiali più usati per inserirli rapidamente nei preventivi.'}
          </p>
          <button
            onClick={() => handleOpenModal()}
            className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-amber-600 hover:text-amber-700"
          >
            <Plus className="w-4 h-4" /> Aggiungi Materiale
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMateriali.map((m) => (
            <div
              key={m.id}
              id={`card-materiale-${m.id}`}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-amber-300 hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                    {m.codice}
                  </span>
                  <span className="text-xs font-medium text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
                    {m.categoria}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 leading-snug">{m.nome}</h3>
                {m.marca && (
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Produttore: <span className="text-slate-700 font-semibold">{m.marca}</span>
                  </p>
                )}

                {/* Fornitore & Scorta */}
                <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                  {m.fornitore ? (
                    <span className="flex items-center gap-1 truncate">
                      <Truck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      {m.fornitore}
                    </span>
                  ) : (
                    <span />
                  )}
                  {m.scorta !== undefined && (
                    <span className="flex items-center gap-1 font-mono text-slate-600">
                      <Boxes className="w-3.5 h-3.5 text-slate-400" />
                      Scorta: {m.scorta} {m.unitaMisura}
                    </span>
                  )}
                </div>

                {/* Economics Box */}
                <div className="mt-4 bg-slate-50 rounded-lg p-3 border border-slate-100 grid grid-cols-3 gap-2 text-center">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 block">
                      Acquisto
                    </span>
                    <span className="text-xs font-mono font-medium text-slate-600">
                      {formatEuro(m.prezzoAcquisto)}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 block">
                      Ricarico
                    </span>
                    <span className="text-xs font-mono font-semibold text-emerald-600">
                      +{m.ricaricoPerc}%
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 block">
                      Vendita /{m.unitaMisura}
                    </span>
                    <span className="text-sm font-mono font-bold text-slate-900">
                      {formatEuro(m.prezzoVendita)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  U.M.: <strong className="text-slate-700 font-semibold">{m.unitaMisura}</strong>
                </span>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenModal(m)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
                    title="Modifica"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Eliminare il materiale "${m.nome}"?`)) {
                        onDeleteMateriale(m.id);
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

      {/* Modal Aggiungi / Modifica Materiale */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
                  <Package className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {editingMateriale ? 'Modifica Materiale' : 'Nuovo Materiale da Costruzione'}
                  </h3>
                  <p className="text-xs text-slate-500">Imposta prezzo fornitore, ricarico e specifiche tecniche</p>
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
                    Codice Articolo
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Es. MAT-CAR-01"
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
                    value={formData.unitaMisura || 'mq'}
                    onChange={(e) => setFormData({ ...formData, unitaMisura: e.target.value as UnitaMisura })}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 bg-white"
                  >
                    <option value="mq">mq (metri quadrati)</option>
                    <option value="ml">ml (metri lineari)</option>
                    <option value="mc">mc (metri cubi)</option>
                    <option value="sacco">sacco (25 kg / premiscelato)</option>
                    <option value="kg">kg (chilogrammi)</option>
                    <option value="lt">lt (litri)</option>
                    <option value="pz">pz (pezzo singolo)</option>
                    <option value="a corpo">a corpo</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Nome Materiale & Descrizione *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Es. Lastra cartongesso idrorepellente 12.5 mm"
                  value={formData.nome || ''}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Categoria
                  </label>
                  <input
                    type="text"
                    placeholder="Es. Cartongessi & Lastre"
                    value={formData.categoria || ''}
                    onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm text-slate-900"
                    list="lista-categorie-materiali"
                  />
                  <datalist id="lista-categorie-materiali">
                    <option value="Leganti & Inerti" />
                    <option value="Laterizi & Murature" />
                    <option value="Cartongessi & Lastre" />
                    <option value="Isolamento Termoacustico" />
                    <option value="Colori & Vernici" />
                    <option value="Adesivi & Sigillanti" />
                    <option value="Materiale Elettrico" />
                    <option value="Idraulica & Tubazioni" />
                  </datalist>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Marca / Produttore
                  </label>
                  <input
                    type="text"
                    placeholder="Es. Knauf, Mapei, Fassa..."
                    value={formData.marca || ''}
                    onChange={(e) => setFormData({ ...formData, marca: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm text-slate-900"
                  />
                </div>
              </div>

              {/* Cost Calculation Box */}
              <div className="bg-amber-50/60 p-4 rounded-xl border border-amber-200/80 space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-amber-950 uppercase tracking-wider">
                  <span>Prezzo e Ricarico</span>
                  <Euro className="w-4 h-4 text-amber-700" />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Costo Acquisto (€)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.prezzoAcquisto ?? 0}
                      onChange={(e) => handlePrezzoAcquistoChange(parseFloat(e.target.value) || 0)}
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
                      Vendita /{formData.unitaMisura || 'pz'}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.prezzoVendita ?? 0}
                      onChange={(e) => setFormData({ ...formData, prezzoVendita: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-1.5 border border-amber-400 bg-amber-100/50 rounded-lg text-sm font-mono font-bold text-amber-950"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Fornitore di Riferimento
                  </label>
                  <input
                    type="text"
                    placeholder="Es. EdilMarket S.p.A."
                    value={formData.fornitore || ''}
                    onChange={(e) => setFormData({ ...formData, fornitore: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Scorta a Magazzino
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Quantità in giacenza"
                    value={formData.scorta ?? 0}
                    onChange={(e) => setFormData({ ...formData, scorta: parseInt(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Note Tecniche
                </label>
                <textarea
                  rows={2}
                  placeholder="Resa mq per sacco, tempi di essiccazione, avvertenze di posa..."
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
                  <span>Salva Materiale</span>
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
        type="materiali"
        onImportConfirmed={(items, strategy) => {
          if (onImportMateriali) {
            onImportMateriali(items as Materiale[], strategy);
          }
        }}
      />
    </div>
  );
};
