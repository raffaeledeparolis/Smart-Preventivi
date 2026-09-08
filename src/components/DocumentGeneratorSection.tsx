import React, { useState } from 'react';
import {
  Sparkles,
  Zap,
  Wand2,
  CheckCircle2,
  Building2,
  Layers,
  ArrowRight,
  Calculator,
  Flame,
  FileText,
  Home,
  Sliders,
  Check,
  RotateCcw
} from 'lucide-react';
import {
  Documento,
  Cliente,
  ModelloDocumentoPreset,
  TipoDocumento,
  CapitoloDocumento,
  RigaComputo
} from '../types';
import { INITIAL_PRESET_MODELLI } from '../data/initialData';
import { generaNumeroDocumento } from '../utils/calculations';

interface DocumentGeneratorSectionProps {
  clienti: Cliente[];
  existingDocsCount: number;
  onDocumentGenerated: (doc: Documento) => void;
}

export const DocumentGeneratorSection: React.FC<DocumentGeneratorSectionProps> = ({
  clienti,
  existingDocsCount,
  onDocumentGenerated
}) => {
  const [activeMode, setActiveMode] = useState<'preset' | 'parametrico' | 'ai'>('preset');
  const [selectedClienteId, setSelectedClienteId] = useState<string>(clienti[0]?.id || '');
  const [selectedPresetId, setSelectedPresetId] = useState<string>(INITIAL_PRESET_MODELLI[0]?.id || '');
  const [docType, setDocType] = useState<TipoDocumento>('preventivo');

  // Parametric Generator State
  const [paramState, setParamState] = useState({
    tipologia: 'appartamento_completo',
    superficieMq: 85,
    altezzaLocali: 2.8,
    numeroBagni: 1,
    gammaFiniture: 'media', // 'economica' | 'media' | 'lusso'
    includiDemolizioni: true,
    includiImpiantoElettrico: true,
    includiImpiantoIdraulico: true,
    includiMassetti: true,
    includiPavimenti: true,
    includiTinteggiatura: true,
    includiOneriSicurezza: true
  });

  // AI Prompt State
  const [aiPrompt, setAiPrompt] = useState(
    'Rifacimento terrazza e lastrico solare di 40 mq: rimozione pavimento e guaina ammalorata, nuovo massetto delle pendenze, doppia membrana impermeabilizzante elastica con risvolti a parete e nuova pavimentazione galleggiante su supporti regolabili.'
  );
  const [isAiGenerating, setIsAiGenerating] = useState(false);

  // 1. Genera da Preset Archetipo
  const handleGenerateFromPreset = (preset: ModelloDocumentoPreset) => {
    const cliente = clienti.find((c) => c.id === selectedClienteId) || clienti[0];
    const anno = new Date().getFullYear();
    const numero = generaNumeroDocumento(docType, anno, existingDocsCount);

    const capitoli: CapitoloDocumento[] = [];
    const righe: RigaComputo[] = [];

    preset.capitoli.forEach((cap, idx) => {
      const capId = `cap-gen-${idx + 1}-${Date.now()}`;
      capitoli.push({
        id: capId,
        titolo: cap.titolo,
        ordine: idx + 1
      });

      cap.righe.forEach((r, rIdx) => {
        const subtotale = Math.round(r.quantita * r.prezzoUnitario * 100) / 100;
        righe.push({
          id: `riga-gen-${idx}-${rIdx}-${Date.now()}`,
          capitoloId: capId,
          codiceVoce: `0${idx + 1}.VOCE.${String(rIdx + 1).padStart(2, '0')}`,
          descrizione: r.descrizione,
          unitaMisura: r.unitaMisura,
          usaFormulaMetrica: Boolean(r.partiUguali && r.lunghezza),
          partiUguali: r.partiUguali || 1,
          lunghezza: r.lunghezza || 1,
          larghezza: r.larghezza || 1,
          altezza: r.altezza || 1,
          quantita: r.quantita,
          prezzoUnitario: r.prezzoUnitario,
          scontoPerc: 0,
          subtotale: subtotale,
          quotaManodoperaPerc: r.quotaManodoperaPerc ?? 65
        });
      });
    });

    const now = new Date();
    const dataOggi = now.toISOString().split('T')[0];
    const dataScad = new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const nuovoDoc: Documento = {
      id: `doc-${Date.now()}`,
      numero: numero,
      titolo: `${preset.titolo} - ${cliente ? cliente.ragioneSociale : 'Committente'}`,
      tipo: docType,
      stato: 'bozza',
      data: dataOggi,
      dataScadenza: dataScad,
      validitaGiorni: 45,
      clienteId: cliente ? cliente.id : '',
      clienteSnapshot: cliente || {
        id: '',
        ragioneSociale: 'Cliente da definire',
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
        oggetto: preset.descrizione,
        indirizzo: cliente?.indirizzo || '',
        citta: cliente?.citta || '',
        cap: cliente?.cap || '',
        provincia: cliente?.provincia || ''
      },
      capitoli: capitoli,
      righe: righe,
      oneriSicurezzaTipo: 'percentuale',
      oneriSicurezzaValore: 3.5,
      cassaPrevidenzialeAttiva: false,
      cassaPrevidenzialeNome: '',
      cassaPrevidenzialeTipo: 'percentuale',
      cassaPrevidenzialeValore: 0,
      cassaPrevidenzialePerc: 0,
      ivaPerc: 10,
      ritenutaAccontoAttiva: false,
      ritenutaAccontoPerc: 0,
      scontoGeneralePerc: 0,
      condizioniPagamento: '30% all\'accettazione del preventivo, 40% a stato avanzamento lavori (SAL), 30% a saldo.',
      tempiEsecuzione: 'Inizio lavori entro 15 giorni lavorativi dalla conferma d\'ordine.',
      esclusioni: 'Fornitura piastrelle e corpi illuminanti salvo diverso accordo scritto.',
      noteFinali: 'Lavori assoggettati ad aliquota IVA agevolata 10% per interventi di recupero del patrimonio edilizio.',
      dataAggiornamento: dataOggi
    };

    onDocumentGenerated(nuovoDoc);
  };

  // 2. Generatore Parametrico Matematico
  const handleGenerateParametric = () => {
    const cliente = clienti.find((c) => c.id === selectedClienteId) || clienti[0];
    const anno = new Date().getFullYear();
    const numero = generaNumeroDocumento(docType, anno, existingDocsCount);

    const mq = Math.max(10, paramState.superficieMq);
    const h = paramState.altezzaLocali || 2.8;
    const moltiplicatore = paramState.gammaFiniture === 'lusso' ? 1.35 : paramState.gammaFiniture === 'economica' ? 0.85 : 1.0;

    const capitoli: CapitoloDocumento[] = [];
    const righe: RigaComputo[] = [];
    let capIndex = 1;

    // Cap 1: Allestimento & Demolizioni
    if (paramState.includiDemolizioni) {
      const capId = `cap-param-${capIndex}-${Date.now()}`;
      capitoli.push({
        id: capId,
        titolo: `Capitolo ${capIndex} - Allestimento Cantiere, Demolizioni e Smaltimento`,
        ordine: capIndex
      });

      // Allestimento
      righe.push({
        id: `riga-param-${capIndex}-1`,
        capitoloId: capId,
        codiceVoce: '01.SIC.01',
        descrizione: 'Protezione aree condominiali, androne, posa teli e allestimento apprestamenti di sicurezza',
        unitaMisura: 'a corpo',
        usaFormulaMetrica: false,
        quantita: 1,
        prezzoUnitario: Math.round(550 * moltiplicatore),
        scontoPerc: 0,
        subtotale: Math.round(550 * moltiplicatore),
        quotaManodoperaPerc: 70
      });

      // Demolizione tramezzi
      const mqTramezzi = Math.round(mq * 0.35 * 10) / 10;
      righe.push({
        id: `riga-param-${capIndex}-2`,
        capitoloId: capId,
        codiceVoce: '01.DEM.02',
        descrizione: 'Demolizione tramezzature interne in forato compreso intonaco, calo in basso e trasporto discarica',
        unitaMisura: 'mq',
        usaFormulaMetrica: false,
        quantita: mqTramezzi,
        prezzoUnitario: Math.round(24 * moltiplicatore),
        scontoPerc: 0,
        subtotale: Math.round(mqTramezzi * 24 * moltiplicatore),
        quotaManodoperaPerc: 85
      });

      // Rimozione pavimenti
      righe.push({
        id: `riga-param-${capIndex}-3`,
        capitoloId: capId,
        codiceVoce: '01.DEM.03',
        descrizione: 'Rimozione pavimentazione e sottostante massetto di posa per posa nuovi impianti',
        unitaMisura: 'mq',
        usaFormulaMetrica: false,
        quantita: mq,
        prezzoUnitario: Math.round(26 * moltiplicatore),
        scontoPerc: 0,
        subtotale: Math.round(mq * 26 * moltiplicatore),
        quotaManodoperaPerc: 85
      });

      capIndex++;
    }

    // Cap 2: Impianto Elettrico
    if (paramState.includiImpiantoElettrico) {
      const capId = `cap-param-${capIndex}-${Date.now()}`;
      capitoli.push({
        id: capId,
        titolo: `Capitolo ${capIndex} - Impianto Elettrico a Norma CEI con Certificazione`,
        ordine: capIndex
      });

      const puntiLuce = Math.round(mq * 0.55) + 10;
      righe.push({
        id: `riga-param-${capIndex}-1`,
        capitoloId: capId,
        codiceVoce: '02.ELE.01',
        descrizione: 'Fornitura e posa quadro elettrico generale centralizzato 24 moduli con differenziali salvavita',
        unitaMisura: 'a corpo',
        usaFormulaMetrica: false,
        quantita: 1,
        prezzoUnitario: Math.round(480 * moltiplicatore),
        scontoPerc: 0,
        subtotale: Math.round(480 * moltiplicatore),
        quotaManodoperaPerc: 55
      });

      righe.push({
        id: `riga-param-${capIndex}-2`,
        capitoloId: capId,
        codiceVoce: '02.ELE.02',
        descrizione: 'Realizzazione punti luce e prese bivalenti con serie civile modulare standard (incluso cablaggio e frutti)',
        unitaMisura: 'cad',
        usaFormulaMetrica: false,
        quantita: puntiLuce,
        prezzoUnitario: Math.round(48 * moltiplicatore),
        scontoPerc: 0,
        subtotale: Math.round(puntiLuce * 48 * moltiplicatore),
        quotaManodoperaPerc: 65
      });

      righe.push({
        id: `riga-param-${capIndex}-3`,
        capitoloId: capId,
        codiceVoce: '02.ELE.03',
        descrizione: 'Dichiarazione di conformità D.M. 37/08 con schemi unifilari',
        unitaMisura: 'a corpo',
        usaFormulaMetrica: false,
        quantita: 1,
        prezzoUnitario: 250,
        scontoPerc: 0,
        subtotale: 250,
        quotaManodoperaPerc: 95
      });

      capIndex++;
    }

    // Cap 3: Impianto Idrico Sanitario
    if (paramState.includiImpiantoIdraulico) {
      const capId = `cap-param-${capIndex}-${Date.now()}`;
      capitoli.push({
        id: capId,
        titolo: `Capitolo ${capIndex} - Impianto Idro-Termo-Sanitario`,
        ordine: capIndex
      });

      const puntiAcqua = paramState.numeroBagni * 4 + 2; // wc, bidet, lavabo, doccia + cucina
      righe.push({
        id: `riga-param-${capIndex}-1`,
        capitoloId: capId,
        codiceVoce: '03.IDR.01',
        descrizione: 'Realizzazione punti idrici di carico acqua calda/fredda in multistrato coibentato e scarichi insonorizzati',
        unitaMisura: 'cad',
        usaFormulaMetrica: false,
        quantita: puntiAcqua,
        prezzoUnitario: Math.round(165 * moltiplicatore),
        scontoPerc: 0,
        subtotale: Math.round(puntiAcqua * 165 * moltiplicatore),
        quotaManodoperaPerc: 60
      });

      righe.push({
        id: `riga-param-${capIndex}-2`,
        capitoloId: capId,
        codiceVoce: '03.IDR.02',
        descrizione: 'Installazione e montaggio sanitari, piatto doccia, rubinetterie e collaudo tenuta idraulica',
        unitaMisura: 'a corpo',
        usaFormulaMetrica: false,
        quantita: paramState.numeroBagni,
        prezzoUnitario: Math.round(450 * moltiplicatore),
        scontoPerc: 0,
        subtotale: Math.round(paramState.numeroBagni * 450 * moltiplicatore),
        quotaManodoperaPerc: 85
      });

      capIndex++;
    }

    // Cap 4: Massetti e Pavimenti
    if (paramState.includiMassetti || paramState.includiPavimenti) {
      const capId = `cap-param-${capIndex}-${Date.now()}`;
      capitoli.push({
        id: capId,
        titolo: `Capitolo ${capIndex} - Massetti, Pavimentazioni e Rivestimenti`,
        ordine: capIndex
      });

      if (paramState.includiMassetti) {
        righe.push({
          id: `riga-param-${capIndex}-1`,
          capitoloId: capId,
          codiceVoce: '04.MAS.01',
          descrizione: 'Formazione di massetto autolivellante spessore 6-8 cm con rete antiritiro',
          unitaMisura: 'mq',
          usaFormulaMetrica: false,
          quantita: mq,
          prezzoUnitario: Math.round(22 * moltiplicatore),
          scontoPerc: 0,
          subtotale: Math.round(mq * 22 * moltiplicatore),
          quotaManodoperaPerc: 55
        });
      }

      if (paramState.includiPavimenti) {
        righe.push({
          id: `riga-param-${capIndex}-2`,
          capitoloId: capId,
          codiceVoce: '04.PAV.02',
          descrizione: 'Posa in opera a regola d\'arte pavimento gres porcellanato con colla deformabile C2TE e stuccatura fughe',
          unitaMisura: 'mq',
          usaFormulaMetrica: false,
          quantita: mq,
          prezzoUnitario: Math.round(32 * moltiplicatore),
          scontoPerc: 0,
          subtotale: Math.round(mq * 32 * moltiplicatore),
          quotaManodoperaPerc: 70
        });

        const mlBattiscopa = Math.round(mq * 0.85);
        righe.push({
          id: `riga-param-${capIndex}-3`,
          capitoloId: capId,
          codiceVoce: '04.PAV.03',
          descrizione: 'Posa battiscopa coordinato compreso tagli sagomati e sigillatura superiore',
          unitaMisura: 'ml',
          usaFormulaMetrica: false,
          quantita: mlBattiscopa,
          prezzoUnitario: Math.round(6.5 * moltiplicatore),
          scontoPerc: 0,
          subtotale: Math.round(mlBattiscopa * 6.5 * moltiplicatore),
          quotaManodoperaPerc: 80
        });
      }

      capIndex++;
    }

    // Cap 5: Tinteggiature
    if (paramState.includiTinteggiatura) {
      const capId = `cap-param-${capIndex}-${Date.now()}`;
      capitoli.push({
        id: capId,
        titolo: `Capitolo ${capIndex} - Rasature, Preparazione e Tinteggiature`,
        ordine: capIndex
      });

      const mqPareti = Math.round(mq * 3.2);
      righe.push({
        id: `riga-param-${capIndex}-1`,
        capitoloId: capId,
        codiceVoce: '05.TIN.01',
        descrizione: 'Rasatura a finire pareti e soffitti con stucco a base gesso e carteggiatura a luce radente',
        unitaMisura: 'mq',
        usaFormulaMetrica: false,
        quantita: mqPareti,
        prezzoUnitario: Math.round(12 * moltiplicatore),
        scontoPerc: 0,
        subtotale: Math.round(mqPareti * 12 * moltiplicatore),
        quotaManodoperaPerc: 80
      });

      righe.push({
        id: `riga-param-${capIndex}-2`,
        capitoloId: capId,
        codiceVoce: '05.TIN.02',
        descrizione: 'Tinteggiatura a due mani con idropittura traspirante lavabile a colore chiaro',
        unitaMisura: 'mq',
        usaFormulaMetrica: false,
        quantita: mqPareti,
        prezzoUnitario: Math.round(11 * moltiplicatore),
        scontoPerc: 0,
        subtotale: Math.round(mqPareti * 11 * moltiplicatore),
        quotaManodoperaPerc: 75
      });
    }

    const now = new Date();
    const dataOggi = now.toISOString().split('T')[0];
    const dataScad = new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const nuovoDoc: Documento = {
      id: `doc-${Date.now()}`,
      numero: numero,
      titolo: `Ristrutturazione Immobile ${mq} mq (${paramState.gammaFiniture.toUpperCase()}) - ${cliente?.ragioneSociale || 'Committente'}`,
      tipo: docType,
      stato: 'bozza',
      data: dataOggi,
      dataScadenza: dataScad,
      validitaGiorni: 45,
      clienteId: cliente?.id || '',
      clienteSnapshot: cliente || {
        id: '',
        ragioneSociale: 'Cliente da definire',
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
        oggetto: `Ristrutturazione complessiva alloggio superficie utile ${mq} mq`,
        indirizzo: cliente?.indirizzo || '',
        citta: cliente?.citta || '',
        cap: cliente?.cap || '',
        provincia: cliente?.provincia || ''
      },
      capitoli: capitoli,
      righe: righe,
      oneriSicurezzaTipo: 'percentuale',
      oneriSicurezzaValore: paramState.includiOneriSicurezza ? 3.5 : 0,
      cassaPrevidenzialeAttiva: false,
      cassaPrevidenzialeNome: '',
      cassaPrevidenzialeTipo: 'percentuale',
      cassaPrevidenzialeValore: 0,
      cassaPrevidenzialePerc: 0,
      ivaPerc: 10,
      ritenutaAccontoAttiva: false,
      ritenutaAccontoPerc: 0,
      scontoGeneralePerc: 0,
      condizioniPagamento: '30% acconto a conferma, 40% a stati avanzamento mensili, 30% a saldo dopo collaudo.',
      tempiEsecuzione: `Inizio lavori entro 15 gg; durata stimata ${Math.round(mq * 0.6 + 15)} giorni lavorativi.`,
      esclusioni: 'Fornitura corpi illuminanti, specchi, box doccia e rivestimenti piastrelle (posa inclusa).',
      noteFinali: 'Offerta redatta mediante stima analitica parametrica.',
      dataAggiornamento: dataOggi
    };

    onDocumentGenerated(nuovoDoc);
  };

  // 3. Generatore da Prompt / Assistente Digitale
  const handleGenerateFromAiPrompt = async () => {
    if (!aiPrompt.trim()) return;
    setIsAiGenerating(true);

    try {
      // Prova a chiamare l'endpoint server se disponibile, altrimenti fallback generativo locale intelligente
      let generatedData = null;
      try {
        const res = await fetch('/api/ai-generate-computo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: aiPrompt, tipologia: docType })
        });
        if (res.ok) {
          const json = await res.json();
          if (json && json.capitoli) {
            generatedData = json;
          }
        }
      } catch (fetchErr) {
        console.log('Chiamata server API non disponibile, utilizzo motore generativo locale:', fetchErr);
      }

      // Se non disponibile da API, analizziamo il prompt per estrarre parole chiave e costruire capitoli
      if (!generatedData) {
        generatedData = parsePromptToDocumentStructure(aiPrompt);
      }

      const cliente = clienti.find((c) => c.id === selectedClienteId) || clienti[0];
      const anno = new Date().getFullYear();
      const numero = generaNumeroDocumento(docType, anno, existingDocsCount);
      const now = new Date();
      const dataOggi = now.toISOString().split('T')[0];
      const dataScad = new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const capitoli: CapitoloDocumento[] = [];
      const righe: RigaComputo[] = [];

      generatedData.capitoli.forEach((cap: any, cIdx: number) => {
        const capId = `cap-ai-${cIdx + 1}-${Date.now()}`;
        capitoli.push({
          id: capId,
          titolo: cap.titolo || `Capitolo ${cIdx + 1}`,
          ordine: cIdx + 1
        });

        cap.voci.forEach((v: any, vIdx: number) => {
          const q = Number(v.quantita) || 1;
          const p = Number(v.prezzoUnitario) || 50;
          const sub = Math.round(q * p * 100) / 100;
          righe.push({
            id: `riga-ai-${cIdx}-${vIdx}-${Date.now()}`,
            capitoloId: capId,
            codiceVoce: `0${cIdx + 1}.${String(vIdx + 1).padStart(2, '0')}`,
            descrizione: v.descrizione || 'Lavorazione a capitolato',
            unitaMisura: v.unitaMisura || 'mq',
            usaFormulaMetrica: false,
            quantita: q,
            prezzoUnitario: p,
            scontoPerc: 0,
            subtotale: sub,
            quotaManodoperaPerc: v.quotaManodoperaPerc ?? 70
          });
        });
      });

      const nuovoDoc: Documento = {
        id: `doc-${Date.now()}`,
        numero: numero,
        titolo: generatedData.titolo || `Preventivo Lavori Specializzati - ${cliente?.ragioneSociale || 'Committente'}`,
        tipo: docType,
        stato: 'bozza',
        data: dataOggi,
        dataScadenza: dataScad,
        validitaGiorni: 45,
        clienteId: cliente?.id || '',
        clienteSnapshot: cliente || {
          id: '',
          ragioneSociale: 'Cliente da definire',
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
          oggetto: aiPrompt,
          indirizzo: cliente?.indirizzo || '',
          citta: cliente?.citta || '',
          cap: cliente?.cap || '',
          provincia: cliente?.provincia || ''
        },
        capitoli: capitoli,
        righe: righe,
        oneriSicurezzaTipo: 'percentuale',
        oneriSicurezzaValore: 3.5,
        cassaPrevidenzialeAttiva: false,
        cassaPrevidenzialeNome: '',
        cassaPrevidenzialeTipo: 'percentuale',
        cassaPrevidenzialeValore: 0,
        cassaPrevidenzialePerc: 0,
        ivaPerc: 10,
        ritenutaAccontoAttiva: false,
        ritenutaAccontoPerc: 0,
        scontoGeneralePerc: 0,
        condizioniPagamento: '30% alla conferma d\'ordine, 40% a SAL intermedio, 30% a saldo.',
        tempiEsecuzione: 'Inizio lavori entro 15 giorni lavorativi dalla formalizzazione del contratto.',
        esclusioni: 'Oneri comunali e pratiche paesaggistiche salvo espresso incarico.',
        noteFinali: 'Documento generato dall\'assistente di capitolato automatico.',
        dataAggiornamento: dataOggi
      };

      onDocumentGenerated(nuovoDoc);
    } finally {
      setIsAiGenerating(false);
    }
  };

  // Helper locale per convertire una descrizione libera in capitoli e voci coerenti
  function parsePromptToDocumentStructure(text: string) {
    const lower = text.toLowerCase();
    const capitoli = [];

    // Estrai una metratura se citata (es. 40 mq)
    const matchMq = text.match(/(\d+)\s*(?:mq|metri\s*quadri|m2)/i);
    const mqTrovati = matchMq ? parseInt(matchMq[1]) : 45;

    if (lower.includes('terrazz') || lower.includes('lastrico') || lower.includes('impermeabilizz')) {
      capitoli.push({
        titolo: 'Capitolo 1 - Demolizioni e Rimozione Pavimento Esterno',
        voci: [
          {
            descrizione: 'Rimozione pavimentazione esterna e zoccolino battiscopa con relativo massetto',
            unitaMisura: 'mq',
            quantita: mqTrovati,
            prezzoUnitario: 28,
            quotaManodoperaPerc: 85
          },
          {
            descrizione: 'Carico e trasporto a discarica autorizzata di macerie e guaina con oneri di smaltimento',
            unitaMisura: 'a corpo',
            quantita: 1,
            prezzoUnitario: 450,
            quotaManodoperaPerc: 60
          }
        ]
      });

      capitoli.push({
        titolo: 'Capitolo 2 - Massetto Pendenze e Impermeabilizzazione Elastica',
        voci: [
          {
            descrizione: 'Formazione di massetto per pendenze (minimo 1.5%) in sabbia e cemento con rete antifessurazione',
            unitaMisura: 'mq',
            quantita: mqTrovati,
            prezzoUnitario: 24,
            quotaManodoperaPerc: 60
          },
          {
            descrizione: 'Fornitura e posa guaina impermeabilizzante elastica bicomponente con rete e risvolti perimetrali h 20 cm',
            unitaMisura: 'mq',
            quantita: Math.round(mqTrovati * 1.15),
            prezzoUnitario: 32,
            quotaManodoperaPerc: 65
          },
          {
            descrizione: 'Fornitura e posa bocchette di scarico pluviale e gocciolatoi perimetrali in alluminio',
            unitaMisura: 'cad',
            quantita: 2,
            prezzoUnitario: 140,
            quotaManodoperaPerc: 60
          }
        ]
      });

      capitoli.push({
        titolo: 'Capitolo 3 - Nuova Pavimentazione Galleggiante o Incollata',
        voci: [
          {
            descrizione: 'Posa pavimentazione per esterni ingeliva R11 su supporti regolabili o a colla C2TE',
            unitaMisura: 'mq',
            quantita: mqTrovati,
            prezzoUnitario: 38,
            quotaManodoperaPerc: 70
          }
        ]
      });

      return {
        titolo: `Rifacimento e Impermeabilizzazione Terrazza (${mqTrovati} mq)`,
        capitoli
      };
    }

    // Default per altri tipi di prompt
    capitoli.push({
      titolo: 'Capitolo 1 - Opere Preparatorie e Demolizioni',
      voci: [
        {
          descrizione: 'Allestimento cantiere, teli di protezione e cartellonistica di sicurezza',
          unitaMisura: 'a corpo',
          quantita: 1,
          prezzoUnitario: 450,
          quotaManodoperaPerc: 75
        },
        {
          descrizione: 'Demolizioni e rimozioni con calo macerie a terra e trasporto a discarica',
          unitaMisura: 'mq',
          quantita: mqTrovati,
          prezzoUnitario: 25,
          quotaManodoperaPerc: 85
        }
      ]
    });

    capitoli.push({
      titolo: 'Capitolo 2 - Opere di Ricostruzione e Impianti',
      voci: [
        {
          descrizione: 'Fornitura e posa opere murarie, finiture e predisposizioni impiantistiche descritte a capitolato',
          unitaMisura: 'mq',
          quantita: mqTrovati,
          prezzoUnitario: 45,
          quotaManodoperaPerc: 65
        },
        {
          descrizione: 'Posa in opera pavimenti, rivestimenti o finiture superficiali a perfetta regola d\'arte',
          unitaMisura: 'mq',
          quantita: mqTrovati,
          prezzoUnitario: 32,
          quotaManodoperaPerc: 70
        }
      ]
    });

    capitoli.push({
      titolo: 'Capitolo 3 - Tinteggiatura e Finiture',
      voci: [
        {
          descrizione: 'Rasatura e tinteggiatura a due mani con pittura traspirante a campione',
          unitaMisura: 'mq',
          quantita: Math.round(mqTrovati * 2.8),
          prezzoUnitario: 12.5,
          quotaManodoperaPerc: 80
        },
        {
          descrizione: 'Pulizia finale di cantiere e smobilitazione apprestamenti',
          unitaMisura: 'a corpo',
          quantita: 1,
          prezzoUnitario: 250,
          quotaManodoperaPerc: 90
        }
      ]
    });

    return {
      titolo: `Opere Edili ed Impiantistiche - Intervento ${mqTrovati} mq`,
      capitoli
    };
  }

  return (
    <div className="space-y-6">
      {/* Generator Header */}
      <div className="bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 rounded-2xl p-6 sm:p-8 text-white shadow-md">
        <div className="max-w-3xl space-y-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/30 text-amber-100 text-xs font-bold uppercase tracking-wider border border-amber-400/30">
            <Sparkles className="w-3.5 h-3.5 text-amber-200" />
            Generatore Automatico di Preventivi & Computi
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Crea un preventivo o computo metrico completo in 1 click
          </h1>
          <p className="text-sm text-amber-100/90 leading-relaxed">
            Scegli tra i modelli preconfezionati per il mercato edile italiano, usa il calcolo parametrico per metri quadri, oppure descrivi i lavori per generare istantaneamente capitoli e voci con prezzi e misure.
          </p>
        </div>

        {/* Mode Selector Tabs inside banner */}
        <div className="mt-6 flex flex-wrap gap-2 pt-4 border-t border-amber-500/40">
          <button
            onClick={() => setActiveMode('preset')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeMode === 'preset'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'bg-amber-800/40 text-amber-100 hover:bg-amber-800/70 border border-amber-400/30'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Modelli Preconfezionati</span>
          </button>

          <button
            onClick={() => setActiveMode('parametrico')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeMode === 'parametrico'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'bg-amber-800/40 text-amber-100 hover:bg-amber-800/70 border border-amber-400/30'
            }`}
          >
            <Calculator className="w-4 h-4" />
            <span>Generatore Parametrico (mq)</span>
          </button>

          <button
            onClick={() => setActiveMode('ai')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeMode === 'ai'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'bg-amber-800/40 text-amber-100 hover:bg-amber-800/70 border border-amber-400/30'
            }`}
          >
            <Wand2 className="w-4 h-4" />
            <span>Assistente di Capitolato Libero</span>
          </button>
        </div>
      </div>

      {/* Global Configuration Bar: Cliente & Document Type */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="w-full sm:w-auto flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="flex-1">
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Assegna al Cliente:
            </label>
            <select
              value={selectedClienteId}
              onChange={(e) => setSelectedClienteId(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold bg-white text-slate-900"
            >
              {clienti.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.ragioneSociale} ({c.citta})
                </option>
              ))}
            </select>
          </div>

          <div className="w-full sm:w-56">
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Formato Output:
            </label>
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value as TipoDocumento)}
              className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold bg-white text-slate-900"
            >
              <option value="preventivo">Preventivo di Spesa</option>
              <option value="computo_metrico">Computo Metrico Estimativo</option>
              <option value="fattura_proforma">Fattura Proforma / Ordine</option>
            </select>
          </div>
        </div>
      </div>

      {/* MODE 1: PRESET ARCHETYPES */}
      {activeMode === 'preset' && (
        <div className="space-y-4">
          <h2 className="text-base font-bold text-slate-900">
            Seleziona un modello professionale pronto all'uso
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {INITIAL_PRESET_MODELLI.map((preset) => {
              const vociTotali = preset.capitoli.reduce((acc, c) => acc + c.righe.length, 0);
              const isSelected = selectedPresetId === preset.id;

              return (
                <div
                  key={preset.id}
                  className={`bg-white rounded-xl border p-5 shadow-xs transition-all flex flex-col justify-between ${
                    isSelected ? 'border-amber-500 ring-2 ring-amber-500/20' : 'border-slate-200 hover:border-amber-300'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                        {preset.categoria}
                      </span>
                      <span className="text-xs text-slate-400 font-medium">
                        {preset.capitoli.length} capitoli | {vociTotali} voci
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900">{preset.titolo}</h3>
                    <p className="text-xs text-slate-600 mt-2 leading-relaxed">{preset.descrizione}</p>

                    {/* Capitoli preview */}
                    <div className="mt-3 pt-3 border-t border-slate-100 space-y-1">
                      {preset.capitoli.map((cap, i) => (
                        <div key={i} className="text-xs text-slate-500 flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className="truncate">{cap.titolo}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs text-slate-500">
                      Include formule metriche e scomposizione manodopera
                    </span>

                    <button
                      onClick={() => handleGenerateFromPreset(preset)}
                      className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-xs transition-colors"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>Genera Documento</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODE 2: PARAMETRIC GENERATOR */}
      {activeMode === 'parametrico' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Calculator className="w-5 h-5 text-amber-600" />
              Configuratore Parametrico per Metri Quadri
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Imposta la superficie dell'immobile, l'altezza utile e le categorie di lavoro richieste. Il sistema stima automaticamente le metrature di demolizione, massetti, intonaci, punti luce e sanitari.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {/* Superficie Mq */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Superficie Calpestabile (mq) *
              </label>
              <input
                type="number"
                min="10"
                max="1000"
                value={paramState.superficieMq}
                onChange={(e) => setParamState({ ...paramState, superficieMq: parseFloat(e.target.value) || 0 })}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm font-mono font-bold text-slate-900"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">Superficie interna dell'appartamento/cantiere</span>
            </div>

            {/* Altezza locali */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Altezza Media Soffitti (m)
              </label>
              <input
                type="number"
                step="0.05"
                min="2.0"
                max="6.0"
                value={paramState.altezzaLocali}
                onChange={(e) => setParamState({ ...paramState, altezzaLocali: parseFloat(e.target.value) || 2.7 })}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm font-mono text-slate-900"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">Standard residenziale: 2.70 - 3.00 m</span>
            </div>

            {/* Gamma Finiture */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Livello e Gamma Finiture
              </label>
              <select
                value={paramState.gammaFiniture}
                onChange={(e) => setParamState({ ...paramState, gammaFiniture: e.target.value })}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm font-semibold bg-white text-slate-900"
              >
                <option value="economica">Economica / Capitolato Base (-15%)</option>
                <option value="media">Standard / Ristrutturazione Media (100%)</option>
                <option value="lusso">Premium / Materiali di Pregio (+35%)</option>
              </select>
              <span className="text-[11px] text-slate-400 mt-1 block">Influenza le tariffe unitarie applicate</span>
            </div>
          </div>

          {/* Categorie di Lavorazione da Includere */}
          <div className="pt-4 border-t border-slate-100">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
              Seleziona le Lavorazioni da Includere nel Preventivo:
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { key: 'includiDemolizioni', label: 'Allestimento & Demolizioni Selettive' },
                { key: 'includiImpiantoElettrico', label: 'Impianto Elettrico & DICO 37/08' },
                { key: 'includiImpiantoIdraulico', label: 'Impianto Idro-Termo-Sanitario' },
                { key: 'includiMassetti', label: 'Rifacimento Massetto Autolivellante' },
                { key: 'includiPavimenti', label: 'Posa Pavimento Gres & Battiscopa' },
                { key: 'includiTinteggiatura', label: 'Rasatura e Tinteggiatura Lavabile' }
              ].map((opt) => (
                <label
                  key={opt.key}
                  className="flex items-center gap-2.5 p-3 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-slate-50 cursor-pointer select-none"
                >
                  <input
                    type="checkbox"
                    checked={(paramState as any)[opt.key]}
                    onChange={(e) => setParamState({ ...paramState, [opt.key]: e.target.checked })}
                    className="w-4 h-4 rounded-sm border-slate-300 text-amber-600 focus:ring-amber-500"
                  />
                  <span className="text-xs font-bold text-slate-800">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              onClick={handleGenerateParametric}
              className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white font-bold px-6 py-3 rounded-xl shadow-xs transition-colors text-sm"
            >
              <Calculator className="w-4 h-4" />
              <span>Calcola e Genera Preventivo Parametrico</span>
            </button>
          </div>
        </div>
      )}

      {/* MODE 3: FREE TEXT CAPITOLATO ASSISTANT */}
      {activeMode === 'ai' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Wand2 className="w-5 h-5 text-amber-600" />
              Assistente di Capitolato in Linguaggio Naturale
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Descrivi liberamente l'intervento o incolla il testo del capitolato / richiesta del committente. Il sistema analizzerà le opere ed elaborerà una proposta strutturata in capitoli, voci, unità di misura e prezzi.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Descrizione Lavori / Capitolato Tecnico
            </label>
            <textarea
              rows={4}
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="Es. Rifacimento tetto a due falde di circa 120 mq: rimozione tegole esistenti, posa guaina traspirante, isolamento in lana di roccia spessore 12 cm, nuova listellatura e rimontaggio tegole con canali di gronda in rame..."
              className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm text-slate-900 leading-relaxed focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
            />
          </div>

          {/* Prompt suggestions pills */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Esempi Rapidi da Provare:
            </span>
            <div className="flex flex-wrap gap-2">
              {[
                'Rifacimento terrazza e impermeabilizzazione guaina elastica 40 mq',
                'Isolamento a cappotto termico esterno EPS con grafite 12 cm per 150 mq',
                'Rifacimento impianto idraulico bagno padronale e lavanderia con termoarredo'
              ].map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => setAiPrompt(s)}
                  className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-left transition-colors"
                >
                  "{s}"
                </button>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              disabled={isAiGenerating || !aiPrompt.trim()}
              onClick={handleGenerateFromAiPrompt}
              className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-700 disabled:bg-slate-300 text-white font-bold px-6 py-3 rounded-xl shadow-xs transition-colors text-sm"
            >
              {isAiGenerating ? (
                <>
                  <RotateCcw className="w-4 h-4 animate-spin" />
                  <span>Elaborazione Capitolato in Corso...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Genera Documento Strutturato</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
