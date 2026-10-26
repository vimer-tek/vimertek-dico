/* VIMER TEK Di.Co. 37/08 — Centro operativo v1.9.9.
 * Modulo aggiuntivo reversibile: non modifica la copertina, l'unifilare o il modello ministeriale esistente.
 * I controlli software non attestano requisiti legali, idoneita' tecnica o effettiva consegna.
 */
(function(){
'use strict';
const VT_MARK='VT_CENTRO_OPERATIVO_V199';
if(window.__vtCentroOperativoV199)return;
window.__vtCentroOperativoV199=true;
const escV=v=>esc(String(v??''));
const att=()=>typeof attachmentMeta==='function'?attachmentMeta():[];
const today=()=>new Date().toISOString().slice(0,10);
const id=()=>window.crypto?.randomUUID?.()||('vt_'+Date.now()+'_'+Math.random().toString(36).slice(2));
const proofList=()=>Array.isArray(state.vtPro?.surveys)?state.vtPro.surveys:[];
function store(){
  if(!state.vtPro||typeof state.vtPro!=='object')state.vtPro={};
  const p=state.vtPro;
  for(const k of ['surveys','instruments','measurements','revisions','deliveries','finalFiles','rooms']){
    if(!Array.isArray(p[k]))p[k]=[];
  }
  if(!p.documents||typeof p.documents!=='object')p.documents={};
  if(!p.cei||typeof p.cei!=='object')p.cei={};
  if(!Number.isInteger(p.revision)||p.revision<1)p.revision=1;
  return p;
}
function fieldHTML(name,label,type='text',value='',note=''){
  return `<label>${escV(label)}<input id="vtp-${name}" type="${type}" value="${escAttr(value??'')}">${note?`<small>${escV(note)}</small>`:''}</label>`;
}
function selectHTML(name,label,options,value=''){
  return `<label>${escV(label)}<select id="vtp-${name}">${options.map(x=>`<option value="${escAttr(x)}" ${x===value?'selected':''}>${escV(x||'Da scegliere')}</option>`).join('')}</select></label>`;
}
function get(name){return document.getElementById('vtp-'+name)?.value?.trim()||'';}
function toast(message){alert(message);}
function hasDocKeyword(re){return att().some(a=>re.test(String(a.name||'')));}
function applicable(){return state.doc==='Di.Ri.'?'Di.Ri.':'Di.Co.';}
function checkResults(){
  const p=store(),items=[], d=p.documents||{};
  const add=(name,ok,detail)=>items.push({name,ok:!!ok,detail:detail||''});
  add('Numero pratica',state.practiceNo,'Identificativo pratica');
  add('Committente',String(state.client||'').trim(),'Nome/ragione sociale');
  add('Ubicazione',String(state.address||'').trim()&&String(state.city||'').trim(),'Indirizzo e comune');
  add('Descrizione intervento',String(state.workDescription||'').trim(),'Descrivere l’opera realmente eseguita');
  add('Impresa o soggetto dichiarante',String(state.issuerCompany||state.company||'').trim(),'Verificare titolo e abilitazione');
  add('Firmatario',String(state.issuerTechnician||state.technician||'').trim(),'Indicare il soggetto effettivo');
  if(applicable()==='Di.Co.'){
    add('Dati impresa e iscrizione CCIAA',state.companyVat&&state.registryOffice&&state.registryNumber,'Verificare che i dati siano attuali');
    add('Certificato requisiti tecnico-professionali',d.cciaa,'Conferma manuale: copia allegata e verificata');
    add('Progetto o schema dell’impianto',d.project,'Valutare l’obbligo del progetto professionale e allegare quello pertinente');
    add('Relazione tipologie materiali',d.materials,'Relazione allegata e coerente con l’impianto');
    add('Schema as-built',d.scheme,'Schema dell’impianto realizzato, non soltanto anteprima');
    add('Di.Co. precedenti o dichiarazione motivata di assenza',d.previous,'Controllo documentale manuale');
    add('Modello ministeriale Allegato I',d.official,'Usare il modello ufficiale vigente, non la sola bozza software');
  }else{
    const v=typeof diriValutazione==='function'?diriValutazione():null;
    add('Epoca dell’impianto',state.diriYear,'Verificare data e applicabilità della Di.Ri.');
    add('Requisiti firmatario',v&&v.problemi.length===0,'Controllo orientativo, non conferisce l’abilitazione');
    add('Sopralluogo e accertamenti',state.diriInspections,'Verifiche realmente effettuate');
    add('Esito accertamenti',state.diriOutcome,'Risultati documentati');
  }
  add('Rapporto prove eseguite',d.tests,'Selezionare solo dopo prove realmente svolte');
  add('Allegati originali conservati',att().length>0,'La presenza di file non ne verifica automaticamente il contenuto');
  if(state.doc==='Di.Co.'&&state.installationType&&state.installationType!=='Impianto elettrico'){
    add('Abilitazione per il settore scelto',state.vtAbilitazione==='Verificata sulla visura','Verificare eventuali limitazioni della visura');
  }
  return items;
}
const card=(title,content)=>`<div class="card vtpro-card"><h2>${title}</h2>${content}</div>`;
function completenessHTML(){
  const p=store(),rows=checkResults(),yes=rows.filter(r=>r.ok).length;
  return card('Controllo completezza della pratica',`<p class="muted">Controllo preliminare dei dati e degli allegati. Non certifica la conformità e non impedisce la stampa.</p>
   <p><strong>${yes}/${rows.length} verifiche documentali registrate</strong> · ${rows.length-yes} da completare o controllare</p>
   <div class="vtpro-progress"><span style="width:${Math.round(yes/Math.max(1,rows.length)*100)}%"></span></div>
   <table class="table"><thead><tr><th>Controllo</th><th>Stato</th></tr></thead><tbody>${rows.map(r=>`<tr><td><b>${escV(r.name)}</b><br><small>${escV(r.detail)}</small></td><td>${r.ok?'Registrato':'Da verificare'}</td></tr>`).join('')}</tbody></table>
   <h3>Conferme documentali manuali</h3><div class="vtpro-checkboxes">${[
    ['cciaa','Certificato CCIAA verificato e allegato'],['project','Progetto/schema pertinente allegato'],['materials','Relazione materiali allegata'],['scheme','Schema as-built verificato'],['previous','Precedenti Di.Co. o assenza documentata'],['official','Modello ministeriale ufficiale compilato'],['tests','Prove e rapporto verificati']
   ].map(([k,l])=>`<label><input type="checkbox" data-vtp-doc="${k}" ${p.documents[k]?'checked':''}> ${escV(l)}</label>`).join('')}</div>
   <p class="muted">Spuntare soltanto dopo un controllo reale. Gli avvisi restano nell'app e non vengono stampati nel PDF.</p>`);
}
function modelHTML(){return card('Modello ministeriale Di.Co. — Allegato I',`<p>La scheda «Di.Co. · modello ministeriale (bozza)» presente nell'app <b>non è ancora un modulo ufficiale validato</b>. Per la consegna usa l'Allegato I vigente e caricalo come PDF originale fra gli Allegati, dopo averlo compilato e verificato.</p>
 <p><a href="https://www.gazzettaufficiale.it/atto/vediMenuHTML?atto.codiceRedazionale=10A08437&atto.dataPubblicazioneGazzetta=2010-07-13&tipoSerie=serie_generale&tipoVigenza=originario" target="_blank" rel="noopener noreferrer">Apri il D.M. 19 maggio 2010 e l'Allegato I sulla Gazzetta Ufficiale ↗</a></p>
 <button class="secondary" type="button" onclick="vtPro.exportMappa()">Scarica dati per compilare l'Allegato I</button>
 <p class="muted">La mappa dei dati è un supporto alla compilazione, non un modulo ministeriale sostitutivo.</p>`);}
function instrumentsHTML(){
  const p=store();
  return card('Strumenti di misura e rapporti di prova',`<p class="muted">Inserisci valori misurati realmente, metodo e identificazione dello strumento. Le misure non vengono generate dal software.</p>
  <h3>Registro strumenti</h3><div class="grid">${fieldHTML('instrumentName','Strumento / marca e modello')}${fieldHTML('instrumentSerial','Matricola')}${fieldHTML('instrumentExpiry','Scadenza taratura (se pertinente)','date')}${fieldHTML('instrumentNotes','Note / certificato')}</div>
  <button type="button" onclick="vtPro.addInstrument()">+ Registra strumento</button>
  ${p.instruments.length?`<table class="table"><tr><th>Strumento / matricola</th><th>Taratura</th><th></th></tr>${p.instruments.map((x,i)=>`<tr><td>${escV(x.name)}<br>${escV(x.serial)}</td><td>${escV(x.expiry||'Da verificare')}</td><td><button class="secondary" onclick="vtPro.delInstrument(${i})">Rimuovi</button></td></tr>`).join('')}</table>`:''}
  <h3>Misurazioni effettive</h3><div class="grid">${fieldHTML('measureDate','Data misura','date',today())}${fieldHTML('measureCircuit','Quadro / circuito')}${fieldHTML('measureTest','Prova / parametro')}${fieldHTML('measureValue','Valore misurato')}${fieldHTML('measureUnit','Unità (Ω, MΩ, ms, A...)')}${fieldHTML('measureMethod','Metodo / condizioni')}${selectHTML('measureInstrument','Strumento',[ '',...p.instruments.map(x=>x.name+' · '+x.serial)])}${selectHTML('measureOutcome','Esito',['Da verificare','Conforme','Non conforme','Non applicabile'],'Da verificare')}</div>
  <button type="button" onclick="vtPro.addMeasure()">+ Registra misura</button>
  ${p.measurements.length?`<table class="table"><tr><th>Prova / circuito</th><th>Risultato</th><th>Esito</th><th></th></tr>${p.measurements.map((x,i)=>`<tr><td>${escV(x.test)}<br>${escV(x.circuit)}</td><td>${escV(x.value)} ${escV(x.unit)}</td><td>${escV(x.outcome)}</td><td><button class="secondary" onclick="vtPro.delMeasure(${i})">×</button></td></tr>`).join('')}</table>`:''}
  `);
}
function surveyHTML(){const p=store();return card('Sopralluogo guidato',`<p class="muted">Registra locali, apparecchi, matricole e foto direttamente dal telefono. Le immagini saranno conservate fra gli Allegati originali della pratica e potranno essere stampate.</p>
  <div class="grid">${fieldHTML('surveyDate','Data sopralluogo','date',today())}${fieldHTML('surveyRoom','Locale / posizione')}${fieldHTML('surveyObjects','Apparecchi / componenti / quantità')}${fieldHTML('surveySerial','Marca, modello, matricole')}</div>
  <label>Note sul rilievo<textarea id="vtp-surveyNotes" rows="3"></textarea></label>
  <label>Foto dal telefono o file immagini<input id="vtp-surveyImages" type="file" accept="image/jpeg,image/png,image/webp" multiple></label>
  <button type="button" onclick="vtPro.addSurvey()">+ Salva sopralluogo</button>
  ${p.surveys.length?`<table class="table"><tr><th>Data / locale</th><th>Dettagli</th><th>Foto</th><th></th></tr>${p.surveys.map((x,i)=>`<tr><td>${escV(x.date)}<br>${escV(x.room)}</td><td>${escV(x.objects)}<br><small>${escV(x.serial)}</small></td><td>${x.photos?.length||0}</td><td><button class="secondary" onclick="vtPro.delSurvey(${i})">Rimuovi rilievo</button></td></tr>`).join('')}</table>`:''}
  <p class="muted">I file sono conservati su questo browser. Esporta periodicamente un backup cifrato per poterli recuperare su altri dispositivi.</p>`);}
function ceiHTML(){const p=store(), c=p.cei,fruits=state.fruits||[];
 const grouped={};for(const f of fruits){const room=String(f.room||'Non indicato');if(!grouped[room])grouped[room]={count:0,types:[]};grouped[room].count+=Number(f.qty)||0;grouped[room].types.push(f.type||'Non classificato');}
 const rooms=Object.entries(grouped);
 return card('Livello CEI 64-8 — raccolta dati e pre-analisi',`<p class="muted">La classificazione richiede dotazioni per ambiente, superficie, circuiti e funzioni. Il conteggio dei frutti da solo <b>non dimostra</b> il livello raggiunto. Questa sezione non attribuisce automaticamente una conformità.</p>
 <div class="grid">${fieldHTML('ceiArea','Superficie interna abitazione (m²)','number',c.area||'')}${fieldHTML('ceiRooms','Numero ambienti (esclusi accessori)','number',c.rooms||'')}${fieldHTML('ceiRcd','Numero differenziali presenti','number',c.rcd||'')}${fieldHTML('ceiDomotica','Numero funzioni domotiche effettive','number',c.domotica||'')}</div>
 ${selectHTML('ceiApplicabile','Applicabilità Capitolo 37',['Da verificare','Nuovo impianto residenziale','Rifacimento completo','Non applicabile'],'')}
 <button type="button" onclick="vtPro.saveCEI()">Salva parametri</button>
 <p><b>Conteggio automatico disponibile:</b> ${fruits.reduce((a,f)=>a+(Number(f.qty)||0),0)} frutti · ${(state.circuits||[]).length} circuiti registrati · ${rooms.length} locali con frutti.</p>
 ${rooms.length?`<table class="table"><tr><th>Ambiente</th><th>Frutti</th><th>Tipologie registrate</th></tr>${rooms.map(([name,val])=>`<tr><td>${escV(name)}</td><td>${val.count}</td><td>${escV(val.types.join(', '))}</td></tr>`).join('')}</table>`:''}
 <p class="muted"><b>Esito automatico:</b> livello non ancora determinabile. Occorre associare ogni punto a una tipologia normalizzata, verificare le dotazioni minime per locale e confrontarle con le tabelle CEI applicabili. Il livello attualmente selezionato nella pratica resta una dichiarazione manuale da validare.</p>`);
}
function revisionsHTML(){const p=store();return card('Revisioni e documento definitivo',`<p class="muted">Una revisione finale registra una fotografia immutabile dei dati e un'impronta SHA-256. Non sostituisce conservazione a norma o firma qualificata.</p>
 <p><strong>Revisione corrente: ${p.revision}</strong> · ${p.locked?'<b>Chiusa (sola lettura)</b>':'Bozza modificabile'}</p>
 <div class="actions">${p.locked?`<button type="button" onclick="vtPro.newRevision()">+ Nuova revisione modificabile</button>`:`<button type="button" onclick="vtPro.freeze()">Chiudi e registra revisione</button>`}<button class="secondary" type="button" onclick="vtPro.downloadRevision()">Esporta registro revisioni</button></div>
 ${p.revisions.length?`<table class="table"><tr><th>Rev.</th><th>Data</th><th>Impronta</th><th>PDF</th></tr>${p.revisions.map(x=>`<tr><td>${x.number}</td><td>${escV(x.date)}</td><td><code title="${escAttr(x.hash)}">${escV(x.hash.slice(0,18))}…</code></td><td>${escV(x.pdfName||'Non allegato')}</td></tr>`).join('')}</table>`:''}`);}
function deliveryHTML(){const p=store();return card('Documento finale e consegna al cliente',`<p class="muted">Dopo aver stampato il fascicolo e inserito l'eventuale firma grafica, importa qui il PDF definitivo. Non viene caricato su servizi esterni senza un tuo comando.</p>
 <label>PDF definitivo (già generato e controllato)<input id="vtp-finalPdf" type="file" accept=".pdf,application/pdf"></label>
 <button type="button" onclick="vtPro.saveFinalPdf()">Conserva PDF definitivo</button>
 ${p.finalFiles.length?`<div class="vtpro-final-list">${p.finalFiles.map((f,i)=>`<div class="archive-item"><div><b>${escV(f.name)}</b><br><small>Revisione ${f.revision} · ${escV(f.date)}</small></div><div class="actions"><button class="secondary" onclick="vtPro.downloadFinal(${i})">Scarica</button><button onclick="vtPro.shareFinal(${i})">Condividi</button></div></div>`).join('')}</div>`:'<p class="muted">Nessun PDF definitivo registrato.</p>'}
 <h3>Registro consegne</h3><div class="grid">${fieldHTML('deliveryDate','Data consegna','date',today())}${selectHTML('deliveryChannel','Canale',['Email','WhatsApp','A mano','Portale cliente','PEC','Altro'],'Email')}${fieldHTML('deliveryReference','Destinatario / riferimento')}${fieldHTML('deliveryNotes','Ricevuta / estremi (se disponibili)')}</div>
 <button type="button" onclick="vtPro.addDelivery()">+ Registra consegna effettuata</button>
 ${p.deliveries.length?`<table class="table"><tr><th>Data</th><th>Canale</th><th>Riferimento</th></tr>${p.deliveries.map(x=>`<tr><td>${escV(x.date)}</td><td>${escV(x.channel)}</td><td>${escV(x.reference)}<br><small>${escV(x.notes)}</small></td></tr>`).join('')}</table>`:''}
 <p class="muted">Il salvataggio di una consegna è una registrazione manuale: non dimostra che il destinatario abbia effettivamente ricevuto il documento.</p>`);}
function backupHTML(){return card('Backup cifrato di pratiche e allegati',`<p class="muted">Le pratiche sono salvate nel browser. Esporta un archivio JSON cifrato con password per conservare una copia recuperabile su un altro dispositivo. L'esportazione include tutte le pratiche archiviate e i PDF/foto effettivamente presenti in IndexedDB.</p>
 <div class="grid">${fieldHTML('backupPassword','Password backup','password')}${fieldHTML('backupPasswordConfirm','Conferma password','password')}</div>
 <button type="button" onclick="vtPro.exportBackup()">Esporta backup cifrato completo</button>
 <h3>Ripristino da backup</h3><label>Archivio .json cifrato<input id="vtp-importFile" type="file" accept=".json,application/json"></label>
 ${fieldHTML('importPassword','Password del backup','password')}
 <button class="secondary" type="button" onclick="vtPro.importBackup()">Ripristina (con conferma)</button>
 <p class="muted">Non perdere la password: non può essere recuperata dal software. Nessun backup viene inviato automaticamente al cloud. Conserva una copia esterna sicura.</p>`);}
function actionBar(){return card('Centro operativo Vimer Tek',`<p class="muted">Pannello per la gestione professionale della pratica. I controlli preliminari restano sullo schermo; il PDF contiene solo dati tecnici inseriti.</p>
 <div class="vtpro-actions"><button onclick="vtPro.goto('check')">Controllo pratica</button><button onclick="vtPro.goto('survey')">Sopralluogo</button><button onclick="vtPro.goto('measure')">Misure e strumenti</button><button onclick="vtPro.goto('cei')">Livello CEI</button><button onclick="vtPro.goto('final')">Revisione e consegna</button><button class="secondary" onclick="vtPro.goto('backup')">Backup cifrato</button></div>`);}
function inject(){
 if(typeof active!=='number'||archiveView)return;
 const root=document.getElementById('app');if(!root)return;
 let html='';
 if(active===0)html=actionBar();
 else if(active===1)html=completenessHTML()+(applicable()==='Di.Co.'?modelHTML():'');
 else if(active===5)html=''; // CEI unificato
 else if(active===6)html=instrumentsHTML();
 else if(active===8)html=surveyHTML();
 else if(active===10)html=revisionsHTML()+deliveryHTML()+backupHTML()+completenessHTML();
 if(html){const target=document.createElement('div');target.id='vtpro-main';target.innerHTML=html;root.appendChild(target);}
 // Il blocco e' applicato dopo che l'app ha terminato il rendering; le azioni vtPro restano abilitate.
 if(store().locked&&active!==0){
   root.querySelectorAll('input,select,textarea').forEach(x=>{x.disabled=true});
   root.querySelectorAll('button').forEach(b=>{const fn=b.getAttribute('onclick')||'';
     const allow=fn.startsWith('vtPro.')||fn.startsWith('goStep(')||fn.startsWith('print')||fn==='save(true)'||fn.startsWith('showArchive(')||fn.startsWith('closeArchive(');
     if(!allow)b.disabled=true;
   });
   root.querySelectorAll('#vtpro-main input,#vtpro-main select,#vtpro-main textarea').forEach(x=>x.disabled=!x.id.startsWith('vtp-')?true:false);
   // Durante la revisione chiusa, solo operazioni non modificanti i dati sono abilitate.
   root.querySelectorAll('#vtpro-main button').forEach(b=>{const fn=b.getAttribute('onclick')||'';if(!/newRevision|downloadFinal|shareFinal|downloadRevision|exportBackup|goto|importBackup|addDelivery/.test(fn))b.disabled=true});
   const msg=document.createElement('p');msg.className='vtpro-locked';msg.textContent='Revisione chiusa: dati in sola lettura. Per modificarli premi “Nuova revisione modificabile” nel Fascicolo.';
   root.prepend(msg);
 }
}
const origRender=render;
render=function(){origRender();inject();};
// Conserva una cronologia locale leggera dei metadati (non i file): NON sostituisce il backup cifrato esterno.
const origSave=save;
save=function(msg=true){origSave(msg);try{
 const key='vtpro_rolling_snapshots',now=Date.now();let a=JSON.parse(localStorage.getItem(key)||'[]');
 if(!a.length||now-a[a.length-1].time>24*60*60*1000){
  a.push({time:now,practices:archive()});localStorage.setItem(key,JSON.stringify(a.slice(-3)));
 }
 }catch(_){/* Errore quota o browser privato: backup esterno resta necessario */}};
function update(){save(false);render();}
function download(name,data,mime='application/json'){
 const blob=data instanceof Blob?data:new Blob([data],{type:mime});const url=URL.createObjectURL(blob);
 const a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
}
async function fileBase64(file){const buf=await file.arrayBuffer();const bytes=new Uint8Array(buf);let s='';for(let i=0;i<bytes.length;i+=8192)s+=String.fromCharCode(...bytes.slice(i,i+8192));return btoa(s);}
function base64Bytes(s){const binary=atob(s),buf=new Uint8Array(binary.length);for(let i=0;i<binary.length;i++)buf[i]=binary.charCodeAt(i);return buf;}
async function encrypt(text,password){
 if(!crypto?.subtle)throw Error('Cifratura non disponibile: usare HTTPS');
 const salt=crypto.getRandomValues(new Uint8Array(16)),iv=crypto.getRandomValues(new Uint8Array(12));
 const keyMaterial=await crypto.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveKey']);
 const key=await crypto.subtle.deriveKey({name:'PBKDF2',salt,iterations:250000,hash:'SHA-256'},keyMaterial,{name:'AES-GCM',length:256},false,['encrypt']);
 const cypher=await crypto.subtle.encrypt({name:'AES-GCM',iv},key,new TextEncoder().encode(text));
 return {format:'VT-DICO-ENCRYPTED-BACKUP',version:1,kdf:'PBKDF2-SHA256',iterations:250000,salt:btoa(String.fromCharCode(...salt)),iv:btoa(String.fromCharCode(...iv)),ciphertext:await fileBase64(new Blob([cypher]))};
}
async function decrypt(info,password){
 if(info?.format!=='VT-DICO-ENCRYPTED-BACKUP'||info.version!==1||info.iterations!==250000)throw Error('Formato backup non riconosciuto');
 const km=await crypto.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveKey']);
 const key=await crypto.subtle.deriveKey({name:'PBKDF2',salt:base64Bytes(info.salt),iterations:info.iterations,hash:'SHA-256'},km,{name:'AES-GCM',length:256},false,['decrypt']);
 const clear=await crypto.subtle.decrypt({name:'AES-GCM',iv:base64Bytes(info.iv)},key,base64Bytes(info.ciphertext));
 return JSON.parse(new TextDecoder().decode(clear));
}
async function hashState(s){const d=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(s)));return Array.from(new Uint8Array(d)).map(v=>v.toString(16).padStart(2,'0')).join('');}
function copySnapshot(){const snap=JSON.parse(JSON.stringify(state));if(snap.vtPro){snap.vtPro.revisions=[];delete snap.vtPro.frozenData;}return snap;}
function vtPrintableTable(headers,rows){return `<table><thead><tr>${headers.map(x=>`<th>${escV(x)}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr>${r.map(x=>`<td>${escV(x)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;}
function printVtPart(){const p=store(), rows=[];
 if(p.surveys.length)rows.push('<h3>Sopralluoghi</h3>'+vtPrintableTable(['Data','Locale','Componenti','Matricole / note'],p.surveys.map(x=>[x.date,x.room,x.objects,[x.serial,x.notes].filter(Boolean).join(' · ')])));
 if(p.instruments.length)rows.push('<h3>Strumenti impiegati</h3>'+vtPrintableTable(['Strumento','Matricola','Taratura / note'],p.instruments.map(x=>[x.name,x.serial,[x.expiry,x.notes].filter(Boolean).join(' · ')])));
 if(p.measurements.length)rows.push('<h3>Misure registrate</h3>'+vtPrintableTable(['Data','Circuito / prova','Valore','Strumento / metodo','Esito'],p.measurements.map(x=>[x.date,[x.circuit,x.test].join(' / '),x.value+' '+x.unit,[x.instrument,x.method].filter(Boolean).join(' · '),x.outcome])));
 return rows.length?`<section class="print-section"><h2>Rapporto sopralluoghi e misurazioni</h2><p>Pratica ${escV(state.practiceNo)} · ${escV(state.client||'')}</p>${rows.join('')}<p>Data: ____________________ &nbsp;&nbsp; Firma del tecnico: ___________________________</p></section>`:'';
}
// Allegato operativo solo quando contiene dati; NON stampa avvisi sui requisiti Di.Ri.
if(typeof PRINT_SECTIONS!=='undefined'&&!PRINT_SECTIONS.some(([k])=>k==='vt-operativo'))PRINT_SECTIONS.push(['vt-operativo','Rapporto sopralluoghi e misurazioni']);
const oldAvailable=typeof availablePrintSections==='function'?availablePrintSections:null;
if(oldAvailable)availablePrintSections=function(){return oldAvailable().filter(([k])=>k!=='vt-operativo'||store().surveys.length+store().measurements.length+store().instruments.length>0)};
const oldPart=printPart;
printPart=function(key){if(key==='vt-operativo')return printVtPart();return oldPart(key);};
// Se il fascicolo completo usa availablePrintSections, l'allegato viene incluso solo se contiene dati.
window.vtPro={
 goto(which){const loc={check:1,survey:8,measure:6,cei:5,final:10,backup:10};goStep(loc[which]??0);setTimeout(()=>{const node=document.getElementById('vtpro-main');node?.scrollIntoView({behavior:'smooth',block:'start'});},0);},
 exportMappa(){const d={documento:state.doc,pratica:state.practiceNo,committente:state.client,cf_piva:state.clientTax,indirizzo:[state.address,state.city,state.province].filter(Boolean).join(', '),intervento:state.work,descrizione:state.workDescription,impresa:state.company,sede:state.companyAddress,piva:state.companyVat,registro:state.registryOffice,numero_iscrizione:state.registryNumber,tecnico:state.technician,dichiarante:state.issuerTechnician,luogo:state.dicoPlace,data:state.dicoDate};download('mappa_allegato_I_'+(state.practiceNo||'pratica')+'.json',JSON.stringify(d,null,2));},
 addInstrument(){if(store().locked)return toast('Apri una nuova revisione per modificare.');const name=get('instrumentName');if(!name)return toast('Inserisci il nome dello strumento.');store().instruments.push({name,serial:get('instrumentSerial'),expiry:get('instrumentExpiry'),notes:get('instrumentNotes')});update();},
 delInstrument(i){if(store().locked)return;if(!confirm('Rimuovere lo strumento?'))return;store().instruments.splice(i,1);update();},
 addMeasure(){if(store().locked)return;const test=get('measureTest'),value=get('measureValue');if(!test||!value)return toast('Indica prova e valore effettivamente misurato.');store().measurements.push({date:get('measureDate'),circuit:get('measureCircuit'),test,value,unit:get('measureUnit'),method:get('measureMethod'),instrument:get('measureInstrument'),outcome:get('measureOutcome')});update();},
 delMeasure(i){if(store().locked)return;if(!confirm('Rimuovere la misura?'))return;store().measurements.splice(i,1);update();},
 async addSurvey(){if(store().locked)return;const room=get('surveyRoom'),objects=get('surveyObjects');if(!room&&!objects)return toast('Inserisci almeno locale o componenti.');const files=[...(document.getElementById('vtp-surveyImages')?.files||[])];
  for(const f of files){if(!/^image\/(jpeg|png|webp)$/.test(f.type))return toast('Utilizza soltanto immagini JPG, PNG o WebP.');if(f.size>15*1024*1024)return toast('Ogni immagine deve pesare al massimo 15 MB.');}
  const photos=[],written=[];try{
   for(const f of files){const x=id(),key=(state.practiceNo||'')+'::'+x;await attachmentWrite({id:key,file:f});written.push(key);
      const name='Sopralluogo_'+today()+'_'+f.name;attachmentMeta().push({id:key,name,size:f.size,type:f.type});photos.push(key);}
   store().surveys.push({id:id(),date:get('surveyDate'),room,objects,serial:get('surveySerial'),notes:get('surveyNotes'),photos});update();
  }catch(e){for(const key of written){try{await attachmentDelete(key)}catch(_){}}
   state.attachmentFiles=attachmentMeta().filter(x=>!written.includes(x.id));toast('Errore nel salvataggio foto: '+e.message);}
 },
 delSurvey(i){if(store().locked)return;if(!confirm('Rimuovere il rilievo? Le eventuali foto resteranno fra gli Allegati, finché non le rimuovi da lì.'))return;store().surveys.splice(i,1);update();},
 saveCEI(){if(store().locked)return;store().cei={area:get('ceiArea'),rooms:get('ceiRooms'),rcd:get('ceiRcd'),domotica:get('ceiDomotica'),applicabile:get('ceiApplicabile')};update();},
 async freeze(){const p=store();if(p.locked)return;const f=p.finalFiles.find(x=>x.revision===p.revision);if(!confirm('Chiudere la revisione '+p.revision+'? I dati saranno registrati in una fotografia. Per ulteriori modifiche occorrerà creare una nuova revisione.'))return;
  if(!crypto?.subtle)return toast('SHA-256 non disponibile: usa l’app su HTTPS.');const snap=copySnapshot(),hash=await hashState(snap);p.revisions.push({number:p.revision,date:new Date().toISOString(),hash,pdfName:f?.name||'',snapshot:snap});p.locked=true;update();},
 newRevision(){const p=store();if(!p.locked)return;if(!confirm('Aprire una nuova revisione modificabile? La precedente resterà registrata.'))return;p.revision++;p.locked=false;update();},
 downloadRevision(){download('revisioni_'+(state.practiceNo||'pratica')+'.json',JSON.stringify(store().revisions,null,2));},
 async saveFinalPdf(){if(store().locked)return toast('Apri una nuova revisione per modificare.');const file=document.getElementById('vtp-finalPdf')?.files?.[0];if(!file)return toast('Seleziona un PDF definitivo.');if(!/\.pdf$/i.test(file.name)&&file.type!=='application/pdf')return toast('Sono ammessi soltanto PDF.');if(file.size>30*1024*1024)return toast('PDF oltre 30 MB: conserva il documento separatamente.');
  const key='vt-final::'+(state.practiceNo||'')+'::'+id();try{await attachmentWrite({id:key,file});store().finalFiles.push({id:key,name:file.name,revision:store().revision,date:today(),size:file.size});update();toast('PDF definitivo conservato su questo browser. Esporta un backup cifrato per proteggerlo.');}catch(e){toast('Salvataggio non riuscito: '+e.message);}},
 async downloadFinal(i){const ref=store().finalFiles[i];if(!ref)return;const rec=await attachmentRead(ref.id);if(!rec?.file)return toast('PDF non disponibile su questo dispositivo.');download(ref.name,rec.file,'application/pdf');},
 async shareFinal(i){const ref=store().finalFiles[i];if(!ref)return;const rec=await attachmentRead(ref.id);if(!rec?.file)return toast('PDF non disponibile su questo dispositivo.');
  const file=new File([rec.file],ref.name,{type:'application/pdf'});if(navigator.share&&navigator.canShare?.({files:[file]})){
    try{await navigator.share({title:'Fascicolo '+state.practiceNo,text:'Fascicolo tecnico',files:[file]});toast('Condivisione avviata. Registra la consegna solo dopo averne verificato l’esito.');}catch(e){if(e.name!=='AbortError')toast('Condivisione non riuscita: '+e.message);}
  }else{download(ref.name,rec.file,'application/pdf');toast('PDF scaricato. Allegalo manualmente all’email o a WhatsApp.');}},
 addDelivery(){const channel=get('deliveryChannel'),ref=get('deliveryReference');if(!ref)return toast('Indica almeno destinatario o riferimento.');store().deliveries.push({date:get('deliveryDate'),channel,reference:ref,notes:get('deliveryNotes')});update();},
 async exportBackup(){const password=get('backupPassword'),again=get('backupPasswordConfirm');if(password.length<12||password!==again)return toast('Inserisci una password di almeno 12 caratteri e confermala.');try{
    save(false);const all=archive(),list=[],seen=new Set();
    for(const rec of all){for(const m of rec.attachmentFiles||[]){if(!m.id||seen.has(m.id))continue;seen.add(m.id);const x=await attachmentRead(m.id);if(!x?.file)throw Error('Allegato mancante: '+m.name);list.push({id:m.id,name:m.name,type:x.file.type||'',base64:await fileBase64(x.file)});}}
    for(const rec of all){for(const m of rec.vtPro?.finalFiles||[]){if(!m.id||seen.has(m.id))continue;seen.add(m.id);const x=await attachmentRead(m.id);if(!x?.file)throw Error('PDF finale mancante: '+m.name);list.push({id:m.id,name:m.name,type:'application/pdf',base64:await fileBase64(x.file)});}}
    const plain={format:'VT-DICO-PORTABLE-ARCHIVE',version:1,created:new Date().toISOString(),practices:all,files:list};
    const enc=await encrypt(JSON.stringify(plain),password);download('VimerTek_BACKUP_CIFRATO_'+today()+'.json',JSON.stringify(enc));
    localStorage.setItem('vtpro_last_encrypted_export',today());toast('Backup cifrato creato. Conservalo fuori dal dispositivo e ricorda la password.');
  }catch(e){toast('Backup non completato: '+e.message);}},
 async importBackup(){const password=get('importPassword'),file=document.getElementById('vtp-importFile')?.files?.[0];if(!file||!password)return toast('Seleziona il backup e inserisci la password.');try{
  const payload=await decrypt(JSON.parse(await file.text()),password);
  if(payload?.format!=='VT-DICO-PORTABLE-ARCHIVE'||!Array.isArray(payload.practices)||!Array.isArray(payload.files))throw Error('Archivio non valido');
  if(payload.practices.some(x=>!x||typeof x.practiceNo!=='string'||!x.practiceNo.startsWith('VT-DICO-')))throw Error('Sono presenti pratiche con identificativo non valido');
  if(!confirm('Ripristinare '+payload.practices.length+' pratiche? Le pratiche con lo stesso numero verranno SOSTITUITE nel browser, comprese le relative informazioni. Esporta prima un backup dell’archivio attuale.'))return;
  const existing=archive(),byNo=new Map(existing.map(x=>[x.practiceNo,x]));
  for(const x of payload.files){if(typeof x.id!=='string'||typeof x.base64!=='string')throw Error('File backup non valido');const bytes=base64Bytes(x.base64);if(bytes.length>30*1024*1024)throw Error('Singolo allegato oltre 30 MB');await attachmentWrite({id:x.id,file:new Blob([bytes],{type:x.type||'application/octet-stream'})});}
  for(const x of payload.practices)byNo.set(x.practiceNo,x);
  const merged=[...byNo.values()];localStorage.setItem('vt_dico_archive',JSON.stringify(merged));
  if(payload.practices.length) {state=payload.practices[0];localStorage.setItem('vt_dico',JSON.stringify(state));}
  toast('Ripristino completato: '+payload.practices.length+' pratiche importate. Aggiorna la pagina per continuare.');render();
 }catch(e){toast('Ripristino NON completato: '+e.message+'. I dati già presenti non sono stati eliminati.');}}
};
// checkbox conferme documentali via delega eventi, senza distruggere le funzioni base dell'app.
document.addEventListener('change',e=>{const box=e.target;if(!box.matches?.('[data-vtp-doc]'))return;if(store().locked)return;
 store().documents[box.dataset.vtpDoc]=box.checked;update();});
const css=document.createElement('style');css.textContent=`
 .vtpro-card{margin-top:18px}.vtpro-card h2{margin-top:0}.vtpro-actions{display:flex;flex-wrap:wrap;gap:8px}.vtpro-progress{height:9px;border-radius:999px;background:#e5e7eb;overflow:hidden;margin:12px 0}.vtpro-progress>span{display:block;height:100%;background:#506d86}.vtpro-checkboxes{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin:14px 0}.vtpro-checkboxes label{border:1px solid #e1e4e8;border-radius:7px;padding:9px;font-weight:500}.vtpro-checkboxes input{width:auto;margin:0 7px 0 0}.vtpro-card .table{margin:14px 0}.vtpro-locked{padding:12px;background:#f6eee2;border-left:4px solid #b45309;margin:16px 0}.vtpro-card small{color:#69727d}.vtpro-card .actions{flex-wrap:wrap}.vtpro-card button:disabled{opacity:.4;cursor:not-allowed}@media(max-width:700px){.vtpro-checkboxes{grid-template-columns:1fr}}
 @media print{#vtpro-main,.vtpro-locked{display:none!important}}
 `;document.head.appendChild(css);
render();
})();
