/* VT_DICO_IMPIANTI_V198A | Modulo aggiuntivo: impianti elettronici lett. B e fotovoltaico lett. A.
   Non sostituisce la verifica dell'abilitazione e non modifica gli originali delle pratiche.
   Il modulo aggiunge campi soltanto alle Di.Co., senza alterare la Di.Ri.
   Non modifica schema unifilare elettrico, copertina, logo e dati delle pratiche pregresse. */
(function () {
  'use strict';
  const VT_TYPES = {
    'Antennistica TV/SAT': {
      prefix: 'Impianto radiotelevisivo e antenne',
      devices: ['Antenna terrestre UHF','Antenna SAT/parabola','LNB','Centralino TV','Amplificatore','Miscelatore','Derivatore/ripartitore','Alimentatore','Presa TV/SAT','Cavo coassiale','Connettore e accessori','Altro'],
      checks: ['Fissaggio e posizionamento antenne','Instradamento e identificazione cavi','Alimentazione apparati e protezioni pertinenti','Livelli segnale ai punti terminali (se misurati)','Qualità segnale / MER / BER (se pertinente)','Funzionamento TV/SAT alle prese','Eventuali collegamenti equipotenziali e protezioni','Consegna schema e istruzioni']
    },
    'Videosorveglianza': {
      prefix: 'Impianto di videosorveglianza',
      devices: ['Telecamera IP','Telecamera analogica','NVR / DVR','Switch PoE','Switch di rete','Alimentatore','UPS','Monitor','Hard disk di registrazione','Cavo dati / coassiale','Armadio rack','Altro'],
      checks: ['Integrità posa e protezione apparecchiature','Posizionamento e inquadrature','Funzionamento delle telecamere','Registrazione e riproduzione immagini','Rete / PoE / alimentazioni e UPS se previsti','Credenziali e accessi amministrativi consegnati','Funzionalità di consultazione e accesso remoto se prevista','Informazioni sulle responsabilità privacy consegnate al committente']
    },
    'Antifurto / antintrusione': {
      prefix: 'Impianto di allarme antintrusione',
      devices: ['Centrale antintrusione','Sensore PIR','Contatto magnetico','Sensore perimetrale','Sirena interna','Sirena esterna','Tastiera','Inseritore / lettore badge','Combinatore / comunicatore','Alimentatore','Batteria tampone','Cavo bus / allarme','Altro'],
      checks: ['Funzionamento centrale e zone','Attivazione singoli sensori e contatti','Prove sirene e dispositivi di segnalazione','Test antimanomissione (tamper) ove previsto','Alimentazione ordinaria e tampone','Comunicazioni e notifiche se previste','Inserimento/disinserimento e codici consegnati','Documentazione uso e manutenzione consegnata']
    },
    'Rete LAN / dati': {
      prefix: 'Impianto rete dati e cablaggio strutturato',
      devices: ['Armadio rack','Patch panel','Switch','Switch PoE','Router / firewall','Access point Wi-Fi','Presa dati RJ45','Cavo rame Cat. 6','Cavo rame Cat. 6A','Cavo fibra ottica','Pannello ottico / ODF','Patch cord','UPS','Altro'],
      checks: ['Etichettatura punti rete e armadi','Verifica continuità e mappatura delle coppie','Pinout e corretta terminazione','Lunghezze tratte e posa dei cavi','Certificazione/qualifica del cablaggio se prevista','Collegamento apparati attivi e funzionalità LAN','PoE e alimentazioni quando presenti','Schema as-built, numerazione porte e report consegnati']
    },
    'Fotovoltaico': {
      prefix: 'Impianto fotovoltaico di produzione energia elettrica',
      devices: ['Modulo fotovoltaico','Inverter di stringa','Inverter ibrido','Microinverter','Batteria accumulo','BMS / sistema gestione batteria','Quadro DC / sezionatore','Fusibili di stringa','SPD DC','Quadro AC / protezione','SPD AC','Interruttore magnetotermico','Interruttore differenziale','Dispositivo di interfaccia','Contatore / misuratore energia','Cavo solare DC','Cavo AC','Connettori FV','Struttura fissaggio / zavorre','Messa a terra / equipotenziale','Altro'],
      checks: ['Verifica visiva posa moduli, supporti e fissaggi','Identificazione delle stringhe e corrispondenza allo schema','Polarità delle stringhe DC e tensione a vuoto, secondo le procedure applicabili','Continuità dei conduttori di protezione ed equipotenzialità','Resistenza di isolamento della parte DC con metodo idoneo','Verifica protezioni e sezionamento DC/AC e SPD, ove presenti','Controllo connessioni, serraggi e identificazione circuiti','Verifica parametri inverter, messa in servizio e documentazione','Prove funzionali del sistema di accumulo, se presente','Verifica protezione di interfaccia e connessione rete, se applicabile','Verifica documentazione e schemi as-built','Consegna manuali, dichiarazioni componenti e rapporto di prova']
    }
  };
  const vtType=()=>String(state.installationType||'Impianto elettrico');
  const vtEnabled=()=>state.doc==='Di.Co.' && Object.prototype.hasOwnProperty.call(VT_TYPES,vtType());
  const vtCfg=()=>VT_TYPES[vtType()]||null;
  const vtPV=()=>vtType()==='Fotovoltaico';
  const vtLetter=()=>vtPV()?'A':'B';
  const vtArray=(key)=>Array.isArray(state[key])?state[key]:(state[key]=[]);
  const vtChecks=()=>{ if(!state.vtSpecialChecks || typeof state.vtSpecialChecks!=='object')state.vtSpecialChecks={}; return state.vtSpecialChecks[vtType()]||(state.vtSpecialChecks[vtType()]={}); };
  const vtField=(key,label,hint)=>`<label>${esc(label)}${help(hint||label)}<input data-k="${key}" value="${escAttr(state[key]||'')}"></label>`;
  const vtPrintEntry=(label,val)=>`<p><strong>${esc(label)}:</strong> ${esc(val===0?'0':val||'Da compilare')}</p>`;
  const vtPvKwp=()=>{const n=Number(String(state.vtPvNmoduli||'').replace(',','.')),w=Number(String(state.vtPvWpModulo||'').replace(',','.'));return n>0&&w>0?(n*w/1000).toLocaleString('it-IT',{minimumFractionDigits:2,maximumFractionDigits:3}):'';};
  const vtPvMode=()=>state.vtPvMode||'Connesso alla rete - senza accumulo';

  document.addEventListener('input', (event) => {
    const key = event.target?.dataset?.k;
    if (key !== 'vtPvNmoduli' && key !== 'vtPvWpModulo') return;
    state[key] = event.target.value;
    const display = document.getElementById('vt-pv-kwp');
    if (display) display.textContent = vtPvKwp() || 'Da calcolare';
  });

  const vtDicoFooter=()=>`<div class="print-signature"><span>Firma del responsabile tecnico ${esc(state.technician||'Da compilare')}<i></i></span></div>`;

  function vtChoice(){
    if(state.doc!=='Di.Co.')return '';
    const selected=vtType();
    return `<label>Tipologia impianto ${help('Per gli impianti FV al servizio degli edifici si applica normalmente la lettera A del D.M. 37/08; per antennistica, TVCC, antintrusione e LAN la lettera B. Verificare le abilitazioni effettivamente possedute.')}
      <select data-k="installationType">${['Impianto elettrico',...Object.keys(VT_TYPES)].map(k=>`<option value="${escAttr(k)}" ${k===selected?'selected':''}>${esc(k)}</option>`).join('')}</select></label>`;
  }
  function vtAuthorization(){
    if(!vtEnabled())return '';
    const letter=vtLetter();
    return `<div class="card"><h3>Di.Co. ${esc(vtType())} · D.M. 37/08, lettera ${letter}</h3>
      <p class="muted">Controllare sulla visura camerale che l'impresa sia abilitata per la lettera ${letter} e per le attività effettivamente svolte. La selezione nell'app non conferisce abilitazione.</p>
      <div class="grid"><label>Abilitazione impresa per lettera ${letter} ${help('Verificare i requisiti e le eventuali limitazioni nella visura CCIAA.')}<select data-k="vtAbilitazione">${['Da verificare','Verificata sulla visura','Non presente / da approfondire'].map(x=>`<option ${x===(state.vtAbilitazione||'Da verificare')?'selected':''}>${x}</option>`).join('')}</select></label>${vtField('vtNormaRiferimento','Norme tecniche effettivamente applicate','Inserire norme, edizioni e varianti pertinenti, non dichiarazioni automatiche.')}</div></div>`;
  }
  function vtPvTechnical(){
    const options=['Connesso alla rete - senza accumulo','Connesso alla rete - con accumulo','Isola (off-grid)','Ampliamento FV / aggiunta accumulo'];
    return `<div class="card"><h2>Dati tecnici · Impianto fotovoltaico</h2><p class="muted">Compila i dati dell'impianto realmente realizzato. La potenza calcolata è solo un riepilogo dei moduli inseriti, non una verifica di progetto.</p>
    <div class="grid">
      <label>Configurazione FV ${help('Indica la configurazione dell’impianto realizzato o modificato.')}<select data-k="vtPvMode">${options.map(x=>`<option ${vtPvMode()===x?'selected':''}>${x}</option>`).join('')}</select></label>
      ${vtField('vtPvUbicazione','Ubicazione moduli / copertura','Tetto piano, falde, pensilina, terreno di pertinenza.')}
      ${vtField('vtPvNmoduli','Numero moduli installati','Quantità totale effettiva dei moduli.')}
      ${vtField('vtPvWpModulo','Potenza nominale singolo modulo (Wp)','Per esempio 450, senza unità.')}
      ${vtField('vtPvModuli','Marca / modello moduli','Produttore, modello, scheda tecnica e certificazioni.')}
      ${vtField('vtPvStringhe','Configurazione stringhe','Esempio: 2 stringhe da 7 moduli; indicare MPPT associati.')}
      ${vtField('vtPvInverter','Inverter marca / modello / matricola','Riportare i dati di targa.')}
      ${vtField('vtPvPotenzaInverter','Potenza nominale inverter (kW)','Indicare potenza AC nominale.')}
      ${vtField('vtPvAccumulo','Accumulo: marca / modello / numero batterie','Lasciare non applicabile se assente.')}
      ${vtField('vtPvAccumuloKwh','Capacità nominale accumulo (kWh)','Indicare capacità nominale totale da schede tecniche.')}
      ${vtField('vtPvDc','Cavi, connettori e protezioni DC','Sezioni, cavi, fusibili, sezionatori e SPD DC applicati.')}
      ${vtField('vtPvAc','Cavi, quadri e protezioni AC','MT/MTD/differenziali, SPD AC, sezioni e caratteristiche.')}
      ${vtField('vtPvInterfaccia','Dispositivo/protezione interfaccia rete','Dati del sistema di interfaccia, se applicabile.')}
      ${vtField('vtPvTerra','Terra ed equipotenzialità','Conduttori PE, masse, strutture metalliche, misure pertinenti.')}
      ${vtField('vtPvRete','Punto connessione e sistema elettrico','Monofase/trifase, tensione, punto di consegna o isola.')}
      ${vtField('vtPvDoc','Progetto, schema unifilare, documenti di connessione','Elencare gli allegati pertinenti e riferimenti ai file caricati.')}
    </div><p><strong>Potenza nominale campo FV:</strong> <span id="vt-pv-kwp">${esc(vtPvKwp()||"Da calcolare")}</span> kWp (numero moduli × Wp / 1000).</p>
    <p class="muted">Occorrono la verifica delle condizioni di applicabilità del D.M. 37/08, il progetto e gli schemi dove previsti, le verifiche effettive e la documentazione di rete se applicabile.</p></div>`;
  }

  const oldPratica=pratica;
  pratica=function(){
    let html=oldPratica();
    const anchor='<label>Stato<select data-k=status>';
    if(html.includes(anchor))html=html.replace(anchor,vtChoice()+anchor);
    else html=html.replace('<label>Documento',vtChoice()+'<label>Documento');
    return html+vtAuthorization();
  };

  const oldImpianto=impianto;
  impianto=function(){
    if(!vtEnabled())return oldImpianto();
    if(vtPV())return vtPvTechnical();
    return `<div class="card"><h2>Dati tecnici · ${esc(vtType())}</h2><p class="muted">Indica la configurazione effettiva dell’impianto. I campi di potenza e livello CEI propri degli impianti elettrici non sono richiesti per la sola sezione elettronica.</p><div class="grid">${vtField('vtArchitettura','Architettura / sorgenti / centrale','Descrivere la struttura: antenne e centralino, NVR e telecamere, centrale e zone, switch e rack.')}${vtField('vtCablaggio','Cavi e infrastrutture','Esempio: coassiale, Cat. 6, fibra ottica, bus allarme, tubazioni.')}${vtField('vtAlimentazione','Alimentazione apparecchiature','Tensione di alimentazione degli apparati, PoE, UPS, eventuale impianto elettrico esistente.')}${vtField('vtAree','Locali / zone / punti serviti','Indicare locali e aree, quantità punti e destinazioni.')}${vtField('vtSchemaRif','Riferimento progetto / schema as-built','Titolo del progetto o della planimetria effettivamente disponibile.')}${vtField('vtCollaudo','Strumenti e risultati di prova','Strumento usato, misure, risultati ed eventuali riferimenti ai rapporti allegati.')}</div><p class="muted">Se il lavoro comprende anche una nuova distribuzione elettrica, documentarla separatamente con le relative verifiche e categorie applicabili.</p></div>`;
  };

  const oldMaterials=materials;
  materials=function(){
    if(!vtEnabled())return oldMaterials();
    const devices=vtArray('vtDevices').map((d,i)=>({...d,idx:i})).filter(d=>!d.category||d.category===vtType());
    const templates=vtCfg().devices;
    return `<div class="card"><h2>Materiali e dispositivi · ${esc(vtType())}</h2><p class="muted">Registra apparati, marca e modello, quantità e posizione: saranno riportati nella relazione materiali. Per il FV riporta anche matricole e dettagli di targa nelle note.</p><div class="grid"><label>Dispositivo<select id="vtDeviceType">${templates.map(x=>`<option>${esc(x)}</option>`).join('')}</select></label><label>Marca<input id="vtDeviceBrand" placeholder="Marca"></label><label>Modello<input id="vtDeviceModel" placeholder="Modello"></label><label>Quantità<input id="vtDeviceQty" type="number" min="1" value="1"></label><label>Locale / posizione<input id="vtDeviceArea" placeholder="Es. Ingresso, rack, terrazza"></label><label>Matricola / note<input id="vtDeviceNotes" placeholder="Facoltativo"></label></div><div class="actions"><button type="button" onclick="vt198AddDevice()">+ Aggiungi dispositivo</button><button type="button" class="secondary" onclick="save(true)">Salva pratica</button></div></div><div class="card"><h3>Elenco dispositivi</h3><table class="table"><thead><tr><th>Tipo</th><th>Marca / modello</th><th>Qtà</th><th>Posizione</th><th>Note</th><th></th></tr></thead><tbody>${devices.length?devices.map((d,i)=>`<tr><td>${esc(d.type)}</td><td>${esc([d.brand,d.model].filter(Boolean).join(' / '))}</td><td>${Number(d.qty)||0}</td><td>${esc(d.area)}</td><td>${esc(d.notes)}</td><td><button type="button" class="danger" onclick="vt198RemoveDevice(${d.idx})">×</button></td></tr>`).join(''):'<tr><td colspan="6">Nessun dispositivo inserito.</td></tr>'}</tbody></table></div>`;
  };
  window.vt198AddDevice=function(){
    const read=id=>document.getElementById(id)?.value?.trim()||'';
    const q=Number(read('vtDeviceQty'));
    if(!read('vtDeviceType') || !Number.isInteger(q) || q<1)return alert('Seleziona il dispositivo e inserisci una quantità valida.');
    vtArray('vtDevices').push({type:read('vtDeviceType'),brand:read('vtDeviceBrand'),model:read('vtDeviceModel'),qty:q,area:read('vtDeviceArea'),notes:read('vtDeviceNotes'),category:vtType()});
    save(false);render();
  };
  window.vt198RemoveDevice=function(i){if(!confirm('Rimuovere questo dispositivo dalla pratica?'))return;vtArray('vtDevices').splice(i,1);save(false);render();};

  const oldCircuits=circuits;
  circuits=function(){
    if(!vtEnabled())return oldCircuits();
    const links=vtArray('vtLinks').map((x,i)=>({...x,idx:i})).filter(x=>!x.category||x.category===vtType());
    return `<div class="card"><h2>${vtPV()?'Collegamenti DC / AC e accumulo':'Cablaggi e collegamenti'}</h2><p class="muted">Descrivi i collegamenti effettivamente installati: serviranno anche per lo schema funzionale.</p><div class="grid"><label>Da componente / origine<input id="vtLinkFrom" placeholder="Es. Stringa FV 1 / quadro DC"></label><label>A componente / destinazione<input id="vtLinkTo" placeholder="Es. MPPT1 inverter / quadro AC"></label><label>Cavo / mezzo di collegamento<input id="vtLinkCable" placeholder="Es. H1Z2Z2-K 1x6 mm²"></label><label>Tratta / note<input id="vtLinkNote" placeholder="Es. 15 m / protezioni / sezione"></label></div><button type="button" onclick="vt198AddLink()">+ Aggiungi collegamento</button></div><div class="card"><h3>Collegamenti registrati</h3><table class="table"><tr><th>Origine</th><th>Destinazione</th><th>Cavo</th><th>Note</th><th></th></tr>${links.length?links.map((x,i)=>`<tr><td>${esc(x.from)}</td><td>${esc(x.to)}</td><td>${esc(x.cable)}</td><td>${esc(x.note)}</td><td><button class="danger" type="button" onclick="vt198RemoveLink(${x.idx})">×</button></td></tr>`).join(''):'<tr><td colspan="5">Nessun collegamento ancora indicato.</td></tr>'}</table></div>`;
  };
  window.vt198AddLink=function(){const r=id=>document.getElementById(id)?.value?.trim()||'';if(!r('vtLinkFrom')||!r('vtLinkTo'))return alert('Indica sia l’origine sia la destinazione del collegamento.');vtArray('vtLinks').push({from:r('vtLinkFrom'),to:r('vtLinkTo'),cable:r('vtLinkCable'),note:r('vtLinkNote'),category:vtType()});save(false);render();};
  window.vt198RemoveLink=function(i){if(!confirm('Rimuovere questo collegamento?'))return;vtArray('vtLinks').splice(i,1);save(false);render();};

  const oldLevel=level;
  level=function(){return !vtEnabled()?oldLevel():`<div class="card"><h2>Livello CEI e ${vtPV()?'impianto fotovoltaico':'impianti elettronici'}</h2><p>Il livello prestazionale dell'impianto residenziale CEI 64-8 non è attribuito automaticamente alla sola installazione <strong>${esc(vtType())}</strong>.</p><p class="muted">${vtPV()?'Per gli impianti FV verificare separatamente requisiti di progetto, sicurezza elettrica, connessione e relative norme applicabili.':'Se la pratica comprende anche interventi sull’impianto elettrico, documentare la sezione elettrica e le verifiche applicabili in una relazione separata.'}</p></div>`;};

  const oldChecks=checks;
  checks=function(){
    if(!vtEnabled())return oldChecks();
    const items=vtCfg().checks, outcomes=['Da eseguire','Conforme','Non conforme','Non applicabile'], store=vtChecks();
    const n=items.filter((_,i)=>store[i] && store[i].outcome && store[i].outcome!=='Da eseguire').length;
    return `<div class="card"><h2>Verifiche funzionali · ${esc(vtType())}</h2><p class="muted">I controlli sono specifici per la tipologia. Compila solo esiti realmente accertati, con note e strumenti. L’app non certifica automaticamente la conformità.</p><p><strong>Compilati: ${n}/${items.length}</strong></p><div class="grid">${vtField('vtDataVerifiche','Data collaudo / verifiche','Giorno in cui sono state effettuate le prove.')}${vtField('vtStrumenti','Strumenti di misura utilizzati','Marca, modello, seriale, taratura se pertinente.')}</div></div><div class="card">${items.map((label,i)=>{const c=store[i]||{};return `<section class="verification-item"><b>${esc(label)}</b><div class="grid"><label>Esito<select onchange="vt198Check(${i},'outcome',this.value)">${outcomes.map(k=>`<option ${k===(c.outcome||'Da eseguire')?'selected':''}>${k}</option>`).join('')}</select></label><label>Rilievi / misure / note<input value="${escAttr(c.note||'')}" onchange="vt198Check(${i},'note',this.value)"></label></div></section>`}).join('')}</div><div class="card"><button type="button" onclick="save(true)">Salva verifiche</button></div>`;
  };
  window.vt198Check=function(i,key,value){const c=vtChecks();c[i]=c[i]||{};c[i][key]=value;save(false);};

  function vtSchemeBody(){
    const a=vtArray('vtLinks').filter(x=>!x.category||x.category===vtType());
    if(!a.length)return '<p><strong>Nessun collegamento registrato.</strong> Compila la sezione «Quadri e circuiti» (cablaggi) e allega lo schema effettivamente realizzato.</p>';
    return `<table><thead><tr><th>Origine</th><th>Destinazione</th><th>Mezzo / cavo</th><th>Tratta / note</th></tr></thead><tbody>${a.map(x=>`<tr><td>${esc(x.from)}</td><td>${esc(x.to)}</td><td>${esc(x.cable)}</td><td>${esc(x.note)}</td></tr>`).join('')}</tbody></table>`;
  }
  const oldUnifilar=unifilar;
  unifilar=function(){
    if(!vtEnabled())return oldUnifilar();
    return `<div class="card"><h2>${vtPV()?'Riepilogo collegamenti FV (non sostituisce lo schema unifilare)':'Schema funzionale'} · ${esc(vtType())}</h2><p class="muted">Questa tabella mostra i collegamenti inseriti. ${vtPV()?'Allegare lo schema unifilare elettrico as-built verificato dal tecnico: questa tabella non lo sostituisce.':'Allegare lo schema funzionale as-built ove necessario; i collegamenti non vengono validati automaticamente.'}</p>${vtSchemeBody()}<p>Riferimento schema/as-built: <strong>${esc(state.vtSchemaRif||'Da allegare')}</strong></p><div class="box"><h3>FIRMA DEL DIRETTORE TECNICO</h3><p>Nominativo: ${esc(state.technician||state.issuerTechnician||'Da compilare')}</p><p>Firma: ____________________________________</p><p>Data: ____ / ____ / ________</p></div></div>`;
  };

  // Sezione nel fascicolo; per l'elettrico ordinario non appare.
  PRINT_SECTIONS.splice(3,0,['vt-specialist','Relazione tecnica impianto speciale']);
  const oldAvailable=availablePrintSections;
  availablePrintSections=function(){return oldAvailable().filter(([id])=>id!=='vt-specialist'||vtEnabled()).filter(([id])=>!vtEnabled()||id!=='circuits'||vtArray('vtLinks').some(x=>!x.category||x.category===vtType())).map(([id,name])=>vtEnabled()&&id==='unifilar'?[id,vtPV()?'Collegamenti FV / schema da allegare':'Schema funzionale / collegamenti']:vtEnabled()&&id==='materials'?[id,vtPV()?'Moduli, inverter, batterie e materiali':'Elenco apparati e materiali']:vtEnabled()&&id==='verification'?[id,vtPV()?'Verifiche e messa in servizio FV':'Collaudo e verifiche funzionali']:[id,name]);};
  const oldFascicolo=fascicolo;
  fascicolo=function(){
    let h=oldFascicolo();
    if(!vtEnabled()){
      return h.replace(/<label class=['"]print-option['"]><input[^>]+data-print-section=['"]vt-specialist['"][^>]*>[^<]*<\/label>/g,'');
    }
    h=h.replace('FASCICOLO TECNICO IMPIANTO ELETTRICO',vtPV()?'FASCICOLO TECNICO IMPIANTO FOTOVOLTAICO':'FASCICOLO TECNICO IMPIANTO ELETTRONICO');
    return h.replace('Relazione tecnica impianto speciale',vtPV()?'Relazione tecnica fotovoltaico':'Relazione tecnica impianto elettronico');
  };
  printFascicolo=function(){
    const ids=availablePrintSections().map(([id])=>id);
    // Gli impianti ordinari non devono stampare la relazione dei moduli speciali.
    return printDocuments(ids);
  };

  const oldPrintPart=printPart;
  printPart=function(id){
    if(!vtEnabled())return oldPrintPart(id);
    const sign=vtDicoFooter(), c=vtCfg(), items=c.checks, verified=vtChecks();
    if(id==='cover'){
      let h=oldPrintPart(id); // Non alterare l'immagine della copertina definitiva.
      return h.replace('Quadri e circuiti</b>', vtPV()?'Collegamenti DC / AC</b>':'Cablaggi e collegamenti</b>').replace('Schema unifilare</b>',vtPV()?'Collegamenti FV / schema da allegare</b>':'Schema funzionale / collegamenti</b>');
    }
    if(id==='declaration'){
      let h=oldPrintPart(id);
      if(!vtPV())h=h.replace(/<p><strong>Sistema di distribuzione:<\/strong>[^<]*<\/p>/g,'').replace(/<p><strong>Alimentazione:<\/strong>[^<]*<\/p>/g,'').replace(/<p><strong>Potenza \(kW\):<\/strong>[^<]*<\/p>/g,'');
      const extra=`${vtPrintEntry('Tipologia di impianto',vtType())}${vtPrintEntry('Classificazione normativa', 'D.M. 37/08, art. 1, comma 2, lett. '+vtLetter())}${vtPrintEntry('Abilitazione CCIAA dichiarata',state.vtAbilitazione||'Da verificare')}`;
      return h.replace('<div class=\'print-signature\'>',extra+'<div class=\'print-signature\'>');
    }
    if(id==='vt-specialist'){
      const common=`${vtPrintEntry('Committente',state.client)}${vtPrintEntry('Ubicazione',[state.address,state.city,state.province].filter(Boolean).join(', '))}${vtPrintEntry('Intervento',state.workDescription)}${vtPrintEntry('Norme tecniche effettivamente applicate',state.vtNormaRiferimento)}${vtPrintEntry('Progetto / elaborati',state.vtSchemaRif)}`;
      if(vtPV())return `<section class="print-section"><h2>Relazione tecnica · Impianto fotovoltaico</h2>${vtPrintEntry('Riferimento normativo','D.M. 37/2008, art. 1, comma 2, lettera A (quando applicabile)')}${common}${vtPrintEntry('Configurazione',vtPvMode())}${vtPrintEntry('Posa moduli',state.vtPvUbicazione)}${vtPrintEntry('Numero moduli',state.vtPvNmoduli)}${vtPrintEntry('Potenza unitaria moduli (Wp)',state.vtPvWpModulo)}${vtPrintEntry('Potenza campo FV (kWp)',vtPvKwp())}${vtPrintEntry('Marca / modello moduli',state.vtPvModuli)}${vtPrintEntry('Stringhe e MPPT',state.vtPvStringhe)}${vtPrintEntry('Inverter',state.vtPvInverter)}${vtPrintEntry('Potenza nominale inverter (kW)',state.vtPvPotenzaInverter)}${vtPrintEntry('Accumulo',state.vtPvAccumulo)}${vtPrintEntry('Capacità accumulo (kWh)',state.vtPvAccumuloKwh)}${vtPrintEntry('Cavi e protezioni DC',state.vtPvDc)}${vtPrintEntry('Cavi, quadri e protezioni AC',state.vtPvAc)}${vtPrintEntry('Interfaccia rete',state.vtPvInterfaccia)}${vtPrintEntry('Messa a terra',state.vtPvTerra)}${vtPrintEntry('Collegamento rete / sistema',state.vtPvRete)}${vtPrintEntry('Elaborati e documenti allegati',state.vtPvDoc)}<p>Allegare schema unifilare dell'impianto realizzato, progetto ove previsto, relazione materiali e rapporti delle prove eseguite. Le procedure di connessione alla rete e gli adempimenti verso gestore/GSE sono distinti dalla Di.Co. e vanno verificati se pertinenti.</p>${sign}</section>`;
      return `<section class="print-section"><h2>Relazione tecnica · ${esc(vtType())}</h2>${vtPrintEntry('Categoria normativa','D.M. 37/2008, art. 1, comma 2, lettera B')}${common}${vtPrintEntry('Impianto e architettura',state.vtArchitettura)}${vtPrintEntry('Cablaggio / infrastrutture',state.vtCablaggio)}${vtPrintEntry('Alimentazione apparecchiature',state.vtAlimentazione)}${vtPrintEntry('Locali e punti serviti',state.vtAree)}${vtPrintEntry('Strumenti e collaudo',state.vtCollaudo)}${sign}</section>`;
    }

    if(id==='materials'){
      const devices=vtArray('vtDevices').filter(x=>!x.category||x.category===vtType());
      return `<section class="print-section"><h2>Relazione materiali · ${esc(vtType())}</h2>${printableTable(['Dispositivo','Marca / modello','Q.tà','Posizione','Matricola / note'],devices.map(x=>[x.type,[x.brand,x.model].filter(Boolean).join(' / '),x.qty,x.area,x.notes]))}${vtPrintEntry('Totale dispositivi registrati',String(devices.reduce((n,x)=>n+(Number(x.qty)||0),0)))}${sign}</section>`;
    }
    if(id==='circuits')return `<section class="print-section"><h2>Cablaggi e collegamenti · ${esc(vtType())}</h2>${vtSchemeBody()}${sign}</section>`;
    if(id==='unifilar')return `<section class="print-section"><h2>${vtPV()?'Collegamenti FV / riferimento schema unifilare':'Schema funzionale'} · ${esc(vtType())}</h2><p>${vtPV()?"I collegamenti qui elencati non sostituiscono lo schema unifilare dell’impianto fotovoltaico realizzato, che va allegato e verificato ove richiesto.":"I collegamenti sono dichiarati dal compilatore e non verificati automaticamente dal software."}</p>${vtSchemeBody()}${vtPrintEntry('Riferimento elaborato',state.vtSchemaRif)}${sign}</section>`;
    if(id==='verification')return `<section class="print-section"><h2>Rapporto di collaudo · ${esc(vtType())}</h2>${vtPrintEntry('Data',state.vtDataVerifiche)}${vtPrintEntry('Strumenti',state.vtStrumenti)}${printableTable(['Controllo','Esito','Risultati / note'],items.map((s,i)=>[s,verified[i]?.outcome||'Da eseguire',verified[i]?.note||'']))}<p>Esiti e misure inseriti dal compilatore, non attestati automaticamente dal software.</p>${sign}</section>`;
    return oldPrintPart(id);
  };
  const oldMinisterialDico=ministerialDico;
  ministerialDico=function(){
    let h=oldMinisterialDico();
    if(!vtEnabled())return h;
    return h.replace(/<b>TIPOLOGIA:<\/b> impianto elettrico · [^<]*<\/p>/,`<b>TIPOLOGIA:</b> ${esc(vtCfg().prefix)} · D.M. 37/08, art. 1, comma 2, lettera ${vtLetter().toLowerCase()}</p>`);
  };

  const oldRender=render;
  render=function(){oldRender();const sel=document.querySelector('[data-k="installationType"]');if(sel)sel.addEventListener('change',()=>render());};
  render();
})();
