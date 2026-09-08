import React, { useState } from 'react';
import {
  Users,
  Plus,
  Search,
  Building,
  User,
  Home,
  FileText,
  Phone,
  Mail,
  MapPin,
  Edit2,
  Trash2,
  X,
  CheckCircle2
} from 'lucide-react';
import { Cliente, Documento } from '../types';

interface ClientiSectionProps {
  clienti?: Cliente[];
  documenti?: Documento[];
  onSaveCliente: (cliente: Cliente) => void;
  onDeleteCliente: (id: string) => void;
  onCreaPreventivoPerCliente?: (cliente: Cliente) => void;
}

export const ClientiSection: React.FC<ClientiSectionProps> = ({
  clienti = [],
  documenti = [],
  onSaveCliente,
  onDeleteCliente,
  onCreaPreventivoPerCliente
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState<string>('tutti');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<Cliente>>({
    ragioneSociale: '',
    referente: '',
    tipoCliente: 'privato',
    codiceFiscale: '',
    piva: '',
    indirizzo: '',
    cap: '',
    citta: '',
    provincia: '',
    telefono: '',
    email: '',
    pec: '',
    codiceSdi: '0000000',
    note: ''
  });

  const handleOpenModal = (cliente?: Cliente) => {
    if (cliente) {
      setEditingCliente(cliente);
      setFormData(cliente);
    } else {
      setEditingCliente(null);
      setFormData({
        ragioneSociale: '',
        referente: '',
        tipoCliente: 'privato',
        codiceFiscale: '',
        piva: '',
        indirizzo: '',
        cap: '',
        citta: '',
        provincia: '',
        telefono: '',
        email: '',
        pec: '',
        codiceSdi: '0000000',
        note: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCliente(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.ragioneSociale?.trim() || !formData.codiceFiscale?.trim()) {
      alert('La Ragione Sociale/Nome e il Codice Fiscale sono obbligatori.');
      return;
    }

    const newCliente: Cliente = {
      id: editingCliente ? editingCliente.id : `cli-${Date.now()}`,
      ragioneSociale: formData.ragioneSociale.trim(),
      referente: formData.referente?.trim() || '',
      tipoCliente: formData.tipoCliente || 'privato',
      codiceFiscale: formData.codiceFiscale.trim().toUpperCase(),
      piva: formData.piva?.trim() || '',
      indirizzo: formData.indirizzo?.trim() || '',
      cap: formData.cap?.trim() || '',
      citta: formData.citta?.trim() || '',
      provincia: formData.provincia?.trim().toUpperCase() || '',
      telefono: formData.telefono?.trim() || '',
      email: formData.email?.trim() || '',
      pec: formData.pec?.trim() || '',
      codiceSdi: formData.codiceSdi?.trim() || '0000000',
      note: formData.note?.trim() || '',
      dataCreazione: editingCliente ? editingCliente.dataCreazione : new Date().toISOString().split('T')[0]
    };

    onSaveCliente(newCliente);
    handleCloseModal();
  };

  const filteredClienti = (clienti || []).filter((c) => {
    const matchesSearch =
      c.ragioneSociale.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.referente && c.referente.toLowerCase().includes(searchTerm.toLowerCase())) ||
      c.codiceFiscale.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.piva && c.piva.toLowerCase().includes(searchTerm.toLowerCase())) ||
      c.citta.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesTipo = filterTipo === 'tutti' || c.tipoCliente === filterTipo;

    return matchesSearch && matchesTipo;
  });

  const getDocCountForCliente = (clienteId: string) => {
    return (documenti || []).filter((d) => d.clienteId === clienteId).length;
  };

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-amber-600" />
            Anagrafica Clienti
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Gestisci i committenti, indirizzi cantieri, dati fiscali per fatturazione elettronica e storico preventivi.
          </p>
        </div>

        <button
          id="btn-nuovo-cliente"
          onClick={() => handleOpenModal()}
          className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold px-4 py-2.5 rounded-lg shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Nuovo Cliente</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="input-ricerca-clienti"
            type="text"
            placeholder="Cerca per nome, codice fiscale, P.IVA, città..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
          />
        </div>

        {/* Tipo Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {[
            { key: 'tutti', label: 'Tutti' },
            { key: 'privato', label: 'Privati' },
            { key: 'azienda', label: 'Aziende' },
            { key: 'condominio', label: 'Condomini' }
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setFilterTipo(t.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                filterTipo === t.key
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Client List Cards Grid */}
      {filteredClienti.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-700">Nessun cliente trovato</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
            {searchTerm || filterTipo !== 'tutti'
              ? 'Prova a modificare i termini di ricerca o i filtri impostati.'
              : 'Inizia aggiungendo il primo committente per associare preventivi e computi metrici.'}
          </p>
          <button
            onClick={() => handleOpenModal()}
            className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-amber-600 hover:text-amber-700"
          >
            <Plus className="w-4 h-4" /> Aggiungi Cliente
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClienti.map((c) => {
            const docsCount = getDocCountForCliente(c.id);
            return (
              <div
                key={c.id}
                id={`card-cliente-${c.id}`}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-amber-300 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Top Badge & Type */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                        c.tipoCliente === 'azienda'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : c.tipoCliente === 'condominio'
                          ? 'bg-purple-50 text-purple-700 border border-purple-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}
                    >
                      {c.tipoCliente === 'azienda' && <Building className="w-3 h-3" />}
                      {c.tipoCliente === 'condominio' && <Home className="w-3 h-3" />}
                      {c.tipoCliente === 'privato' && <User className="w-3 h-3" />}
                      {c.tipoCliente}
                    </span>

                    {docsCount > 0 && (
                      <span className="text-xs font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full flex items-center gap-1 border border-amber-200">
                        <FileText className="w-3 h-3" />
                        {docsCount} {docsCount === 1 ? 'documento' : 'documenti'}
                      </span>
                    )}
                  </div>

                  {/* Name & Contact */}
                  <h3 className="text-base font-bold text-slate-900 leading-tight">
                    {c.ragioneSociale}
                  </h3>
                  {c.referente && (
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      Rif: <span className="text-slate-700">{c.referente}</span>
                    </p>
                  )}

                  {/* Tax Info */}
                  <div className="mt-3 text-xs text-slate-600 space-y-1 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-medium">C.F.:</span>
                      <span className="font-mono font-medium text-slate-800">{c.codiceFiscale}</span>
                    </div>
                    {c.piva && (
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-medium">P.IVA:</span>
                        <span className="font-mono font-medium text-slate-800">{c.piva}</span>
                      </div>
                    )}
                    {c.codiceSdi && (
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-medium">Cod. SDI:</span>
                        <span className="font-mono font-medium text-slate-800">{c.codiceSdi}</span>
                      </div>
                    )}
                  </div>

                  {/* Address & Contact */}
                  <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                    {c.indirizzo && (
                      <p className="flex items-center gap-1.5 truncate text-slate-600">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>
                          {c.indirizzo}, {c.cap} {c.citta} ({c.provincia})
                        </span>
                      </p>
                    )}
                    {c.telefono && (
                      <p className="flex items-center gap-1.5 truncate text-slate-600">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{c.telefono}</span>
                      </p>
                    )}
                    {c.email && (
                      <p className="flex items-center gap-1.5 truncate text-slate-600">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{c.email}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    id={`btn-preventivo-cliente-${c.id}`}
                    onClick={() => onCreaPreventivoPerCliente && onCreaPreventivoPerCliente(c)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 px-2.5 py-1.5 rounded-md transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Crea Preventivo</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      id={`btn-edit-cliente-${c.id}`}
                      onClick={() => handleOpenModal(c)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
                      title="Modifica Anagrafica"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      id={`btn-delete-cliente-${c.id}`}
                      onClick={() => {
                        if (confirm(`Sei sicuro di voler eliminare il cliente "${c.ragioneSociale}"?`)) {
                          onDeleteCliente(c.id);
                        }
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                      title="Elimina Cliente"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Aggiungi / Modifica Cliente */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {editingCliente ? 'Modifica Anagrafica Cliente' : 'Nuovo Cliente'}
                  </h3>
                  <p className="text-xs text-slate-500">Compila i dati anagrafici e fiscali del committente</p>
                </div>
              </div>
              <button
                onClick={handleCloseModal}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Ragione Sociale */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Ragione Sociale / Nominativo *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Es. Impresa Costruzioni S.r.l. oppure Mario Rossi"
                    value={formData.ragioneSociale || ''}
                    onChange={(e) => setFormData({ ...formData, ragioneSociale: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>

                {/* Tipo Cliente */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Tipologia Committente
                  </label>
                  <select
                    value={formData.tipoCliente || 'privato'}
                    onChange={(e) => setFormData({ ...formData, tipoCliente: e.target.value as any })}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  >
                    <option value="privato">Persona Fisica / Privato</option>
                    <option value="azienda">Azienda / Società / P.IVA</option>
                    <option value="condominio">Condominio</option>
                    <option value="ente_pubblico">Ente Pubblico</option>
                  </select>
                </div>

                {/* Referente */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Referente / Amministratore
                  </label>
                  <input
                    type="text"
                    placeholder="Es. Ing. Rossi / Geom. Bianchi"
                    value={formData.referente || ''}
                    onChange={(e) => setFormData({ ...formData, referente: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>

                {/* Codice Fiscale */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Codice Fiscale *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Codice Fiscale 16 caratteri o numerico"
                    value={formData.codiceFiscale || ''}
                    onChange={(e) => setFormData({ ...formData, codiceFiscale: e.target.value.toUpperCase() })}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm font-mono text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>

                {/* Partita IVA */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Partita IVA (se applicabile)
                  </label>
                  <input
                    type="text"
                    placeholder="Es. 01234567890"
                    value={formData.piva || ''}
                    onChange={(e) => setFormData({ ...formData, piva: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm font-mono text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>

                {/* Indirizzo */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Indirizzo di Residenza / Sede Legale
                  </label>
                  <input
                    type="text"
                    placeholder="Via, Piazza, Numero Civico"
                    value={formData.indirizzo || ''}
                    onChange={(e) => setFormData({ ...formData, indirizzo: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>

                {/* CAP, Città, Prov */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    CAP e Città
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="CAP"
                      value={formData.cap || ''}
                      onChange={(e) => setFormData({ ...formData, cap: e.target.value })}
                      className="w-24 px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900"
                    />
                    <input
                      type="text"
                      placeholder="Comune"
                      value={formData.citta || ''}
                      onChange={(e) => setFormData({ ...formData, citta: e.target.value })}
                      className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Provincia (sigla)
                  </label>
                  <input
                    type="text"
                    maxLength={2}
                    placeholder="Es. MI, RM, TO"
                    value={formData.provincia || ''}
                    onChange={(e) => setFormData({ ...formData, provincia: e.target.value.toUpperCase() })}
                    className="w-24 px-3.5 py-2 border border-slate-300 rounded-lg text-sm text-slate-900"
                  />
                </div>

                {/* Telefono & Email */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Telefono / Cellulare
                  </label>
                  <input
                    type="text"
                    placeholder="+39 02 ..."
                    value={formData.telefono || ''}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Email Ordinaria
                  </label>
                  <input
                    type="email"
                    placeholder="cliente@email.it"
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm text-slate-900"
                  />
                </div>

                {/* PEC & SDI */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Indirizzo PEC
                  </label>
                  <input
                    type="email"
                    placeholder="cliente@pec.it"
                    value={formData.pec || ''}
                    onChange={(e) => setFormData({ ...formData, pec: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Codice SDI (Fatt. Elettronica)
                  </label>
                  <input
                    type="text"
                    maxLength={7}
                    placeholder="0000000 o 7 caratteri"
                    value={formData.codiceSdi || '0000000'}
                    onChange={(e) => setFormData({ ...formData, codiceSdi: e.target.value.toUpperCase() })}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm font-mono text-slate-900"
                  />
                </div>

                {/* Note */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Note Interne / Agevolazioni
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Note su cantieri passati, detrazioni fiscali richieste, orari di reperibilità..."
                    value={formData.note || ''}
                    onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm text-slate-900"
                  />
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-semibold shadow-xs transition-colors"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Salva Cliente</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
