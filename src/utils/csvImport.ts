import { VocePrezziario, Prestazione, Materiale, UnitaMisura } from '../types';

/**
 * Parsing robusto di stringhe CSV
 * Gestisce separatori virgola, punto e virgola, tab, doppi apici e a capo.
 */
export function parseCSV(csvText: string): string[][] {
  const cleanText = csvText.replace(/^\uFEFF/, '').trim();
  if (!cleanText) return [];

  // Rileva separatore prevalente sulla prima riga non vuota
  const firstLine = cleanText.split(/\r\n|\n|\r/)[0] || '';
  const countSemi = (firstLine.match(/;/g) || []).length;
  const countComma = (firstLine.match(/,/g) || []).length;
  const countTab = (firstLine.match(/\t/g) || []).length;

  let delimiter = ';';
  if (countTab > countSemi && countTab > countComma) delimiter = '\t';
  else if (countComma > countSemi) delimiter = ',';

  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let insideQuotes = false;

  for (let i = 0; i < cleanText.length; i++) {
    const char = cleanText[i];
    const nextChar = cleanText[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        currentField += '"';
        i++; // salta escape
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === delimiter && !insideQuotes) {
      currentRow.push(currentField.trim());
      currentField = '';
    } else if ((char === '\r' || char === '\n') && !insideQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      currentRow.push(currentField.trim());
      currentField = '';
      if (currentRow.some((f) => f.length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
    } else {
      currentField += char;
    }
  }

  // Ultimo campo rimasto
  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some((f) => f.length > 0)) {
      rows.push(currentRow);
    }
  }

  return rows;
}

/**
 * Normalizza un numero gestendo sia virgola che punto (es. '25,50' o '1.250,50' o '25.50')
 */
export function parseItalianNumber(val: any, defaultValue: number = 0): number {
  if (typeof val === 'number') return isNaN(val) ? defaultValue : val;
  if (!val) return defaultValue;

  let str = String(val).trim();
  // Rimuove simbolo euro o % o spazi
  str = str.replace(/[€%\s]/g, '');

  if (str.includes(',') && str.includes('.')) {
    // Es. 1.250,50 (formato it/de) o 1,250.50 (formato us)
    if (str.lastIndexOf(',') > str.lastIndexOf('.')) {
      str = str.replace(/\./g, '').replace(',', '.');
    } else {
      str = str.replace(/,/g, '');
    }
  } else if (str.includes(',')) {
    str = str.replace(',', '.');
  }

  const num = parseFloat(str);
  return isNaN(num) ? defaultValue : num;
}

/**
 * Normalizza unità di misura note nell'edilizia
 */
export function normalizeUnitaMisura(val?: string): UnitaMisura {
  if (!val) return 'cad';
  const clean = val.toLowerCase().replace(/\./g, '').trim();

  if (['h', 'ora', 'ore'].includes(clean)) return 'h';
  if (['corpo', 'a corpo', 'cor'].includes(clean)) return 'a corpo';
  if (['mq', 'm2', 'metro quadro', 'metri quadri', 'mquadro'].includes(clean)) return 'mq';
  if (['ml', 'm', 'metro lineare', 'metri lineari', 'mlineare'].includes(clean)) return 'ml';
  if (['mc', 'm3', 'metro cubo', 'metri cubi', 'mcubo'].includes(clean)) return 'mc';
  if (['kg', 'chilogrammo', 'chili', 'kilo'].includes(clean)) return 'kg';
  if (['sacco', 'sacchi', 'sac'].includes(clean)) return 'sacco';
  if (['lt', 'l', 'litro', 'litri'].includes(clean)) return 'lt';
  if (['pz', 'pezzo', 'pezzi', 'n', 'nr'].includes(clean)) return 'pz';
  if (['gg', 'giorno', 'giorni'].includes(clean)) return 'gg';

  return 'cad';
}

/**
 * Helper per scaricare stringa CSV con BOM per Excel
 */
