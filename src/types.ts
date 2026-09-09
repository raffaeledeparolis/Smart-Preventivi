export type UnitaMisura = 'h' | 'a corpo' | 'mq' | 'ml' | 'mc' | 'cad' | 'kg' | 'sacco' | 'lt' | 'pz' | 'gg';

export interface Cliente {
  id: string;
  ragioneSociale: string;
  referente?: string;
  piva?: string;
  codiceFiscale: string;
  tipoCliente: 'privato' | 'azienda' | 'condominio' | 'ente_pubblico';
  indirizzo: string;
  cap: string;
  citta: string;
  provincia: string;
  telefono: string;
  email: string;
  pec?: string;
  codiceSdi?: string; // Codice Destinatario o 0000000
  note?: string;
  dataCreazione: string;
}

export interface Prestazione {
  id: string;
  codice: string;
  titolo: string;
  categoria: string;
  unitaMisura: UnitaMisura;
  costoOrario: number; // Costo orario o base aziendale (€)
  ricaricoPerc: number; // % ricarico
  prezzoConsigliato: number; // Prezzo venduto cliente (€)
  note?: string;
}

export interface Materiale {
  id: string;
  codice: string;
  nome: string;
  categoria: string;
  marca?: string;
  unitaMisura: UnitaMisura;
  prezzoAcquisto: number; // Costo acquisto fornitore
  ricaricoPerc: number; // % ricarico
  prezzoVendita: number; // Prezzo al cliente
  fornitore?: string;
  codiceFornitore?: string;
  scorta?: number;
  note?: string;
}

export interface VocePrezziario {
  id: string;
  codice: string; // es. 01.A02.010
  categoria: string; // Capitolo / Categoria di lavorazione
  titolo: string;
  descrizioneBreve: string;
  descrizioneEstesa: string;
  unitaMisura: UnitaMisura;
  prezzoUnitario: number;
  quotaManodopera?: number; // Quota manodopera in € o % per detrazioni
  quotaMateriali?: number; // Quota materiali
  ricaricoPerc?: number;
  note?: string;
}

export interface RigaComputo {
  id: string;
  capitoloId: string;
  codiceVoce?: string;
  descrizione: string;
  unitaMisura: UnitaMisura;
  
  // Calcolo metrico analitico
  usaFormulaMetrica: boolean; // se true usa partiUguali * L * W * H
  partiUguali?: number;
  lunghezza?: number;
  larghezza?: number;
  altezza?: number;
  
  quantita: number; // Quantità risultante o inserita direttamente
  prezzoUnitario: number;
  scontoPerc: number; // % sconto riga
  subtotale: number; // quantita * prezzoUnitario * (1 - sconto/100)
  
  quotaManodoperaPerc?: number; // % manodopera per detrazioni fiscali
  note?: string;

  // Analisi Costi Diretti e Margine di Guadagno
  costoMaterialiUnitario?: number; // Costo unitario sostenuto per materiali (€/UM)
  costoManodoperaUnitario?: number; // Costo unitario sostenuto per manodopera/posa (€/UM)
}

export interface DettaglioCostiRiga {
  rigaId: string;
  capitoloId: string;
  codiceVoce?: string;
  descrizione: string;
  unitaMisura: UnitaMisura;
  quantita: number;
  prezzoUnitario: number;
  scontoPerc: number;
  ricavoNettoUnitario: number;
  ricavoTotale: number; // subtotale effettivo

  costoMaterialiUnitario: number;
  costoManodoperaUnitario: number;
  costoUnitarioTotale: number;

  costoMaterialiTotale: number;
  costoManodoperaTotale: number;
  costoTotale: number;

  margineEuro: number; // ricavoTotale - costoTotale
  marginePerc: number; // (margineEuro / ricavoTotale) * 100
  ricaricoPerc: number; // (margineEuro / costoTotale) * 100
  incidenzaMaterialiPerc: number; // % sul costo totale riga
  incidenzaManodoperaPerc: number; // % sul costo totale riga
  isStimaAutomatica: boolean;
}

export interface AnalisiCapitoloMargini {
  capitoloId: string;
  titolo: string;
  ordine: number;
  numeroVoci: number;
  ricavoTotale: number;
  costoMaterialiTotale: number;
  costoManodoperaTotale: number;
  costoTotale: number;
  margineEuro: number;
  marginePerc: number;
  ricaricoPerc: number;
}

export interface AnalisiMarginiDocumento {
  righeDettaglio: DettaglioCostiRiga[];
  capitoliDettaglio: AnalisiCapitoloMargini[];

  // Totali Economici di Commessa
  ricavoLavoriLordo: number;
  scontoGeneraleValore: number;
  ricavoLavoriNetto: number;

