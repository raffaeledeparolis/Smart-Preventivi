import React, { useState, useEffect } from 'react';
import {
  Cliente,
  Prestazione,
  Materiale,
  VocePrezziario,
  Documento,
  DatiAzienda,
  StatoDocumento,
  TipoDocumento
} from './types';
import {
  loadInitialData,
  saveClienti,
  savePrestazioni,
  saveMateriali,
  saveVociPrezziario,
  saveDocumenti,
  saveDatiAzienda,
  exportBackupJson,
  importBackupJson,
  resetToDefaultData
} from './utils/storage';
import { generaNumeroDocumento } from './utils/calculations';
import { Navbar, ActiveTab } from './components/Navbar';
import { ClientiSection } from './components/ClientiSection';
import { PrestazioniSection } from './components/PrestazioniSection';
import { MaterialiSection } from './components/MaterialiSection';
import { PrezziarioSection } from './components/PrezziarioSection';
import { DocumentiSection } from './components/DocumentiSection';
import { DocumentEditor } from './components/DocumentEditor';
import { DocumentGeneratorSection } from './components/DocumentGeneratorSection';
import { DocumentPrintView } from './components/DocumentPrintView';
import { ImpostazioniAziendaModal } from './components/ImpostazioniAziendaModal';
import { DuplicateStrategy } from './components/CsvImportModal';

