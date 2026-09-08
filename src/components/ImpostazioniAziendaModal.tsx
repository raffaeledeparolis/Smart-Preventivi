import React, { useState, useRef, useEffect } from 'react';
import {
  Building2,
  Save,
  X,
  CreditCard,
  Phone,
  Mail,
  CheckCircle2,
  Upload,
  Image as ImageIcon,
  Trash2,
  Link as LinkIcon,
  AlertCircle
} from 'lucide-react';
import { ImpostazioniAzienda } from '../types';

interface ImpostazioniAziendaModalProps {
  isOpen: boolean;
  azienda: ImpostazioniAzienda;
  onSave: (azienda: ImpostazioniAzienda) => void;
  onClose: () => void;
}

export const ImpostazioniAziendaModal: React.FC<ImpostazioniAziendaModalProps> = ({
  isOpen,
  azienda: initialAzienda,
  onSave,
  onClose
}) => {
  const [formData, setFormData] = useState<ImpostazioniAzienda>(initialAzienda);
  const [isDragging, setIsDragging] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [customUrl, setCustomUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setFormData(initialAzienda);
      setLogoError(null);
      setShowUrlInput(false);
      setCustomUrl('');
    }
  }, [isOpen, initialAzienda]);

  if (!isOpen) return null;

  const processFile = (file: File) => {
    setLogoError(null);

    if (!file.type.startsWith('image/')) {
      setLogoError('Seleziona un file immagine valido (PNG, JPG, SVG, WebP).');
      return;
    }

    if (file.size > 4 * 1024 * 1024) {
      setLogoError('La dimensione del file supera i 4MB. Scegli un\'immagine più leggera.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setFormData((prev) => ({ ...prev, logoUrl: dataUrl }));
      }
    };
    reader.onerror = () => {
      setLogoError('Impossibile leggere il file immagine. Riprova con un altro formato.');
    };
    reader.readAsDataURL(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleRemoveLogo = () => {
    setFormData((prev) => ({ ...prev, logoUrl: undefined }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setLogoError(null);
  };

  const handleApplyUrl = () => {
    if (!customUrl.trim()) return;
    setFormData((prev) => ({ ...prev, logoUrl: customUrl.trim() }));
    setShowUrlInput(false);
    setCustomUrl('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const nome = formData.ragioneSociale || formData.nomeImpresa || '';
    if (!nome.trim()) {
      alert('La ragione sociale o nome dell\'impresa è obbligatoria.');
      return;
    }
    const updated: ImpostazioniAzienda = {
      ...formData,
      ragioneSociale: nome.trim(),
      nomeImpresa: nome.trim(),
      partitaIva: formData.partitaIva || formData.piva || '',
      piva: formData.partitaIva || formData.piva || '',
      iscrizioneRea: formData.iscrizioneRea || formData.numeroREA || '',
      numeroREA: formData.iscrizioneRea || formData.numeroREA || ''
    };
    onSave(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Dati Impresa & Logo Aziendale
              </h3>
              <p className="text-xs text-slate-500">
                Questi dati e il logo compaiono nell'intestazione dei preventivi, computi e stampe PDF
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Sezione Logo Aziendale */}
          <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-amber-600" />
                Logo dell'Azienda
              </label>
              {formData.logoUrl && (
                <button
                  type="button"
                  onClick={handleRemoveLogo}
                  className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 hover:underline flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Rimuovi logo</span>
                </button>
              )}
            </div>

            {formData.logoUrl ? (
              <div className="bg-white border border-slate-200 rounded-lg p-3 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xs">
                <div className="flex items-center gap-3">
                  <div className="w-24 h-16 bg-slate-50 border border-slate-200 rounded-md p-1.5 flex items-center justify-center overflow-hidden">
                    <img
                      src={formData.logoUrl}
                      alt="Anteprima Logo Azienda"
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Logo caricato con successo</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Verrà inserito nella testata di tutti i preventivi e computi A4
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Cambia</span>
                  </button>
                </div>
              </div>
            ) : (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-amber-500 bg-amber-50/60 scale-[1.01]'
                    : 'border-slate-300 hover:border-amber-500 bg-white hover:bg-amber-50/20'
                }`}
              >
                <div className="w-10 h-10 mx-auto rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mb-2">
                  <Upload className="w-5 h-5" />
                </div>
                <p className="text-xs font-bold text-slate-800">
                  Clicca per selezionare il logo o trascina l'immagine qui
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Formati consigliati: PNG, SVG, JPG o WebP su sfondo trasparente o bianco (Max 4MB)
                </p>
              </div>
            )}

            {/* Input file nascosto */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              onChange={handleFileInputChange}
              className="hidden"
            />

            {/* Errore logo */}
            {logoError && (
              <div className="flex items-center gap-1.5 text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-lg p-2 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{logoError}</span>
              </div>
            )}

            {/* Inserimento URL opzionale */}
            {!formData.logoUrl && (
              <div>
                {!showUrlInput ? (
                  <button
                    type="button"
                    onClick={() => setShowUrlInput(true)}
                    className="text-[11px] font-semibold text-amber-700 hover:text-amber-800 hover:underline flex items-center gap-1"
                  >
                    <LinkIcon className="w-3 h-3" />
                    <span>Oppure incolla l'URL di un logo online</span>
                  </button>
                ) : (
                  <div className="flex gap-2 items-center pt-1">
                    <input
                      type="url"
                      placeholder="https://tuosito.it/logo.png"
                      value={customUrl}
                      onChange={(e) => setCustomUrl(e.target.value)}
                      className="flex-1 px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-900"
                    />
                    <button
                      type="button"
                      onClick={handleApplyUrl}
                      className="px-3 py-1.5 bg-amber-600 text-white rounded-lg text-xs font-semibold hover:bg-amber-700"
                    >
                      Applica
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowUrlInput(false)}
                      className="px-2 py-1.5 text-slate-500 text-xs hover:text-slate-700"
                    >
                      Annulla
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Ragione Sociale Impresa / Studio Tecnico *
            </label>
            <input
              type="text"
              required
              value={formData.ragioneSociale || formData.nomeImpresa || ''}
              onChange={(e) =>
                setFormData({ ...formData, ragioneSociale: e.target.value, nomeImpresa: e.target.value })
              }
              className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm font-bold text-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Sottotitolo o Specializzazione (Opzionale)
            </label>
            <input
              type="text"
              placeholder="Es. Opere Edili, Ristrutturazioni Civili e Impiantistica"
              value={formData.sottotitolo || ''}
              onChange={(e) => setFormData({ ...formData, sottotitolo: e.target.value })}
              className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm text-slate-900"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Partita IVA *
              </label>
              <input
                type="text"
                required
                value={formData.partitaIva || formData.piva || ''}
                onChange={(e) =>
                  setFormData({ ...formData, partitaIva: e.target.value, piva: e.target.value })
                }
                className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm font-mono text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Codice Fiscale
              </label>
              <input
                type="text"
                value={formData.codiceFiscale}
                onChange={(e) => setFormData({ ...formData, codiceFiscale: e.target.value.toUpperCase() })}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm font-mono text-slate-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Sede Legale / Indirizzo
              </label>
              <input
                type="text"
                value={formData.indirizzo}
                onChange={(e) => setFormData({ ...formData, indirizzo: e.target.value })}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Numero R.E.A. / Albo
              </label>
              <input
                type="text"
                placeholder="Es. MI-198273"
                value={formData.numeroREA || ''}
                onChange={(e) => setFormData({ ...formData, numeroREA: e.target.value })}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm text-slate-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                CAP
              </label>
              <input
                type="text"
                value={formData.cap}
                onChange={(e) => setFormData({ ...formData, cap: e.target.value })}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Comune
              </label>
              <input
                type="text"
                value={formData.citta}
                onChange={(e) => setFormData({ ...formData, citta: e.target.value })}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Provincia
              </label>
              <input
                type="text"
                maxLength={2}
                value={formData.provincia}
                onChange={(e) => setFormData({ ...formData, provincia: e.target.value.toUpperCase() })}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm text-slate-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Telefono
              </label>
              <input
                type="text"
                value={formData.telefono}
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
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                PEC (Posta Certificata)
              </label>
              <input
                type="email"
                value={formData.pec}
                onChange={(e) => setFormData({ ...formData, pec: e.target.value })}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm text-slate-900"
              />
            </div>
          </div>

          {/* Dati Bancari */}
          <div className="bg-amber-50/60 p-4 rounded-xl border border-amber-200/80 space-y-3">
            <span className="text-xs font-bold text-amber-950 uppercase tracking-wider flex items-center gap-1.5">
              <CreditCard className="w-4 h-4 text-amber-700" />
              Coordinate Bancarie per Bonifico (Detrazioni Fiscali)
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Nome Istituto Bancario
                </label>
                <input
                  type="text"
                  placeholder="Es. Intesa Sanpaolo / UniCredit"
                  value={formData.banca}
                  onChange={(e) => setFormData({ ...formData, banca: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Intestatario Conto
                </label>
                <input
                  type="text"
                  placeholder="Es. Edil Costruzioni S.r.l."
                  value={formData.intestatarioConto}
                  onChange={(e) => setFormData({ ...formData, intestatarioConto: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Codice IBAN
              </label>
              <input
                type="text"
                placeholder="IT00X0000000000000000000000"
                value={formData.iban}
                onChange={(e) => setFormData({ ...formData, iban: e.target.value.toUpperCase().replace(/\s/g, '') })}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-mono font-bold bg-white text-slate-900 tracking-wider"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Annulla
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shadow-xs"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Salva Impostazioni</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
