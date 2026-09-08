import {
  Cliente,
  Prestazione,
  Materiale,
  VocePrezziario,
  Documento,
  DatiAzienda,
  ModelloDocumentoPreset
} from '../types';

export const INITIAL_AZIENDA: DatiAzienda = {
  ragioneSociale: 'EDILTECNICA RESTAURI & COSTRUZIONI S.R.L.',
  sottotitolo: 'Opere Edili, Ristrutturazioni Civili, Impiantistica e Manutenzioni Immobiliari',
  partitaIva: '08429180963',
  codiceFiscale: '08429180963',
  iscrizioneRea: 'MI - 2038491',
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
  condizioniStandard:
    'Offerta valida per 30 giorni dalla data di emissione. Lavori eseguiti a regola d\'arte ai sensi del D.M. 37/08 e NTC vigenti. I pagamenti si intendono al netto degli oneri di legge. Eventuali opere extra capitolato verranno preventivamente concordate per iscritto.'
};

export const INITIAL_CLIENTI: Cliente[] = [
  {
    id: 'cli-01',
    ragioneSociale: 'Immobiliare San Marco S.r.l.',
    referente: 'Ing. Roberto Ferri',
    piva: '04918230154',
    codiceFiscale: '04918230154',
    tipoCliente: 'azienda',
    indirizzo: 'Corso Buenos Aires, 78',
    cap: '20124',
    citta: 'Milano',
    provincia: 'MI',
    telefono: '+39 02 4892 1100',
    email: 'gestione.cantieri@sanmarcoimmobili.it',
    pec: 'sanmarcoimmobiliare@pec.it',
    codiceSdi: 'M5UXCR1',
    note: 'Cliente business continuativo. Applicazione IVA 10% per ristrutturazioni.',
    dataCreazione: '2026-01-15'
  },
  {
    id: 'cli-02',
    ragioneSociale: 'Condominio Residenza I Tigli',
    referente: 'Studio Amministrazione Dott.ssa Colombo',
    codiceFiscale: '97812030159',
    tipoCliente: 'condominio',
    indirizzo: 'Via Monte Rosa, 15',
    cap: '20149',
    citta: 'Milano',
    provincia: 'MI',
    telefono: '+39 02 6671 9044',
    email: 'amm.colombo@studiorosati.com',
    codiceSdi: '0000000',
    note: 'Richiesto computo metrico dettagliato da allegare alla delibera assembleare.',
    dataCreazione: '2026-02-01'
  },
  {
    id: 'cli-03',
    ragioneSociale: 'Arch. Matteo Valenti & Famiglia',
    referente: 'Matteo Valenti',
    codiceFiscale: 'VLNMTT82C14F205K',
    tipoCliente: 'privato',
    indirizzo: 'Via dei Giardini, 8',
    cap: '20121',
    citta: 'Milano',
    provincia: 'MI',
    telefono: '+39 347 9128 402',
    email: 'm.valenti.arch@gmail.com',
    codiceSdi: '0000000',
    note: 'Ristrutturazione residenziale con detrazione fiscale per recupero edilizio (50%).',
    dataCreazione: '2026-02-20'
  }
];

export const INITIAL_PRESTAZIONI: Prestazione[] = [
  {
    id: 'prs-01',
    codice: 'OP-DEM-01',
    titolo: 'Demolizione controllata di tramezzature',
    categoria: 'Demolizioni & Rimozioni',
    unitaMisura: 'mq',
    costoOrario: 28.0,
    ricaricoPerc: 30,
    prezzoConsigliato: 24.0,
    note: 'Inclusa discesa al piano e carico su autocarro per trasporto a discarica autorizzata.'
  },
  {
    id: 'prs-02',
    codice: 'OP-MUR-02',
    titolo: 'Assistenza muraria a impiantisti (idraulico/elettricista)',
    categoria: 'Opere Murarie',
    unitaMisura: 'h',
    costoOrario: 30.0,
    ricaricoPerc: 35,
    prezzoConsigliato: 42.0,
    note: 'Esecuzione tracce a parete, chiusura tracce con malta bastarda e rasatura.'
  },
  {
    id: 'prs-03',
    codice: 'OP-CAR-03',
    titolo: 'Posa in opera controparete o tramezzo in cartongesso',
    categoria: 'Cartongessi & Isolamenti',
    unitaMisura: 'mq',
    costoOrario: 32.0,
    ricaricoPerc: 30,
    prezzoConsigliato: 38.0,
    note: 'Compreso orditura metallica zincata 50/75mm e stuccatura giunti Q2.'
  },
  {
    id: 'prs-04',
    codice: 'OP-TIN-04',
    titolo: 'Tinteggiatura a due mani con idropittura traspirante/lavabile',
    categoria: 'Tinteggiature & Finiture',
    unitaMisura: 'mq',
    costoOrario: 26.0,
    ricaricoPerc: 35,
    prezzoConsigliato: 14.5,
    note: 'Compresa mascheratura con nastro carta, preparazione del supporto e mano di fissativo.'
  },
  {
    id: 'prs-05',
    codice: 'OP-PAV-05',
    titolo: 'Posa in opera di pavimento o rivestimento in gres porcellanato',
    categoria: 'Pavimenti & Rivestimenti',
    unitaMisura: 'mq',
    costoOrario: 34.0,
    ricaricoPerc: 25,
    prezzoConsigliato: 32.0,
    note: 'Posa a colla a correre o fugata, stuccatura giunti con sigillante epossidico o cementizio.'
  },
  {
    id: 'prs-06',
    codice: 'OP-MAS-06',
    titolo: 'Formazione di massetto autolivellante o alleggerito',
    categoria: 'Opere Murarie',
    unitaMisura: 'mq',
    costoOrario: 28.0,
    ricaricoPerc: 30,
    prezzoConsigliato: 22.0,
    note: 'Spessore medio 5cm, compresa rete elettrosaldata antifessurazione.'
  },
  {
    id: 'prs-07',
    codice: 'OP-DIR-07',
    titolo: 'Direzione tecnica cantiere e sicurezza (D.Lgs 81/08)',
    categoria: 'Servizi Tecnici',
    unitaMisura: 'a corpo',
    costoOrario: 65.0,
    ricaricoPerc: 20,
    prezzoConsigliato: 1200.0,
    note: 'Coordinamento maestranze, redazione POS e controllo conformità normativa.'
  }
];