export default function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<ActiveTab>('documenti');
  const [editingDocumento, setEditingDocumento] = useState<Documento | null>(null);
  const [printingDocumento, setPrintingDocumento] = useState<Documento | null>(null);
  const [isAziendaModalOpen, setIsAziendaModalOpen] = useState(false);

  // App Data States
  const [clienti, setClienti] = useState<Cliente[]>([]);
  const [prestazioni, setPrestazioni] = useState<Prestazione[]>([]);
  const [materiali, setMateriali] = useState<Materiale[]>([]);
  const [vociPrezziario, setVociPrezziario] = useState<VocePrezziario[]>([]);
  const [documenti, setDocumenti] = useState<Documento[]>([]);
  const [azienda, setAzienda] = useState<DatiAzienda>({
    ragioneSociale: 'EDILTECNICA RESTAURI & COSTRUZIONI S.R.L.',
    sottotitolo: 'Opere Edili, Ristrutturazioni Civili e Impiantistica',
    partitaIva: '08429180963',
    codiceFiscale: '08429180963',
    indirizzo: 'Via Michelangelo Buonarroti, 42',
    cap: '20145',
    citta: 'Milano',
    provincia: 'MI',
    telefono: '+39 02 8739 4120',
    email: 'info@ediltecnicarestauri.it',
    pec: 'ediltecnica.mi@pec.it',
    sitoWeb: 'www.ediltecnicarestauri.it',
    iban: 'IT78 X 03069 09606 100000049281',
    banca: 'Banca Intesa Sanpaolo - Filiale Milano CityLife',
    intestatarioConto: 'Ediltecnica Restauri & Costruzioni S.r.l.',
    condizioniStandard: ''
  });

  // Initial Data Load
  useEffect(() => {
    const data = loadInitialData();
    setClienti(data.clienti);
    setPrestazioni(data.prestazioni);
    setMateriali(data.materiali);
    setVociPrezziario(data.vociPrezziario);
    setDocumenti(data.documenti);
    setAzienda(data.azienda);
  }, []);

  // --- CLIENT HANDLERS ---
  const handleSaveCliente = (cliente: Cliente) => {
    setClienti((prev) => {
      const exists = prev.some((c) => c.id === cliente.id);
      const next = exists ? prev.map((c) => (c.id === cliente.id ? cliente : c)) : [cliente, ...prev];
      saveClienti(next);
      return next;
    });
  };

  const handleDeleteCliente = (id: string) => {
    setClienti((prev) => {
      const next = prev.filter((c) => c.id !== id);
      saveClienti(next);
      return next;
    });
  };

  // --- PRESTAZIONI HANDLERS ---
  const handleSavePrestazione = (prest: Prestazione) => {
    setPrestazioni((prev) => {
      const exists = prev.some((p) => p.id === prest.id);
      const next = exists ? prev.map((p) => (p.id === prest.id ? prest : p)) : [prest, ...prev];
      savePrestazioni(next);
      return next;
    });
  };

  const handleDeletePrestazione = (id: string) => {
    setPrestazioni((prev) => {
      const next = prev.filter((p) => p.id !== id);
      savePrestazioni(next);
      return next;
    });
  };

  const handleImportPrestazioni = (nuove: Prestazione[], strategy: DuplicateStrategy = 'overwrite') => {
    setPrestazioni((prev) => {
      let next: Prestazione[] = [];
      if (strategy === 'overwrite') {
        const codiciNuovi = new Map(nuove.map((p) => [p.codice.toLowerCase(), p]));
        const aggiornati = prev.map((p) => {
          const matching = codiciNuovi.get(p.codice.toLowerCase());
          if (matching) {
            codiciNuovi.delete(p.codice.toLowerCase());
            return { ...matching, id: p.id };
          }
          return p;
        });
        next = [...Array.from(codiciNuovi.values()), ...aggiornati];
      } else if (strategy === 'skip') {
        const codiciEsistenti = new Set(prev.map((p) => p.codice.toLowerCase()));
        const daAggiungere = nuove.filter((p) => !codiciEsistenti.has(p.codice.toLowerCase()));
        next = [...daAggiungere, ...prev];
      } else {
        next = [...nuove, ...prev];
      }
      savePrestazioni(next);
      return next;
    });
  };

  // --- MATERIALI HANDLERS ---
  const handleSaveMateriale = (mat: Materiale) => {
    setMateriali((prev) => {
      const exists = prev.some((m) => m.id === mat.id);
      const next = exists ? prev.map((m) => (m.id === mat.id ? mat : m)) : [mat, ...prev];
      saveMateriali(next);
      return next;
    });
  };

  const handleDeleteMateriale = (id: string) => {
    setMateriali((prev) => {
      const next = prev.filter((m) => m.id !== id);
      saveMateriali(next);
      return next;
    });
  };

  const handleImportMateriali = (nuovi: Materiale[], strategy: DuplicateStrategy = 'overwrite') => {
    setMateriali((prev) => {
      let next: Materiale[] = [];
      if (strategy === 'overwrite') {
        const codiciNuovi = new Map(nuovi.map((m) => [m.codice.toLowerCase(), m]));
        const aggiornati = prev.map((m) => {
          const matching = codiciNuovi.get(m.codice.toLowerCase());
          if (matching) {
            codiciNuovi.delete(m.codice.toLowerCase());
            return { ...matching, id: m.id };
          }
          return m;
        });
        next = [...Array.from(codiciNuovi.values()), ...aggiornati];
      } else if (strategy === 'skip') {
        const codiciEsistenti = new Set(prev.map((m) => m.codice.toLowerCase()));
        const daAggiungere = nuovi.filter((m) => !codiciEsistenti.has(m.codice.toLowerCase()));
        next = [...daAggiungere, ...prev];
      } else {
        next = [...nuovi, ...prev];
      }
      saveMateriali(next);
      return next;
    });
  };

  // --- PREZZIARIO HANDLERS ---
  const handleSaveVocePrezziario = (voce: VocePrezziario) => {
    setVociPrezziario((prev) => {
      const exists = prev.some((v) => v.id === voce.id);
      const next = exists ? prev.map((v) => (v.id === voce.id ? voce : v)) : [voce, ...prev];
      saveVociPrezziario(next);
      return next;
    });
  };

  const handleDeleteVocePrezziario = (id: string) => {
    setVociPrezziario((prev) => {
      const next = prev.filter((v) => v.id !== id);
      saveVociPrezziario(next);
      return next;
    });
  };

  const handleImportVociPrezziario = (nuoveVoci: VocePrezziario[], strategy: DuplicateStrategy = 'overwrite') => {
    setVociPrezziario((prev) => {
      let next: VocePrezziario[] = [];
      if (strategy === 'overwrite') {
        const codiciNuovi = new Map(nuoveVoci.map((v) => [v.codice.toLowerCase(), v]));
        const aggiornati = prev.map((v) => {
          const matching = codiciNuovi.get(v.codice.toLowerCase());
          if (matching) {
            codiciNuovi.delete(v.codice.toLowerCase());
            return { ...matching, id: v.id };
          }
          return v;
        });
        next = [...Array.from(codiciNuovi.values()), ...aggiornati];
      } else if (strategy === 'skip') {
        const codiciEsistenti = new Set(prev.map((v) => v.codice.toLowerCase()));
        const daAggiungere = nuoveVoci.filter((v) => !codiciEsistenti.has(v.codice.toLowerCase()));
        next = [...daAggiungere, ...prev];
      } else {
        next = [...nuoveVoci, ...prev];
      }
      saveVociPrezziario(next);
      return next;
    });
  };

  // --- DOCUMENTI HANDLERS ---
  const handleSaveDocumento = (doc: Documento) => {
    setDocumenti((prev) => {
      const exists = prev.some((d) => d.id === doc.id);
      const next = exists ? prev.map((d) => (d.id === doc.id ? doc : d)) : [doc, ...prev];
      saveDocumenti(next);
      return next;
    });
    setEditingDocumento(null);
  };

  const handleDeleteDocumento = (id: string) => {
    setDocumenti((prev) => {
      const next = prev.filter((d) => d.id !== id);
      saveDocumenti(next);
      return next;
    });
  };

  const handleUpdateStato = (id: string, stato: StatoDocumento) => {
    setDocumenti((prev) => {
      const next = prev.map((d) => (d.id === id ? { ...d, stato } : d));
      saveDocumenti(next);
      return next;
    });
  };

  const handleDuplicateDocumento = (sourceDoc: Documento) => {
    const anno = new Date().getFullYear();
    const numero = generaNumeroDocumento(sourceDoc.tipo, anno, documenti.length);
    const now = new Date();
    const dataOggi = now.toISOString().split('T')[0];

    const duplicato: Documento = {
      ...JSON.parse(JSON.stringify(sourceDoc)),
      id: `doc-${Date.now()}`,
      numero: numero,
      titolo: `${sourceDoc.titolo} (Copia)`,
      stato: 'bozza',
      data: dataOggi,
      dataAggiornamento: dataOggi
    };

    setDocumenti((prev) => {
      const next = [duplicato, ...prev];
      saveDocumenti(next);
      return next;
    });

    setEditingDocumento(duplicato);
  };

  const handleNuovoDocumento = (clientePredefinito?: Cliente) => {
    const anno = new Date().getFullYear();
    const numero = generaNumeroDocumento('preventivo', anno, documenti.length);
    const now = new Date();
    const dataOggi = now.toISOString().split('T')[0];
    const dataScad = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const targetCliente = (clientePredefinito && clientePredefinito.id) ? clientePredefinito : (clienti[0] || null);

    const nuovo: Documento = {
      id: `doc-${Date.now()}`,
      numero: numero,
      titolo: targetCliente?.ragioneSociale ? `Preventivo per ${targetCliente.ragioneSociale}` : 'Nuovo Preventivo di Ristrutturazione',
      tipo: 'preventivo',
      stato: 'bozza',
      data: dataOggi,
      dataScadenza: dataScad,
      validitaGiorni: 30,
      clienteId: targetCliente ? targetCliente.id : '',
      clienteSnapshot: targetCliente || {
        id: '',
        ragioneSociale: 'Committente da definire',
        codiceFiscale: '',
        tipoCliente: 'privato',
        indirizzo: '',
        cap: '',
        citta: '',
        provincia: '',
        telefono: '',
        email: '',
        dataCreazione: dataOggi
      },
      cantiere: {
        oggetto: 'Opere edili e impiantistiche',
        indirizzo: targetCliente?.indirizzo || '',
        citta: targetCliente?.citta || '',
        cap: targetCliente?.cap || '',
        provincia: targetCliente?.provincia || ''
      },
      capitoli: [
        {
          id: `cap-${Date.now()}-1`,
          titolo: 'Capitolo 1 - Opere Murarie ed Edili',
          ordine: 1
        }
      ],
      righe: [],
      oneriSicurezzaTipo: 'percentuale',
      oneriSicurezzaValore: 3.5,
      cassaPrevidenzialeAttiva: false,
      cassaPrevidenzialeNome: 'Cassa Edile',
      cassaPrevidenzialeTipo: 'percentuale',
      cassaPrevidenzialeValore: 0,
      cassaPrevidenzialePerc: 0,
      ivaPerc: 10,
      ritenutaAccontoAttiva: false,
      ritenutaAccontoPerc: 0,
      scontoGeneralePerc: 0,
      condizioniPagamento: '30% acconto all\'accettazione, 40% a SAL, 30% a saldo lavori',
      tempiEsecuzione: 'Inizio lavori entro 15 gg lavorativi dalla conferma d\'ordine',
      esclusioni: 'Fornitura corpi illuminanti, sanitari e piastrelle salvo diverso accordo scritto',
      noteFinali: 'IVA agevolata 10% ai sensi della vigente normativa sul recupero edilizio.',
      dataAggiornamento: dataOggi
    };

    setEditingDocumento(nuovo);
  };

  const handleDocumentGenerated = (doc: Documento) => {
    setDocumenti((prev) => {
      const next = [doc, ...prev];
      saveDocumenti(next);
      return next;
    });
    setEditingDocumento(doc);
  };

  // --- AZIENDA SETTINGS HANDLER ---
  const handleSaveAzienda = (nuovaAzienda: DatiAzienda) => {
    setAzienda(nuovaAzienda);
    saveDatiAzienda(nuovaAzienda);
  };

  // --- BACKUP & RESET HANDLERS ---
  const handleExportBackup = () => {
    exportBackupJson({
      clienti,
      prestazioni,
      materiali,
      vociPrezziario,
      documenti,
      azienda
    });
  };

  const handleImportBackup = async (file: File) => {
    try {
      const data = await importBackupJson(file);
      if (data) {
        setClienti(data.clienti);
        setPrestazioni(data.prestazioni);
        setMateriali(data.materiali);
        setVociPrezziario(data.vociPrezziario);
        setDocumenti(data.documenti);
        setAzienda(data.azienda);
        alert('Backup importato con successo!');
      }
    } catch (err) {
      alert('Errore durante l\'importazione del file di backup.');
    }
  };

  const handleResetData = () => {
    resetToDefaultData();
    const data = loadInitialData();
    setClienti(data.clienti);
    setPrestazioni(data.prestazioni);
    setMateriali(data.materiali);
    setVociPrezziario(data.vociPrezziario);
    setDocumenti(data.documenti);
    setAzienda(data.azienda);
    setEditingDocumento(null);
    setPrintingDocumento(null);
    setActiveTab('documenti');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      {/* Global Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setEditingDocumento(null);
          setPrintingDocumento(null);
          setActiveTab(tab);
        }}
        azienda={azienda}
        onOpenAziendaModal={() => setIsAziendaModalOpen(true)}
        onNuovoDocumento={handleNuovoDocumento}
        onExportBackup={handleExportBackup}
        onImportBackup={handleImportBackup}
        onResetData={handleResetData}
        documentiCount={documenti.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* PRINT VIEW MODE */}
        {printingDocumento ? (
          <DocumentPrintView
            documento={printingDocumento}
            azienda={azienda}
            onBack={() => setPrintingDocumento(null)}
          />
        ) : editingDocumento ? (
          /* EDITOR VIEW MODE */
          <DocumentEditor
            documento={editingDocumento}
            clienti={clienti}
            vociPrezziario={vociPrezziario}
            prestazioni={prestazioni}
            materiali={materiali}
            onSave={handleSaveDocumento}
            onOpenPrint={(doc) => setPrintingDocumento(doc)}
            onClose={() => setEditingDocumento(null)}
          />
        ) : (
          /* TAB VIEWS */
          <>
            {activeTab === 'documenti' && (
              <DocumentiSection
                documenti={documenti}
                onOpenEditor={(doc) => setEditingDocumento(doc)}
                onOpenPrint={(doc) => setPrintingDocumento(doc)}
                onNuovoDocumento={handleNuovoDocumento}
                onOpenGeneratore={() => setActiveTab('generatore')}
                onDuplicateDocumento={handleDuplicateDocumento}
                onDeleteDocumento={handleDeleteDocumento}
                onUpdateStato={handleUpdateStato}
              />
            )}

            {activeTab === 'generatore' && (
              <DocumentGeneratorSection
                clienti={clienti}
                existingDocsCount={documenti.length}
                onDocumentGenerated={handleDocumentGenerated}
              />
            )}

            {activeTab === 'prezziario' && (
              <PrezziarioSection
                vociPrezziario={vociPrezziario}
                onSaveVoce={handleSaveVocePrezziario}
                onDeleteVoce={handleDeleteVocePrezziario}
                onImportVoci={handleImportVociPrezziario}
              />
            )}

            {activeTab === 'prestazioni' && (
              <PrestazioniSection
                prestazioni={prestazioni}
                onSavePrestazione={handleSavePrestazione}
                onDeletePrestazione={handleDeletePrestazione}
                onImportPrestazioni={handleImportPrestazioni}
              />
            )}

            {activeTab === 'materiali' && (
              <MaterialiSection
                materiali={materiali}
                onSaveMateriale={handleSaveMateriale}
                onDeleteMateriale={handleDeleteMateriale}
                onImportMateriali={handleImportMateriali}
              />
            )}

            {activeTab === 'clienti' && (
              <ClientiSection
                clienti={clienti}
                documenti={documenti}
                onSaveCliente={handleSaveCliente}
                onDeleteCliente={handleDeleteCliente}
                onCreaPreventivoPerCliente={(cli) => handleNuovoDocumento(cli)}
              />
            )}
          </>
        )}
      </main>

      {/* Modal Impostazioni Azienda */}
      <ImpostazioniAziendaModal
        isOpen={isAziendaModalOpen}
        azienda={azienda}
        onSave={handleSaveAzienda}
        onClose={() => setIsAziendaModalOpen(false)}
      />
    </div>
  );
}
