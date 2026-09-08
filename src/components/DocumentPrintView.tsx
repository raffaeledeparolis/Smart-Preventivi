import React, { useState, useRef } from 'react';
import {
  Printer,
  ArrowLeft,
  Download,
  Building2,
  Calendar,
  CheckCircle2,
  Eye,
  EyeOff,
  Phone,
  Mail,
  CreditCard,
  Layers,
  FileCheck,
  Loader2,
  ExternalLink
} from 'lucide-react';
import { Documento, ImpostazioniAzienda } from '../types';
import {
  calcolaTotaliDocumento,
  formatEuro,
  formatNumero,
  formatDataItaliana
} from '../utils/calculations';
import {
  downloadPdfFromElement,
  openPrintableDocumentInNewTab
} from '../utils/pdfGenerator';

interface DocumentPrintViewProps {
  documento: Documento;
  azienda: ImpostazioniAzienda;
  onBack: () => void;
}

export const DocumentPrintView: React.FC<DocumentPrintViewProps> = ({
  documento: doc,
  azienda,
  onBack
}) => {
  const [mostraFormuleMetriche, setMostraFormuleMetriche] = useState(
    doc.tipo === 'computo_metrico'
  );
  const [mostraPrezziUnitari, setMostraPrezziUnitari] = useState(true);
  const [mostraManodopera, setMostraManodopera] = useState(true);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const printSheetRef = useRef<HTMLDivElement>(null);
  const totali = calcolaTotaliDocumento(doc);

  const handlePrint = async () => {
    if (!printSheetRef.current || isGeneratingPdf) return;
    setIsGeneratingPdf(true);
    setFeedbackMessage(null);

    const docFileName = `${doc.tipo || 'documento'}_${(doc.numero || '01').replace(/[/\\?%*:|"<>]/g, '-')}`;

    try {
      // 1. Tenta la stampa nativa del browser (funziona se l'utente è su scheda autonoma o browser abilitato)
      try {
        window.print();
      } catch (printErr) {
        console.warn('window.print() non supportato o bloccato nel frame:', printErr);
      }

      // 2. Genera e scarica direttamente il file PDF A4 ad alta risoluzione
      // Questo garantisce che l'utente ottenga sempre il file PDF salvato sul proprio dispositivo
      const downloaded = await downloadPdfFromElement(printSheetRef.current, docFileName);

      if (downloaded) {
        setFeedbackMessage('File PDF generato e scaricato sul tuo computer con successo!');
        setTimeout(() => setFeedbackMessage(null), 5000);
      } else {
        // Se la cattura grafica locale non riesce, apri la vista pulita in nuova scheda per la stampa nativa
        openPrintableDocumentInNewTab(printSheetRef.current, `${doc.titolo || 'Documento'} N. ${doc.numero}`);
      }
    } catch (err) {
      console.error('Errore durante la procedura di stampa/PDF:', err);
      if (printSheetRef.current) {
        openPrintableDocumentInNewTab(printSheetRef.current, `${doc.titolo || 'Documento'} N. ${doc.numero}`);
      }
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleOpenInNewTab = () => {
    if (printSheetRef.current) {
      openPrintableDocumentInNewTab(printSheetRef.current, `${doc.titolo || 'Documento'} N. ${doc.numero}`);
    }
  };

  const getTitoloTipo = () => {
    switch (doc.tipo) {
      case 'computo_metrico':
        return mostraPrezziUnitari
          ? 'COMPUTO METRICO ESTIMATIVO'
          : 'COMPUTO METRICO DELLE OPERE';
      case 'fattura_proforma':
        return 'FATTURA PROFORMA';
      default:
        return 'PREVENTIVO DI SPESA';
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Top Controls Bar (Hidden in Print) */}
      <div className="no-print bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-4 sticky top-16 z-30">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Indietro</span>
          </button>

          <div>
            <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">
              {doc.numero}
            </span>
            <span className="text-xs text-slate-500 ml-2">Anteprima di Stampa A4</span>
          </div>
        </div>

        {/* View toggles for printing customization */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <label className="flex items-center gap-1.5 text-slate-700 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={mostraFormuleMetriche}
              onChange={(e) => setMostraFormuleMetriche(e.target.checked)}
              className="rounded-sm border-slate-300 text-amber-600"
            />
            <span>Misure Metriche (L × P × H)</span>
          </label>

          <label className="flex items-center gap-1.5 text-slate-700 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={mostraPrezziUnitari}
              onChange={(e) => setMostraPrezziUnitari(e.target.checked)}
              className="rounded-sm border-slate-300 text-amber-600"
            />
            <span>Mostra Prezzi & Totali</span>
          </label>

          <label className="flex items-center gap-1.5 text-slate-700 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={mostraManodopera}
              onChange={(e) => setMostraManodopera(e.target.checked)}
              className="rounded-sm border-slate-300 text-amber-600"
            />
            <span>Quota Manodopera Detrazioni</span>
          </label>

          <button
            id="btn-trigger-print"
            onClick={handlePrint}
            disabled={isGeneratingPdf}
            className={`inline-flex items-center gap-2 ${
              isGeneratingPdf ? 'bg-amber-600 cursor-wait' : 'bg-slate-900 hover:bg-slate-800'
            } text-white font-bold px-4 py-2 rounded-lg text-xs shadow-xs transition-all`}
            title="Genera e scarica il file PDF A4 o avvia la stampa del documento"
          >
            {isGeneratingPdf ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-amber-200" />
                <span>Generazione PDF in corso...</span>
              </>
            ) : (
              <>
                <Printer className="w-4 h-4" />
                <span>Stampa o Salva in PDF</span>
              </>
            )}
          </button>

          <button
            id="btn-open-print-tab"
            onClick={handleOpenInNewTab}
            className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold px-3 py-2 rounded-lg text-xs transition-colors"
            title="Apri in una nuova scheda autonoma per stampare direttamente dal dialogo di sistema del browser"
          >
            <ExternalLink className="w-3.5 h-3.5 text-slate-600" />
            <span>Nuova Scheda</span>
          </button>
        </div>
      </div>

      {/* Feedback Banner se il PDF è stato scaricato */}
      {feedbackMessage && (
        <div className="no-print bg-emerald-50 border border-emerald-200 text-emerald-900 px-4 py-3 rounded-xl text-xs flex flex-wrap items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-medium">{feedbackMessage}</span>
          </div>
          <button
            onClick={handleOpenInNewTab}
            className="text-emerald-800 underline font-bold hover:text-emerald-950 text-xs flex items-center gap-1"
          >
            <span>Apri anteprima di stampa a tutto schermo</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* A4 Printable Sheet Container */}
      <div
        ref={printSheetRef}
        id="printable-document-sheet"
        className="print-page bg-white max-w-[210mm] mx-auto p-8 sm:p-12 border border-slate-200 shadow-md rounded-xl space-y-6 text-slate-900 leading-normal print:m-0 print:p-0 print:border-none print:shadow-none print:max-w-none"
      >
        {/* 1. Header Azienda & Committente */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-b-2 border-slate-900 pb-6">
          {/* Azienda Info */}
          <div className="space-y-1 text-xs text-slate-600 max-w-sm">
            {azienda.logoUrl && (
              <div className="mb-2 max-h-16 flex items-center">
                <img
                  src={azienda.logoUrl}
                  alt={`Logo ${azienda.ragioneSociale || azienda.nomeImpresa || 'Impresa'}`}
                  className="max-h-14 max-w-[220px] object-contain rounded-xs"
                />
              </div>
            )}

            <div className="flex items-center gap-2 mb-1">
              {!azienda.logoUrl && (
                <div className="w-8 h-8 rounded-lg bg-amber-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                  {((azienda.ragioneSociale || azienda.nomeImpresa || 'PS').trim().slice(0, 2)).toUpperCase()}
                </div>
              )}
              <div>
                <h2 className="text-lg font-extrabold text-slate-900 tracking-tight leading-tight">
                  {azienda.ragioneSociale || azienda.nomeImpresa}
                </h2>
                {azienda.sottotitolo && (
                  <p className="text-[11px] text-slate-500 font-medium leading-tight">
                    {azienda.sottotitolo}
                  </p>
                )}
              </div>
            </div>

            <p className="text-xs font-medium text-slate-700">{azienda.indirizzo}</p>
            <p className="text-xs font-medium text-slate-700">
              {azienda.cap} {azienda.citta} ({azienda.provincia})
            </p>
            <p className="font-mono text-slate-700">
              P.IVA: <strong>{azienda.partitaIva || azienda.piva}</strong> | C.F.: <strong>{azienda.codiceFiscale}</strong>
            </p>
            {(azienda.iscrizioneRea || azienda.numeroREA) && (
              <p className="text-slate-500">R.E.A.: {azienda.iscrizioneRea || azienda.numeroREA}</p>
            )}

            <div className="pt-1 flex flex-wrap gap-x-3 text-slate-500 text-[11px]">
              {azienda.telefono && <span>Tel: {azienda.telefono}</span>}
              {azienda.email && <span>Email: {azienda.email}</span>}
              {azienda.pec && <span>PEC: {azienda.pec}</span>}
            </div>
          </div>

          {/* Committente Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-700 w-full sm:w-72 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Spettabile Committente
            </span>
            <p className="text-sm font-bold text-slate-900">
              {doc.clienteSnapshot?.ragioneSociale || 'Committente Privato'}
            </p>
            {doc.clienteSnapshot?.referente && (
              <p className="text-slate-600">All'attenzione di: {doc.clienteSnapshot.referente}</p>
            )}
            <p>{doc.clienteSnapshot?.indirizzo}</p>
            <p>
              {doc.clienteSnapshot?.cap} {doc.clienteSnapshot?.citta} ({doc.clienteSnapshot?.provincia})
            </p>
            {doc.clienteSnapshot?.codiceFiscale && (
              <p className="font-mono pt-1 text-[11px]">
                C.F.: <strong>{doc.clienteSnapshot.codiceFiscale}</strong>
              </p>
            )}
            {doc.clienteSnapshot?.piva && (
              <p className="font-mono text-[11px]">
                P.IVA: <strong>{doc.clienteSnapshot.piva}</strong>
              </p>
            )}
          </div>
        </div>

        {/* 2. Titolo Documento & Metadati */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-xs font-mono font-bold tracking-wider text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                {getTitoloTipo()} N. {doc.numero}
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1.5">
                {doc.titolo}
              </h1>
            </div>

            <div className="text-left sm:text-right text-xs text-slate-500 space-y-0.5">
              <div>
                Data di emissione: <strong className="text-slate-900">{formatDataItaliana(doc.data)}</strong>
              </div>
              <div>
                Validità offerta: <strong className="text-slate-900">{doc.validitaGiorni} giorni</strong> (scadenza:{' '}
                {formatDataItaliana(doc.dataScadenza)})
              </div>
            </div>
          </div>

          {/* Dati Cantiere */}
          {doc.cantiere && (doc.cantiere.indirizzo || doc.cantiere.citta) && (
            <div className="bg-slate-50/80 p-2.5 rounded-lg border border-slate-200 text-xs text-slate-600 flex flex-wrap items-center gap-x-4 gap-y-1">
              <span className="font-semibold text-slate-800">Luogo di esecuzione (Cantiere):</span>
              <span>
                {doc.cantiere.indirizzo} - {doc.cantiere.cap} {doc.cantiere.citta} ({doc.cantiere.provincia})
              </span>
              {doc.cantiere.responsabile && (
                <span className="text-slate-500">D.L.: {doc.cantiere.responsabile}</span>
              )}
            </div>
          )}
        </div>

        {/* 3. Tabelle delle Lavorazioni divise per Capitoli */}
        <div className="space-y-6">
          {(doc.capitoli || []).map((cap, cIdx) => {
            const capRighe = (doc.righe || []).filter((r) => r.capitoloId === cap.id);
            if (capRighe.length === 0) return null;

            const capSubtotale = capRighe.reduce((acc, r) => acc + (Number(r.subtotale) || 0), 0);

            return (
              <div key={cap.id} className="space-y-2 break-inside-avoid">
                {/* Capitolo Title Bar */}
                <div className="bg-slate-900 text-white px-3 py-1.5 rounded-md flex justify-between items-center text-xs font-bold uppercase tracking-wider">
                  <span>{cap.titolo}</span>
                  {mostraPrezziUnitari && (
                    <span className="font-mono">{formatEuro(capSubtotale)}</span>
                  )}
                </div>

                {/* Voci Table */}
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-300 text-[10px] uppercase font-bold text-slate-500 bg-slate-50/50">
                      <th className="py-1.5 px-2 w-16">Codice</th>
                      <th className="py-1.5 px-2">Descrizione delle Opere e Forniture</th>
                      {mostraFormuleMetriche && (
                        <th className="py-1.5 px-2 text-center w-28">Misure (L×P×H)</th>
                      )}
                      <th className="py-1.5 px-2 text-center w-12">U.M.</th>
                      <th className="py-1.5 px-2 text-right w-16">Quantità</th>
                      {mostraPrezziUnitari && (
                        <>
                          <th className="py-1.5 px-2 text-right w-20">Prezzo Unit.</th>
                          <th className="py-1.5 px-2 text-right w-24">Importo Tot.</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {capRighe.map((r, rIdx) => (
                      <tr key={r.id} className="hover:bg-slate-50/40">
                        <td className="py-2 px-2 font-mono text-[11px] font-bold text-slate-700 align-top">
                          {r.codiceVoce || `0${cIdx + 1}.${rIdx + 1}`}
                        </td>
                        <td className="py-2 px-2 text-slate-900 leading-snug align-top">
                          <div className="font-medium">{r.descrizione}</div>
                          {mostraManodopera && r.quotaManodoperaPerc ? (
                            <span className="text-[10px] text-slate-400 block mt-0.5">
                              Quota incidenza manodopera: {r.quotaManodoperaPerc}%
                            </span>
                          ) : null}
                        </td>
                        {mostraFormuleMetriche && (
                          <td className="py-2 px-2 text-center font-mono text-[11px] text-slate-600 align-top whitespace-nowrap">
                            {r.usaFormulaMetrica ? (
                              <span>
                                {r.partiUguali && r.partiUguali > 1 ? `${r.partiUguali}×` : ''}
                                {formatNumero(r.lunghezza || 1)}×{formatNumero(r.larghezza || 1)}
                                {r.altezza && r.altezza !== 1 ? `×${formatNumero(r.altezza)}` : ''}
                              </span>
                            ) : (
                              <span className="text-slate-300">-</span>
                            )}
                          </td>
                        )}
                        <td className="py-2 px-2 text-center font-semibold text-slate-600 align-top">
                          {r.unitaMisura}
                        </td>
                        <td className="py-2 px-2 text-right font-mono font-bold text-slate-900 align-top">
                          {formatNumero(r.quantita)}
                        </td>
                        {mostraPrezziUnitari && (
                          <>
                            <td className="py-2 px-2 text-right font-mono text-slate-700 align-top">
                              {formatEuro(r.prezzoUnitario)}
                              {r.scontoPerc ? (
                                <span className="text-[10px] text-rose-600 block">-{r.scontoPerc}%</span>
                              ) : null}
                            </td>
                            <td className="py-2 px-2 text-right font-mono font-bold text-slate-900 align-top">
                              {formatEuro(r.subtotale)}
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>

        {/* 4. Quadro Economico e Tabella Fiscale (Solo se mostra prezzi) */}
        {mostraPrezziUnitari && (
          <div className="pt-4 border-t-2 border-slate-900 break-inside-avoid space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-6">
              {/* Note e Dettagli Finanziari */}
              <div className="flex-1 space-y-2 text-xs text-slate-600">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
                  <span className="font-bold text-slate-800 block text-[11px] uppercase tracking-wider">
                    Sintesi di Legge & Detrazioni
                  </span>
                  {mostraManodopera && (
                    <p>
                      Costo totale della manodopera stimato: <strong>{formatEuro(totali.totaleManodopera)}</strong> (ai
                      sensi dell'art. 26 D.Lgs. 81/2008 e per le agevolazioni fiscali).
                    </p>
                  )}
                  <p>
                    Oneri per la sicurezza aziendali inclusi e non ribassabili: <strong>{formatEuro(totali.oneriSicurezza)}</strong>.
                  </p>
                </div>

                {/* Dati Bancari per Bonifico Agevolato */}
                {azienda.iban && (
                  <div className="bg-amber-50/50 p-3 rounded-lg border border-amber-200 text-xs text-amber-950 space-y-1">
                    <span className="font-bold uppercase tracking-wider text-[10px] text-amber-800 flex items-center gap-1">
                      <CreditCard className="w-3.5 h-3.5" />
                      Coordinate per Bonifico Bancario / Detrazione Fiscale
                    </span>
                    <p className="font-mono text-xs font-bold text-slate-900">{azienda.iban}</p>
                    <p className="text-[11px] text-slate-600">
                      Banca: {azienda.banca} {azienda.intestatarioConto && `| Intestato a: ${azienda.intestatarioConto}`}
                    </p>
                  </div>
                )}
              </div>

              {/* Economic Summary Box */}
              <div className="w-full sm:w-80 bg-slate-50 border border-slate-300 rounded-xl p-4 text-xs space-y-2">
                <div className="flex justify-between items-center text-slate-600">
                  <span>Totale Lavori (Lordo):</span>
                  <span className="font-mono font-medium">{formatEuro(totali.imponibileLavoriLordo)}</span>
                </div>

                {totali.scontoGeneraleValore > 0 && (
                  <div className="flex justify-between items-center text-rose-600">
                    <span>Sconto Generale ({doc.scontoGeneralePerc}%):</span>
                    <span className="font-mono">-{formatEuro(totali.scontoGeneraleValore)}</span>
                  </div>
                )}

                <div className="flex justify-between items-center text-slate-700 font-semibold pt-1 border-t border-slate-200">
                  <span>Lavori al Netto dello Sconto:</span>
                  <span className="font-mono text-slate-900">{formatEuro(totali.imponibileLavoriNetto)}</span>
                </div>

                <div className="flex justify-between items-center text-slate-600">
                  <span>Oneri di Sicurezza:</span>
                  <span className="font-mono">{formatEuro(totali.oneriSicurezza)}</span>
                </div>

                {doc.cassaPrevidenzialeAttiva && (
                  <div className="flex justify-between items-center text-slate-600">
                    <span>
                      {doc.cassaPrevidenzialeNome || 'Cassa Previdenziale'}
                      {doc.cassaPrevidenzialeTipo === 'fisso'
                        ? ' (importo fisso)'
                        : ` (${doc.cassaPrevidenzialeValore !== undefined ? doc.cassaPrevidenzialeValore : doc.cassaPrevidenzialePerc}%):`}
                    </span>
                    <span className="font-mono">{formatEuro(totali.cassaPrevidenziale)}</span>
                  </div>
                )}

                <div className="flex justify-between items-center font-bold text-slate-900 pt-1 border-t border-slate-200">
                  <span>Totale Imponibile:</span>
                  <span className="font-mono text-sm">{formatEuro(totali.totaleImponibileFiscale)}</span>
                </div>

                <div className="flex justify-between items-center text-slate-600">
                  <span>
                    IVA {doc.ivaPerc}%
                    {doc.ivaPerc === 0 && doc.ivaEsenzioneTesto ? ` (${doc.ivaEsenzioneTesto})` : ''}:
                  </span>
                  <span className="font-mono font-semibold">{formatEuro(totali.ivaValore)}</span>
                </div>

                <div className="flex justify-between items-baseline pt-2 border-t-2 border-slate-900 font-extrabold text-sm text-slate-900">
                  <span className="uppercase tracking-wider">Totale Documento:</span>
                  <span className="font-mono text-lg text-amber-600">
                    {formatEuro(totali.totaleComplessivo)}
                  </span>
                </div>

                {doc.ritenutaAccontoAttiva && (
                  <div className="flex justify-between items-center pt-1 border-t border-slate-200 text-slate-700 text-xs">
                    <span>Netto da Pagare:</span>
                    <span className="font-mono font-bold text-slate-900">{formatEuro(totali.totaleNettoDaPagare)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 5. Condizioni Contrattuali & Pagamento */}
        <div className="pt-4 border-t border-slate-200 break-inside-avoid text-xs text-slate-700 space-y-2">
          <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
            Condizioni Generali di Fornitura
          </h4>

          {doc.condizioniPagamento && (
            <p>
              <strong>Modalità di Pagamento:</strong> {doc.condizioniPagamento}
            </p>
          )}

          {doc.tempiEsecuzione && (
            <p>
              <strong>Tempi di Inizio ed Esecuzione:</strong> {doc.tempiEsecuzione}
            </p>
          )}

          {doc.esclusioni && (
            <p>
              <strong>Opere Escluse:</strong> {doc.esclusioni}
            </p>
          )}

          {doc.noteFinali && (
            <p className="text-slate-500 italic">
              <strong>Note:</strong> {doc.noteFinali}
            </p>
          )}
        </div>

        {/* 6. Timbro & Firma per Accettazione */}
        <div className="pt-8 border-t border-slate-200 break-inside-avoid grid grid-cols-2 gap-8 text-xs">
          <div className="space-y-12">
            <p className="text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
              Timbro e Firma dell'Impresa / Professionista
            </p>
            <div className="border-b border-slate-400 w-48" />
          </div>

          <div className="space-y-12 text-right">
            <p className="text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
              Firma del Committente per Accettazione
            </p>
            <div className="border-b border-slate-400 w-48 ml-auto" />
          </div>
        </div>
      </div>
    </div>
  );
};