export const INITIAL_MATERIALI: Materiale[] = [
  {
    id: 'mat-01',
    codice: 'MAT-CEM-01',
    nome: 'Cemento Portland 32.5 R (sacco 25 kg)',
    categoria: 'Leganti & Inerti',
    marca: 'Italcementi',
    unitaMisura: 'sacco',
    prezzoAcquisto: 4.8,
    ricaricoPerc: 35,
    prezzoVendita: 6.5,
    fornitore: 'EdilMarket S.p.A.',
    scorta: 120
  },
  {
    id: 'mat-02',
    codice: 'MAT-CAR-02',
    nome: 'Lastra cartongesso standard 12.5mm (120x200 cm)',
    categoria: 'Cartongessi & Lastre',
    marca: 'Knauf GKB',
    unitaMisura: 'mq',
    prezzoAcquisto: 4.2,
    ricaricoPerc: 40,
    prezzoVendita: 5.9,
    fornitore: 'Centro Cartongesso Nord',
    scorta: 85
  },
  {
    id: 'mat-03',
    codice: 'MAT-ISO-03',
    nome: 'Pannello isolante in lana di roccia sp. 50mm (densità 70 kg/mc)',
    categoria: 'Isolamento Termoacustico',
    marca: 'Rockwool Acoustic',
    unitaMisura: 'mq',
    prezzoAcquisto: 7.5,
    ricaricoPerc: 35,
    prezzoVendita: 10.2,
    fornitore: 'IsolSystem Italia',
    scorta: 60
  },
  {
    id: 'mat-04',
    codice: 'MAT-PITT-04',
    nome: 'Idropittura superlavabile traspirante bianca (fusto 14 lt)',
    categoria: 'Colori & Vernici',
    marca: 'Sikkens Alpha Tex',
    unitaMisura: 'lt',
    prezzoAcquisto: 5.2,
    ricaricoPerc: 45,
    prezzoVendita: 7.5,
    fornitore: 'Colorificio Lombardo',
    scorta: 40
  },
  {
    id: 'mat-05',
    codice: 'MAT-COL-05',
    nome: 'Adesivo cementizio flessibile C2TE S1 per grandi formati (25 kg)',
    categoria: 'Adesivi & Sigillanti',
    marca: 'Mapei Keraflex Maxi S1',
    unitaMisura: 'sacco',
    prezzoAcquisto: 16.5,
    ricaricoPerc: 30,
    prezzoVendita: 21.5,
    fornitore: 'EdilMarket S.p.A.',
    scorta: 50
  },
  {
    id: 'mat-06',
    codice: 'MAT-ELE-06',
    nome: 'Cavo antincendio FG16OR16 3G2.5 mmq (matassa 100 m)',
    categoria: 'Materiale Elettrico',
    marca: 'Prysmian Group',
    unitaMisura: 'ml',
    prezzoAcquisto: 1.1,
    ricaricoPerc: 40,
    prezzoVendita: 1.55,
    fornitore: 'Sonepar Elettroforniture',
    scorta: 300
  },
  {
    id: 'mat-07',
    codice: 'MAT-IDR-07',
    nome: 'Tubo multistrato coibentato 16x2 per riscaldamento/sanitario',
    categoria: 'Idraulica & Tubazioni',
    marca: 'Valsir Pexal',
    unitaMisura: 'ml',
    prezzoAcquisto: 1.6,
    ricaricoPerc: 35,
    prezzoVendita: 2.2,
    fornitore: 'Idrocentro S.r.l.',
    scorta: 250
  }
];

