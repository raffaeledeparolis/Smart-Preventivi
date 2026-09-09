import {
  Documento,
  RigaComputo,
  DettaglioCostiRiga,
  AnalisiCapitoloMargini,
  AnalisiMarginiDocumento
} from '../types';

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

/**
 * Ricava i costi unitari di una riga:
 * - Se definiti esplicitamente dall'utente, usa i valori inseriti.
 * - Altrimenti fornisce una stima iniziale basata sulla quota manodopera e un margine indicativo di cantiere (~30%).
 */
export function getRigaCostiUnitari(riga: Partial<RigaComputo>): {
  costoMaterialiUnitario: number;
  costoManodoperaUnitario: number;
  isStimaAutomatica: boolean;
} {
  const hasExplicitMat = riga.costoMaterialiUnitario !== undefined && riga.costoMaterialiUnitario !== null;
  const hasExplicitMano = riga.costoManodoperaUnitario !== undefined && riga.costoManodoperaUnitario !== null;

  if (hasExplicitMat || hasExplicitMano) {
    return {
      costoMaterialiUnitario: hasExplicitMat ? round2(Number(riga.costoMaterialiUnitario) || 0) : 0,
      costoManodoperaUnitario: hasExplicitMano ? round2(Number(riga.costoManodoperaUnitario) || 0) : 0,
      isStimaAutomatica: false
    };
  }

  // Stima automatica basata sul prezzo di vendita e sulla quota manodopera
  const pUnitario = Number(riga.prezzoUnitario) || 0;
  if (pUnitario > 0) {
    const costoStimatoTotale = pUnitario * 0.70; // 30% margine base tipico edile
    const manoRatio = (riga.quotaManodoperaPerc !== undefined ? Number(riga.quotaManodoperaPerc) : 65) / 100;
    const costoMano = round2(costoStimatoTotale * manoRatio);
    const costoMat = round2(costoStimatoTotale * (1 - manoRatio));
    return {
      costoMaterialiUnitario: costoMat,
      costoManodoperaUnitario: costoMano,
      isStimaAutomatica: true
    };
  }

  return {
    costoMaterialiUnitario: 0,
    costoManodoperaUnitario: 0,
    isStimaAutomatica: false
  };
}

/**
 * Calcola l'analisi di costo, ricavo e margine per una singola riga
 */
export function calcolaAnalisiRiga(riga: RigaComputo): DettaglioCostiRiga {
  const quantita = Number(riga.quantita) || 0;
  const prezzoUnitario = Number(riga.prezzoUnitario) || 0;
  const scontoPerc = Number(riga.scontoPerc) || 0;

  const ricavoNettoUnitario = round2(prezzoUnitario * (1 - scontoPerc / 100));
  const ricavoTotale = round2(Number(riga.subtotale) !== undefined && !isNaN(Number(riga.subtotale))
    ? Number(riga.subtotale)
    : quantita * ricavoNettoUnitario);

  const costi = getRigaCostiUnitari(riga);
  const costoMaterialiTotale = round2(quantita * costi.costoMaterialiUnitario);
  const costoManodoperaTotale = round2(quantita * costi.costoManodoperaUnitario);
  const costoTotale = round2(costoMaterialiTotale + costoManodoperaTotale);
  const costoUnitarioTotale = round2(costi.costoMaterialiUnitario + costi.costoManodoperaUnitario);

  const margineEuro = round2(ricavoTotale - costoTotale);
  const marginePerc = ricavoTotale > 0 ? round2((margineEuro / ricavoTotale) * 100) : 0;
  const ricaricoPerc = costoTotale > 0 ? round2((margineEuro / costoTotale) * 100) : 0;

  const incidenzaMaterialiPerc = costoTotale > 0 ? round2((costoMaterialiTotale / costoTotale) * 100) : 0;
  const incidenzaManodoperaPerc = costoTotale > 0 ? round2((costoManodoperaTotale / costoTotale) * 100) : 0;

  return {
    rigaId: riga.id,
    capitoloId: riga.capitoloId,
    codiceVoce: riga.codiceVoce,
    descrizione: riga.descrizione,
    unitaMisura: riga.unitaMisura,
    quantita,
    prezzoUnitario,
    scontoPerc,
    ricavoNettoUnitario,
    ricavoTotale,
    costoMaterialiUnitario: costi.costoMaterialiUnitario,
    costoManodoperaUnitario: costi.costoManodoperaUnitario,
    costoUnitarioTotale,
    costoMaterialiTotale,
    costoManodoperaTotale,
    costoTotale,
    margineEuro,
    marginePerc,
    ricaricoPerc,
    incidenzaMaterialiPerc,
    incidenzaManodoperaPerc,
    isStimaAutomatica: costi.isStimaAutomatica
  };
}

