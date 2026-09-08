import { Documento, RigaComputo } from '../types';

/**
 * Calcola la quantità risultante per una riga di computo metrico
 */
export function calcolaQuantitaRiga(riga: Partial<RigaComputo>): number {
  if (!riga.usaFormulaMetrica) {
    return Number(riga.quantita) || 0;
  }

  const p = riga.partiUguali !== undefined && riga.partiUguali !== null && riga.partiUguali > 0 ? riga.partiUguali : 1;
  const l = riga.lunghezza !== undefined && riga.lunghezza !== null && riga.lunghezza > 0 ? riga.lunghezza : 1;
  const w = riga.larghezza !== undefined && riga.larghezza !== null && riga.larghezza > 0 ? riga.larghezza : 1;
  const h = riga.altezza !== undefined && riga.altezza !== null && riga.altezza > 0 ? riga.altezza : 1;

  // Se tutti i parametri dimensionali sono vuoti o pari a 1 senza valori, default a quantita
  if (!riga.lunghezza && !riga.larghezza && !riga.altezza) {
    return Number(riga.quantita) || 1;
  }

  const result = p * l * w * h;
  return Math.round(result * 100) / 100;
}

/**
 * Calcola il subtotale di una singola riga
 */
export function calcolaSubtotaleRiga(quantita: number, prezzoUnitario: number, scontoPerc: number = 0): number {
  const netto = quantita * prezzoUnitario;
  const scontato = netto * (1 - (scontoPerc || 0) / 100);
  return Math.round(scontato * 100) / 100;
}

export interface TotaliEconomici {
  imponibileLavoriLordo: number;
  scontoGeneraleValore: number;
  imponibileLavoriNetto: number;
  totaleManodopera: number;
  oneriSicurezza: number;
  cassaPrevidenziale: number;
  totaleImponibileFiscale: number;
  ivaValore: number;
  ritenutaAccontoValore: number;
  totaleComplessivo: number;
  totaleNettoDaPagare: number;
}

/**
 * Calcola l'intero quadro economico del preventivo / computo metrico
 */
export function calcolaTotaliDocumento(doc: Documento): TotaliEconomici {
  let imponibileLavoriLordo = 0;
  let totaleManodopera = 0;

  for (const r of doc.righe) {
    const subtotale = Number(r.subtotale) || 0;
    imponibileLavoriLordo += subtotale;

    const percMano = Number(r.quotaManodoperaPerc) || 0;
    totaleManodopera += (subtotale * percMano) / 100;
  }

  // Sconto generale sul valore dei lavori
  const scontoPerc = Math.max(0, Math.min(100, Number(doc.scontoGeneralePerc) || 0));
  const scontoGeneraleValore = (imponibileLavoriLordo * scontoPerc) / 100;
  const imponibileLavoriNetto = imponibileLavoriLordo - scontoGeneraleValore;

  // Oneri di sicurezza (non soggetti a ribasso contrattuale)
  let oneriSicurezza = 0;
  if (doc.oneriSicurezzaTipo === 'percentuale') {
    oneriSicurezza = (imponibileLavoriNetto * (Number(doc.oneriSicurezzaValore) || 0)) / 100;
  } else {
    oneriSicurezza = Number(doc.oneriSicurezzaValore) || 0;
  }

  // Base per cassa previdenziale (se attiva)
  let cassaPrevidenziale = 0;
  if (doc.cassaPrevidenzialeAttiva) {
    const tipo = doc.cassaPrevidenzialeTipo || 'percentuale';
    const valore = Number(
      doc.cassaPrevidenzialeValore !== undefined
        ? doc.cassaPrevidenzialeValore
        : doc.cassaPrevidenzialePerc
    ) || 0;

    if (tipo === 'fisso') {
      cassaPrevidenziale = valore;
    } else {
      cassaPrevidenziale = ((imponibileLavoriNetto + oneriSicurezza) * valore) / 100;
    }
  }

  // Totale imponibile IVA
  const totaleImponibileFiscale = imponibileLavoriNetto + oneriSicurezza + cassaPrevidenziale;

  // IVA
  const ivaPerc = Number(doc.ivaPerc) || 0;
  const ivaValore = (totaleImponibileFiscale * ivaPerc) / 100;

  // Ritenuta d'acconto (se applicata, calcolata di norma sull'imponibile professionale/prestazioni)
  let ritenutaAccontoValore = 0;
  if (doc.ritenutaAccontoAttiva) {
    const ritPerc = Number(doc.ritenutaAccontoPerc) || 0;
    ritenutaAccontoValore = (imponibileLavoriNetto * ritPerc) / 100;
  }

  const totaleComplessivo = totaleImponibileFiscale + ivaValore;
  const totaleNettoDaPagare = totaleComplessivo - ritenutaAccontoValore;

  return {
    imponibileLavoriLordo: round2(imponibileLavoriLordo),
    scontoGeneraleValore: round2(scontoGeneraleValore),
    imponibileLavoriNetto: round2(imponibileLavoriNetto),
    totaleManodopera: round2(totaleManodopera),
    oneriSicurezza: round2(oneriSicurezza),
    cassaPrevidenziale: round2(cassaPrevidenziale),
    totaleImponibileFiscale: round2(totaleImponibileFiscale),
    ivaValore: round2(ivaValore),
    ritenutaAccontoValore: round2(ritenutaAccontoValore),
    totaleComplessivo: round2(totaleComplessivo),
    totaleNettoDaPagare: round2(totaleNettoDaPagare)
  };
}

function round2(val: number): number {
  return Math.round((val + Number.EPSILON) * 100) / 100;
}

/**
 * Formatta valuta in Euro stile italiano (€ 1.250,00)
 */
export function formatEuro(valore: number | undefined | null): string {
  if (valore === undefined || valore === null || isNaN(valore)) return '€ 0,00';
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(valore);
}

/**
 * Formatta numero decimale italiano
 */
export function formatNumero(valore: number | undefined | null, decimali: number = 2): string {
  if (valore === undefined || valore === null || isNaN(valore)) return '0';
  return new Intl.NumberFormat('it-IT', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimali
  }).format(valore);
}

/**
 * Formatta data italiana (es. 15/04/2026)
 */
export function formatDataItaliana(dataIso: string | undefined | null): string {
  if (!dataIso) return '-';
  try {
    const d = new Date(dataIso);
    if (isNaN(d.getTime())) return dataIso;
    return d.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch {
    return dataIso;
  }
}

/**
 * Generatore di codice progressivo
 */
export function generaNumeroDocumento(tipo: string, anno: number, conteggio: number): string {
  const prefisso = tipo === 'computo_metrico' ? 'CME' : tipo === 'fattura_proforma' ? 'PROF' : 'PREV';
  const progressivo = String(conteggio + 1).padStart(3, '0');
  return `${prefisso}-${anno}-${progressivo}`;
}