export const INITIAL_PREZZIARIO: VocePrezziario[] = [
  {
    id: 'prz-01',
    codice: '01.DEM.010',
    categoria: 'Demolizioni e Rimozioni',
    titolo: 'Demolizione tramezzature in laterizio forato',
    descrizioneBreve: 'Demolizione di murature divisorie fino a 12 cm di spessore',
    descrizioneEstesa:
      'Demolizione di murature divisorie in mattoni forati o blocchi di laterizio spessore fino a 12 cm, eseguita a mano o con motopicchi, compreso lo scrostamento dell\'intonaco, la cernita dei materiali, il calo in basso con condotto o a braccia, e il trasporto ad impianto di recupero autorizzato.',
    unitaMisura: 'mq',
    prezzoUnitario: 24.5,
    quotaManodopera: 80,
    quotaMateriali: 20
  },
  {
    id: 'prz-02',
    codice: '01.DEM.020',
    categoria: 'Demolizioni e Rimozioni',
    titolo: 'Rimozione pavimento e sottostante massetto',
    descrizioneBreve: 'Demolizione pavimento in piastrelle e massetto spessore 6-8 cm',
    descrizioneEstesa:
      'Rimozione e demolizione di pavimentazione di qualsiasi tipo (ceramica, gres, marmette) compreso il relativo massetto di posa in sabbia e cemento fino a 8 cm di spessore, compreso il carico, trasporto e oneri di smaltimento a discarica.',
    unitaMisura: 'mq',
    prezzoUnitario: 28.0,
    quotaManodopera: 85,
    quotaMateriali: 15
  },
  {
    id: 'prz-03',
    codice: '02.MUR.015',
    categoria: 'Opere Murarie e Strutturali',
    titolo: 'Nuova muratura in forati spessore 8 cm',
    descrizioneBreve: 'Costruzione tramezzo in mattoni forati con malta cementizia',
    descrizioneEstesa:
      'Tramezzatura interna realizzata con blocchi forati di laterizio spessore 8 cm, allettati con malta cementizia a prestazione garantita, compreso ammorsature alle strutture esistenti, formazione di architravi su vani porta, tagli e sfridi.',
    unitaMisura: 'mq',
    prezzoUnitario: 39.0,
    quotaManodopera: 65,
    quotaMateriali: 35
  },
  {
    id: 'prz-04',
    codice: '02.MUR.030',
    categoria: 'Opere Murarie e Strutturali',
    titolo: 'Massetto di sottofondo alleggerito per passaggio impianti',
    descrizioneBreve: 'Sottofondo in calcestruzzo cellulare alleggerito spessore 7-10 cm',
    descrizioneEstesa:
      'Fornitura e posa in opera di sottofondo per pavimenti alleggerito con perlite o polistirolo espanso per il perfetto inglobamento e protezione delle tubazioni impiantistiche, steso a staggia e livellato a perfetta planarità.',
    unitaMisura: 'mq',
    prezzoUnitario: 18.5,
    quotaManodopera: 50,
    quotaMateriali: 50
  },
  {
    id: 'prz-05',
    codice: '03.CAR.010',
    categoria: 'Cartongesso e Controsoffitti',
    titolo: 'Controparete in cartongesso con isolamento termoacustico',
    descrizioneBreve: 'Lastra 12.5mm su orditura metallica 50mm con lana di roccia',
    descrizioneEstesa:
      'Realizzazione di controparete interna costituita da orditura metallica a montanti zincati sp. 6/10 da 50 mm, pannelli in lana minerale densità 50 kg/mc interposti, rivestimento con lastra in cartongesso standard 12.5 mm, stuccatura dei giunti con nastro microforato e finitura Q2.',
    unitaMisura: 'mq',
    prezzoUnitario: 42.0,
    quotaManodopera: 55,
    quotaMateriali: 45
  },
  {
    id: 'prz-06',
    codice: '04.IMP.010',
    categoria: 'Impianti Elettrici e Speciali',
    titolo: 'Punto luce completo e certificato (Serie civile standard)',
    descrizioneBreve: 'Punto luce comando o presa 10/16A Bticino/Vimar compreso cablaggio',
    descrizioneEstesa:
      'Realizzazione di punto luce o punto presa 10/16A civile, compreso scatola di derivazione 503, supporto, frutti serie LivingLight o Vimar Plana, placca 3 posti, tubazione corrugata autoestinguente, conduttori antifiamma da 1.5 a 2.5 mmq, collegamenti e collaudo con dichiarazione di conformità.',
    unitaMisura: 'cad',
    prezzoUnitario: 48.0,
    quotaManodopera: 60,
    quotaMateriali: 40
  },
  {
    id: 'prz-07',
    codice: '04.IMP.025',
    categoria: 'Impianti Idraulici e Termici',
    titolo: 'Punto idrico per carico e scarico sanitario',
    descrizioneBreve: 'Punto acqua calda/fredda e scarico per lavabo/bidet/doccia/wc',
    descrizioneEstesa:
      'Realizzazione di punto idrico completo con tubazione multistrato coibentato per acqua sanitaria calda e fredda, collettore di distribuzione, tubazione di scarico in PP insonorizzato ad innesto rapido con pendenza idonea, raccordi a pressare e prova di tenuta idraulica.',
    unitaMisura: 'cad',
    prezzoUnitario: 165.0,
    quotaManodopera: 55,
    quotaMateriali: 45
  },
  {
    id: 'prz-08',
    codice: '05.PAV.020',
    categoria: 'Pavimenti e Rivestimenti',
    titolo: 'Posa pavimento gres porcellanato medio/grande formato',
    descrizioneBreve: 'Fornitura colla C2TE e posa pavimento con fuga 2mm',
    descrizioneEstesa:
      'Posa in opera di piastrelle in gres porcellanato fino al formato 60x120 cm su idoneo massetto, compreso collante adesivo elastico deformabile, distanziatori a cuneo autolivellanti, tagli sagomati e sigillatura fughe.',
    unitaMisura: 'mq',
    prezzoUnitario: 34.0,
    quotaManodopera: 70,
    quotaMateriali: 30
  },
  {
    id: 'prz-09',
    codice: '06.TIN.015',
    categoria: 'Tinteggiature e Verniciature',
    titolo: 'Rasatura e tinteggiatura a finire lavabile antimuffa',
    descrizioneBreve: 'Doppia mano di rasatura a gesso/stucco e 2 mani di pittura lavabile',
    descrizioneEstesa:
      'Trattamento pareti interne con applicazione di isolante fissativo acrilico ad alta penetrazione, doppia rasatura con stucco riempitivo, carteggiatura con levigatrice orbitale a luce radente, e applicazione di due mani di pittura lavabile con additivo igienizzante.',
    unitaMisura: 'mq',
    prezzoUnitario: 16.5,
    quotaManodopera: 75,
    quotaMateriali: 25
  },
  {
    id: 'prz-10',
    codice: '07.SIC.005',
    categoria: 'Sicurezza e Allestimento Cantiere',
    titolo: 'Allestimento cantiere, recinzione e protezione parti comuni',
    descrizioneBreve: 'Protezione androne, ascensore, posa estintori e cartellonistica',
    descrizioneEstesa:
      'Fornitura e posa in opera di teli in polionda e nastro adesivo removibile per protezione vano scale, pianerottoli e cabina ascensore; fornitura cassetta di primo soccorso ed estintori omologati; predisposizione impianto elettrico di cantiere con quadro ASC a norma.',
    unitaMisura: 'a corpo',
    prezzoUnitario: 650.0,
    quotaManodopera: 60,
    quotaMateriali: 40
  }
];