  totaleCostoMateriali: number;
  totaleCostoManodopera: number;
  totaleCosti: number;

  margineComplessivoEuro: number;
  margineComplessivoPerc: number; // Margine % sul ricavo netto
  ricaricoComplessivoPerc: number; // Markup % sui costi diretti

  incidenzaMaterialiSuCosti: number; // %
  incidenzaManodoperaSuCosti: number; // %

  // Conteggi per salute margini
  vociInPerdita: number;
  vociMargineBasso: number;
  vociMargineBuono: number;
  vociMargineOttimo: number;
}

export interface CapitoloDocumento {
  id: string;
  titolo: string;
  ordine: number;
  descrizione?: string;
}

export type TipoDocumento = 'preventivo' | 'computo_metrico' | 'fattura_proforma';
export type StatoDocumento = 'bozza' | 'inviato' | 'approvato' | 'rifiutato' | 'completato';

export interface Documento {
  id: string;
  numero: string; // es. "PREV-2026-001" o "CME-2026-001"
  titolo: string; // es. "Ristrutturazione Appartamento Via Garibaldi 12"
  tipo: TipoDocumento;
  stato: StatoDocumento;
  data: string; // YYYY-MM-DD
  dataScadenza: string;
  validitaGiorni: number; // es. 30 o 60 gg
  
  clienteId: string;
  clienteSnapshot: Cliente; // Dati congelati al momento dell'emissione
  
  cantiere: {
    oggetto: string;
    indirizzo: string;
    citta: string;
    cap: string;
    provincia: string;
    responsabile?: string;
  };
  
  capitoli: CapitoloDocumento[];
  righe: RigaComputo[];
  
  // Condizioni Economiche
  oneriSicurezzaTipo: 'percentuale' | 'fisso';
  oneriSicurezzaValore: number; // % o importo fisso non soggetto a ribasso
  
  cassaPrevidenzialeAttiva: boolean;
  cassaPrevidenzialeNome: string; // es. "Cassa Previdenza Architetti/Geometri" o "Cassa Edile"
  cassaPrevidenzialeTipo?: 'percentuale' | 'fisso';
  cassaPrevidenzialeValore?: number; // % o importo fisso in €
  cassaPrevidenzialePerc: number; // es. 4% (mantenuto per retrocompatibilità)
  
  ivaPerc: number; // 4, 10, 22, 0
  ivaEsenzioneTesto?: string; // Dicitura di legge se IVA 0% o Reverse Charge
  
  ritenutaAccontoAttiva: boolean;
  ritenutaAccontoPerc: number; // es. 20%
  
  scontoGeneralePerc: number; // Sconto complessivo su imponibile
  
  // Condizioni Contrattuali
  condizioniPagamento: string;
  tempiEsecuzione: string;
  esclusioni: string;
  noteFinali: string;
  
  dataAggiornamento: string;
}

export interface DatiAzienda {
  ragioneSociale: string;
  nomeImpresa?: string; // alias per ragioneSociale
  sottotitolo?: string;
  partitaIva: string;
  piva?: string; // alias per partitaIva
  codiceFiscale: string;
  iscrizioneRea?: string;
  numeroREA?: string; // alias per iscrizioneRea
  indirizzo: string;
  cap: string;
  citta: string;
  provincia: string;
  telefono: string;
  email: string;
  pec: string;
  sitoWeb?: string;
  iban: string;
  banca: string;
  intestatarioConto: string;
  logoUrl?: string;
  condizioniStandard?: string;
}

export type ImpostazioniAzienda = DatiAzienda;

export interface ModelloDocumentoPreset {
  id: string;
  titolo: string;
  categoria: string;
  descrizione: string;
  tipoPredefinito: TipoDocumento;
  isCustom?: boolean;
  dataCreazione?: string;
  capitoli: {
    titolo: string;
    righe: {
      descrizione: string;
      unitaMisura: UnitaMisura;
      partiUguali?: number;
      lunghezza?: number;
      larghezza?: number;
      altezza?: number;
      quantita: number;
      prezzoUnitario: number;
      quotaManodoperaPerc?: number;
    }[];
  }[];
  oneriSicurezzaTipo?: 'percentuale' | 'fisso';
  oneriSicurezzaValore?: number;
  cassaPrevidenzialeAttiva?: boolean;
  cassaPrevidenzialeNome?: string;
  cassaPrevidenzialeTipo?: 'percentuale' | 'fisso';
  cassaPrevidenzialeValore?: number;
  cassaPrevidenzialePerc?: number;
  ivaPerc?: number;
  ritenutaAccontoAttiva?: boolean;
  ritenutaAccontoPerc?: number;
  condizioniPagamento?: string;
  tempiEsecuzione?: string;
  esclusioni?: string;
  noteFinali?: string;
}