/**
 * Calcola l'analisi completa di redditività e margini per l'intero documento
 */
export function calcolaAnalisiMarginiDocumento(doc: Documento): AnalisiMarginiDocumento {
  const totaliDoc = calcolaTotaliDocumento(doc);
  const righeDettaglio: DettaglioCostiRiga[] = (doc.righe || []).map(calcolaAnalisiRiga);

  let totaleCostoMateriali = 0;
  let totaleCostoManodopera = 0;
  let vociInPerdita = 0;
  let vociMargineBasso = 0;
  let vociMargineBuono = 0;
  let vociMargineOttimo = 0;

  for (const r of righeDettaglio) {
    totaleCostoMateriali += r.costoMaterialiTotale;
    totaleCostoManodopera += r.costoManodoperaTotale;

    if (r.marginePerc < 0) {
      vociInPerdita++;
    } else if (r.marginePerc < 15) {
      vociMargineBasso++;
    } else if (r.marginePerc < 30) {
      vociMargineBuono++;
    } else {
      vociMargineOttimo++;
    }
  }

  totaleCostoMateriali = round2(totaleCostoMateriali);
  totaleCostoManodopera = round2(totaleCostoManodopera);
  const totaleCosti = round2(totaleCostoMateriali + totaleCostoManodopera);

  // Considera l'imponibile effettivo al netto dello sconto generale
  const ricavoLavoriNetto = totaliDoc.imponibileLavoriNetto;
  const ricavoLavoriLordo = totaliDoc.imponibileLavoriLordo;
  const scontoGeneraleValore = totaliDoc.scontoGeneraleValore;

  const margineComplessivoEuro = round2(ricavoLavoriNetto - totaleCosti);
  const margineComplessivoPerc = ricavoLavoriNetto > 0 ? round2((margineComplessivoEuro / ricavoLavoriNetto) * 100) : 0;
  const ricaricoComplessivoPerc = totaleCosti > 0 ? round2((margineComplessivoEuro / totaleCosti) * 100) : 0;

  const incidenzaMaterialiSuCosti = totaleCosti > 0 ? round2((totaleCostoMateriali / totaleCosti) * 100) : 0;
  const incidenzaManodoperaSuCosti = totaleCosti > 0 ? round2((totaleCostoManodopera / totaleCosti) * 100) : 0;

  // Analisi per capitolo
  const capitoliDettaglio: AnalisiCapitoloMargini[] = (doc.capitoli || []).map((cap) => {
    const righeCap = righeDettaglio.filter((r) => r.capitoloId === cap.id);
    const ricavoCapLordo = righeCap.reduce((sum, r) => sum + r.ricavoTotale, 0);

    // Applica quota proporzionale di sconto generale al capitolo se presente
    const scontoRatio = ricavoLavoriLordo > 0 ? ricavoLavoriNetto / ricavoLavoriLordo : 1;
    const ricavoCapNetto = round2(ricavoCapLordo * scontoRatio);

    const cMat = round2(righeCap.reduce((sum, r) => sum + r.costoMaterialiTotale, 0));
    const cMano = round2(righeCap.reduce((sum, r) => sum + r.costoManodoperaTotale, 0));
    const cTot = round2(cMat + cMano);
    const margCapEuro = round2(ricavoCapNetto - cTot);
    const margCapPerc = ricavoCapNetto > 0 ? round2((margCapEuro / ricavoCapNetto) * 100) : 0;
    const ricCapPerc = cTot > 0 ? round2((margCapEuro / cTot) * 100) : 0;

    return {
      capitoloId: cap.id,
      titolo: cap.titolo,
      ordine: cap.ordine,
      numeroVoci: righeCap.length,
      ricavoTotale: ricavoCapNetto,
      costoMaterialiTotale: cMat,
      costoManodoperaTotale: cMano,
      costoTotale: cTot,
      margineEuro: margCapEuro,
      marginePerc: margCapPerc,
      ricaricoPerc: ricCapPerc
    };
  });

  return {
    righeDettaglio,
    capitoliDettaglio,
    ricavoLavoriLordo,
    scontoGeneraleValore,
    ricavoLavoriNetto,
    totaleCostoMateriali,
    totaleCostoManodopera,
    totaleCosti,
    margineComplessivoEuro,
    margineComplessivoPerc,
    ricaricoComplessivoPerc,
    incidenzaMaterialiSuCosti,
    incidenzaManodoperaSuCosti,
    vociInPerdita,
    vociMargineBasso,
    vociMargineBuono,
    vociMargineOttimo
  };
}
