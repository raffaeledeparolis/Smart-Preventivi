import {
  Cliente,
  Prestazione,
  Materiale,
  VocePrezziario,
  Documento,
  DatiAzienda
} from '../types';
import {
  INITIAL_AZIENDA,
  INITIAL_CLIENTI,
  INITIAL_PRESTAZIONI,
  INITIAL_MATERIALI,
  INITIAL_PREZZIARIO,
  INITIAL_DOCUMENTI
} from '../data/initialData';

const STORAGE_KEYS = {
  CLIENTI: 'app_computo_clienti_v1',
  PRESTAZIONI: 'app_computo_prestazioni_v1',
  MATERIALI: 'app_computo_materiali_v1',
  PREZZIARIO: 'app_computo_prezziario_v1',
  DOCUMENTI: 'app_computo_documenti_v1',
  AZIENDA: 'app_computo_azienda_v1'
};

function safeGet<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (err) {
    console.error(`Errore caricamento dati per ${key}`, err);
    return fallback;
  }
}

function safeSet<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error(`Errore salvataggio dati per ${key}`, err);
  }
}

export function loadClienti(): Cliente[] {
  return safeGet<Cliente[]>(STORAGE_KEYS.CLIENTI, INITIAL_CLIENTI);
}

export function saveClienti(data: Cliente[]): void {
  safeSet(STORAGE_KEYS.CLIENTI, data);
}

export function loadPrestazioni(): Prestazione[] {
  return safeGet<Prestazione[]>(STORAGE_KEYS.PRESTAZIONI, INITIAL_PRESTAZIONI);
}

export function savePrestazioni(data: Prestazione[]): void {
  safeSet(STORAGE_KEYS.PRESTAZIONI, data);
}

export function loadMateriali(): Materiale[] {
  return safeGet<Materiale[]>(STORAGE_KEYS.MATERIALI, INITIAL_MATERIALI);
}

export function saveMateriali(data: Materiale[]): void {
  safeSet(STORAGE_KEYS.MATERIALI, data);
}

export function loadPrezziario(): VocePrezziario[] {
  return safeGet<VocePrezziario[]>(STORAGE_KEYS.PREZZIARIO, INITIAL_PREZZIARIO);
}

export function savePrezziario(data: VocePrezziario[]): void {
  safeSet(STORAGE_KEYS.PREZZIARIO, data);
}

export function loadDocumenti(): Documento[] {
  return safeGet<Documento[]>(STORAGE_KEYS.DOCUMENTI, INITIAL_DOCUMENTI);
}

export function saveDocumenti(data: Documento[]): void {
  safeSet(STORAGE_KEYS.DOCUMENTI, data);
}

export function loadAzienda(): DatiAzienda {
  return safeGet<DatiAzienda>(STORAGE_KEYS.AZIENDA, INITIAL_AZIENDA);
}

export function saveAzienda(data: DatiAzienda): void {
  safeSet(STORAGE_KEYS.AZIENDA, data);
}

export function resetDatabaseToDefaults(): void {
  safeSet(STORAGE_KEYS.CLIENTI, INITIAL_CLIENTI);
  safeSet(STORAGE_KEYS.PRESTAZIONI, INITIAL_PRESTAZIONI);
  safeSet(STORAGE_KEYS.MATERIALI, INITIAL_MATERIALI);
  safeSet(STORAGE_KEYS.PREZZIARIO, INITIAL_PREZZIARIO);
  safeSet(STORAGE_KEYS.DOCUMENTI, INITIAL_DOCUMENTI);
  safeSet(STORAGE_KEYS.AZIENDA, INITIAL_AZIENDA);
}

export const resetToDefaultData = resetDatabaseToDefaults;
export const saveVociPrezziario = savePrezziario;
export const saveDatiAzienda = saveAzienda;

export function loadInitialData() {
  return {
    clienti: loadClienti(),
    prestazioni: loadPrestazioni(),
    materiali: loadMateriali(),
    vociPrezziario: loadPrezziario(),
    documenti: loadDocumenti(),
    azienda: loadAzienda()
  };
}

export function exportBackupJson(data?: {
  clienti: Cliente[];
  prestazioni: Prestazione[];
  materiali: Materiale[];
  vociPrezziario: VocePrezziario[];
  documenti: Documento[];
  azienda: DatiAzienda;
}): void {
  const backup = data || {
    clienti: loadClienti(),
    prestazioni: loadPrestazioni(),
    materiali: loadMateriali(),
    vociPrezziario: loadPrezziario(),
    documenti: loadDocumenti(),
    azienda: loadAzienda()
  };
  const jsonString = JSON.stringify(backup, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `backup-preventivi-computo-${new Date().toISOString().split('T')[0]}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export async function importBackupJson(file: File): Promise<any> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = JSON.parse(text);
        if (parsed.clienti && Array.isArray(parsed.clienti)) saveClienti(parsed.clienti);
        if (parsed.prestazioni && Array.isArray(parsed.prestazioni)) savePrestazioni(parsed.prestazioni);
        if (parsed.materiali && Array.isArray(parsed.materiali)) saveMateriali(parsed.materiali);
        if (parsed.vociPrezziario && Array.isArray(parsed.vociPrezziario)) savePrezziario(parsed.vociPrezziario);
        if (parsed.prezziario && Array.isArray(parsed.prezziario)) savePrezziario(parsed.prezziario);
        if (parsed.documenti && Array.isArray(parsed.documenti)) saveDocumenti(parsed.documenti);
        if (parsed.azienda && typeof parsed.azienda === 'object') saveAzienda(parsed.azienda);

        resolve({
          clienti: parsed.clienti || loadClienti(),
          prestazioni: parsed.prestazioni || loadPrestazioni(),
          materiali: parsed.materiali || loadMateriali(),
          vociPrezziario: parsed.vociPrezziario || parsed.prezziario || loadPrezziario(),
          documenti: parsed.documenti || loadDocumenti(),
          azienda: parsed.azienda || loadAzienda()
        });
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsText(file);
  });
}

export function esportaTuttoBackupJSON(): string {
  const backup = {
    versione: '1.0',
    dataExport: new Date().toISOString(),
    clienti: loadClienti(),
    prestazioni: loadPrestazioni(),
    materiali: loadMateriali(),
    prezziario: loadPrezziario(),
    documenti: loadDocumenti(),
    azienda: loadAzienda()
  };
  return JSON.stringify(backup, null, 2);
}

export function importaBackupJSON(jsonString: string): boolean {
  try {
    const parsed = JSON.parse(jsonString);
    if (parsed.clienti && Array.isArray(parsed.clienti)) saveClienti(parsed.clienti);
    if (parsed.prestazioni && Array.isArray(parsed.prestazioni)) savePrestazioni(parsed.prestazioni);
    if (parsed.materiali && Array.isArray(parsed.materiali)) saveMateriali(parsed.materiali);
    if (parsed.prezziario && Array.isArray(parsed.prezziario)) savePrezziario(parsed.prezziario);
    if (parsed.documenti && Array.isArray(parsed.documenti)) saveDocumenti(parsed.documenti);
    if (parsed.azienda && typeof parsed.azienda === 'object') saveAzienda(parsed.azienda);
    return true;
  } catch (err) {
    console.error('File JSON non valido o corrotto', err);
    return false;
  }
}