export const INITIAL_PRESET_MODELLI: ModelloDocumentoPreset[] = [
  {
    id: 'mod-bagno-01',
    titolo: 'Ristrutturazione Bagno Completa (Chiavi in Mano)',
    categoria: 'Ristrutturazione Bagno',
    descrizione:
      'Pacchetto completo per rifacimento totale di un bagno da 6 a 10 mq: demolizioni, impianti nuovi, massetto, posa rivestimenti, montaggio sanitari e tinteggiatura.',
    tipoPredefinito: 'preventivo',
    capitoli: [
      {
        titolo: 'Capitolo 1 - Demolizioni e Smaltimenti',
        righe: [
          {
            descrizione: 'Rimozione sanitari esistenti (lavabo, wc, bidet, vasca o doccia) e rubinetteria',
            unitaMisura: 'a corpo',
            quantita: 1,
            prezzoUnitario: 220.0,
            quotaManodoperaPerc: 90
          },
          {
            descrizione: 'Demolizione pavimento e battiscopa esistenti compreso sottostante massetto',
            unitaMisura: 'mq',
            partiUguali: 1,
            lunghezza: 3.2,
            larghezza: 2.2,
            quantita: 7.04,
            prezzoUnitario: 28.0,
            quotaManodoperaPerc: 85
          },
          {
            descrizione: 'Demolizione rivestimento piastrelle a parete fino a h 2.20 m con intonaco',
            unitaMisura: 'mq',
            partiUguali: 2,
            lunghezza: 5.4,
            altezza: 2.2,
            quantita: 23.76,
            prezzoUnitario: 22.0,
            quotaManodoperaPerc: 85
          },
          {
            descrizione: 'Carico e trasporto a discarica autorizzata di tutti i detriti di risulta con formulario',
            unitaMisura: 'a corpo',
            quantita: 1,
            prezzoUnitario: 350.0,
            quotaManodoperaPerc: 50
          }
        ]
      },
      {
        titolo: 'Capitolo 2 - Impianto Idrico Sanitario e Termoarredo',
        righe: [
          {
            descrizione: 'Nuovo impianto idrico con collettore e linee in multistrato per 4 punti acqua (wc, bidet, lavabo, doccia)',
            unitaMisura: 'cad',
            quantita: 4,
            prezzoUnitario: 165.0,
            quotaManodoperaPerc: 60
          },
          {
            descrizione: 'Nuova linea di scarico acque nere in geberit/insonorizzato fino a colonna di scarico',
            unitaMisura: 'a corpo',
            quantita: 1,
            prezzoUnitario: 280.0,
            quotaManodoperaPerc: 70
          },
          {
            descrizione: 'Predisposizione e allacciamento scaldasalviette termoarredo con valvole cromate',
            unitaMisura: 'a corpo',
            quantita: 1,
            prezzoUnitario: 190.0,
            quotaManodoperaPerc: 65
          }
        ]
      },
      {
        titolo: 'Capitolo 3 - Massetti, Impermeabilizzazione e Finiture',
        righe: [
          {
            descrizione: 'Rifacimento massetto in sabbia e cemento con rete e additivo rapida asciugatura',
            unitaMisura: 'mq',
            partiUguali: 1,
            lunghezza: 3.2,
            larghezza: 2.2,
            quantita: 7.04,
            prezzoUnitario: 24.0,
            quotaManodoperaPerc: 60
          },
          {
            descrizione: 'Impermeabilizzazione zona doccia con guaina liquida Mapelastic e bandelle d\'angolo',
            unitaMisura: 'mq',
            quantita: 8.5,
            prezzoUnitario: 26.0,
            quotaManodoperaPerc: 65
          },
          {
            descrizione: 'Posa a regola d\'arte pavimento e rivestimento in gres con colla C2TE e stuccatura fughe',
            unitaMisura: 'mq',
            quantita: 30.8,
            prezzoUnitario: 34.0,
            quotaManodoperaPerc: 75
          },
          {
            descrizione: 'Installazione e montaggio sanitari, rubinetterie, piatto doccia e box doccia',
            unitaMisura: 'a corpo',
            quantita: 1,
            prezzoUnitario: 450.0,
            quotaManodoperaPerc: 85
          },
          {
            descrizione: 'Tinteggiatura a soffitto con pittura traspirante antimuffa 2 mani',
            unitaMisura: 'mq',
            quantita: 7.04,
            prezzoUnitario: 15.0,
            quotaManodoperaPerc: 75
          }
        ]
      }
    ]
  },
  {
    id: 'mod-elettrico-02',
    titolo: 'Rifacimento Impianto Elettrico a Norma (con Certificazione D.M. 37/08)',
    categoria: 'Impiantistica Elettrica',
    descrizione:
      'Adeguamento o rifacimento integrale impianto elettrico per appartamento civile abitazione 70-90 mq con quadro generale, differenziali selettivi e dichiarazione di conformità.',
    tipoPredefinito: 'preventivo',
    capitoli: [
      {
        titolo: 'Capitolo 1 - Centralino e Distribuzione Principale',
        righe: [
          {
            descrizione: 'Fornitura e posa centralino incasso 24 moduli con interruttore generale magneto-termico differenziale tipo A e selettori magnetotermici luce e forza motrice',
            unitaMisura: 'a corpo',
            quantita: 1,
            prezzoUnitario: 480.0,
            quotaManodoperaPerc: 55
          },
          {
            descrizione: 'Montante principale di alimentazione e collegamento impianto di terra con dispersore',
            unitaMisura: 'a corpo',
            quantita: 1,
            prezzoUnitario: 260.0,
            quotaManodoperaPerc: 60
          }
        ]
      },
      {
        titolo: 'Capitolo 2 - Punti Luce, Prese e Impianti Ausiliari',
        righe: [
          {
            descrizione: 'Punti luce interrotti, deviati o invertiti completi di frutti e placca 3 posti',
            unitaMisura: 'cad',
            quantita: 24,
            prezzoUnitario: 48.0,
            quotaManodoperaPerc: 65
          },
          {
            descrizione: 'Punti presa 10/16A bivalenti e Schuko per elettrodomestici forza motrice',
            unitaMisura: 'cad',
            quantita: 28,
            prezzoUnitario: 52.0,
            quotaManodoperaPerc: 60
          },
          {
            descrizione: 'Presa dati RJ45 Cat. 6 e presa TV/SAT passante e terminale',
            unitaMisura: 'cad',
            quantita: 6,
            prezzoUnitario: 55.0,
            quotaManodoperaPerc: 60
          },
          {
            descrizione: 'Dichiarazione di Conformità (DICO) ai sensi del D.M. 37/08 con schemi unifilari',
            unitaMisura: 'a corpo',
            quantita: 1,
            prezzoUnitario: 250.0,
            quotaManodoperaPerc: 95
          }
        ]
      }
    ]
  },
  {
    id: 'mod-appartamento-03',
    titolo: 'Ristrutturazione Edile Appartamento Residenziale (80-100 mq)',
    categoria: 'Ristrutturazione Completa',
    descrizione:
      'Intervento globale: demolizioni, ridistribuzione spazi con pareti in cartongesso, massetti, impianti, rasature, tinteggiature e posa pavimenti in gres.',
    tipoPredefinito: 'computo_metrico',
    capitoli: [
      {
        titolo: 'Capitolo 1 - Allestimento, Demolizioni e Movimentazioni',
        righe: [
          {
            descrizione: 'Protezione ambienti di transito condominiale, allestimento cantiere e apprestamenti di sicurezza',
            unitaMisura: 'a corpo',
            quantita: 1,
            prezzoUnitario: 650.0,
            quotaManodoperaPerc: 70
          },
          {
            descrizione: 'Demolizione tramezze divisorie in forati sp. 8-10 cm compreso scrostamento intonaco',
            unitaMisura: 'mq',
            partiUguali: 2,
            lunghezza: 5.5,
            altezza: 2.8,
            quantita: 30.8,
            prezzoUnitario: 24.0,
            quotaManodoperaPerc: 85
          },
          {
            descrizione: 'Rimozione pavimentazione e battiscopa compreso massetto di posa',
            unitaMisura: 'mq',
            partiUguali: 1,
            lunghezza: 10.5,
            larghezza: 8.2,
            quantita: 86.1,
            prezzoUnitario: 26.0,
            quotaManodoperaPerc: 85
          },
          {
            descrizione: 'Movimentazione e smaltimento macerie a discarica autorizzata con trasporto e formulari',
            unitaMisura: 'a corpo',
            quantita: 1,
            prezzoUnitario: 950.0,
            quotaManodoperaPerc: 50
          }
        ]
      },
      {
        titolo: 'Capitolo 2 - Nuove Opere Divisorie e Isolamento',
        righe: [
          {
            descrizione: 'Tramezzatura acustica in cartongesso a doppia lastra con interposta lana di roccia 70 kg/mc',
            unitaMisura: 'mq',
            partiUguali: 1,
            lunghezza: 12.0,
            altezza: 2.8,
            quantita: 33.6,
            prezzoUnitario: 48.0,
            quotaManodoperaPerc: 55
          },
          {
            descrizione: 'Fornitura e posa controtelaio per porta scorrevole a scomparsa tipo Scrigno/Eclisse',
            unitaMisura: 'cad',
            quantita: 3,
            prezzoUnitario: 195.0,
            quotaManodoperaPerc: 40
          },
          {
            descrizione: 'Massetto premiscelato a basso spessore autolivellante per impianti radianti/posa pavimenti',
            unitaMisura: 'mq',
            partiUguali: 1,
            lunghezza: 10.5,
            larghezza: 8.2,
            quantita: 86.1,
            prezzoUnitario: 22.0,
            quotaManodoperaPerc: 55
          }
        ]
      },
      {
        titolo: 'Capitolo 3 - Finiture, Rasature e Tinteggiature',
        righe: [
          {
            descrizione: 'Posa a correre pavimento gres effetto legno o cemento 60x120 cm su idoneo collante',
            unitaMisura: 'mq',
            partiUguali: 1,
            lunghezza: 10.5,
            larghezza: 8.2,
            quantita: 86.1,
            prezzoUnitario: 32.0,
            quotaManodoperaPerc: 75
          },
          {
            descrizione: 'Posa battiscopa coordinato compresi tagli a quartabono e sigillatura acrilica',
            unitaMisura: 'ml',
            quantita: 68.0,
            prezzoUnitario: 6.5,
            quotaManodoperaPerc: 80
          },
          {
            descrizione: 'Rasatura completa pareti e soffitti con malta fine e finitura a gesso',
            unitaMisura: 'mq',
            quantita: 240.0,
            prezzoUnitario: 12.0,
            quotaManodoperaPerc: 80
          },
          {
            descrizione: 'Tinteggiatura a due mani con pittura lavabile opaca traspirante colore a scelta D.L.',
            unitaMisura: 'mq',
            quantita: 240.0,
            prezzoUnitario: 11.5,
            quotaManodoperaPerc: 75
          }
        ]
      }
    ]
  },
  {
    id: 'mod-tinteggiatura-04',
    titolo: 'Tinteggiatura & Risana Pareti Antimuffa',
    categoria: 'Tinteggiature e Finiture',
    descrizione:
      'Intervento di risanamento murario, igienizzazione con biocida antimuffa, stuccatura buchi e microcavillature, primer fissativo e 2 mani di pittura termica o lavabile.',
    tipoPredefinito: 'preventivo',
    capitoli: [
      {
        titolo: 'Capitolo 1 - Preparazione e Trattamento Risanante',
        righe: [
          {
            descrizione: 'Mascheratura battiscopa, serramenti e pavimenti con fogli di feltro e nastro protettivo',
            unitaMisura: 'a corpo',
            quantita: 1,
            prezzoUnitario: 180.0,
            quotaManodoperaPerc: 85
          },
          {
            descrizione: 'Trattamento sanificante con soluzione acquosa ad azione fungicida e alghicida contro le muffe',
            unitaMisura: 'mq',
            quantita: 45.0,
            prezzoUnitario: 6.5,
            quotaManodoperaPerc: 70
          },
          {
            descrizione: 'Stuccatura lesioni superficiali, fori tasselli e raschiatura parti sfarinanti',
            unitaMisura: 'a corpo',
            quantita: 1,
            prezzoUnitario: 220.0,
            quotaManodoperaPerc: 85
          }
        ]
      },
      {
        titolo: 'Capitolo 2 - Pitturazione e Finitura',
        righe: [
          {
            descrizione: 'Applicazione di isolante acrilico microemulsione ad alta penetrazione',
            unitaMisura: 'mq',
            quantita: 160.0,
            prezzoUnitario: 3.5,
            quotaManodoperaPerc: 65
          },
          {
            descrizione: 'Tinteggiatura con pittura anticondensa termoisolante con microsfere di vetro cave',
            unitaMisura: 'mq',
            quantita: 160.0,
            prezzoUnitario: 14.5,
            quotaManodoperaPerc: 70
          }
        ]
      }
    ]
  }
];

