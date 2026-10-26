/* Vimer Tek Di.Co. 37/08 - v1.9.10 - completamento Allegato I, CEI 64-8, backup Drive.
 * Nessuna modifica a copertina/logo/schema. Nessuna chiave OAuth privata nel codice.
 * Backup cifrato AES-GCM; access token e password mantenuti esclusivamente in memoria.
 */
(function(){
'use strict';
const MARK='VT_COMPLETAMENTO_V1910';
if(window.__vtCompletamentoV1910)return;
window.__vtCompletamentoV1910=true;
const iso=()=>new Date().toISOString().slice(0,10);
const escapeHTML=s=>String(s??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const val=id=>document.getElementById('vtx-'+id)?.value?.trim()||'';
const check=id=>!!document.getElementById('vtx-'+id)?.checked;
const fmt=v=>escapeHTML(v||'________________________________');
const ministerialKey=['representative','sector','headOffice','regType','regOffice','regNo','installDesc','clientTown','clientProv','floor','interno','scala','owner','projectAuthor','technicalStandard','otherWork','otherAttachments','confirmProject','confirmNorms','confirmMaterials','confirmTesting','attachProject','attachMaterials','attachScheme','attachPrior','attachCertificate','attachOther','buildingUse'];
const opts={regType:['Registro delle imprese','Albo imprese artigiane'],buildingUse:['civile','industriale','commercio','altri usi']};
const labels={
regType:'Tipo di iscrizione',
buildingUse:'Destinazione uso immobile',
representative:'Titolare / legale rappresentante che dichiara',sector:'Settore di attività impresa (es. impianti elettrici)',headOffice:'Sede (via, n., comune, provincia)',regOffice:'Camera C.I.A.A. / albo di',regNo:'Numero di iscrizione',installDesc:'Descrizione schematica dell’impianto',clientTown:'Comune di installazione',clientProv:'Provincia di installazione',floor:'Piano',interno:'Interno',scala:'Scala',owner:'Proprietario (se diverso dal committente)',projectAuthor:'Autore del progetto / titolo professionale',technicalStandard:'Norme tecniche applicate (specifiche e verificate)',otherWork:'Altro intervento (precisare)',otherAttachments:'Allegati facoltativi'};
const defaultValue=(k)=>{
 const d={representative:state.issuerTechnician||'',sector:'Impianti tecnologici',headOffice:state.companyAddress||'',regType:'Registro delle imprese',regOffice:state.registryOffice||'',regNo:state.registryNumber||'',installDesc:state.workDescription||'',clientTown:state.city||'',clientProv:state.province||'',owner:state.client||'',projectAuthor:(state.designers||[])[0]?.name||'',technicalStandard:'',buildingUse:state.use==='Residenziale'?'civile':state.use==='Industriale'?'industriale':state.use==='Commerciale'?'commercio':'altri usi'};
 return d[k]||'';
};
function getStore(){if(!state.vtV1910||typeof state.vtV1910!=='object')state.vtV1910={};const d=state.vtV1910;if(!d.ministerial)d.ministerial={};if(!d.cei)d.cei={};return d;}
function entry(key){
 const d=getStore().ministerial;
 const v=d[key];
 const automatici=['installDesc','clientTown','clientProv'];
 if(v===undefined || (v==='' && automatici.includes(key))){
   return defaultValue(key);
 }
 return v;
}
function input(k,placeholder=''){const a=entry(k);return `<label>${escapeHTML(labels[k]||k)}<input id="vtx-${k}" value="${escapeHTML(a)}" placeholder="${escapeHTML(placeholder)}"></label>`;}
function selector(k,items){const saved=entry(k);return `<label>${escapeHTML(labels[k]||k)}<select id="vtx-${k}">${items.map(x=>`<option value="${escapeHTML(x)}" ${x===saved?'selected':''}>${escapeHTML(x)}</option>`).join('')}</select></label>`;}
function ministerialHTML(){
 if(state.doc!=='Di.Co.')return '';
 return `<section class="card vtx-card" id="vtx-ministerial"><h2>Allegato I ministeriale — compilazione guidata</h2>
 <p>Riproduzione del modello previsto dal <b>D.M. 19 maggio 2010, Allegato I</b>, per imprese installatrici. I campi anagrafici sono precompilati dalla pratica; controlla tutti i dati e i presupposti prima di firmare. Questo modulo è <b>separato</b> dalla precedente scheda di lavoro nel fascicolo.</p>
 <p><a href="https://www.gazzettaufficiale.it/atto/vediMenuHTML?atto.codiceRedazionale=10A08437&atto.dataPubblicazioneGazzetta=2010-07-13&tipoSerie=serie_generale&tipoVigenza=originario" target="_blank" rel="noopener noreferrer">Consulta l’originale ufficiale (Gazzetta Ufficiale) ↗</a></p>
 <div class="grid">${input('representative')}${input('sector')}${input('headOffice')}${selector('regType',opts.regType)}${input('regOffice')}${input('regNo')}${input('installDesc')}${input('clientTown')}${input('clientProv')}${input('floor')}${input('scala')}${input('interno')}${input('owner')}${selector('buildingUse',opts.buildingUse)}${input('projectAuthor')}${input('technicalStandard','Specificare CEI, UNI ecc. applicabili')}${input('otherWork')}${input('otherAttachments')}</div>
 <p><b>Controlli dichiarativi (selezionare solo se verificati):</b></p><div class="vtx-checks">${[['confirmProject','Rispettato il progetto applicabile'],['confirmNorms','Seguita la normativa tecnica indicata'],['confirmMaterials','Componenti idonei al luogo di installazione'],['confirmTesting','Prove effettivamente eseguite, esito positivo']].map(([k,s])=>`<label><input type="checkbox" id="vtx-${k}" ${entry(k)?'checked':''}> ${escapeHTML(s)}</label>`).join('')}</div>
 <p><b>Allegati (includere nella pratica o indicare se non pertinenti):</b></p><div class="vtx-checks">${[['attachProject','Progetto artt. 5 e 7'],['attachMaterials','Relazione materiali'],['attachScheme','Schema impianto realizzato'],['attachPrior','Riferimenti a Di.Co. precedenti/parziali'],['attachCertificate','Certificato requisiti tecnico-professionali'],['attachOther','Attestazione per sistemi non normalizzati, ove applicabile']].map(([k,s])=>`<label><input type="checkbox" id="vtx-${k}" ${entry(k)?'checked':''}> ${escapeHTML(s)}</label>`).join('')}</div>
 <div class="actions"><button type="button" onclick="vtV1910.saveMinisterial()">Salva campi Allegato I</button><button type="button" onclick="vtV1910.printMinisterial()">Stampa modello / Salva PDF</button></div>
 <p class="muted">La dichiarazione è valida soltanto se emessa dal soggetto legittimato, con i requisiti e gli allegati applicabili. La firma grafica non è automaticamente una firma elettronica qualificata.</p></section>`;
}
function checkbox(key,label){return `<label><input type="checkbox" id="vtx-cei-${key}" ${getStore().cei[key]?'checked':''}> ${escapeHTML(label)}</label>`;}
const circs={1:[2,3,4,5],2:[3,3,5,6],3:[3,4,5,7]};
function areaBand(n){return n<=50?0:n<=75?1:n<=125?2:3;}
function ceiResult(c){
 if(c.applicabile==='Non applicabile')return {status:'Capitolo 37 non applicabile alla pratica selezionata',levels:[],checks:[]};if(!/^(Nuovo impianto residenziale|Rifacimento completo)$/.test(c.applicabile||''))return {status:'Applicabilità da verificare',levels:[],checks:[]};
 const area=Number(c.area),circ=Number(c.circuits),rcd=Number(c.rcd),domo=Number(c.domotica);
 if(!area||area<=0||!Number.isInteger(circ)||!Number.isInteger(rcd)||circ<0||rcd<0)return {status:'Dati insufficienti',levels:[],checks:[]};
 const b=areaBand(area),levels=[];
 for(const level of [1,2,3]){
   const rows=[
    ['Circuiti ordinari',circ>=circs[level][b],`${circ} presenti / ${circs[level][b]} minimi (esclusi i dedicati)`],
    ['Differenziali',rcd>=2,`${rcd} indicati / almeno 2`],
    ['Quadro, montante e protezione',!!c.distributionVerified,'Sezioni, generale, SPD e adeguatezza dimensionamento verificati dal tecnico'],
    ['Punti presa/luce per ambiente',!!c.roomVerified,'Verificata voce per voce la Tabella A applicabile, non dal solo conteggio frutti'],
    ['Prese dati/TV e predisposizione digitale',!!c.dataVerified,'Prese e QDSA / predisposizioni richieste verificate'],
    ['Lampade di emergenza / antiblackout',!!c.emergencyVerified,'Numero e posizione coerenti con Tabella A'],
    ['Funzioni e dotazioni livello',!!c.levelVerified,'Verificati eventuali requisiti aggiuntivi specifici del livello']
   ];
   if(level===2)rows.push(['Funzioni aggiuntive',domo>=2,`${domo} funzioni indicate; verificare che corrispondano alle funzioni ammesse`]);
   if(level===3){rows.push(['Funzioni domotiche integrate',domo>=4&&!!c.integrated,`${domo} funzioni, integrazione/interoperabilità da verificare`]);rows.push(['SPD livello 3',!!c.spd3,'Protezione da sovratensioni verificata come richiesta']);}
   levels.push({level,passed:rows.every(x=>x[1]),checks:rows});
 }
 const accepted=levels.filter(x=>x.passed).map(x=>x.level);
 return {status:accepted.length?`Pre-verifica completata fino al livello ${Math.max(...accepted)}`:'Requisiti incompleti — livello non attestabile',levels,checks:[]};
}
function ceiCounts(){
 const fruits=state.fruits||[], grouped=new Map();
 for(const f of fruits){
  const room=String(f.room||'Non indicato');
  if(!grouped.has(room))grouped.set(room,{count:0,types:new Set()});
  const g=grouped.get(room);
  g.count+=Number(f.qty)||0;
  g.types.add(String(f.type||'Non classificato'));
 }
 const rows=[...grouped].map(([room,g])=>`<tr><td>${escapeHTML(room)}</td><td>${g.count}</td><td>${escapeHTML([...g.types].join(', '))}</td></tr>`).join('');
 return `<p><b>Conteggio automatico:</b> ${fruits.reduce((sum,f)=>sum+(Number(f.qty)||0),0)} frutti · ${(state.circuits||[]).length} circuiti registrati · ${grouped.size} locali con frutti.</p>${rows?`<table class="table"><tr><th>Ambiente</th><th>Frutti</th><th>Tipologie registrate</th></tr>${rows}</table>`:''}`;
}
function ceiHTML(){const saved=getStore().cei;const legacy=state.vtPro?.cei||{};
 const c={...legacy,...saved};if(!saved.applicabile&&legacy.applicable)c.applicabile=legacy.applicable;const result=ceiResult(c);
 const sel=(key,title,list)=>`<label>${title}<select id="vtx-cei-${key}">${list.map(t=>`<option value="${escapeHTML(t)}" ${c[key]===t?'selected':''}>${escapeHTML(t)}</option>`).join('')}</select></label>`;
 const number=(key,title)=>`<label>${title}<input type="number" id="vtx-cei-${key}" min="0" value="${escapeHTML(c[key]??'')}"></label>`;
 return `<section id="vtx-cei" class="card vtx-card"><h2>CEI 64-8 — verifica guidata Capitolo 37 (ed. 2024)</h2><p>Per nuovi impianti e rifacimenti <b>completi</b> di unità immobiliari a uso residenziale. La pre-verifica usa le soglie dei circuiti; le dotazioni per ogni ambiente devono essere controllate dal tecnico sulla Tabella A vigente. Nessuna conformità è assegnata automaticamente se mancano verifiche.</p>
 ${ceiCounts()}
 <div class="grid">${sel('applicabile','Applicabilità',['Da verificare','Nuovo impianto residenziale','Rifacimento completo','Non applicabile'])}${number('area','Superficie calpestabile interna (m²)')}${number('rooms','Numero ambienti (esclusi accessori)')}${number('circuits','Circuiti ordinari (esclusi servizi dedicati)')}${number('rcd','Interruttori differenziali')}${number('domotica','Funzioni aggiuntive/domotiche valide')}</div>
 <div class="vtx-checks">${checkbox('distributionVerified','Quadro, montante, generale e SPD valutati secondo norma')}${checkbox('roomVerified','Ogni locale verificato sulla Tabella A 2024 (presa, luce, TV...)')}${checkbox('dataVerified','Dati, TV, QDSA/predisposizioni richieste verificati')}${checkbox('emergencyVerified','Illuminazione di emergenza/antiblackout verificata')}${checkbox('levelVerified','Tutte le dotazioni specifiche del livello richiesto verificate')}${checkbox('integrated','Livello 3: funzioni domotiche effettivamente integrate/interoperabili')}${checkbox('spd3','Livello 3: SPD conformi alle prescrizioni specifiche')}</div>
 <div class="actions"><button type="button" onclick="vtV1910.saveCEI()">Salva e ricalcola</button><button class="secondary" type="button" onclick="vtV1910.printCEI()">Stampa scheda di verifica</button></div>
 <p><strong>Esito orientativo:</strong> ${escapeHTML(result.status)}</p>
 ${result.levels.length?`<table class="table"><tr><th>Livello</th><th>Requisito</th><th>Verifica</th></tr>${result.levels.flatMap(L=>L.checks.map(([name,ok,note])=>`<tr><td>${L.level}</td><td>${escapeHTML(name)}<br><small>${escapeHTML(note)}</small></td><td>${ok?'✓ Registrato':'Da verificare'}</td></tr>`)).join('')}</table>`:''}
 <p class="muted"><b>Importante:</b> le caselle sono dichiarazioni di verifica dell’operatore, non sensori automatici. Per l’attestazione effettiva occorre consultare le tabelle della norma CEI applicabile e il progetto. La scheda è salvata nella pratica e rimane un rapporto ausiliario.</p></section>`;
}
let token='',tokenExpiry=0,backupPass='',running=false,lastSignature='',dirty=true,lastSync=0;
const CLOUD_ID='vt_dico_oauth_client_id', CLOUD_AUTO='vt_dico_cloud_autosync';
const cloudAllowed=()=>!!token&&Date.now()+30000<tokenExpiry;
const clientId=()=>localStorage.getItem(CLOUD_ID)||'';
function cloudHTML(){const enabled=localStorage.getItem(CLOUD_AUTO)==='yes';return `<section class="card vtx-card" id="vtx-cloud"><h2>Backup cifrato su Google Drive</h2>
 <p>Salva un archivio AES-256-GCM completo nella <b>cartella nascosta dell’app</b> di Google Drive (non nella cartella pubblica). Collegamento OAuth: Google richiede un Client ID per l’origine HTTPS da cui apri l’app; non servono password Google nell’app.</p>
 <label>Google OAuth Client ID (identificatore pubblico)<input id="vtx-clientId" value="${escapeHTML(clientId())}" placeholder="...apps.googleusercontent.com"></label>
 <div class="grid"><label>Password del backup (min. 12 caratteri, mai salvata)<input id="vtx-cloudPassword" type="password" autocomplete="off" placeholder="Password per cifrare prima dell'invio"></label><label><input type="checkbox" id="vtx-auto" ${enabled?'checked':''}> Backup automatico ogni 20 min con app aperta, se sono presenti modifiche</label></div>
 <div class="actions"><button type="button" onclick="vtV1910.authorizeDrive()">Collega Google Drive</button><button type="button" onclick="vtV1910.uploadDrive()">Crea backup cifrato ora</button><button class="secondary" type="button" onclick="vtV1910.downloadLastDrive()">Scarica ultimo backup cifrato</button></div>
 <p id="vtx-cloudStatus" class="muted">${cloudAllowed()?'Google Drive collegato per questa sessione':'Google Drive non collegato / accesso scaduto'} · ultimo caricamento ${escapeHTML(localStorage.getItem('vt_dico_cloud_last')||'mai')}</p>
 <p class="muted">La sincronizzazione automatica opera <b>solo mentre questa pagina è aperta</b>, il token è valido e la password è disponibile in memoria. Chiudendo l’app è necessario autenticarsi nuovamente e reinserire la password. I backup remoti <b>non</b> vengono inviati a GitHub. Verifica periodicamente il ripristino tramite il pulsante già presente «Ripristina da backup».</p></section>`;}
function status(txt){const el=document.getElementById('vtx-cloudStatus');if(el)el.textContent=txt;}
function enhance(){if(archiveView)return;const root=document.getElementById('app');if(!root||document.getElementById('vtx-enhanced'))return;
 let body='';if(active===1&&state.doc==='Di.Co.')body=ministerialHTML();if(active===5)body=ceiHTML();if(active===10)body=cloudHTML();if(!body)return;
 const el=document.createElement('div');el.id='vtx-enhanced';el.innerHTML=body;root.appendChild(el);
 if(state.vtPro?.locked)el.querySelectorAll('input,select').forEach(x=>x.disabled=true);
}
const prevRender=render;
render=function(){prevRender();enhance();};
function saveM(){if(state.vtPro?.locked)return alert('Apri prima una nuova revisione modificabile.');const d=getStore().ministerial;for(const key of ministerialKey){d[key]=key.startsWith('confirm')||key.startsWith('attach')?check(key):val(key);}save(false);dirty=true;alert('Campi Allegato I salvati correttamente');}
function saveC(){if(state.vtPro?.locked)return alert('Apri prima una nuova revisione modificabile.');const c=getStore().cei;for(const k of ['applicabile','area','rooms','circuits','rcd','domotica'])c[k]=val('cei-'+k);if(state.vtPro?.cei){const old=state.vtPro.cei;for(const k of ['area','rooms','rcd','domotica'])old[k]=c[k];old.applicable=c.applicabile;}for(const k of ['distributionVerified','roomVerified','dataVerified','emergencyVerified','levelVerified','integrated','spd3'])c[k]=check('cei-'+k);save(false);dirty=true;render();}
const box=(b)=>b?'☒':'☐';
function printWindow(title,html){const w=window.open('','_blank');if(!w){alert('Consenti i popup per stampare il documento.');return;}w.document.open();w.document.write(`<!doctype html><html lang="it"><head><meta charset="utf-8"><title>${escapeHTML(title)}</title><style>@page{size:A4;margin:13mm 13mm}*{box-sizing:border-box}body{font:10pt/1.34 Arial,sans-serif;color:#111;margin:0}h1{font-size:13.5pt;text-align:center;margin:3mm 0 5mm}h2{font-size:10pt;margin:4mm 0 1mm}.a{border:1px solid #222;padding:5mm}p{margin:2.5mm 0;overflow-wrap:anywhere}.line{border-bottom:1px dotted #888}.small{font-size:8pt}.sig{display:flex;gap:9mm;margin-top:7mm}.sig>div{flex:1;text-align:center}.signline{border-bottom:1px solid #111;min-height:10mm}.page{page-break-after:always;break-after:page}.legend{font-size:9pt;line-height:1.28}.legend p{margin:2mm 0 3mm}table{width:100%;border-collapse:collapse}td,th{padding:2.5mm;border:1px solid #bbb;text-align:left}strong{font-weight:700}@media screen{body{margin:8mm auto;padding:5mm;max-width:210mm;box-shadow:0 0 6px #bbb}}@media print{.page:last-child{page-break-after:auto}}</style></head><body>${html}</body></html>`);w.document.close();w.focus();setTimeout(()=>w.print(),350);}
function printMinisterial(){if(state.doc!=='Di.Co.')return alert('Il modello Allegato I è predisposto solo per Di.Co.');saveM();const d=getStore().ministerial;
 const ins=x=>fmt(x), f=k=>fmt(d[k]);const regFirm=state.issuerCompany||state.company||'';
 const work=['Nuovo impianto','Trasformazione','Ampliamento','Manutenzione straordinaria','Altro'].map(x=>`${box(state.work===x)} ${escapeHTML(x)}`).join(' &nbsp; ');
 const use=opts.buildingUse.map(x=>`${box(d.buildingUse===x)} ${escapeHTML(x)}`).join(' &nbsp; ');
 const ch=k=>box(!!d[k]);
 const page1=`<article class="page"><div style="text-align:right" class="small">Allegato I (art. 7 D.M. 37/2008) · testo di riferimento: D.M. 19 maggio 2010</div><div class="a"><h1>DICHIARAZIONE DI CONFORMITÀ DELL’IMPIANTO ALLA REGOLA DELL’ARTE</h1>
 <p>Il sottoscritto <strong>${f('representative')}</strong>, titolare o legale rappresentante dell’impresa (ragione sociale) <strong>${ins(regFirm)}</strong>, operante nel settore <strong>${f('sector')}</strong>, con sede in <strong>${f('headOffice')}</strong>, tel. <strong>${ins(state.companyPhone)}</strong>, part. IVA <strong>${ins(state.companyVat)}</strong>.</p>
 <p>${box(d.regType==='Registro delle imprese')} Iscritta nel registro delle imprese (d.P.R. 7/12/1995, n. 581) &nbsp; ${box(d.regType==='Albo imprese artigiane')} iscritta all’albo provinciale delle imprese artigiane (l. 8/8/1985, n. 443) della Camera C.I.A.A. di <strong>${f('regOffice')}</strong>, n. <strong>${f('regNo')}</strong>.</p>
 <p>esecutrice dell’impianto (descrizione schematica) <strong>${f('installDesc')}</strong></p>
 <p>inteso come: ${work}${d.otherWork?` (${f('otherWork')})`:''}</p>
 <p>commissionato da: <strong>${ins(state.client)}</strong>, installato nei locali siti nel comune di <strong>${f('clientTown')}</strong> (prov. <strong>${f('clientProv')}</strong>) via <strong>${ins(state.address)}</strong> scala <strong>${f('scala')}</strong> piano <strong>${f('floor')}</strong> interno <strong>${f('interno')}</strong>, di proprietà di <strong>${f('owner')}</strong>.</p>
 <p>In edificio adibito ad uso: ${use}</p><h2 style="text-align:center">DICHIARA</h2>
 <p>sotto la propria personale responsabilità, che l’impianto è stato realizzato in modo conforme alla regola dell’arte, secondo quanto previsto dall’art. 6, tenuto conto delle condizioni di esercizio e degli usi a cui è destinato l’edificio, avendo in particolare:</p>
 <p>${ch('confirmProject')} rispettato il progetto redatto ai sensi dell’art. 5 da <strong>${f('projectAuthor')}</strong>;</p>
 <p>${ch('confirmNorms')} seguito la norma tecnica applicabile all’impiego <strong>${f('technicalStandard')}</strong>;</p>
 <p>${ch('confirmMaterials')} installato componenti e materiali adatti al luogo di installazione (art. 5 e 6);</p>
 <p>${ch('confirmTesting')} controllato l’impianto ai fini della sicurezza e della funzionalità con esito positivo, avendo eseguito le verifiche richieste dalle norme e dalle disposizioni di legge.</p>
 <h2>Allegati obbligatori (secondo applicabilità):</h2>
 <p>${ch('attachProject')} progetto ai sensi degli articoli 5 e 7; ${ch('attachMaterials')} relazione con tipologie dei materiali utilizzati; ${ch('attachScheme')} schema dell’impianto realizzato; ${ch('attachPrior')} riferimento a dichiarazioni di conformità precedenti o parziali, già esistenti; ${ch('attachCertificate')} copia del certificato di riconoscimento dei requisiti tecnico-professionali; ${ch('attachOther')} attestazione di conformità per impianto con materiali o sistemi non normalizzati, ove richiesta.</p>
 <p>Allegati facoltativi: <strong>${f('otherAttachments')}</strong></p>
 <p style="text-align:center">DECLINA</p><p>ogni responsabilità per sinistri a persone o a cose derivanti da manomissione dell’impianto da parte di terzi ovvero da carenze di manutenzione o riparazione.</p>
 <div class="sig"><div>Data: ${ins(state.dicoDate||iso())}<div class="signline"></div></div><div>Il responsabile tecnico<div class="signline"></div><small>(timbro e firma) ${ins(state.technician)}</small></div><div>Il dichiarante<div class="signline"></div><small>(timbro e firma) ${f('representative')}</small></div></div>
 <p class="small">AVVERTENZE PER IL COMMITTENTE: responsabilità del committente o del proprietario, art. 8 (nota 10 nella legenda).</p></div></article>`;
 const legend=`<article class="legend"><h1>ALLEGATO I — LEGENDA E NOTE DI COMPILAZIONE</h1><div class="a">
 <p><b>1.</b> La voce «altro» può riferirsi, ad esempio, alla sostituzione di un apparecchio installato in modo fisso.</p>
 <p><b>2.</b> Indicare nome, cognome, qualifica e, quando necessario ai sensi dell’art. 5 comma 2, estremi d’iscrizione all’albo del tecnico che ha redatto il progetto.</p>
 <p><b>3.</b> Citare le norme tecniche e di legge, distinguendo progettazione, esecuzione e verifiche.</p>
 <p><b>4.</b> Il progetto finale deve includere le varianti in corso d’opera e, ove necessario, i riferimenti alla prevenzione incendi.</p>
 <p><b>5.</b> La relazione materiali deve documentare la conformità dei prodotti e l’idoneità rispetto all’ambiente di installazione, con le caratteristiche rilevanti degli apparecchi.</p>
 <p><b>6.</b> Lo schema dell’impianto realizzato descrive l’opera come eseguita, eventualmente rinviando al progetto non variato; in caso di trasformazione o ampliamento inquadrare le parti preesistenti.</p>
 <p><b>7.</b> Indicare le imprese esecutrici e le date delle Di.Co. precedenti o parziali; quando applicabile, i riferimenti a dichiarazioni di rispondenza di parti antecedenti al decreto.</p>
 <p><b>8.</b> Per prodotti/sistemi non normalizzati legittimamente utilizzati in altri Stati UE/SEE verificare le specifiche condizioni e la documentazione integrativa prevista dal modello.</p>
 <p><b>9.</b> Gli allegati facoltativi possono includere risultati delle verifiche, trattamenti e certificati supplementari.</p>
 <p><b>10.</b> L’impresa installatrice rilascia la Di.Co. al termine dei lavori. Il committente o proprietario affida i lavori ad imprese abilitate ai sensi dell’art. 3 D.M. 37/08.</p></div>
 <p class="small">NOTA: Questa è una riproduzione funzionale del modello con legenda riassunta, non una copia tipografica integrale della pubblicazione ministeriale. Confrontare con l’Allegato I originale prima dell’emissione.</p>
 <p class="small">Fonte: Gazzetta Ufficiale n. 161 del 13 luglio 2010, D.M. 19 maggio 2010, Allegato I.</p></article>`;
 printWindow('Di.Co. Allegato I '+(state.practiceNo||''),page1+legend);
}
function printCEI(){saveC();const c=getStore().cei;const r=ceiResult(c);const rows=r.levels.flatMap(x=>x.checks.map(([s,yes,note])=>`<tr><td>${x.level}</td><td>${escapeHTML(s)}</td><td>${yes?'Registrata':'Da verificare'}</td><td>${escapeHTML(note)}</td></tr>`)).join('');printWindow('CEI 64-8 '+(state.practiceNo||''),`<h1>Scheda ausiliaria — verifica livello CEI 64-8</h1><p><b>Pratica:</b> ${fmt(state.practiceNo)} &nbsp; <b>Cliente:</b> ${fmt(state.client)}</p><p><b>Applicabilità:</b> ${fmt(c.applicabile)}; superficie ${fmt(c.area)} m²; circuiti ordinari ${fmt(c.circuits)}; differenziali ${fmt(c.rcd)}.</p><p><b>Esito orientativo:</b> ${escapeHTML(r.status)}</p><table><tr><th>Liv.</th><th>Voce</th><th>Esito</th><th>Osservazioni</th></tr>${rows}</table><p class="small">Esito da verificare con CEI 64-8 edizione applicabile e tabella dotazioni ambienti. Non sostituisce una dichiarazione di conformità.</p><div class="sig"><div>Data ${iso()}</div><div>Verificato da ${fmt(state.technician)}<div class="signline"></div></div></div>`);}
// Google Identity Services. OAuth client ID pubblico, scope limitato alla cartella dati app.
const SCOPE='https://www.googleapis.com/auth/drive.appdata';
async function gis(){if(window.google?.accounts?.oauth2)return;
 await new Promise((resolve,reject)=>{let src=document.querySelector('script[data-vtx-gis]');if(src){src.addEventListener('load',resolve,{once:true});src.addEventListener('error',reject,{once:true});return;}src=document.createElement('script');src.src='https://accounts.google.com/gsi/client';src.async=true;src.dataset.vtxGis='1';src.onload=resolve;src.onerror=()=>reject(Error('Libreria Google non raggiungibile'));document.head.appendChild(src);});}
function passwordForCloud(){const p=val('cloudPassword')||backupPass;if(p.length<12)throw Error('Inserisci una password di almeno 12 caratteri.');backupPass=p;return p;}
async function authorizeDrive(){const c=val('clientId')||clientId();if(!/^\d+-[a-zA-Z0-9_-]+\.apps\.googleusercontent\.com$/.test(c))return alert('Inserisci un OAuth Client ID Google valido (.apps.googleusercontent.com).');
 localStorage.setItem(CLOUD_ID,c);localStorage.setItem(CLOUD_AUTO,check('auto')?'yes':'no');
 try{passwordForCloud();await gis();const oauth=google.accounts.oauth2.initTokenClient({client_id:c,scope:SCOPE,callback:resp=>{if(resp.error){status('Accesso negato: '+resp.error);return;}token=resp.access_token;tokenExpiry=Date.now()+(Number(resp.expires_in)||3500)*1000;status('Google Drive collegato. Puoi eseguire il backup cifrato.');}});oauth.requestAccessToken({prompt:'consent'});}catch(e){status('Collegamento non riuscito: '+e.message);}}
async function googleFetch(path,init={}){if(!cloudAllowed())throw Error('Autorizzazione Google scaduta: riconnetti Drive.');const heads=new Headers(init.headers||{});heads.set('Authorization','Bearer '+token);const r=await fetch(path,{...init,headers:heads});if(!r.ok){const tx=(await r.text()).slice(0,500);throw Error('Google Drive HTTP '+r.status+': '+tx);}return r;}
async function allData(){save(false);const all=archive(),files=[],seen=new Set();for(const p of all){const refs=[...(p.attachmentFiles||[]),...(p.vtPro?.finalFiles||[])];for(const r of refs){if(!r.id||seen.has(r.id))continue;seen.add(r.id);const f=await attachmentRead(r.id);if(!f?.file)throw Error('Allegato/PDF non disponibile: '+(r.name||r.id));if(f.file.size>30*1024*1024)throw Error('Un allegato supera 30 MB: '+(r.name||r.id));const ab=await f.file.arrayBuffer(),a=new Uint8Array(ab);let s='';for(let i=0;i<a.length;i+=8192)s+=String.fromCharCode(...a.slice(i,i+8192));files.push({id:r.id,name:r.name||'',type:f.file.type||'application/octet-stream',base64:btoa(s)});}}
 return {format:'VT-DICO-PORTABLE-ARCHIVE',version:1,created:new Date().toISOString(),practices:all,files};}
async function secureArchive(password){if(!crypto?.subtle)throw Error('Serve HTTPS per cifrare i dati');const plain=JSON.stringify(await allData());const salt=crypto.getRandomValues(new Uint8Array(16)),iv=crypto.getRandomValues(new Uint8Array(12));const m=await crypto.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveKey']);const key=await crypto.subtle.deriveKey({name:'PBKDF2',salt,iterations:250000,hash:'SHA-256'},m,{name:'AES-GCM',length:256},false,['encrypt']);const out=new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv},key,new TextEncoder().encode(plain)));
 const b64=a=>{let s='';for(let i=0;i<a.length;i+=8192)s+=String.fromCharCode(...a.slice(i,i+8192));return btoa(s)};
 return JSON.stringify({format:'VT-DICO-ENCRYPTED-BACKUP',version:1,kdf:'PBKDF2-SHA256',iterations:250000,salt:b64(salt),iv:b64(iv),ciphertext:b64(out)});}
// Verify existing v1.9.9 format to guarantee round-trip with its importer.
async function uploadJson(name,txt){const blob=new Blob([txt],{type:'application/json'});
 // Resumable session handles large photographic archives; no 5MB multipart restriction.
 const begin=await googleFetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&fields=id,name',{method:'POST',headers:{'Content-Type':'application/json; charset=UTF-8','X-Upload-Content-Type':'application/json','X-Upload-Content-Length':String(blob.size)},body:JSON.stringify({name,mimeType:'application/json',parents:['appDataFolder'],description:'Backup Vimer Tek Di.Co. cifrato AES-GCM'})});
 const session=begin.headers.get('Location');if(!session)throw Error('Google non ha restituito la sessione di caricamento (verifica CORS/origine OAuth).');
 const res=await googleFetch(session,{method:'PUT',headers:{'Content-Type':'application/json'},body:blob});return res.json();}
async function uploadDrive(auto=false){if(running)return;if(!cloudAllowed()){if(!auto)alert('Collega prima Google Drive.');return;}
 running=true;try{const pass=passwordForCloud();status('Cifratura dell’archivio completo in corso...');const txt=await secureArchive(pass);status('Trasferimento cifrato su Google Drive...');const name='VimerTek_DiCo_Backup_'+new Date().toISOString().replace(/[:.]/g,'-')+'.json';await uploadJson(name,txt);lastSync=Date.now();dirty=false;localStorage.setItem('vt_dico_cloud_last',new Date().toLocaleString('it-IT'));status('Backup cifrato salvato su Google Drive alle '+new Date().toLocaleString('it-IT'));if(!auto)alert('Backup cifrato caricato su Google Drive.');}catch(e){status('BACKUP NON RIUSCITO: '+e.message);if(!auto)alert('Backup NON completato: '+e.message);}finally{running=false;}}
async function downloadLastDrive(){if(!cloudAllowed())return alert('Collega prima Google Drive.');try{
 const q=new URLSearchParams({spaces:'appDataFolder',fields:'nextPageToken,files(id,name,createdTime,size)',page_size:'100',orderBy:'createdTime desc'});
 const res=await googleFetch('https://www.googleapis.com/drive/v3/files?'+q);const data=await res.json();const list=(data.files||[]).filter(x=>/^VimerTek_DiCo_Backup_.*\.json$/.test(x.name));if(!list.length)throw Error('Nessun backup salvato dalla nuova funzione');const item=list[0];const r=await googleFetch('https://www.googleapis.com/drive/v3/files/'+encodeURIComponent(item.id)+'?alt=media');const blob=await r.blob();const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=item.name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
 status('Archivio cifrato scaricato. Per ripristinarlo usa il modulo Backup cifrato della v1.9.9.');
 }catch(e){status('Download non riuscito: '+e.message);alert('Download non riuscito: '+e.message);}}
const prevSave=save;
save=function(...args){const result=prevSave(...args);dirty=true;return result;};
setInterval(()=>{if(localStorage.getItem(CLOUD_AUTO)==='yes'&&cloudAllowed()&&backupPass.length>=12&&dirty&&!running&&Date.now()-lastSync>=20*60*1000)uploadDrive(true);},60000);
window.vtV1910={saveMinisterial:saveM,printMinisterial,saveCEI:saveC,printCEI,authorizeDrive,uploadDrive,downloadLastDrive};
const style=document.createElement('style');style.textContent='.vtx-card{margin-top:18px}.vtx-card>.grid{margin-bottom:14px}.vtx-checks{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin:10px 0 16px}.vtx-checks label{display:flex;align-items:flex-start;border:1px solid #ddd;border-radius:6px;padding:9px;gap:7px;font-weight:500}.vtx-checks input{width:auto;margin:4px 0 0}.vtx-card input[type="checkbox"]{width:auto}.vtx-card td{vertical-align:top}@media(max-width:700px){.vtx-checks{grid-template-columns:1fr}}@media print{#vtx-enhanced{display:none!important}}';document.head.appendChild(style);
render();
})();