export function downloadCsvFile(content: string, filename: string) {
  const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// ---------------------------------------------------------------------------------
// 1. PREZZIARIO TEMPLATE & PARSER
// ---------------------------------------------------------------------------------

export function getPrezziarioCsvTemplate(): string {
  const headers = [
    'Codice',
    'Categoria',
    'Titolo',
    'Descrizione Breve',
    'Descrizione Estesa',
    'Unita Misura',
    'Prezzo Unitario',
    'Quota Manodopera %',
    'Quota Materiali %',
    'Note'
  ];

  const sampleRows = [
    [
      '01.DEM.001',
      'Demolizioni e Rimozioni',
      'Demolizione di tramezzatura in mattoni forati',
      'Demolizione pareti interne spessore fino a 10 cm con calo a terra',
      'Demolizione eseguita a mano o con idonei mezzi meccanici di tramezzi in muratura di laterizio fino a 10 cm di spessore, compreso il calo dei materiali di risulta e accatastamento.',
      'mq',
      '24,50',
      '80',
      '20',
      'Escluso smaltimento in discarica autorizzata'
    ],
    [
      '02.MUR.015',
      'Opere Murarie e Cemento',
      'Intonaco premiscelato tradizionale a base calce e cemento',
      'Intonaco di fondo per interni applicato a macchina',
      'Applicazione di intonaco premiscelato tirato in piano con staggia e rifinito a frattazzo, compresi paraspigoli zincati e ponteggi interni.',
      'mq',
      '28,00',
      '65',
      '35',
      'Finitura civile'
    ],
    [
      '03.FIN.020',
      'Finiture e Tinteggiature',
      'Tinteggiatura lavabile traspirante due mani',
      'Pittura pareti e soffitti interni due mani previo fissativo',
      'Tinteggiatura con idropittura traspirante antimuffa data a due passate, previa applicazione di fondo isolante acrilico e stuccature.',
      'mq',
      '12,50',
      '75',
      '25',
      'Colore bianco standard'
    ]
  ];

  return [headers.join(';'), ...sampleRows.map((r) => r.map((f) => `"${f.replace(/"/g, '""')}"`).join(';'))].join('\r\n');
}

export interface ParsedPrezziarioItem {
  codice: string;
  categoria: string;
  titolo: string;
  descrizioneBreve: string;
  descrizioneEstesa: string;
  unitaMisura: UnitaMisura;
  prezzoUnitario: number;
  quotaManodopera?: number;
  quotaMateriali?: number;
  note?: string;
  isValid: boolean;
  errors: string[];
}

export function parsePrezziarioRows(matrix: string[][]): ParsedPrezziarioItem[] {
  if (matrix.length < 2) return [];

  const headers = matrix[0].map((h) => h.toLowerCase().trim());

  // Indici delle colonne
  const idxCodice = headers.findIndex((h) => h.includes('cod') || h.includes('art'));
  const idxCategoria = headers.findIndex((h) => h.includes('cat') || h.includes('capitolo'));
  const idxTitolo = headers.findIndex((h) => h.includes('titolo') || h.includes('voce') || h.includes('nome'));
  const idxDescBreve = headers.findIndex((h) => h.includes('breve') || h.includes('sintet'));
  const idxDescEstesa = headers.findIndex((h) => h.includes('estesa') || h.includes('capitolato') || h.includes('descriz'));
  const idxUM = headers.findIndex((h) => h.includes('misura') || h === 'um' || h === 'u.m.');
  const idxPrezzo = headers.findIndex((h) => h.includes('prezzo') || h.includes('tariffa') || h.includes('importo'));
  const idxMano = headers.findIndex((h) => h.includes('manodopera') || h.includes('mano'));
  const idxMat = headers.findIndex((h) => h.includes('material'));
  const idxNote = headers.findIndex((h) => h.includes('note') || h.includes('osservazioni'));

  const results: ParsedPrezziarioItem[] = [];

  for (let r = 1; r < matrix.length; r++) {
    const row = matrix[r];
    if (!row || row.length === 0 || row.every((c) => !c.trim())) continue;

    const codice = (idxCodice !== -1 ? row[idxCodice] : row[0])?.trim() || `VOCE-${Date.now().toString().slice(-4)}-${r}`;
    const titolo = (idxTitolo !== -1 ? row[idxTitolo] : row[2] || row[1])?.trim();
    const categoria = (idxCategoria !== -1 ? row[idxCategoria] : row[1])?.trim() || 'Opere Generali';
    const descBreve = (idxDescBreve !== -1 ? row[idxDescBreve] : '')?.trim() || titolo || '';
    const descEstesa = (idxDescEstesa !== -1 ? row[idxDescEstesa] : '')?.trim() || descBreve || titolo || '';
    const umRaw = (idxUM !== -1 ? row[idxUM] : row[5] || row[4])?.trim();
    const unitaMisura = normalizeUnitaMisura(umRaw);
    const prezzoRaw = idxPrezzo !== -1 ? row[idxPrezzo] : row[6] || row[5];
    const prezzoUnitario = parseItalianNumber(prezzoRaw, 0);

    const quotaManoRaw = idxMano !== -1 ? row[idxMano] : undefined;
    const quotaMatRaw = idxMat !== -1 ? row[idxMat] : undefined;
    const quotaManodopera = quotaManoRaw !== undefined ? parseItalianNumber(quotaManoRaw, 0) : undefined;
    const quotaMateriali = quotaMatRaw !== undefined ? parseItalianNumber(quotaMatRaw, 0) : undefined;
    const note = (idxNote !== -1 ? row[idxNote] : '')?.trim();

    const errors: string[] = [];
    if (!titolo) errors.push('Titolo mancante');
    if (prezzoUnitario <= 0) errors.push('Prezzo unitario nullo o non valido');

    results.push({
      codice,
      categoria,
      titolo: titolo || 'Senza Titolo',
      descrizioneBreve: descBreve,
      descrizioneEstesa: descEstesa,
      unitaMisura,
      prezzoUnitario,
      quotaManodopera,
      quotaMateriali,
      note,
      isValid: errors.length === 0,
      errors
    });
  }

  return results;
}

// ---------------------------------------------------------------------------------
// 2. PRESTAZIONI TEMPLATE & PARSER
// ---------------------------------------------------------------------------------

export function getPrestazioniCsvTemplate(): string {
  const headers = [
    'Codice',
    'Categoria',
    'Titolo',
    'Unita Misura',
    'Costo Base / Orario €',
    'Ricarico %',
    'Prezzo Consigliato €',
    'Note'
  ];

  const sampleRows = [
    ['PR-MAN-01', 'Manodopera Specializzata', 'Muratore Specializzato di 3° Livello', 'h', '24,00', '35', '32,40', 'Tariffa oraria cantiere'],
    ['PR-MAN-02', 'Manodopera Comune', 'Manovale Edile Comune', 'h', '18,50', '30', '24,05', 'Pulizia e sgombero'],
    ['PR-IMP-01', 'Impianti Elettrici', 'Assistenza muraria a impiantisti', 'gg', '180,00', '25', '225,00', 'Giornata intera operatore'],
    ['PR-POS-01', 'Pavimentazioni', 'Posa in opera gres porcellanato 60x60', 'mq', '22,00', '40', '30,80', 'Incollato a colla escluso battiscopa']
  ];

  return [headers.join(';'), ...sampleRows.map((r) => r.map((f) => `"${f.replace(/"/g, '""')}"`).join(';'))].join('\r\n');
}

export interface ParsedPrestazioneItem {
  codice: string;
  titolo: string;
  categoria: string;
  unitaMisura: UnitaMisura;
  costoOrario: number;
  ricaricoPerc: number;
  prezzoConsigliato: number;
  note?: string;
  isValid: boolean;
  errors: string[];
}

export function parsePrestazioniRows(matrix: string[][]): ParsedPrestazioneItem[] {
  if (matrix.length < 2) return [];

  const headers = matrix[0].map((h) => h.toLowerCase().trim());

  const idxCodice = headers.findIndex((h) => h.includes('cod') || h.includes('art'));
  const idxCategoria = headers.findIndex((h) => h.includes('cat') || h.includes('reparto') || h.includes('gruppo'));
  const idxTitolo = headers.findIndex((h) => h.includes('titolo') || h.includes('nome') || h.includes('descriz') || h.includes('lavoraz'));
  const idxUM = headers.findIndex((h) => h.includes('misura') || h === 'um' || h === 'u.m.');
  const idxCosto = headers.findIndex((h) => h.includes('costo') || h.includes('base') || h.includes('orario'));
  const idxRicarico = headers.findIndex((h) => h.includes('ricarico') || h.includes('margine') || h.includes('%'));
  const idxPrezzo = headers.findIndex((h) => h.includes('prezzo') || h.includes('consigliato') || h.includes('vendita') || h.includes('tariffa'));
  const idxNote = headers.findIndex((h) => h.includes('note') || h.includes('osservazioni'));

  const results: ParsedPrestazioneItem[] = [];

  for (let r = 1; r < matrix.length; r++) {
    const row = matrix[r];
    if (!row || row.length === 0 || row.every((c) => !c.trim())) continue;

    const codice = (idxCodice !== -1 ? row[idxCodice] : row[0])?.trim() || `PR-${Date.now().toString().slice(-4)}-${r}`;
    const titolo = (idxTitolo !== -1 ? row[idxTitolo] : row[2] || row[1])?.trim();
    const categoria = (idxCategoria !== -1 ? row[idxCategoria] : row[1])?.trim() || 'Prestazioni Generali';
    const umRaw = (idxUM !== -1 ? row[idxUM] : row[3])?.trim();
    const unitaMisura = normalizeUnitaMisura(umRaw || 'h');

    const costoOrario = parseItalianNumber(idxCosto !== -1 ? row[idxCosto] : row[4], 0);
    const ricaricoPerc = parseItalianNumber(idxRicarico !== -1 ? row[idxRicarico] : row[5], 30);
    let prezzoConsigliato = parseItalianNumber(idxPrezzo !== -1 ? row[idxPrezzo] : row[6], 0);

    if (prezzoConsigliato <= 0 && costoOrario > 0) {
      prezzoConsigliato = Number((costoOrario * (1 + ricaricoPerc / 100)).toFixed(2));
    }

    const note = (idxNote !== -1 ? row[idxNote] : '')?.trim();

    const errors: string[] = [];
    if (!titolo) errors.push('Titolo prestazione mancante');
    if (costoOrario <= 0 && prezzoConsigliato <= 0) errors.push('Costo o prezzo non specificato');

    results.push({
      codice,
      titolo: titolo || 'Senza Nome',
      categoria,
      unitaMisura,
      costoOrario,
      ricaricoPerc,
      prezzoConsigliato,
      note,
      isValid: errors.length === 0,
      errors
    });
  }

  return results;
}

// ---------------------------------------------------------------------------------
// 3. MATERIALI TEMPLATE & PARSER
// ---------------------------------------------------------------------------------

export function getMaterialiCsvTemplate(): string {
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

  const sampleRows = [
    ['MAT-CEM-01', 'Cemento Portland 32.5 R sacco 25kg', 'Leganti e Inerti', 'Italcementi', 'Edilferramenta Srl', 'sacco', '4,80', '35', '6,48', '50', 'Fornito su bancali'],
    ['MAT-COL-02', 'Colla per piastrelle C2TE Grigia 25kg', 'Adesivi e Sigillanti', 'Mapei Keraflex', 'Edilizia Moderna SpA', 'sacco', '14,50', '30', '18,85', '20', 'Per interni ed esterni'],
    ['MAT-TUB-10', 'Tubo PVC arancio d.100 lunghezza 3m', 'Tubazioni e Scarichi', 'Redi', 'Idrotermica F.lli', 'pz', '8,20', '40', '11,48', '15', 'Giunto a bicchiere'],
    ['MAT-PST-05', 'Lastra Cartongesso Standard 120x200 sp. 12.5mm', 'Sistemi a Secco', 'Knauf', 'Centro Cartongesso Srl', 'mq', '3,90', '35', '5,26', '80', 'Lastra bianca tipo A']
  ];

  return [headers.join(';'), ...sampleRows.map((r) => r.map((f) => `"${f.replace(/"/g, '""')}"`).join(';'))].join('\r\n');
}

export interface ParsedMaterialeItem {
  codice: string;
  nome: string;
  categoria: string;
  marca?: string;
  fornitore?: string;
  codiceFornitore?: string;
  unitaMisura: UnitaMisura;
  prezzoAcquisto: number;
  ricaricoPerc: number;
  prezzoVendita: number;
  scorta?: number;
  note?: string;
  isValid: boolean;
  errors: string[];
}

export function parseMaterialiRows(matrix: string[][]): ParsedMaterialeItem[] {
  if (matrix.length < 2) return [];

  const headers = matrix[0].map((h) => h.toLowerCase().trim());

  const idxCodice = headers.findIndex((h) => h.includes('cod') || h.includes('art'));
  const idxNome = headers.findIndex((h) => h.includes('nome') || h.includes('material') || h.includes('descriz') || h.includes('articolo'));
  const idxCategoria = headers.findIndex((h) => h.includes('cat') || h.includes('reparto') || h.includes('gruppo'));
  const idxMarca = headers.findIndex((h) => h.includes('marca') || h.includes('produttore') || h.includes('brand'));
  const idxFornitore = headers.findIndex((h) => h.includes('fornitore') || h.includes('distributore'));
  const idxUM = headers.findIndex((h) => h.includes('misura') || h === 'um' || h === 'u.m.');
  const idxAcquisto = headers.findIndex((h) => h.includes('acquisto') || h.includes('costo') || h.includes('fornitore'));
  const idxRicarico = headers.findIndex((h) => h.includes('ricarico') || h.includes('margine') || h.includes('%'));
  const idxVendita = headers.findIndex((h) => h.includes('vendita') || h.includes('cliente') || h.includes('prezzo'));
  const idxScorta = headers.findIndex((h) => h.includes('scorta') || h.includes('giacenza') || h.includes('quantita'));
  const idxNote = headers.findIndex((h) => h.includes('note') || h.includes('osservazioni'));

  const results: ParsedMaterialeItem[] = [];

  for (let r = 1; r < matrix.length; r++) {
    const row = matrix[r];
    if (!row || row.length === 0 || row.every((c) => !c.trim())) continue;

    const codice = (idxCodice !== -1 ? row[idxCodice] : row[0])?.trim() || `MAT-${Date.now().toString().slice(-4)}-${r}`;
    const nome = (idxNome !== -1 ? row[idxNome] : row[1])?.trim();
    const categoria = (idxCategoria !== -1 ? row[idxCategoria] : row[2])?.trim() || 'Materiali Generali';
    const marca = (idxMarca !== -1 ? row[idxMarca] : '')?.trim();
    const fornitore = (idxFornitore !== -1 ? row[idxFornitore] : '')?.trim();
    const umRaw = (idxUM !== -1 ? row[idxUM] : row[5] || row[4])?.trim();
    const unitaMisura = normalizeUnitaMisura(umRaw || 'pz');

    const prezzoAcquisto = parseItalianNumber(idxAcquisto !== -1 ? row[idxAcquisto] : row[6], 0);
    const ricaricoPerc = parseItalianNumber(idxRicarico !== -1 ? row[idxRicarico] : row[7], 30);
    let prezzoVendita = parseItalianNumber(idxVendita !== -1 ? row[idxVendita] : row[8], 0);

    if (prezzoVendita <= 0 && prezzoAcquisto > 0) {
      prezzoVendita = Number((prezzoAcquisto * (1 + ricaricoPerc / 100)).toFixed(2));
    }

    const scorta = parseItalianNumber(idxScorta !== -1 ? row[idxScorta] : '', 0);
    const note = (idxNote !== -1 ? row[idxNote] : '')?.trim();

    const errors: string[] = [];
    if (!nome) errors.push('Nome materiale mancante');
    if (prezzoAcquisto <= 0 && prezzoVendita <= 0) errors.push('Prezzo acquisto o vendita mancante');

    results.push({
      codice,
      nome: nome || 'Materiale senza nome',
      categoria,
      marca,
      fornitore,
      unitaMisura,
      prezzoAcquisto,
      ricaricoPerc,
      prezzoVendita,
      scorta,
      note,
      isValid: errors.length === 0,
      errors
    });
  }

  return results;
}