export const INITIAL_DOCUMENTI: Documento[] = [
  {
    id: 'doc-001',
    numero: 'PREV-2026-001',
    titolo: 'Ristrutturazione Edile ed Impiantistica Alloggio Residenziale',
    tipo: 'preventivo',
    stato: 'approvato',
    data: '2026-02-15',
    dataScadenza: '2026-03-31',
    validitaGiorni: 45,
    clienteId: 'cli-01',
    clienteSnapshot: INITIAL_CLIENTI[0],
    cantiere: {
      oggetto: 'Opere di manutenzione straordinaria e rifacimento servizi',
      indirizzo: 'Via Solferino, 24',
      citta: 'Milano',
      cap: '20121',
      provincia: 'MI',
      responsabile: 'Geom. Alberto Conti'
    },
    capitoli: [
      {
        id: 'cap-01',
        titolo: 'Capitolo 1 - Allestimento Cantiere e Demolizioni',
        ordine: 1,
        descrizione: 'Opere di protezione parti comuni e demolizione selettiva'
      },
      {
        id: 'cap-02',
        titolo: 'Capitolo 2 - Impianti Idrosanitari ed Elettrici',
        ordine: 2,
        descrizione: 'Rifacimento completo impianti conformi normative CEI e UNI'
      },
      {
        id: 'cap-03',
        titolo: 'Capitolo 3 - Massetti, Pavimenti e Finiture',
        ordine: 3,
        descrizione: 'Opere di finitura, posa gres e tinteggiature lavabili'
      }
    ],
    righe: [
      {
        id: 'row-01',
        capitoloId: 'cap-01',
        codiceVoce: '07.SIC.005',
        descrizione: 'Allestimento cantiere, protezione androne e vano ascensore con polionda, cartellonistica e kit primo soccorso',
        unitaMisura: 'a corpo',
        usaFormulaMetrica: false,
        quantita: 1,
        prezzoUnitario: 650.0,
        scontoPerc: 0,
        subtotale: 650.0,
        quotaManodoperaPerc: 70
      },
      {
        id: 'row-02',
        capitoloId: 'cap-01',
        codiceVoce: '01.DEM.010',
        descrizione: 'Demolizione tramezzi in forato spessore 8-10 cm compreso calo in basso e smaltimento',
        unitaMisura: 'mq',
        usaFormulaMetrica: true,
        partiUguali: 2,
        lunghezza: 4.8,
        larghezza: 1.0,
        altezza: 2.7,
        quantita: 25.92,
        prezzoUnitario: 24.5,
        scontoPerc: 0,
        subtotale: 635.04,
        quotaManodoperaPerc: 85
      },
      {
        id: 'row-03',
        capitoloId: 'cap-01',
        codiceVoce: '01.DEM.020',
        descrizione: 'Rimozione pavimento esistente e massetto per passaggio nuovi impianti',
        unitaMisura: 'mq',
        usaFormulaMetrica: true,
        partiUguali: 1,
        lunghezza: 8.5,
        larghezza: 6.2,
        altezza: 1.0,
        quantita: 52.7,
        prezzoUnitario: 28.0,
        scontoPerc: 5,
        subtotale: 1401.82,
        quotaManodoperaPerc: 80
      },
      {
        id: 'row-04',
        capitoloId: 'cap-02',
        codiceVoce: '04.IMP.025',
        descrizione: 'Punti idraulici per bagno e cucina in multistrato coibentato compresi scarichi',
        unitaMisura: 'cad',
        usaFormulaMetrica: false,
        quantita: 6,
        prezzoUnitario: 165.0,
        scontoPerc: 0,
        subtotale: 990.0,
        quotaManodoperaPerc: 60
      },
      {
        id: 'row-05',
        capitoloId: 'cap-02',
        codiceVoce: '04.IMP.010',
        descrizione: 'Punti luce e prese elettriche complete di cablaggio e placca 3 posti',
        unitaMisura: 'cad',
        usaFormulaMetrica: false,
        quantita: 32,
        prezzoUnitario: 48.0,
        scontoPerc: 0,
        subtotale: 1536.0,
        quotaManodoperaPerc: 65
      },
      {
        id: 'row-06',
        capitoloId: 'cap-03',
        codiceVoce: '02.MUR.030',
        descrizione: 'Massetto premiscelato autolivellante per posa pavimentazione',
        unitaMisura: 'mq',
        usaFormulaMetrica: true,
        partiUguali: 1,
        lunghezza: 8.5,
        larghezza: 6.2,
        altezza: 1.0,
        quantita: 52.7,
        prezzoUnitario: 22.0,
        scontoPerc: 0,
        subtotale: 1159.4,
        quotaManodoperaPerc: 55
      },
      {
        id: 'row-07',
        capitoloId: 'cap-03',
        codiceVoce: '05.PAV.020',
        descrizione: 'Fornitura colla C2TE e posa pavimento in gres porcellanato formato 60x60',
        unitaMisura: 'mq',
        usaFormulaMetrica: true,
        partiUguali: 1,
        lunghezza: 8.5,
        larghezza: 6.2,
        altezza: 1.0,
        quantita: 52.7,
        prezzoUnitario: 34.0,
        scontoPerc: 5,
        subtotale: 1702.21,
        quotaManodoperaPerc: 70
      },
      {
        id: 'row-08',
        capitoloId: 'cap-03',
        codiceVoce: '06.TIN.015',
        descrizione: 'Doppia rasatura a stucco e tinteggiatura pareti e soffitti con idropittura lavabile',
        unitaMisura: 'mq',
        usaFormulaMetrica: false,
        quantita: 180.0,
        prezzoUnitario: 16.5,
        scontoPerc: 0,
        subtotale: 2970.0,
        quotaManodoperaPerc: 75
      }
    ],
    oneriSicurezzaTipo: 'percentuale',
    oneriSicurezzaValore: 3.5, // 3.5%
    cassaPrevidenzialeAttiva: false,
    cassaPrevidenzialeNome: 'Cassa Edile',
    cassaPrevidenzialeTipo: 'percentuale',
    cassaPrevidenzialeValore: 0,
    cassaPrevidenzialePerc: 0,
    ivaPerc: 10,
    ivaEsenzioneTesto: '',
    ritenutaAccontoAttiva: false,
    ritenutaAccontoPerc: 0,
    scontoGeneralePerc: 2,
    condizioniPagamento:
      '30% alla conferma d\'ordine e inizio allestimento cantiere; 40% a SAL (completamento massetti e impianti); 30% a saldo dopo collaudo finale e consegna certificazioni.',
    tempiEsecuzione:
      'Inizio lavori entro 10 giorni lavorativi dall\'approvazione del preventivo. Durata stimata complessiva: 45 giorni lavorativi consecutivi.',
    esclusioni:
      'Sono esclusi la fornitura dei corpi illuminanti, specchi, box doccia e piastrelle di finitura (a carico committente, posa inclusa nel preventivo).',
    noteFinali:
      'L\'intervento beneficia delle detrazioni fiscali per recupero del patrimonio edilizio (Bonus Ristrutturazioni 50%) con bonifico parlante dedicato.',
    dataAggiornamento: '2026-02-18'
  },
  {
    id: 'doc-002',
    numero: 'CME-2026-001',
    titolo: 'Computo Metrico Estimativo - Manutenzione Facciata e Balconi',
    tipo: 'computo_metrico',
    stato: 'inviato',
    data: '2026-03-01',
    dataScadenza: '2026-04-15',
    validitaGiorni: 45,
    clienteId: 'cli-02',
    clienteSnapshot: INITIAL_CLIENTI[1],
    cantiere: {
      oggetto: 'Risanamento frontalini balconi e tinteggiatura vano corte interna',
      indirizzo: 'Via Monte Rosa, 15',
      citta: 'Milano',
      cap: '20149',
      provincia: 'MI',
      responsabile: 'Ing. Marco Ferraris'
    },
    capitoli: [
      {
        id: 'cap-cme-1',
        titolo: 'Capitolo 1 - Ponteggi e Sicurezza Cantiere',
        ordine: 1,
        descrizione: 'Opere provvisionali ed allestimento trabattelli e ponteggi'
      },
      {
        id: 'cap-cme-2',
        titolo: 'Capitolo 2 - Ripristino Calcestruzzo e Balconi',
        ordine: 2,
        descrizione: 'Picchettatura, passivazione ferri d\'armatura e malte tixotropiche'
      }
    ],
    righe: [
      {
        id: 'cme-r1',
        capitoloId: 'cap-cme-1',
        codiceVoce: '07.SIC.005',
        descrizione: 'Noleggio, montaggio e smontaggio ponteggio a telai prefabbricati compreso progetto e PiMUS',
        unitaMisura: 'mq',
        usaFormulaMetrica: true,
        partiUguali: 1,
        lunghezza: 18.0,
        larghezza: 1.0,
        altezza: 14.5,
        quantita: 261.0,
        prezzoUnitario: 14.0,
        scontoPerc: 0,
        subtotale: 3654.0,
        quotaManodoperaPerc: 70
      },
      {
        id: 'cme-r2',
        capitoloId: 'cap-cme-2',
        codiceVoce: '01.DEM.010',
        descrizione: 'Demolizione parti di calcestruzzo ammalorato e pericolante su frontalini balconi',
        unitaMisura: 'ml',
        usaFormulaMetrica: true,
        partiUguali: 8, // 8 balconi
        lunghezza: 4.2,
        quantita: 33.6,
        prezzoUnitario: 22.0,
        scontoPerc: 0,
        subtotale: 739.2,
        quotaManodoperaPerc: 85
      },
      {
        id: 'cme-r3',
        capitoloId: 'cap-cme-2',
        codiceVoce: '02.MUR.015',
        descrizione: 'Spazzolatura ferri d\'armatura ossidati e trattamento anticorrosivo con malta passivante cementizia Mapefer',
        unitaMisura: 'ml',
        usaFormulaMetrica: true,
        partiUguali: 8,
        lunghezza: 4.2,
        quantita: 33.6,
        prezzoUnitario: 16.5,
        scontoPerc: 0,
        subtotale: 554.4,
        quotaManodoperaPerc: 70
      },
      {
        id: 'cme-r4',
        capitoloId: 'cap-cme-2',
        codiceVoce: '02.MUR.015',
        descrizione: 'Ricostruzione volumetrica dei copriferri con malta strutturale tixotropica a ritiro compensato tipo Mapegrout',
        unitaMisura: 'ml',
        usaFormulaMetrica: true,
        partiUguali: 8,
        lunghezza: 4.2,
        quantita: 33.6,
        prezzoUnitario: 28.0,
        scontoPerc: 0,
        subtotale: 940.8,
        quotaManodoperaPerc: 65
      }
    ],
    oneriSicurezzaTipo: 'fisso',
    oneriSicurezzaValore: 450.0,
    cassaPrevidenzialeAttiva: false,
    cassaPrevidenzialeNome: '',
    cassaPrevidenzialeTipo: 'percentuale',
    cassaPrevidenzialeValore: 0,
    cassaPrevidenzialePerc: 0,
    ivaPerc: 10,
    ritenutaAccontoAttiva: false,
    ritenutaAccontoPerc: 0,
    scontoGeneralePerc: 0,
    condizioniPagamento: 'Bonifico bancario 30 giorni data emissione fattura a stato di avanzamento mensile.',
    tempiEsecuzione: 'Durata stimata lavori: 20 giorni solari con condizioni meteo favorevoli.',
    esclusioni: 'Tassa occupazione suolo pubblico (TOSAP) conteggiata a parte secondo tariffa comunale.',
    noteFinali: 'Offerta redatta in conformità al capitolato lavori approvato in sede condominiale.',
    dataAggiornamento: '2026-03-02'
  }
];
