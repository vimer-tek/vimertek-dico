const tabs=['Dashboard','Pratica','Impianto','Frutti e materiali','Quadri e circuiti','Livello CEI','Verifiche','Progettisti e progetti','Allegati','Unifilare','Fascicolo'];
const YEAR=new Date().getFullYear();
const emptyState=(no)=>({practiceNo:no||nextNo(),doc:'Di.Co.',status:'In lavorazione',client:'',clientTax:'',clientPhone:'',clientEmail:'',address:'',city:'',province:'',work:'Nuovo impianto',workDescription:'',use:'Residenziale',phase:'Monofase',voltage:'230 V',power:'6',earth:'TT',level:'1',brand:'',series:'',fruits:[],circuits:[],checks:{},verification:{mode:'rapida',items:{},instruments:[],date:'',notes:''},attachments:[],declarationRole:'Impresa installatrice',issuerCompany:'',issuerTechnician:'',issuerBasis:'',designers:[],projects:[],company:'VIMER TEK S.R.L.S.',technician:'',createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()});
function archive(){try{return JSON.parse(localStorage.getItem('vt_dico_archive')||'[]')}catch{return[]}}
function nextNo(){let a=archive(), nums=a.map(p=>+(String(p.practiceNo||'').match(/(\d+)$/)||[])[1]||0);let last=+(localStorage.getItem('vt_dico_last_no_'+YEAR)||0);let n=Math.max(0,last,...nums)+1;localStorage.setItem('vt_dico_last_no_'+YEAR,String(n));return `VT-DICO-${YEAR}-${String(n).padStart(3,'0')}`}
let state;try{state=JSON.parse(localStorage.getItem('vt_dico')||'null')}catch{}; state=state||emptyState(); let active=0; let archiveView=false;
const help=t=>`<button type='button' class='help' data-help='${escAttr(t)}' aria-label='Informazioni: ${escAttr(t)}' title='${escAttr(t)}'>?</button>`; const field=(k,l,h,type='text')=>`<label>${l}${help(h)}<input type='${type}' data-k='${k}' value='${escAttr(state[k]||'')}'></label>`;
function nav(){document.querySelector('#nav').innerHTML=tabs.map((x,i)=>`<button data-tab='${i}' class='${i===active?'active':''}'>${x}</button>`).join('');document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{goStep(+b.dataset.tab)})}
function dashboard(){let a=archive();return `<div class=grid3><div class=card><div class=muted>Pratica corrente</div><div class=stat>${esc(state.practiceNo)}</div></div><div class=card><div class=muted>Pratiche archiviate</div><div class=stat>${a.length}</div></div><div class=card><div class=muted>Stato</div><div class=stat smallstat>${esc(state.status||'In lavorazione')}</div></div></div><div class=card><h2>Gestione pratiche</h2><p>Crea, salva, riapri e modifica le pratiche Di.Co./Di.Ri. I dati tecnici vengono riutilizzati nelle sezioni successive.</p><div class=row><button onclick='newPractice()'>+ Nuova pratica</button><button class=secondary onclick='showArchive()'>Archivio pratiche</button></div></div><div id=archiveBox>${archiveHtml(a)}</div>`}
function archiveHtml(a){if(!a.length)return '';return `<div class=card><h2>Ultime pratiche</h2><div class=archive-list>${a.slice().reverse().map(p=>`<div class=archive-item><div><b>${esc(p.practiceNo)}</b><br><span>${esc(p.client||'Cliente da definire')} · ${esc(p.doc||'Di.Co.')}</span><br><small>${esc(p.address||p.city||'Ubicazione da definire')}</small></div><div><span class=pill>${esc(p.status||'In lavorazione')}</span><button onclick="openPractice('${escAttr(p.practiceNo)}')">Apri</button><button class='danger' onclick="deletePractice('${escAttr(p.practiceNo)}')">Elimina</button></div></div>`).join('')}</div></div>`}
function showArchive(){archiveView=true;active=0;render();window.scrollTo(0,0)}
function closeArchive(){archiveView=false;active=0;render()}
// VIMERTEK_DIRI_CONTROLLO_V196 - Valutazione PRELIMINARE su dati dichiarati, non abilitazione legale.
function diriValutazione(){
  const ruolo=String(state.diriRole||'');
  const rt=ruolo==='Responsabile tecnico di impresa abilitata';
  const professionista=ruolo.startsWith('Professionista iscritto');
  const nominativo=String(state.issuerTechnician||state.technician||'').toUpperCase();
  const vimer=rt && /Vimer\s*Tek/i.test(String(state.company||'')) && nominativo.includes('DECARO') && nominativo.includes('ALESSIO');
  // Decorrenza verificata sulla visura della Vimer Tek: SOLO per il RT identificato.
  const start=String(rt?(state.diriRtStart||(vimer?'2024-02-12':'')):(state.diriProfStart||''));
  const valido=/^\d{4}-\d{2}-\d{2}$/.test(start);
  let scadenza='',maturato=false,anni=0;
  if(valido){
    const [a,m,g]=start.split('-').map(Number);
    const inizio=new Date(a,m-1,g), anniv=new Date(a+5,m-1,g), oggi=new Date();
    if(inizio.getFullYear()===a && inizio.getMonth()===m-1 && inizio.getDate()===g && inizio<=oggi){
      scadenza=[String(anniv.getDate()).padStart(2,'0'),String(anniv.getMonth()+1).padStart(2,'0'),anniv.getFullYear()].join('/');
      maturato=oggi>=anniv;
      anni=oggi.getFullYear()-a-(oggi.getMonth()<m-1||(oggi.getMonth()===m-1&&oggi.getDate()<g)?1:0);
    }
  }
  const yr=String(state.diriYear||'').match(/\b(18|19|20)\d{2}\b/);
  const anno=yr?Number(yr[0]):0;
  const ante=anno>0&&anno<2008 || (anno===2008&&state.diriAnteMarzo2008==='Si');
  const problemi=[];
  if(!rt&&!professionista)problemi.push('Selezionare la qualifica effettiva del dichiarante.');
  if(!scadenza)problemi.push('Inserire una data di decorrenza valida del ruolo o esercizio professionale.');
  else if(!maturato)problemi.push('Requisito temporale di cinque anni non maturato: data prevista '+scadenza+'.');
  if(rt&&state.diriRtContinuita!=='Si')problemi.push('Continuità del ruolo di responsabile tecnico da documentare.');
  if(professionista&&!String(state.diriAlbo||'').trim())problemi.push('Indicare albo, iscrizione e settore del professionista.');
  if(!ante)problemi.push('Verificare che l’impianto sia stato realizzato prima del 27/03/2008.');
  if(state.diriDicoAssente!=='Si')problemi.push('Confermare che la Di.Co. sia assente o non reperibile.');
  if(rt&&state.diriArt5Comma2!=='No')problemi.push('Per il responsabile tecnico: verificare che l’impianto NON ricada nell’art. 5, comma 2.');
  if(state.diriSettoreAttinente!=='Si')problemi.push('Verificare abilitazione/competenza nel settore dell’impianto.');
  if(!String(state.diriInspections||'').trim()||!String(state.diriOutcome||'').trim())problemi.push('Completare sopralluoghi, accertamenti ed esito delle verifiche effettive.');
  return {ruolo,rt,professionista,start,scadenza,maturato,anni,ante,anno,problemi};
}
function diriScelta(k,titolo,opzioni,nota){
  return `<label>${esc(titolo)}${help(nota||'Valore da verificare e documentare.')}`+
    `<select data-k='${k}'>${opzioni.map(v=>`<option value='${escAttr(v)}' ${String(state[k]||'')===v?'selected':''}>${esc(v||'Da verificare')}</option>`).join('')}</select></label>`;
}
function diriRiquadro(){
  if(state.doc!=='Di.Ri.')return '';
  const v=diriValutazione();
  const oggi=documento=>documento; // sola presentazione, senza modificare i dati salvati
  const suggerito=v.rt&&v.start==='2024-02-12'&&!state.diriRtStart;
  const dataInput=(k,label,helpText,val)=>`<label>${label}${help(helpText)}<input type='date' data-k='${k}' value='${escAttr(val||'')}'></label>`;
  return `<style>@media print{.vt-diri-solo-schermo{display:none!important}}</style><div class='wide vt-diri-solo-schermo' style='margin-top:18px;padding:18px;border:1px solid #b8c2d2;border-radius:10px;background:#f8fafc;color:#17283c'>
   <h3>Controllo preliminare requisiti Di.Ri. · D.M. 37/2008, art. 7, c. 6</h3>
   <p class='muted'>La verifica del software è solo orientativa e si basa sui dati inseriti. Non autorizza automaticamente il rilascio della dichiarazione.</p>
   <div class='grid'>
   ${v.rt?dataInput('diriRtStart','Data inizio incarico come responsabile tecnico','Data della nomina formalmente documentata nella visura camerale.',v.start):''}
   ${v.professionista?dataInput('diriProfStart','Data inizio esercizio professionale nel settore','Documentare almeno cinque anni di esercizio professionale nel settore specifico.',v.start):''}
   ${v.professionista?field('diriAlbo','Albo e iscrizione professionale','Indicare Ordine / Collegio, numero di iscrizione e competenza di settore.'):''}
   ${v.rt?diriScelta('diriRtContinuita','Incarico continuativo da documentare',['','Si','No'],'Confermare dopo verifica della documentazione che il ruolo non sia stato interrotto.'):''}
   ${diriScelta('diriDicoAssente','Di.Co. assente o non reperibile',['','Si','No'],'La Di.Ri. è prevista quando la Di.Co. non è stata prodotta o non è più reperibile.')}
   ${v.rt?diriScelta('diriArt5Comma2','Impianto ricadente nell’art. 5, comma 2',['','Si','No'],'Se rientra nell’articolo 5, comma 2, la Di.Ri. non può essere firmata dal solo responsabile tecnico ai sensi dell’art. 7, comma 6.'):''}
   ${diriScelta('diriSettoreAttinente','Competenze/abilitazione nel settore impiantistico',['','Si','No'],'Verificare la pertinenza al settore dell’impianto. Dalla visura Vimer Tek risultano le lettere A e B: non attestano da sole la validità della singola Di.Ri.')}
   ${v.anno===2008?diriScelta('diriAnteMarzo2008','Impianto realizzato PRIMA del 27/03/2008',['','Si','No'],'Per impianti del 2008 occorre verificare la data effettiva di realizzazione.'):''}
   </div>
   ${suggerito?`<p style='font-size:13px'>Data <b>12/02/2024</b> proposta dalla visura camerale Vimer Tek, riferita al responsabile tecnico identificato. Verificare e correggere se necessario.</p>`:''}
   <p><b>Decorrenza esaminata:</b> ${esc(v.start? v.start.split('-').reverse().join('/'):'Da indicare')} &nbsp; · &nbsp;
   <b>Compimento cinque anni:</b> ${esc(v.scadenza||'Da calcolare')} &nbsp; · &nbsp;
   <b>Tempo maturato:</b> ${v.scadenza?Math.max(0,v.anni)+' anni compiuti':'Da verificare'}</p>
   <div style='border-left:4px solid ${v.problemi.length?'#b45309':'#64748b'};padding:10px 14px;background:white'>
      <strong>${v.problemi.length?'VERIFICHE DA COMPLETARE':'DATI PRELIMINARI COMPILATI · controllare i requisiti'}</strong>
      ${v.problemi.length?`<ul>${v.problemi.map(p=>`<li>${esc(p)}</li>`).join('')}</ul>`:''}
   </div>
   <p style='font-size:12px;margin-top:12px'>I comandi di firma e stampa restano disponibili. Prima del rilascio il firmatario deve possedere i requisiti previsti dalla legge; la compilazione software non li certifica.</p>
  </div>`;
}

function pratica(){return `<div class=card><h2>Dati pratica</h2><div class=grid>${field('practiceNo','Numero pratica','Identificativo univoco della pratica.')}<label>Documento ${help('Seleziona Di.Co. o Di.Ri.')}<select data-k=doc>${['Di.Co.','Di.Ri.'].map(x=>`<option ${state.doc===x?'selected':''}>${x}</option>`)}</select></label><label>Stato<select data-k=status>${['In lavorazione','Da verificare','Completata'].map(x=>`<option ${state.status===x?'selected':''}>${x}</option>`)}</select></label>${field('client','Cliente / committente','Intestatario o committente dei lavori.')}${field('clientTax','Codice fiscale / P.IVA','Dato fiscale del cliente o committente.')}${field('clientPhone','Telefono','Recapito telefonico del cliente.','tel')}${field('clientEmail','Email','Email del cliente.','email')}${field('address','Ubicazione impianto','Via/piazza e numero civico.')}${field('city','Comune','Comune dell’impianto.')}${field('province','Provincia','Sigla provincia.')}<label>Intervento<select data-k=work>${['Nuovo impianto','Trasformazione','Ampliamento','Manutenzione straordinaria','Altro'].map(x=>`<option ${state.work===x?'selected':''}>${x}</option>`)}</select></label><label>Destinazione<select data-k=use>${['Residenziale','Commerciale','Artigianale','Industriale','Uffici','Altro'].map(x=>`<option ${state.use===x?'selected':''}>${x}</option>`)}</select></label><label class=wide>Descrizione lavori<textarea data-k=workDescription>${esc(state.workDescription||'')}</textarea></label><label>Ruolo del soggetto dichiarante ${help('Per la dichiarazione come impresa non installatrice verificare la fattispecie giuridica applicabile e il modello ufficiale; la selezione non abilita automaticamente al rilascio.') }<select data-k='${state.doc==='Di.Ri.'?'diriRole':'declarationRole'}'>${(state.doc==='Di.Ri.'?['','Professionista iscritto all’albo','Responsabile tecnico di impresa abilitata']:['Impresa installatrice','Impresa non installatrice — caso da verificare']).map(x=>`<option ${((state.doc==='Di.Ri.'?state.diriRole:state.declarationRole)===x)?'selected':''}>${x||'Seleziona il ruolo'}</option>`).join('')}</select></label>${field('company','Impresa esecutrice','Impresa che ha eseguito i lavori.')}${field('issuerCompany','Soggetto che rilascia la dichiarazione','Indicare la ragione sociale del soggetto dichiarante, se diverso dall’esecutore.')}${field('issuerTechnician','Firmatario della dichiarazione','Nominativo e qualifica del firmatario.')}${field(state.doc==='Di.Ri.'?'diriBasis':'issuerBasis',state.doc==='Di.Ri.'?'Titolo e requisiti professionali per la Di.Ri.':'Titolo / presupposto normativo','Specificare la fattispecie ammessa e la documentazione di supporto; da verificare con professionista competente.')}${field('technician','Responsabile tecnico','Nome e cognome del responsabile tecnico.')}${state.doc==='Di.Co.'?`<div class='wide'><h3>Dati della Di.Co. · Allegato I ministeriale</h3><p class='muted'>Campi da verificare con i dati dell'impresa e il modello ufficiale vigente.</p></div>${field('companyAddress','Sede legale impresa','Indirizzo e comune sede legale.')}${field('companyVat','P. IVA impresa','Partita IVA impresa.')}${field('companyPhone','Telefono impresa','Recapito telefonico sede aziendale.')}${field('companySector','Settore impiantistico','Settore effettivo dell’abilitazione impresa.')}${field('technicalStandard','Norme tecniche applicate','Indicare norme effettivamente utilizzate, dopo verifica tecnica.')}${field('projectAuthor','Redattore del progetto / schema','Indicare il progettista oppure il responsabile tecnico se competente e ammesso.')}${field('registryOffice','CCIAA / Albo imprese artigiane','Camera di commercio o albo competente.')}${field('registryNumber','Numero iscrizione','Numero iscrizione impresa.')}${field('dicoDate','Data dichiarazione','Data da riportare sul modulo.')}${field('dicoPlace','Luogo dichiarazione','Luogo di sottoscrizione.')}<div class='wide'><h3>Controlli prima dell’emissione definitiva</h3><p class='muted'>Selezionare Sì soltanto dopo aver realmente verificato documenti, misure e allegati; il programma non li certifica.</p></div>${[['dicoProjectVerified','Progetto e schema verificati'],['dicoMaterialsVerified','Materiali conformi e relazione completata'],['dicoTestsVerified','Verifiche e misure eseguite con esito positivo'],['dicoCertVerified','Certificato camerale requisiti tecnico-professionali allegato']].map(([key,label])=>`<label>${label}<select data-k='${key}'><option value='' ${!state[key]?'selected':''}>Da verificare</option><option value='Si' ${state[key]==='Si'?'selected':''}>Sì</option><option value='No' ${state[key]==='No'?'selected':''}>No</option></select></label>`).join('')}`:`<div class='wide'>
<h3>Dati specifici Di.Ri.</h3>
<p class='muted'>Dichiarazione di rispondenza: verificare applicabilità, requisiti del dichiarante e documentazione tecnica.</p>
</div>${field('diriYear','Epoca di realizzazione impianto','Indicare il periodo in cui è stato realizzato l’impianto.')}
${field('diriQualification','Qualifica del dichiarante','Titolo professionale e requisiti per il rilascio della Di.Ri.')}
${field('diriInspections','Sopralluoghi e accertamenti','Descrivere gli accertamenti effettuati.')}
${field('diriOutcome','Esito delle verifiche','Indicare risultati e documentazione di supporto.')}
${field('diriDate','Data dichiarazione','Data della Di.Ri.')}
${field('diriPlace','Luogo dichiarazione','Luogo di sottoscrizione.')}`}${diriRiquadro()}</div><div class=actions><button onclick='save(true)'>Salva pratica</button><button class=secondary onclick='goStep(2)'>Continua → Impianto</button></div></div>`}
function projectStore(){state.designers=Array.isArray(state.designers)?state.designers:[];state.projects=Array.isArray(state.projects)?state.projects:[]}
function projectSection(){projectStore();return `<div class='card'><h2>Anagrafica progettisti</h2><p class='muted'>Registra i professionisti incaricati. L'iscrizione all'albo e le competenze vanno verificate.</p><div class='grid'><input id='designerName' placeholder='Nome e cognome / studio'><input id='designerOrder' placeholder='Ordine / Collegio e provincia'><input id='designerNumber' placeholder='Numero iscrizione'><input id='designerContact' placeholder='Email / telefono'></div><button onclick='addDesigner()'>+ Aggiungi progettista</button>${printableTable(['Progettista','Albo / Collegio','Iscrizione','Contatto'],state.designers.map(x=>[x.name,x.order,x.number,x.contact]))}<div class='actions'>${state.designers.map((x,i)=>`<button class='secondary' onclick='deleteDesigner(${i})'>Rimuovi ${esc(x.name)}</button>`).join('')}</div></div><div class='card'><h2>Progetti e revisioni</h2><p class='muted'>Puoi inserire più progetti per la stessa pratica e collegare ciascuno a un progettista.</p><div class='grid'><input id='projectTitle' placeholder='Titolo progetto / elaborato'><select id='projectDesigner'><option value=''>Progettista da assegnare</option>${state.designers.map((x,i)=>`<option value='${i}'>${esc(x.name)}</option>`).join('')}</select><input id='projectRevision' placeholder='Revisione (es. Rev. 01)'><input id='projectDate' type='date'><input id='projectFiles' type='file' multiple accept='.pdf,image/*,.dwg,.dxf' aria-label='File progetto'></div><button onclick='addProject()'>+ Aggiungi progetto</button><p class='muted'>I file sono registrati per nome; non vengono ancora conservati né incorporati nel PDF. Conserva gli originali.</p>${printableTable(['Progetto','Progettista','Revisione','Data','File registrati'],state.projects.map(x=>[x.title,x.designer,x.revision,x.date,(x.files||[]).join(', ')]))}<div class='actions'>${state.projects.map((x,i)=>`<button class='secondary' onclick='deleteProject(${i})'>Rimuovi ${esc(x.title)}</button>`).join('')}</div></div>`}
function addDesigner(){projectStore();let name=document.querySelector('#designerName').value.trim();if(!name)return alert('Inserisci il nome del progettista.');state.designers.push({name,order:designerOrder.value.trim(),number:designerNumber.value.trim(),contact:designerContact.value.trim()});save(false);render()}
function deleteDesigner(i){if(!confirm('Rimuovere questo progettista dalla rubrica della pratica?'))return;state.designers.splice(i,1);save(false);render()}
function addProject(){projectStore();let title=projectTitle.value.trim();if(!title)return alert('Inserisci il titolo del progetto.');let i=projectDesigner.value;state.projects.push({title,designer:i===''?'':(state.designers[+i]?.name||''),revision:projectRevision.value.trim(),date:projectDate.value,files:[...projectFiles.files].map(x=>x.name)});save(false);render()}
function deleteProject(i){if(!confirm('Rimuovere questo progetto dalla pratica?'))return;state.projects.splice(i,1);save(false);render()}
function impianto(){return `<div class=card><h2>Caratteristiche impianto</h2><div class=grid><label>Sistema<select data-k=phase>${['Monofase','Trifase'].map(x=>`<option ${state.phase===x?'selected':''}>${x}</option>`)}</select></label>${field('voltage','Tensione','Tensione nominale.')}${field('power','Potenza (kW)','Potenza disponibile/impegnata.','number')}${field('earth','Sistema di distribuzione','Es. TT, TN-S, TN-C-S, IT.')}</div></div>`}
function materials(){let rows=state.fruits.map((x,i)=>`<tr><td>${esc(x.room)}</td><td>${esc(x.brand)}</td><td>${esc(x.series)}</td><td>${esc(x.type)}</td><td>${x.qty}</td><td><button onclick='delFruit(${i})'>×</button></td></tr>`).join('');return `<div class=card><h2>Frutti e punti impianto</h2><div class=grid>${field('brand','Marca predefinita','Marca serie civile.')}${field('series','Serie predefinita','Serie civile.')}</div><hr><div class=grid3><input id=froom placeholder='Locale'><input id=ftype placeholder='Tipo frutto'><input id=fqty type=number min=1 value=1></div><button onclick='addFruit()'>+ Aggiungi frutto</button></div><div class=card><table class=table><tr><th>Locale</th><th>Marca</th><th>Serie</th><th>Tipologia</th><th>Qtà</th><th></th></tr>${rows||'<tr><td colspan=6>Nessun elemento</td></tr>'}</table></div>`}
function circuits(){let rows=state.circuits.map((x,i)=>`<tr><td>${esc(x.name)}</td><td>${esc(x.prot)}</td><td>${esc(x.cable)}</td><td>${esc(x.dest)}</td><td><button onclick='delCircuit(${i})'>×</button></td></tr>`).join('');return `<div class=card><h2>Quadri e circuiti</h2><div class=grid><input id=cname placeholder='Sigla / nome circuito'><input id=cprot placeholder='Protezione es. MT C16 1P+N'><input id=ccable placeholder='Cavo es. FG16 3G2,5'><input id=cdest placeholder='Destinazione'></div><button onclick='addCircuit()'>+ Aggiungi circuito</button></div><div class=card><table class=table><tr><th>Circuito</th><th>Protezione</th><th>Cavo</th><th>Destinazione</th><th></th></tr>${rows||'<tr><td colspan=5>Nessun circuito</td></tr>'}</table></div>`}
function level(){return `<div class=card><h2>Livello impianto residenziale</h2><label>Livello dichiarato<select data-k=level>${['1','2','3'].map(x=>`<option ${state.level===x?'selected':''}>Livello ${x}</option>`)}</select></label><div class=box><b>Dati disponibili:</b><br>Frutti: ${state.fruits.reduce((a,x)=>a+(+x.qty||0),0)}<br>Circuiti: ${state.circuits.length}<br>Potenza: ${state.power||'-'} kW</div></div>`}
const VERIFY_GROUPS=[
['Esame a vista', [['vista_protezioni','Protezione contro i contatti diretti e indiretti'],['vista_conduttori','Sezioni, posa e identificazione dei conduttori'],['vista_quadri','Quadri, involucri, IP e accessibilità'],['vista_dispositivi','Scelta e coordinamento delle protezioni'],['vista_terra','Collegamenti di terra ed equipotenziali'],['vista_segnali','Identificazione circuiti, avvisi e documentazione'],['vista_spd','SPD: presenza, collegamenti e stato (se previsti)']]],
['Prove e misure', [['continuita','Continuità PE ed equipotenziali'],['isolamento','Resistenza di isolamento'],['terra','Resistenza di terra'],['rcd','Prove interruttori differenziali'],['anello','Impedenza anello di guasto Zs'],['guasto','Corrente di guasto / cortocircuito presunta'],['polarita','Polarità'],['fasi','Sequenza delle fasi'],['funzionale','Prove funzionali e interblocchi'],['autoprotezione','Verifica dell’interruzione automatica dell’alimentazione']]]];
const VERIFY_UNITS={continuita:'Ω',isolamento:'MΩ',terra:'Ω',rcd:'ms / mA',anello:'Ω',guasto:'A / kA'};
function verifyStore(){if(!state.verification||typeof state.verification!=='object')state.verification={mode:'rapida',items:{},instruments:[],date:'',notes:''};let v=state.verification;v.items=v.items||{};v.instruments=v.instruments||[];return v}
function verifyItems(){return VERIFY_GROUPS.flatMap(g=>g[1])}
function verifyEntry(id){let v=verifyStore();if(!v.items[id])v.items[id]={};return v.items[id]}
function vSelect(key,value,choices){return `<select data-v-global='${key}'>${choices.map(([k,t])=>`<option value='${k}' ${value===k?'selected':''}>${t}</option>`).join('')}</select>`}
function checks(){const v=verifyStore(), detailed=v.mode==='dettagliata';let completed=verifyItems().filter(([id])=>['Conforme','Non conforme','Non applicabile'].includes(verifyEntry(id).result)).length;return `<div class='card'><h2>Verifiche iniziali · CEI 64-8 Parte 6</h2><p class='muted'>Seleziona la modalità. I dati sono salvati nella pratica anche quando cambi modalità. Gli esiti e le misure vanno inseriti dal tecnico dopo le prove effettive.</p><div class='grid'><label>Modalità di compilazione ${help('Rapida: esito e note. Dettagliata: esito, valori, circuiti, metodo e strumento. I dati non vengono cancellati cambiando modalità.')}${vSelect('mode',v.mode,[['rapida','Rapida'],['dettagliata','Dettagliata']])}</label><label>Data delle verifiche<input type='date' data-v-global='date' value='${escAttr(v.date||'')}'></label></div><p><b>Controlli compilati: ${completed}/${verifyItems().length}</b> · Da eseguire: ${verifyItems().length-completed}</p></div>${VERIFY_GROUPS.map(([group,items])=>`<div class='card'><h3>${esc(group)}</h3>${items.map(([id,name])=>{let x=verifyEntry(id);return `<section class='verification-item'><div class='verification-heading'><b>${esc(name)}</b>${help('Selezionare Non applicabile solo se la prova non è pertinente al tipo di impianto. Valutare il risultato secondo la norma e le caratteristiche del circuito.')}</div><div class='grid'><label>Esito<select data-v-item='${id}' data-v-field='result'>${['Da eseguire','Conforme','Non conforme','Non applicabile'].map(z=>`<option ${((x.result||'Da eseguire')===z)?'selected':''}>${z}</option>`).join('')}</select></label>${detailed?`<label>Quadro / circuito<input data-v-item='${id}' data-v-field='circuit' value='${escAttr(x.circuit||'')}' placeholder='Es. QG / C1'></label><label>Valore misurato ${VERIFY_UNITS[id]?`(${esc(VERIFY_UNITS[id])})`:''}<input data-v-item='${id}' data-v-field='value' value='${escAttr(x.value||'')}' placeholder='Solo se misurato'></label><label>Unità di misura<input data-v-item='${id}' data-v-field='unit' value='${escAttr(x.unit||VERIFY_UNITS[id]||'')}' placeholder='Es. Ω, MΩ, ms'></label><label>Metodo / condizioni di prova<input data-v-item='${id}' data-v-field='method' value='${escAttr(x.method||'')}' placeholder='Metodo, tensione di prova, IΔn…'></label><label>Strumento utilizzato<input data-v-item='${id}' data-v-field='instrument' value='${escAttr(x.instrument||'')}' placeholder='Marca / modello / matricola'></label>`:''}<label class='wide'>Note<textarea data-v-item='${id}' data-v-field='notes' rows='2'>${esc(x.notes||'')}</textarea></label></div></section>`}).join('')}</div>`).join('')}<div class='card'><h3>Strumenti e osservazioni generali</h3><div class='grid'><label>Strumenti impiegati (marca, modello, matricola, taratura - dati reali, non di prova)<textarea data-v-global='instrumentNotes' rows='3'>${esc(v.instrumentNotes||'')}</textarea></label><label>Osservazioni / anomalie / prescrizioni<textarea data-v-global='notes' rows='3'>${esc(v.notes||'')}</textarea></label></div><div class='actions'><button type='button' onclick='save(true)'>Salva verifiche</button><button type='button' class='secondary' onclick='printVerification()'>Stampa / PDF rapporto verifiche</button></div></div>`}
function verificationReport(){let v=verifyStore();return `<div class='verification-print'><div class='report-header'><img src='assets/logo-vimertek.png' alt='Vimer Tek'><div><h1>Rapporto delle verifiche dell'impianto elettrico</h1><p>CEI 64-8 Parte 6 · ${esc(v.mode==='dettagliata'?'Compilazione dettagliata':'Compilazione rapida')}</p></div></div><p><b>Pratica:</b> ${esc(state.practiceNo)} · <b>Documento:</b> ${esc(state.doc)}<br><b>Committente:</b> ${esc(state.client||'—')}<br><b>Impianto:</b> ${esc([state.address,state.city,state.province].filter(Boolean).join(', ')||'—')}<br><b>Data verifiche:</b> ${esc(v.date||'Non indicata')}<br><b>Tecnico:</b> ${esc(state.technician||'Non indicato')}</p>${VERIFY_GROUPS.map(([group,items])=>`<h2>${esc(group)}</h2><table><thead><tr><th>Verifica</th><th>Esito</th><th>Misura / circuito</th><th>Note</th></tr></thead><tbody>${items.filter(([id])=>!isNotApplicable(verifyEntry(id).result)).map(([id,name])=>{let x=verifyEntry(id);return `<tr><td>${esc(name)}</td><td>${esc(x.result||'Da eseguire')}</td><td>${esc([x.circuit,x.value?x.value+' '+(x.unit||VERIFY_UNITS[id]||''):'',x.method,x.instrument].filter(Boolean).join(' · '))}</td><td>${esc(x.notes||'')}</td></tr>`}).join('')}</tbody></table>`).join('')}<h2>Strumenti e osservazioni</h2><p><b>Strumenti:</b> ${esc(v.instrumentNotes||'Non indicati')}</p><p><b>Osservazioni:</b> ${esc(v.notes||'Nessuna indicata')}</p><p class='report-warning'>Documento compilato sulla base dei dati registrati dal tecnico. Gli esiti non sono certificati automaticamente dal software. Le verifiche mancanti restano «Da eseguire».</p><div class='report-sign'>Luogo e data: ____________________<span>Firma del tecnico: ____________________</span></div></div>`}
function printVerification(){save(false);document.body.classList.add('print-verification');let el=document.createElement('div');el.id='verificationPrintRoot';el.innerHTML=verificationReport();document.body.appendChild(el);window.print();setTimeout(()=>{el.remove();document.body.classList.remove('print-verification')},1500)}
// VT_ATTACHMENT_DB_V2: allegati veri conservati nel browser per questa pratica.
const VT_ATTACHMENT_DB='vt_dico_file_storage_v2';
function attachmentMeta(){if(!Array.isArray(state.attachmentFiles))state.attachmentFiles=[];return state.attachmentFiles}
function hasProjectData(){projectStore();return state.designers.length>0||state.projects.length>0}
function openAttachmentDB(){return new Promise((resolve,reject)=>{if(!('indexedDB' in window)){reject(new Error('IndexedDB non disponibile in questo browser.'));return}const r=indexedDB.open(VT_ATTACHMENT_DB,1);r.onupgradeneeded=()=>{if(!r.result.objectStoreNames.contains('files'))r.result.createObjectStore('files',{keyPath:'id'})};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error||new Error('Impossibile aprire archivio allegati'))})}
async function attachmentWrite(entry){const db=await openAttachmentDB();try{await new Promise((resolve,reject)=>{const tx=db.transaction('files','readwrite');tx.objectStore('files').put(entry);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error)})}finally{db.close()}}
async function attachmentRead(id){const db=await openAttachmentDB();try{return await new Promise((resolve,reject)=>{const r=db.transaction('files','readonly').objectStore('files').get(id);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})}finally{db.close()}}
async function attachmentDelete(id){const db=await openAttachmentDB();try{await new Promise((resolve,reject)=>{const tx=db.transaction('files','readwrite');tx.objectStore('files').delete(id);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error)})}finally{db.close()}}
function imageAsDataURL(blob){return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(reader.error||new Error('Errore lettura immagine'));reader.readAsDataURL(blob)})}
let vtPdfLoader=null;
function loadVtPdfJs(){if(!vtPdfLoader)vtPdfLoader=new Function('url', 'return import(url)')(new URL('assets/pdf.min.mjs',document.baseURI).href).then(pdf=>{pdf.GlobalWorkerOptions.workerSrc=new URL('assets/pdf.worker.min.mjs',document.baseURI).href;return pdf});return vtPdfLoader}
async function buildRealAttachmentPages(){let output='';let totalPages=0;for(const meta of attachmentMeta()){
 const stored=await attachmentRead(meta.id);if(!stored||!stored.file)throw new Error('Allegato non trovato nel browser: '+meta.name+'. Ricarica il file dalla sezione Allegati.');
 const f=stored.file;const type=(f.type||'').toLowerCase(),isPDF=type==='application/pdf'||/\.pdf$/i.test(meta.name);let images=[];
 if(isPDF){let pdfjs;try{pdfjs=await loadVtPdfJs()}catch(e){throw new Error('Lettore PDF non disponibile. Verifica che i due file pdf.min.mjs e pdf.worker.min.mjs siano nella cartella assets.')}let doc;try{doc=await pdfjs.getDocument({data:new Uint8Array(await f.arrayBuffer())}).promise}catch(e){throw new Error('Impossibile leggere il PDF '+meta.name+': '+(e.message||e))}if(doc.numPages>80)throw new Error('Il PDF '+meta.name+' supera 80 pagine: dividilo in file più piccoli.');for(let n=1;n<=doc.numPages;n++){const page=await doc.getPage(n),unit=page.getViewport({scale:1}),vp=page.getViewport({scale:Math.min(2.7,1450/unit.width)}),canvas=document.createElement('canvas');canvas.width=Math.round(vp.width);canvas.height=Math.round(vp.height);await page.render({canvasContext:canvas.getContext('2d',{alpha:false}),viewport:vp}).promise;images.push(canvas.toDataURL('image/jpeg',.92));canvas.width=canvas.height=1;}await doc.destroy();}
 else if(/^image\/(png|jpeg|webp|gif|bmp)$/.test(type)||/\.(png|jpg|jpeg|webp)$/i.test(meta.name)){images.push(await imageAsDataURL(f));}
 else throw new Error('Formato non stampabile: '+meta.name+'. Carica PDF, JPG o PNG.');
 for(let i=0;i<images.length;i++){totalPages++;if(totalPages>100)throw new Error('Troppi fogli allegati (oltre 100). Dividi il fascicolo.');output+=`<section class="print-section vt-attachment-page"><div class="vt-attachment-title">ALLEGATO · ${esc(meta.name)}${images.length>1?' · pag. '+(i+1)+'/'+images.length:''}</div><img alt="Pagina allegato" src="${images[i]}"></section>`;}
 }return output}
async function removeStoredAttachment(i){const meta=attachmentMeta()[i];if(!meta)return;if(!confirm('Rimuovere l’allegato '+meta.name+' dalla pratica?'))return;try{await attachmentDelete(meta.id)}catch(err){alert('Impossibile cancellare il file: '+err.message);return}attachmentMeta().splice(i,1);if(!attachmentMeta().some(x=>x.name===meta.name))state.attachments=(state.attachments||[]).filter(x=>x!==meta.name);save(false);render()}
function attachments(){const meta=attachmentMeta(),savedNames=new Set(meta.map(x=>x.name)),legacy=(state.attachments||[]).map((name,i)=>({name,i})).filter(x=>!savedNames.has(x.name));return `<div class=card><h2>Allegati originali</h2><p class=muted>Carica PDF e immagini (JPG, PNG, WebP). Questa versione conserva il file completo in IndexedDB nel browser attuale: verrà inserito nel fascicolo stampato. Non basta avere registrato il nome.</p><input id=files type=file multiple accept=".pdf,.png,.jpg,.jpeg,.webp,application/pdf,image/png,image/jpeg,image/webp"><button onclick='addFiles()'>+ Conserva file allegati</button><h3>Documenti pronti da stampare</h3>${meta.length?meta.map((x,i)=>`<div class="archive-item"><div><b>${esc(x.name)}</b><br><small>${Math.ceil((x.size||0)/1024)} KB · originale conservato nel browser</small></div><button class='danger' onclick='removeStoredAttachment(${i})'>Rimuovi</button></div>`).join(''):'<p class=muted>Nessun file originale conservato.</p>'}${legacy.length?`<h3>Vecchi allegati da ricaricare</h3><p class=muted>Di questi documenti l’app aveva registrato soltanto il nome. Se vuoi stamparli devi caricarli nuovamente qui.</p>${legacy.map(x=>`<div class="archive-item"><span>${esc(x.name)} · solo nome</span><button onclick='delFile(${x.i})'>×</button></div>`).join('')}`:''}<p class=muted>Per un altro dispositivo o dopo una pulizia del browser, conserva una copia originale di ogni documento: i file non sono ancora sincronizzati online.</p></div>`}
function schemaItems(){if(!Array.isArray(state.schemaItems))state.schemaItems=(state.circuits||[]).filter(c=>!/^(QG|GENERALE|QUADRO GENERALE)$/i.test((c.name||'').trim())).map(c=>({name:c.name||'',prot:c.prot||'',cable:c.cable||'',dest:c.dest||'',group:'',board:'QG',device:/MTD|DIFF/i.test(c.prot||'')?'MTD':'MT'}));return state.schemaItems}
function schemaGeneral(){if(!state.schemaGeneral){let q=(state.circuits||[]).find(c=>/^(QG|GENERALE|QUADRO GENERALE)$/i.test((c.name||'').trim()));state.schemaGeneral={name:'QG',prot:q?.prot||''}}return state.schemaGeneral}
function schemaGroups(){return state.schemaGroups||(state.schemaGroups=[])}
function schemaBoards(){return state.schemaBoards||(state.schemaBoards=[])}
// La revisione è attestata manualmente dal tecnico, mai dedotta dal software.
function schemaIsReviewed(){
  const g=schemaGeneral(), a=schemaItems();
  return state.schemaValidated==='Si' && !!String(g.prot||'').trim() &&
         a.length>0 && a.every(c=>String(c.prot||'').trim() && String(c.cable||'').trim());
}
function schemaInvalidate(){state.schemaValidated='';state.schemaValidatedOn=''}
function schemaMarkReviewed(value){
  if(value!=='Si'){schemaInvalidate();save(false);render();return;}
  const g=schemaGeneral(),a=schemaItems();
  const missing=[];
  if(!String(g.prot||'').trim()) missing.push('Protezione generale QG / protezione a monte');
  if(!a.length) missing.push('Nessuna partenza registrata nello schema');
  const bad=a.filter(c=>!String(c.prot||'').trim()||!String(c.cable||'').trim());
  if(bad.length) missing.push(bad.length+' circuiti privi di protezione o cavo');
  if(missing.length){
    alert('Prima della validazione completa questi dati:\n\n• '+missing.join('\n• '));
    render();return;
  }
  if(!confirm('Confermi di aver confrontato personalmente lo schema con l’impianto realmente eseguito, controllato protezioni, collegamenti, sezioni e selettività? La conferma non sostituisce la firma del tecnico.')){
    render();return;
  }
  state.schemaValidated='Si';
  state.schemaValidatedOn=new Date().toISOString().slice(0,10);
  save(false);render();
}
function schemaEdit(i,k,v){schemaItems()[i][k]=v;schemaInvalidate();save(false);refreshSchema()}
function schemaEditGeneral(k,v){schemaGeneral()[k]=v;schemaInvalidate();save(false);refreshSchema()}
function schemaMove(i,d){let a=schemaItems(),j=i+d;if(j<0||j>=a.length)return;[a[i],a[j]]=[a[j],a[i]];schemaInvalidate();save(false);render()}
function schemaAdd(){schemaItems().push({name:'Nuovo circuito',prot:'',cable:'',dest:'',group:'',board:'QG',device:'MT'});schemaInvalidate();save(false);render()}
function schemaRemove(i){if(!confirm('Rimuovere la partenza dallo schema? Il circuito originale resta nella pratica.'))return;schemaItems().splice(i,1);schemaInvalidate();save(false);render()}
function schemaAddGroup(){let id='DG'+(schemaGroups().length+1);schemaGroups().push({id,name:id,prot:'',board:'QG'});schemaInvalidate();save(false);render()}
function schemaEditGroup(i,k,v){schemaGroups()[i][k]=v;schemaInvalidate();save(false);render()}
function schemaRemoveGroup(i){let id=schemaGroups()[i].id;schemaItems().forEach(c=>{if(c.group===id)c.group=''});schemaGroups().splice(i,1);schemaInvalidate();save(false);render()}
function schemaAddBoard(){let id='QS'+(schemaBoards().length+1);schemaBoards().push({id,name:id,feed:'',cable:''});schemaInvalidate();save(false);render()}
function schemaEditBoard(i,k,v){schemaBoards()[i][k]=v;schemaInvalidate();save(false);render()}
function schemaRemoveBoard(i){let id=schemaBoards()[i].id;schemaItems().forEach(c=>{if(c.board===id)c.board='QG'});schemaGroups().forEach(g=>{if(g.board===id)g.board='QG'});schemaBoards().splice(i,1);schemaInvalidate();save(false);render()}
function schemaRegenerate(){if(!confirm('Rigenerare dai circuiti? Le modifiche manuali, i gruppi e i quadri secondari saranno sostituiti.'))return;delete state.schemaItems;delete state.schemaGeneral;state.schemaGroups=[];state.schemaBoards=[];schemaItems();schemaGeneral();schemaInvalidate();save(false);render()}
function schemaSelect(value,options,fn){return `<select onchange='${fn}'>${options.map(([v,t])=>`<option value="${escAttr(v)}" ${value===v?'selected':''}>${esc(t)}</option>`).join('')}</select>`}
const SCHEMA_DEVICE_CATALOG=[
 ['Protezione',['MT','Magnetotermico'],['MTD','Magnetotermico differenziale'],['ID','Differenziale puro'],['MCCB','Interruttore scatolato'],['ACB','Interruttore aperto'],['MOT','Salvamotore'],['RTH','Relè termico']],
 ['Sezionamento e fusibili',['SEZ','Sezionatore'],['IMS','Interruttore manovra-sezionatore'],['PF','Portafusibili'],['FUS','Fusibile'],['SF','Sezionatore con fusibili'],['COMM','Commutatore'],['ATS','Commutatore automatico ATS']],
 ['Sovratensioni',['SPD1','SPD Tipo 1'],['SPD2','SPD Tipo 2'],['SPD12','SPD Tipo 1+2'],['SPD3','SPD Tipo 3']],
 ['Comando e automazione',['KM','Contattore'],['KA','Relè ausiliario'],['KP','Relè passo-passo'],['KT','Temporizzatore'],['AST','Orologio astronomico'],['CREP','Interruttore crepuscolare'],['DIM','Dimmer'],['ACT','Attuatore domotico'],['PLC','PLC']],
 ['Controllo e misura',['EM','Contatore energia'],['ANL','Analizzatore di rete'],['VM','Voltmetro'],['AM','Amperometro'],['RV','Relè controllo tensione'],['RF','Relè controllo fasi'],['RDT','Relè differenziale con toroide']],
 ['Alimentazione',['TRAFO','Trasformatore'],['PSU','Alimentatore AC/DC'],['UPS','Gruppo di continuità UPS'],['INV','Inverter']],
 ['Fotovoltaico / DC',['MTDC','Magnetotermico DC'],['SDC','Sezionatore DC'],['FDC','Fusibile DC'],['SPDDC','SPD lato DC']],
 ['Comandi e altri',['SG','Bobina di sgancio'],['LED','Spia luminosa'],['PB','Pulsante'],['ALTRO','Dispositivo personalizzato']]
];
function schemaDeviceSelect(i,value){const known=SCHEMA_DEVICE_CATALOG.some(g=>g.slice(1).some(x=>x[0]===value));return `<select onchange='schemaEdit(${i},"device",this.value)'>${!known?`<option value="${escAttr(value)}" selected>${esc(value)} (precedente)</option>`:''}${SCHEMA_DEVICE_CATALOG.map(g=>`<optgroup label="${escAttr(g[0])}">${g.slice(1).map(([id,name])=>`<option value="${escAttr(id)}" ${value===id?'selected':''}>${esc(name)}</option>`).join('')}</optgroup>`).join('')}</select>`}
function schemaDevice(x,y,type){let t=String(type||'MT').toUpperCase(),line=`<path d="M${x-12} ${y+34}L${x+12} ${y+10}" stroke="#24344c" stroke-width="1.7"/>`,symbol=line;
 if(t==='ID'||t==='MTD')symbol+=`<ellipse cx="${x}" cy="${y+22}" rx="9" ry="12" fill="none" stroke="#24344c" stroke-width="1.2"/>`;
 else if(/^SPD/.test(t))symbol=`<path d="M${x+4} ${y+8}l-13 18h12l-7 13 19-22h-12z" fill="none" stroke="#24344c" stroke-width="1.7"/>`;
 else if(['FUS','FDC','PF','SF'].includes(t))symbol=`<rect x="${x-7}" y="${y+11}" width="14" height="23" fill="none" stroke="#24344c" stroke-width="1.7"/><path d="M${x} ${y+6}v5m0 23v5" stroke="#24344c"/>`;
 else if(['KM','KA','KP','KT','RTH','RDT'].includes(t))symbol=`<circle cx="${x}" cy="${y+22}" r="12" fill="none" stroke="#24344c" stroke-width="1.7"/>`;
 else if(['EM','ANL','VM','AM'].includes(t))symbol=`<circle cx="${x}" cy="${y+22}" r="15" fill="none" stroke="#24344c" stroke-width="1.7"/><text x="${x}" y="${y+26}" text-anchor="middle" font-size="9">${['VM','AM'].includes(t)?t[0]:'M'}</text>`;
 else if(['TRAFO','PSU','UPS','INV'].includes(t))symbol=`<circle cx="${x-7}" cy="${y+22}" r="9" fill="none" stroke="#24344c"/><circle cx="${x+7}" cy="${y+22}" r="9" fill="none" stroke="#24344c"/>`;
 return `<rect x="${x-21}" y="${y}" width="42" height="45" fill="white" stroke="#24344c" stroke-width="1.7"/>${symbol}<text x="${x}" y="${y-7}" text-anchor="middle" font-size="${t.length>5?8:10}" fill="#25344a">${esc(t)}</text>`}
function unifilarSVGLegacy(){
 const cs=schemaItems(), groups=schemaGroups(), boards=schemaBoards(), general=schemaGeneral();
 const safe=v=>esc(String(v??''));
 const line=(a,b,c,d)=>`<path d="M${a} ${b} L${c} ${d}" fill="none" stroke="#24344c" stroke-width="1.7"/>`;
 const label=(x,y,v,size=10,anchor='middle',bold=false)=>`<text x="${x}" y="${y}" font-size="${size}" text-anchor="${anchor}" fill="#25344a"${bold?' font-weight="bold"':''}>${safe(v)}</text>`;
 // One differential is drawn for each group, upstream of all its assigned departures.
 const boardDefs=[{id:'QG',name:'Quadro generale'},...boards];
 const prepared=boardDefs.map(board=>{
  const own=cs.filter(c=>(c.board||'QG')===board.id);
  const activeGroups=groups.filter(g=>(g.board||'QG')===board.id && own.some(c=>c.group===g.id));
  const grouped=new Set(activeGroups.map(g=>g.id));
  const entries=[...activeGroups.map(g=>({group:g,items:own.filter(c=>c.group===g.id)})),...own.filter(c=>!grouped.has(c.group)).map(c=>({items:[c]})),...(board.id==='QG'?boards.map(feeder=>({feeder})):[])];
  return {board,entries};
 });
 const maxColumns=Math.max(3,...prepared.map(x=>x.entries.reduce((n,e)=>n+(e.group?Math.max(1,e.items.length):1),0)));
 const width=Math.max(900,170+maxColumns*165);
 let y=84, sections=[];
 prepared.forEach(({board,entries},bi)=>{
  const start=y, xStart=140, step=Math.min(180,(width-205)/Math.max(1,maxColumns));
  const busY=start+105, devY=busY+29;
  const hasGroups=entries.some(e=>e.group);
  const circuitY=hasGroups?devY+104:devY;
  const bottomTextY=circuitY+111;
  const sectionHeight=bottomTextY-start+37;
  let out=`<rect x="24" y="${start}" width="${width-48}" height="${sectionHeight}" fill="none" stroke="#9ba9bb" stroke-dasharray="5 4"/>`;
  out+=label(39,start+20,`${board.name||board.id} (${board.id})`,14,'start',true);
  if(bi===0){
   out+=`<rect x="45" y="${start+27}" width="110" height="22" fill="white" stroke="#24344c"/>`;
   out+=label(100,start+42,'RETE / FORNITURA',9);
   out+=line(100,start+49,100,start+55)+schemaDevice(100,start+55,/MTD|DIFF|30\s*mA|300\s*mA/i.test(general.prot)?'MTD':'MT');
   out+=label(126,start+81,`QG · ${general.prot||'Dati da verificare'}`,9,'start');
   out+=line(100,start+100,100,busY);
  }else{
   out+=label(42,start+44,`Alimentazione da QG · ${board.feed||'Protezione da indicare'}`,9,'start');
   out+=label(42,start+59,board.cable||'Cavo da indicare',9,'start');
   out+=line(100,start+65,100,busY);
  }
  let slot=0;
  const positions=entries.map(e=>{
   const count=e.group?Math.max(1,e.items.length):1;
   const xs=Array.from({length:count},(_,i)=>xStart+(slot+i)*step);
   slot+=count;
   return {e,xs,x:xs.reduce((a,b)=>a+b,0)/xs.length};
  });
  const busEnd=positions.length?Math.max(positions[positions.length-1].xs.at(-1),185):185;
  out+=line(100,busY,busEnd,busY);
  positions.forEach(({e,x,xs})=>{
   out+=line(x,busY,x,devY);
   if(e.feeder){
    out+=schemaDevice(x,devY,'MT');
    out+=label(x,devY+64,e.feeder.id,10,'middle',true);
    out+=label(x,devY+79,e.feeder.name||'',9);
    out+=label(x,devY+94,e.feeder.feed||'Protezione da indicare',9);
    out+=label(x,devY+109,e.feeder.cable||'Cavo da indicare',9);
   }else if(e.group){
    out+=schemaDevice(x,devY,'ID');
    out+=label(x,devY+60,`${e.group.id} · ${e.group.name||''}`,10,'middle',true);
    out+=label(x,devY+74,e.group.prot||'Protezione da indicare',9);
    const junction=devY+91;
    out+=line(x,devY+45,x,junction);
    if(xs.length>1)out+=line(xs[0],junction,xs[xs.length-1],junction);
    e.items.forEach((c,i)=>{
     const xx=xs[i];out+=line(xx,junction,xx,circuitY);
     out+=schemaDevice(xx,circuitY,c.device||'MT');
     out+=label(xx,circuitY+62,c.name||'Circuito',10,'middle',true);
     out+=label(xx,circuitY+77,c.prot||'Protezione da indicare',9);
     out+=label(xx,circuitY+92,c.cable||'Cavo da indicare',9);
     if(c.dest)out+=label(xx,circuitY+107,c.dest,9);
    });
   }else{
    const c=e.items[0];
    out+=schemaDevice(x,devY,c.device||'MT');
    out+=label(x,devY+62,c.name||'Circuito',10,'middle',true);
    out+=label(x,devY+77,c.prot||'Protezione da indicare',9);
    out+=label(x,devY+92,c.cable||'Cavo da indicare',9);
    if(c.dest)out+=label(x,devY+107,c.dest,9);
   }
  });
  sections.push(out);y+=sectionHeight+24;
 });
 // VT_UNIFILARE_FIRMA_DT_V197A: riquadro firma integrato nello schema SVG.
 const signatureY=y+12;
 const signatureW=480;
 const signatureX=width-signatureW-30;
 const signatureH=155;
 const height=signatureY+signatureH+34;
 const signedBy=state.technician||state.issuerTechnician||'Da compilare';
 const signatureBlock=`<rect x="${signatureX}" y="${signatureY}" width="${signatureW}" height="${signatureH}" fill="white" stroke="#24344c" stroke-width="1.5"/>${label(signatureX+18,signatureY+25,'FIRMA DEL DIRETTORE TECNICO',12,'start',true)}${label(signatureX+18,signatureY+49,`Nominativo: ${signedBy}`,11,'start')}${label(signatureX+18,signatureY+78,'Firma:',11,'start')}<path d="M${signatureX+82} ${signatureY+123} L${signatureX+signatureW-20} ${signatureY+123}" stroke="#24344c" stroke-width="1.2" fill="none"/>${label(signatureX+18,signatureY+145,'Data: ____/____/________',10,'start')}`;
 return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" aria-label="Schema unifilare"><rect x="1" y="1" width="${width-2}" height="${height-2}" fill="white" stroke="#263442"/>${label(25,29,`SCHEMA UNIFILARE · ${state.practiceNo||''}`,17,'start',true)}${label(25,51,`Sistema ${state.earth||''} · ${state.phase||''} · ${state.voltage||''} · ${state.power||''} kW`,11,'start')}${sections.join('')}${signatureBlock}${label(25,height-16,schemaIsReviewed()?'VIMER TEK · Schema controllato dal responsabile tecnico':'VIMER TEK · Verificare collegamenti, protezioni e sezioni',10,'start')}</svg>`;
}
// VT_UNIFILARE_GERARCHICO_V1910B - configurazione QPT / QPP / Giardino.
// La topologia a tre rami si attiva SOLO quando QPT-07/08/09 sono presenti
// nel quadro generale, insieme a QPT-GEN e al montante QPT-PP verso QPP.
// In ogni altra pratica resta attivo il disegno gerarchico della v1.9.10a.
// Mostra una sola volta ogni protezione di montante; l'alimentazione del quadro
// secondario e' richiamata con testo, non con un secondo simbolo RCBO.
function vtSchemaHierarchicSupported(){
 const b=schemaBoards(),items=schemaItems();
 return schemaGroups().length===0 && b.length===1 && /QPP/i.test(String(b[0].name||'')) && items.some(c=>/^QPT-GEN\b/i.test(c.name||'') && (c.board||'QG')==='QG') && items.some(c=>/^QPP-GEN\b/i.test(c.name||'') && c.board===b[0].id) && items.some(c=>/^QPT-PP\b/i.test(c.name||'') && (c.board||'QG')==='QG');
}
function unifilarSVG(onlyBoard=''){
 if(!vtSchemaHierarchicSupported())return unifilarSVGLegacy();
 const cs=schemaItems(), boards=schemaBoards(), groups=schemaGroups(), general=schemaGeneral();
 const defs=[{id:'QG',name:'Quadro generale'},...boards];
 const W=960, C=[208,480,752], rowHeight=153, margin=36;
 const safe=v=>esc(String(v??''));
 const line=(x1,y1,x2,y2,dash='')=>`<path d="M${x1} ${y1} L${x2} ${y2}" fill="none" stroke="#24344c" stroke-width="1.8"${dash?' stroke-dasharray="5 3"':''}/>`;
 const text=(x,y,v,size=12,anchor='middle',bold=false)=>`<text x="${x}" y="${y}" font-family="Arial,sans-serif" font-size="${size}" text-anchor="${anchor}" fill="#25344a"${bold?' font-weight="bold"':''}>${safe(v)}</text>`;
 const words=(v,maxChars,maxLines=2)=>{
  const src=String(v??'').replace(/\s+/g,' ').trim();if(!src)return [];
  const out=[];let buf='';for(const w of src.split(' ')){if((buf+' '+w).trim().length<=maxChars){buf=(buf+' '+w).trim();continue;}if(buf)out.push(buf);buf=w;}
  if(buf)out.push(buf);
  const fitted=[];for(const l of out){if(l.length<=maxChars)fitted.push(l);else for(let i=0;i<l.length;i+=maxChars)fitted.push(l.slice(i,i+maxChars));}
  if(fitted.length>maxLines){fitted.length=maxLines;fitted[maxLines-1]=fitted[maxLines-1].slice(0,Math.max(1,maxChars-1))+'…';}
  return fitted;
 };
 const multi=(x,y,v,size=12,maxChars=34,maxLines=2)=>words(v,maxChars,maxLines).map((z,i)=>text(x,y+i*15,z,size)).join('');
 const isGen=c=>/(^|[\s-])GEN(?:ERALE)?(?=$|[\s-])/i.test(String(c.name||'')) || /^GENERALE\b/i.test(String(c.name||''));
 const matchesFeeder=(c,b)=>{const n=String(c.name||'').toUpperCase(),dest=String(c.dest||'').toUpperCase(),code=String(b.name||'').toUpperCase();return n.startsWith('QPT-PP')&&code.includes('QPP') || (n.includes('MONTANTE') && ((code && dest.includes(code))||dest.includes('QUADRO'))) || (dest.includes('ALIMENTAZIONE QUADRO') && code && dest.includes(code));};
 const feedFor=(b)=>cs.find(c=>(c.board||'QG')==='QG' && matchesFeeder(c,b));
 // Board feeders are identified by the saved circuit where possible.
 const feeders=boards.map(b=>({board:b,circuit:feedFor(b)}));
 const matchedFeederCircuits=new Set(feeders.map(z=>z.circuit).filter(Boolean));
 const deviceBlock=(c,x,top,options={})=>{
  let s=schemaDevice(x,top,c.device||(/MTD|DIFF/i.test(c.prot||'')?'MTD':'MT'));
  s+=multi(x,top+61,c.name||'Circuito',12.5,33,2);
  s+=multi(x,top+92,c.prot||'Protezione da verificare',11,38,2);
  if(!options.noCable)s+=multi(x,top+124,c.cable||'Cavo da indicare',10.5,41,2);
  return s;
 };
 const circuitRows=(items,startY,parentX)=>{
  if(!items.length)return {svg:text(480,startY+35,'Nessuna partenza secondaria registrata',12),bottom:startY+80};
  let out='',busX=89;
  const rows=Math.ceil(items.length/3);
  // The vertical riser is wired to the output of the protective device upstream.
  out+=line(parentX,startY-38,parentX,startY-14)+line(parentX,startY-14,busX,startY-14);
  out+=line(busX,startY-14,busX,startY+(rows-1)*rowHeight+19);
  for(let r=0;r<rows;r++){
   const slice=items.slice(r*3,(r+1)*3),busY=startY+r*rowHeight+19,devY=busY+22;
   out+=line(busX,busY,C[slice.length-1],busY);
   slice.forEach((c,i)=>{out+=line(C[i],busY,C[i],devY)+deviceBlock(c,C[i],devY);});
  }
  return {svg:out,bottom:startY+(rows-1)*rowHeight+22+146};
 };
 const signature=()=>{
  const signed=state.technician||state.issuerTechnician||'Da compilare';
  const x=453,y=0,w=467,h=121;
  return (at)=>`<rect x="${x}" y="${at}" width="${w}" height="${h}" fill="white" stroke="#24344c" stroke-width="1.4"/>${text(x+15,at+23,'FIRMA DEL DIRETTORE TECNICO',12,'start',true)}${text(x+15,at+44,'Nominativo: '+signed,11,'start')}${text(x+15,at+67,'Firma:',11,'start')}${line(x+81,at+94,x+w-18,at+94)}${text(x+15,at+113,'Data: ____/____/________',10,'start')}`;
 };
 function panel(board){
  const id=board.id;
  const own=cs.filter(c=>(c.board||'QG')===id);
  const source=own.find(c=>isGen(c));
  const feedItems=id==='QG'?feeders:[];
  // QPT-07 is a third, independently protected upstream branch,
  // with QPT-08 and QPT-09 electrically DOWNSTREAM of its RCBO.
  const garden=id==='QG'?own.find(c=>/^QPT-07\b/i.test(String(c.name||''))):null;
  const gardenLights=id==='QG'?own.find(c=>/^QPT-08\b/i.test(String(c.name||''))):null;
  const gardenSockets=id==='QG'?own.find(c=>/^QPT-09\b/i.test(String(c.name||''))):null;
  const gardenTopology=!!(garden && gardenLights && gardenSockets && source && feedItems.length===1);
  const exclude=new Set([source,...matchedFeederCircuits,...(gardenTopology?[garden,gardenLights,gardenSockets]:[])]);
  const items=own.filter(c=>!exclude.has(c));
  let s='', y=0;
  if(id==='QG'){
   if(gardenTopology){
    // Three independent branches upstream of the floor's local distribution:
    // QPT-GEN -> internal circuits; QPT-PP -> QPP; QPT-07 -> QPT-08/09.
    const topY=179,topBusY=148,branchXs=[188,480,772];
    s+=text(margin,30,'QUADRO PIANO TERRA / DISTRIBUZIONE PRINCIPALE (QG)',16,'start',true);
    s+=text(margin,51,'Sistema '+(state.earth||'?')+' · '+(state.phase||'?')+' · '+(state.voltage||'?')+' · '+(state.power||'?')+' kW',12,'start');
    s+=`<rect x="350" y="73" width="260" height="31" fill="#f2f5fa" stroke="#8795a7"/>`+text(480,94,'RETE / ALIMENTAZIONE',12,'middle',true);
    s+=text(480,122,general.prot?'Protezione a monte: '+general.prot:'Protezione a monte: da verificare',11);
    s+=line(480,105,480,topBusY)+line(branchXs[0],topBusY,branchXs[2],topBusY);
    const upstream=[source,feedItems[0].circuit,garden];
    upstream.forEach((c,i)=>{
      const x=branchXs[i];
      s+=line(x,topBusY,x,topY)+schemaDevice(x,topY,c?.device||'MTD');
      s+=multi(x,244,c?.name||'Partenza da identificare',12.5,28,2);
      s+=multi(x,278,c?.prot||(i===1?feedItems[0].board.feed:'Protezione da verificare'),10.8,31,3);
    });
    s+=text(branchXs[1],323,'→ '+(feedItems[0].board.name||feedItems[0].board.id)+' ('+feedItems[0].board.id+')',11.5,'middle',true);
    // The central QPT-PP branch terminates at QPP; its RCBO is NOT redrawn there.
    s+=line(branchXs[1],224,branchXs[1],230);
    // Branch QPT-GEN: 6 local circuits, grouped 2 per row, on a dedicated bus.
    s+=text(108,348,'A VALLE DI '+source.name,11,'start',true);
    s+=line(branchXs[0],224,branchXs[0],328)+line(branchXs[0],328,107,328)+line(107,328,107,730);
    const localXs=[205,397],localBusYs=[382,554,726];
    items.forEach((c,i)=>{
      const r=Math.floor(i/2),col=i%2,busY=localBusYs[r],x=localXs[col];
      if(col===0)s+=line(107,busY,localXs[1],busY);
      s+=line(x,busY,x,busY+20)+deviceBlock(c,x,busY+20);
    });
    // Independently protected garden branch QPT-07 (C20/30mA):
    // only lights QPT-08 and sockets QPT-09 lie downstream.
    s+=text(590,348,'A VALLE DI '+garden.name,11,'start',true);
    s+=line(branchXs[2],224,branchXs[2],365)+line(601,365,859,365);
    [[gardenLights,665],[gardenSockets,860]].forEach(([c,x])=>{
      s+=line(x,365,x,392)+deviceBlock(c,x,392);
    });
    // Visual separator does not represent an electrical connection.
    s+=`<path d="M518 349 V857" stroke="#c5cfda" stroke-width="1" stroke-dasharray="4 6"/>`;
    y=905;
   }else{
   const hasFeed=feedItems.length>0;
   const generalX=hasFeed?257:480,feederX=hasFeed?735:480;
   s+=text(margin,30,'QUADRO PIANO TERRA / DISTRIBUZIONE PRINCIPALE (QG)',16,'start',true);
   s+=text(margin,51,'Sistema '+(state.earth||'?')+' · '+(state.phase||'?')+' · '+(state.voltage||'?')+' · '+(state.power||'?')+' kW',12,'start');
   s+=`<rect x="350" y="73" width="260" height="31" fill="#f2f5fa" stroke="#8795a7"/>`+text(480,94,'RETE / ALIMENTAZIONE',12,'middle',true);
   if(general.prot){s+=text(480,122,'Protezione generale QG: '+general.prot,11);}else{s+=text(480,122,'Protezione a monte: da verificare',11);}
   s+=line(480,105,480,148);
   if(hasFeed){s+=line(generalX,148,feederX,148);}
   s+=line(generalX,148,generalX,179);
   if(source){s+=schemaDevice(generalX,179,source.device||'MTD');s+=multi(407,244,source.name,13,25,2)+multi(407,273,source.prot,11,31,2);s+=line(generalX,224,generalX,310);}
   else{s+=`<rect x="${generalX-126}" y="179" width="252" height="52" fill="white" stroke="#9ba9bb" stroke-dasharray="5 3"/>`+text(generalX,198,'Generale ramo piano terra',11)+text(generalX,215,'Da identificare',11);}
   if(hasFeed){
    s+=line(feederX,148,feederX,179);
    // One protective symbol for each distinct feeder. Never a second symbol in QPP.
    feedItems.forEach(({board:b,circuit:c},j)=>{
      if(j>0){/* multiple feeders share the upper bus, each at a separate horizontal slot */}
      if(j===0){
       s+=schemaDevice(feederX,179,c?.device||'MTD');
       s+=multi(feederX,243,c?.name||('Montante '+(b.name||b.id)),12.5,30,2);
       s+=multi(feederX,274,c?.prot||b.feed||'Protezione da verificare',10.8,35,3);
       s+=text(feederX,326,'→ '+(b.name||b.id)+' ('+b.id+')',12,'middle',true);
       s+=line(feederX,224,feederX,232);
      }
    });
   }
   const startY=348;
   s+=text(102,startY-38,source?'PARTENZE A VALLE DI '+source.name:'PARTENZE QG: TOPOLOGIA DA VERIFICARE',11,'start',true);
   const rows=circuitRows(items,startY,generalX);
   s+=rows.svg;y=rows.bottom+22;
   }

  }else{
   const linked=feeders.find(f=>f.board.id===id),feeder=linked?.circuit;
   s+=text(margin,30,`${board.name||id} (${id})`,16,'start',true);
   s+=text(margin,53,`Alimentazione dal quadro generale — montante ${feeder?.name||'da identificare'}`,12,'start');
   s+=multi(480,79,board.cable||feeder?.cable||'Cavo montante da indicare',11,95,2);
   // Only a dashed reference arrow: the feeder protective device is drawn in QG.
   s+=line(480,109,480,160,'dash');
   if(source){s+=schemaDevice(480,160,source.device||'MTD');s+=multi(665,197,source.name,13,29,2);s+=multi(665,228,source.prot,11,30,2);s+=line(480,205,480,291);}
   else{s+=`<rect x="345" y="160" width="270" height="48" fill="white" stroke="#9ba9bb" stroke-dasharray="5 3"/>`+text(480,178,'Generale quadro da verificare',12)+text(480,194,'Non identificato nei circuiti',11);}
   s+=text(102,302,'PARTENZE A VALLE DEL GENERALE DEL QUADRO',11,'start',true);
   const rows=circuitRows(items,329,480);s+=rows.svg;y=rows.bottom+18;
  }
  // Deliberately do not draw duplicate 'virtual' feeder nodes as independent devices.
  const H=y+28;
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Schema unifilare ${safe(board.name||id)}"><rect x="1" y="1" width="${W-2}" height="${H-2}" fill="white" stroke="#263442"/>${s}${text(28,H-13,schemaIsReviewed()?'VIMER TEK · Schema controllato dal responsabile tecnico':'VIMER TEK · Verificare corrispondenza con i collegamenti reali',10,'start')}</svg>`;
  return {board,svg,body:s,height:H};
 }
 const visible=onlyBoard?defs.filter(b=>b.id===onlyBoard):defs;
 const panels=visible.map(panel);
 const header=68,space=18;
 const sigH=onlyBoard && onlyBoard!==(defs.at(-1)?.id)?0:153;
 const height=header+panels.reduce((n,p)=>n+p.height+space,0)+sigH+20;
 let y=header,inner=`<rect x="1" y="1" width="${W-2}" height="${height-2}" fill="white" stroke="#263442"/>`;
 inner+=text(27,29,'SCHEMA UNIFILARE · '+(state.practiceNo||''),17,'start',true);
 inner+=text(27,52,schemaIsReviewed()?'Rappresentazione gerarchica dei quadri e circuiti':'Rappresentazione gerarchica – verificare alimentazioni e protezioni',11,'start');
 for(const p of panels){inner+=`<svg x="0" y="${y}" width="${W}" height="${p.height}" viewBox="0 0 ${W} ${p.height}">${p.body}</svg>`;y+=p.height+space;}
 if(sigH)inner+=signature()(y+10);
 inner+=text(27,height-13,schemaIsReviewed()?'VIMER TEK · Schema controllato dal responsabile tecnico':'VIMER TEK · Schema da verificare e validare prima del rilascio',10,'start');
 return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${height}" width="${W}" height="${height}" role="img" aria-label="Schema unifilare">${inner}</svg>`;
}
function unifilarPrintPages(){
 if(!vtSchemaHierarchicSupported())return `<section class="print-section"><h2>Schema unifilare · ${esc(state.practiceNo||'')}</h2>${schemaIsReviewed()?'':'<p class="notice">Schema da verificare prima del rilascio.</p>'}<div class="vt-unifilar-sheet-svg">${unifilarSVGLegacy().replace(/width="\d+" height="\d+" role=/,'width="100%" height="auto" role=')}</div></section>`;
 const defs=[{id:'QG',name:'Quadro generale'},...schemaBoards()];
 return defs.map((b,i)=>`<section class="print-section vt-unifilar-sheet"><h2>Schema unifilare · ${esc(state.practiceNo||'')} — ${esc(b.name||b.id)}</h2>${schemaIsReviewed()?'':'<p class="notice">Schema da verificare: controllare protezioni, collegamenti, selettività e dati prima dell’uso professionale.</p>'}<div class="vt-unifilar-sheet-svg">${unifilarSVG(b.id).replace(/width="\d+" height="\d+" role=/,'width="100%" height="auto" role=')}</div></section>`).join('');
}
function refreshSchema(){let d=document.getElementById('schemaPreview');if(d)d.innerHTML=unifilarSVG()}
function unifilar(){
 let a=schemaItems(),g=schemaGeneral(),groups=schemaGroups(),boards=schemaBoards(),boardOptions=[['QG','Quadro generale'],...boards.map(b=>[b.id,b.name||b.id])],groupOptions=[['','Nessun gruppo'],...groups.map(x=>[x.id,x.name||x.id])];
 return `<div class="card"><h2>Editor schema unifilare · gruppi e quadri</h2><p class="muted">Gestione di partenze, differenziali di gruppo e quadri secondari. Dopo il controllo tecnico dello schema puoi confermarne la revisione per togliere gli avvisi dalla stampa.</p><div class="actions"><button onclick="schemaAdd()">+ Partenza</button><button onclick="schemaAddGroup()">+ Differenziale di gruppo</button><button onclick="schemaAddBoard()">+ Quadro secondario</button><button class="secondary" onclick="schemaRegenerate()">Rigenera dai circuiti</button><button class="secondary" onclick="save(true)">Salva schema</button></div><div class="grid"><label>Protezione generale QG<input value="${escAttr(g.prot)}" onchange='schemaEditGeneral("prot",this.value)'></label><label>Revisione dello schema<select onchange='schemaMarkReviewed(this.value)'><option value='' ${!schemaIsReviewed()?'selected':''}>Da verificare</option><option value='Si' ${schemaIsReviewed()?'selected':''}>Verificato dal responsabile tecnico</option></select></label></div><p class="muted">Seleziona «Verificato» solo dopo il controllo dei collegamenti reali, delle protezioni e delle sezioni. Le modifiche allo schema annullano automaticamente la conferma. ${schemaIsReviewed()?'Revisione registrata il '+esc(state.schemaValidatedOn||'data non indicata')+'.':''}</p>
 <h3>Differenziali di gruppo</h3>${groups.length?'':'<p class="muted">Nessun gruppo inserito.</p>'}${groups.map((x,i)=>`<div class="schema-edit-row"><div class="grid"><label>Codice gruppo<input value="${escAttr(x.id)}" disabled></label><label>Nome<input value="${escAttr(x.name)}" onchange='schemaEditGroup(${i},"name",this.value)'></label><label>Protezione (es. ID 40 A 30 mA tipo A)<input value="${escAttr(x.prot)}" onchange='schemaEditGroup(${i},"prot",this.value)'></label><label>Quadro${schemaSelect(x.board||'QG',boardOptions,`schemaEditGroup(${i},"board",this.value)`)}</label></div><button class="danger" onclick="schemaRemoveGroup(${i})">Rimuovi gruppo</button></div>`).join('')}
 <h3>Quadri secondari</h3>${boards.length?'':'<p class="muted">Nessun quadro secondario inserito.</p>'}${boards.map((x,i)=>`<div class="schema-edit-row"><div class="grid"><label>Codice<input value="${escAttr(x.id)}" disabled></label><label>Nome quadro<input value="${escAttr(x.name)}" onchange='schemaEditBoard(${i},"name",this.value)'></label><label>Protezione linea di alimentazione<input value="${escAttr(x.feed)}" onchange='schemaEditBoard(${i},"feed",this.value)'></label><label>Cavo alimentazione<input value="${escAttr(x.cable)}" onchange='schemaEditBoard(${i},"cable",this.value)'></label></div><button class="danger" onclick="schemaRemoveBoard(${i})">Rimuovi quadro</button></div>`).join('')}
 <h3>Partenze</h3>${a.map((c,i)=>`<div class="schema-edit-row"><b>Partenza ${i+1}</b><div class="grid">${[['name','Circuito'],['prot','Protezione'],['cable','Cavo'],['dest','Destinazione']].map(([k,t])=>`<label>${t}<input value="${escAttr(c[k]||'')}" onchange='schemaEdit(${i},"${k}",this.value)'></label>`).join('')}<label>Tipo dispositivo${schemaDeviceSelect(i,c.device||'MT')}</label><label>Quadro${schemaSelect(c.board||'QG',boardOptions,`schemaEdit(${i},"board",this.value)`)}</label><label>Gruppo differenziale${schemaSelect(c.group||'',groupOptions,`schemaEdit(${i},"group",this.value)`)}</label></div><div class="actions"><button class="secondary" onclick="schemaMove(${i},-1)" ${i===0?'disabled':''}>↑</button><button class="secondary" onclick="schemaMove(${i},1)" ${i===a.length-1?'disabled':''}>↓</button><button class="danger" onclick="schemaRemove(${i})">Rimuovi</button></div></div>`).join('')}<h3>Anteprima</h3><div id="schemaPreview" class="unifilar" style="overflow:auto;background:white">${unifilarSVG()}</div><p class="muted">Questa versione rappresenta i gruppi sopra i circuiti assegnati, senza validare i collegamenti reali. Verificare protezioni, selettività e dati prima dell'uso professionale.</p></div>`;
}

const PRINT_SECTIONS=[['cover','Copertina e indice (pagina 2)'],['declaration','Dichiarazione / scheda dati'],['ministerial','Di.Co. · Allegato I D.M. 37/2008'],['materials','Relazione materiali'],['circuits','Quadri e circuiti'],['unifilar','Schema unifilare'],['verification','Rapporto verifiche'],['projects','Progettisti e progetti'],['attachments','Allegati originali (file PDF e immagini)']];
function availablePrintSections(){return PRINT_SECTIONS.filter(([id])=>id!=='ministerial'||state.doc==='Di.Co.').filter(([id])=>id!=='projects'||hasProjectData()).filter(([id])=>id!=='attachments'||attachmentMeta().length>0)}
function fascicolo(){return `<div class='card'><h2>Stampa fascicolo tecnico · v1.9.11</h2><p class='muted'>Stampa A4 del fascicolo o dei singoli documenti. Le sezioni vuote non vengono stampate. Gli allegati originali (PDF e immagini) sono aggiunti come pagine, non come elenco di nomi.</p><div class='actions'><button type='button' onclick='printFascicolo()'>Stampa fascicolo completo</button><button type='button' class='secondary' onclick='printSelected()'>Stampa documenti selezionati</button></div><h3>Documenti da stampare</h3><div class='print-options'>${availablePrintSections().map(([id,title])=>`<label class='print-option'><input type='checkbox' data-print-section='${id}' ${id==='cover'?'':'checked'}> ${esc(title)}</label>`).join('')}</div>${!attachmentMeta().length?'<p class=muted>Non ci sono allegati originali da stampare: carica PDF o immagini nella sezione Allegati. I vecchi nomi da soli non bastano.</p>':''}<p class='muted'>Il modello Allegato I si stampa soltanto quando i dati e le verifiche richiesti sono stati confermati. Restano necessarie le firme e la documentazione tecnica effettiva. La copertina non è stata modificata.</p></div><div class='card'><h3>Anteprima copertina</h3><div class='cover'><img src='assets/logo-vimertek.png' alt='Vimer Tek'><h2>FASCICOLO TECNICO IMPIANTO ELETTRICO</h2><h3>${esc(state.doc)}</h3><div>${esc(state.practiceNo)}</div><div class='box'><b>Cliente:</b> ${esc(state.client||'Da compilare')}<br><b>Ubicazione:</b> ${esc([state.address,state.city,state.province].filter(Boolean).join(', ')||'Da compilare')}<br><b>Intervento:</b> ${esc(state.work)}<br><b>Impresa:</b> ${esc(state.company||'Da compilare')}<br><b>Responsabile tecnico:</b> ${esc(state.technician||'Da compilare')}</div></div></div>`}
function printFascicolo(){printDocuments(availablePrintSections().map(x=>x[0]))}
function printSelected(){const ids=[...document.querySelectorAll('[data-print-section]:checked')].map(x=>x.dataset.printSection);if(!ids.length){alert('Seleziona almeno un documento.');return}printDocuments(ids)}
function isNotApplicable(value){return typeof value==='string' && /^non applicabile$/i.test(value.trim())}
function printableTable(headers,rows){rows=rows.filter(row=>!row.some(value=>isNotApplicable(value)));return `<table><thead><tr>${headers.map(x=>`<th>${esc(x)}</th>`).join('')}</tr></thead><tbody>${rows.length?rows.map(row=>`<tr>${row.map(x=>`<td>${esc(x??'')}</td>`).join('')}</tr>`).join(''):`<tr><td colspan='${headers.length}'>Nessun dato inserito</td></tr>`}</tbody></table>`}
function printPart(id){const v=verifyStore(),loc=[state.address,state.city,state.province].filter(Boolean).join(', ');const entry=(label,value)=>`<p><strong>${esc(label)}:</strong> ${esc(value||'Da compilare')}</p>`;
if(id==='cover'){
const designer=(state.designers||[])[0];
const val=(x)=>esc(x||'Da compilare');
const date=state.date ? new Date(state.date).toLocaleDateString('it-IT') : new Date().toLocaleDateString('it-IT');
const addr=[state.address,state.city,state.province].filter(Boolean).join(', ');
const level=state.level ? (/^\d+$/.test(String(state.level)) ? 'Livello '+state.level+' – '+({1:'Base',2:'Standard',3:'Domotico'}[state.level]||'') : state.level) : '';
const designerInfo=[designer?.name,designer?.order,designer?.number ? 'N. '+designer.number : '',designer?.contact].filter(Boolean).join(' · ');
const fields=[['▤','CODICE PRATICA',state.practiceNo],['▦','DATA',date],['♙','COMMITTENTE',state.client],['⌖','UBICAZIONE',addr],['⌂','TIPOLOGIA IMPIANTO',state.use||state.work],['▥','LIVELLO PRESTAZIONALE',level]];
return `<section class="print-page cover-page template-cover"><img class="template-bg" src="assets/copertina-vimertek-definitiva.png" alt="Copertina Vimer Tek"><div class="cover-values">${[state.practiceNo,date,state.client,addr,state.use||state.work,level].map((value,i)=>`<div class="cover-value cover-value-${i}">${val(value)}</div>`).join('')}<div class="cover-designer">${designerInfo?val(designerInfo):''}</div><div class="cover-technician">${val(state.technician)}</div></div></section><section class="print-page index-page"><div class="index-kicker">${esc(state.practiceNo||'Fascicolo tecnico')} · D.M. 37/2008</div><h1>INDICE DEL FASCICOLO</h1><p>Documenti selezionati per questa stampa</p><ol>${PRINT_SECTIONS.filter(([k])=>k!=='cover'&&printIds.includes(k)).map(([,title],i)=>`<li><span>${String(i+1).padStart(2,'0')}</span><b>${esc(title)}</b></li>`).join('')||'<li>Nessun altro documento selezionato</li>'}</ol><div class="index-note">La presenza nell’indice non attesta la completezza normativa della pratica. Verificare i documenti obbligatori e le firme richieste.</div></section>`;
}
if(id==='declaration')return `<section class='print-section'><h2>${esc(state.doc)} — scheda dati della pratica</h2><p class='notice'>Scheda riepilogativa non sostitutiva del modello ufficiale di dichiarazione previsto dalla normativa. Completare e sottoscrivere il modello prescritto e i suoi allegati.</p>${entry('Numero pratica',state.practiceNo)}${entry('Committente',state.client)}${entry('CF / P.IVA',state.clientTax)}${entry('Ubicazione',loc)}${entry('Tipologia intervento',state.work)}${entry('Descrizione dei lavori',state.workDescription)}${entry('Impresa esecutrice',state.company)}${entry('Ruolo dichiarante',state.doc==='Di.Ri.'?state.diriRole:state.declarationRole)}${entry('Soggetto dichiarante',state.doc==='Di.Co.' && (state.declarationRole||'Impresa installatrice')==='Impresa installatrice' ? state.company : (state.issuerCompany||state.company))}${entry('Firmatario',state.issuerTechnician||state.technician)}${entry(state.doc==='Di.Ri.'?'Requisiti professionali dichiarati':'Presupposto normativo',state.doc==='Di.Ri.'?state.diriBasis:state.issuerBasis)}${entry('Responsabile tecnico',state.technician)}${entry('Sistema di distribuzione',state.earth)}${entry('Alimentazione',`${state.phase||''} ${state.voltage||''}`)}${entry('Potenza (kW)',state.power)}${state.doc==='Di.Ri.'?`
<h3>Dati specifici della Di.Ri.</h3>
${entry('Epoca di realizzazione impianto',state.diriYear)}
${entry('Qualifica del dichiarante',state.diriQualification)}
${entry('Sopralluoghi e accertamenti',state.diriInspections)}
${entry('Esito delle verifiche',state.diriOutcome)}
${entry('Data dichiarazione',state.diriDate)}
${entry('Luogo dichiarazione',state.diriPlace)}
<p class='notice'>Verificare applicabilità della Di.Ri., requisiti del dichiarante e documentazione delle verifiche prima della sottoscrizione.</p>
`:''}<div class='print-signature'><span>Firma del responsabile tecnico<br>${esc(state.technician||'')}<i></i></span></div></section>`;
if(id==='materials')return `<section class='print-section'><h2>Relazione materiali e punti impianto</h2>${entry('Marca / serie prevalente',[state.brand,state.series].filter(Boolean).join(' / '))}${printableTable(['Locale','Marca','Serie','Tipologia','Quantità'],(state.fruits||[]).map(x=>[x.room,x.brand,x.series,x.type,x.qty]))}<p><strong>Totale frutti registrati:</strong> ${(state.fruits||[]).reduce((a,x)=>a+(Number(x.qty)||0),0)}</p></section>`;
if(id==='circuits')return `<section class='print-section vt-circuits-section'><h2>Quadri e circuiti</h2>${entry('Distribuzione',state.earth)}${entry('Fasi',state.phase)}${entry('Tensione',state.voltage)}${printableTable(['Circuito','Protezione','Cavo','Destinazione'],(state.circuits||[]).map(x=>[x.name,x.prot,x.cable,x.dest]))}</section>`;
if(id==='unifilar')return unifilarPrintPages();
if(id==='ministerial')return ministerialDico();

if(id==='verification')return `<section class='print-section vt-verification-section'><h2>Rapporto verifiche · CEI 64-8 Parte 6</h2>${entry('Modalità',v.mode==='dettagliata'?'Dettagliata':'Rapida')}${entry('Data',v.date)}${VERIFY_GROUPS.map(([group,items])=>`<div class='verification-group'><h3>${esc(group)}</h3>${printableTable(['Verifica','Esito','Circuito / valore / metodo / strumento','Note'],items.filter(([key])=>!isNotApplicable(verifyEntry(key).result)).map(([key,title])=>{let x=verifyEntry(key);return [title,x.result||'Da eseguire',[x.circuit,x.value?`${x.value} ${x.unit||VERIFY_UNITS[key]||''}`:'',x.method,x.instrument].filter(Boolean).join(' · '),x.notes||'']}))}</div>`).join('')}${entry('Strumenti',v.instrumentNotes)}${entry('Osservazioni',v.notes)}<p class='notice'>Le misure e gli esiti sono dichiarati dal compilatore e non verificati automaticamente dal software.</p><div class='print-signature'><span>Firma del responsabile tecnico<br>${esc(state.technician||'')}<i></i></span></div></section>`;
if(id==='projects'){projectStore();if(!hasProjectData())return '';return `<section class='print-section'><h2>Progettisti e progetti</h2>${printableTable(['Progettista','Ordine / Collegio','Iscrizione','Contatto'],state.designers.map(x=>[x.name,x.order,x.number,x.contact]))}${printableTable(['Progetto','Progettista','Revisione','Data','File registrati'],state.projects.map(x=>[x.title,x.designer,x.revision,x.date,(x.files||[]).join(', ')]))}<p class='notice'>I file sono elencati per nome e devono essere allegati separatamente. Verificare gli elaborati e le firme professionali richieste.</p></section>`}
if(id==='attachments')return '';return ''}
// VT_DICO_IMPRESA_INSTALLATRICE_V1910C
// VIMERTEK_DICO_FINALE_1911_20261027: rilascio documento solo a dati completi.
function vtDicoDatiMancanti(){
  const m=state.vtV1910?.ministerial||{};
  const blanks=[];
  const req=(label,value)=>{if(!String(value??'').trim())blanks.push(label)};
  if(state.doc!=='Di.Co.' || state.declarationRole!=='Impresa installatrice')
    blanks.push('Di.Co. rilasciata da impresa installatrice');
  const co=String(state.company||'').trim();
  if(!/vimer\s*tek/i.test(co))blanks.push('Ragione sociale Vimer Tek');
  req('Firmatario / legale rappresentante',m.representative||state.issuerTechnician||state.technician);
  req('Responsabile tecnico',state.technician);
  req('Committente',state.client);
  req('CF / P.IVA committente',state.clientTax);
  req('Ubicazione',state.address);
  if(!String(state.city||'').trim()||!String(state.province||'').trim())blanks.push('Comune e provincia dell’immobile');
  req('Descrizione lavori',state.workDescription);
  req('Sede impresa',state.companyAddress||m.headOffice);
  req('Telefono impresa',state.companyPhone);
  if(String(state.companyVat||'01760570885').replace(/\D/g,'')!=='01760570885')blanks.push('Partita IVA Vimer Tek');
  req('Settore impiantistico',state.companySector||m.sector);
  req('CCIAA / Albo',state.registryOffice||m.regOffice);
  const ufficio=String(state.registryOffice||m.regOffice||'').trim();
  const iscrizione=String(state.registryNumber||m.regNo||'').trim();
  if(/^(?:[A-Z]{2}\s*[-–]\s*)?\d{4,}$/i.test(ufficio)|| (ufficio && iscrizione && ufficio.replace(/\s/g,'').toUpperCase()===iscrizione.replace(/\s/g,'').toUpperCase()))blanks.push('CCIAA: inserire il nome della Camera di Commercio, non il numero REA');
  req('Numero iscrizione Registro imprese / Albo',state.registryNumber||m.regNo);
  req('Norma tecnica applicata',state.technicalStandard||m.technicalStandard);
  req('Progettista o redattore elaborato',state.projectAuthor||m.projectAuthor||(state.designers||[])[0]?.name);
  req('Data e luogo di rilascio',state.dicoDate&&state.dicoPlace);
  if(!(state.fruits||[]).some(x=>Number(x.qty)>0))blanks.push('Relazione materiali / punti impianto compilata');
  if(!(state.circuits||[]).length&&!Array.isArray(state.schemaItems))blanks.push('Circuiti e schema impianto');
  const v=verifyStore();
  if(!String(v.date||'').trim())blanks.push('Data verifiche');
  if(!String(v.instrumentNotes||'').trim())blanks.push('Strumento utilizzato e identificazione');
  const actual=Object.values(v.items||{});
  if(!actual.some(x=>x&&x.result==='Conforme'))blanks.push('Esiti delle verifiche realmente eseguite');
  const remaining=verifyItems().filter(([id])=>!['Conforme','Non applicabile'].includes(verifyEntry(id).result));
  if(remaining.length)blanks.push('Completare gli esiti delle verifiche: '+remaining.length+' non compilate');
  if(actual.some(x=>x && x.result==='Non conforme'))blanks.push('Risoluzione esiti non conformi');
  for(const [k,t] of [['dicoProjectVerified','Progetto e schema verificati'],['dicoMaterialsVerified','Relazione materiali verificata'],['dicoTestsVerified','Verifiche strumentali concluse'],['dicoCertVerified','Certificato requisiti tecnico-professionali allegato']]) {
    if(state[k]!=='Si')blanks.push(t);
  }
  return [...new Set(blanks)];
}
function ministerialDico(){
 const m=state.vtV1910?.ministerial||{};
 const e=x=>esc(String(x??'').trim()||'________________');
 const firm=m.representative||state.issuerTechnician||state.technician||'DECARO ALESSIO';
 const company=/vimer\s*tek/i.test(state.company||'')?'VIMER TEK S.R.L.S.':(state.company||'');
 const loc=[state.address,state.city,state.province].filter(Boolean).join(', ');
 const sector=state.companySector||m.sector;
 const standard=state.technicalStandard||m.technicalStandard;
 const progettista=state.projectAuthor||m.projectAuthor||(state.designers||[])[0]?.name||state.technician;
 const iscrizione=state.registryNumber||m.regNo;
 const camera=state.registryOffice||m.regOffice;
 const note=Array.isArray(state.attachments)?state.attachments.join('; '):'';
 return `<section class='print-section ministerial-dico vt-allegato-1'>
 <div class='vt-dico-law'>D.M. 37/2008 · Allegato I (modello aggiornato dal D.M. 19 maggio 2010)</div>
 <h2>DICHIARAZIONE DI CONFORMITÀ DELL’IMPIANTO ALLA REGOLA DELL’ARTE</h2>
 <p>Il sottoscritto <b>${e(firm)}</b>, titolare o legale rappresentante dell’impresa <b>${e(company)}</b>,
 operante nel settore <b>${e(sector)}</b>, con sede in <b>${e(state.companyAddress||m.headOffice)}</b>,
 tel. <b>${e(state.companyPhone)}</b>, P. IVA <b>${e(state.companyVat||'01760570885')}</b>,
 iscritta nel Registro delle Imprese / Albo delle imprese artigiane della C.C.I.A.A. di <b>${e(camera)}</b>,
 n. <b>${e(iscrizione)}</b>, esecutrice dell’impianto di seguito descritto:</p>
 <p><b>Impianto:</b> ${e(state.workDescription)}<br>
 <b>Committente:</b> ${e(state.client)} · CF/P.IVA ${e(state.clientTax)}<br>
 <b>Edificio / unità immobiliare:</b> ${e(loc)}<br>
 <b>Destinazione d’uso:</b> ${e(state.use)} · <b>Tipo intervento:</b> ${e(state.work)}<br>
 <b>Impianto elettrico:</b> ${e(state.phase)} ${e(state.voltage)}, sistema ${e(state.earth)}</p>
 <h3>DICHIARA</h3>
 <p>Sotto la propria personale responsabilità, che l’impianto è stato realizzato in modo conforme alla regola dell’arte secondo quanto previsto dall’art. 6 del D.M. 37/2008, tenuto conto delle condizioni di esercizio e degli usi cui è destinato l’edificio, avendo in particolare:</p>
 <ul class='vt-dico-declarations'>
 <li>rispettato il progetto, redatto ai sensi dell’art. 5 da <b>${e(progettista)}</b>;</li>
 <li>seguito la norma tecnica applicabile all’impiego: <b>${e(standard)}</b>;</li>
 <li>installato componenti e materiali adatti al luogo di installazione;</li>
 <li>controllato l’impianto ai fini della sicurezza e della funzionalità, con esito positivo, eseguendo le verifiche richieste dalle norme e dalla legge.</li>
 </ul>
 <h3>ALLEGATI OBBLIGATORI</h3>
 <p>□ Progetto ai sensi degli artt. 5 e 7 (e relative varianti ove previste);<br>
 □ Relazione con tipologie dei materiali utilizzati;<br>
 □ Schema dell’impianto realizzato;<br>
 □ Riferimento a dichiarazioni di conformità precedenti o parziali, già esistenti, ove pertinenti;<br>
 □ Copia del certificato di riconoscimento dei requisiti tecnico-professionali.</p>
 <p><b>Allegati facoltativi:</b> ${e(note||'Nessuno')}</p>
 <h3>DECLINA</h3>
 <p>Ogni responsabilità per sinistri a persone o cose derivanti da manomissioni dell’impianto da parte di terzi ovvero da carenze di manutenzione o riparazione.</p>
 <p><b>Data:</b> ${e(state.dicoDate)} &nbsp; <b>Luogo:</b> ${e(state.dicoPlace)}</p>
 <div class='vt-dico-signatures'>
 <div><b>IL RESPONSABILE TECNICO</b><p>${e(state.technician)}</p><span>Timbro e firma</span></div>
 <div><b>IL DICHIARANTE</b><p>${e(firm)}</p><span>Timbro e firma</span></div>
 </div>
 <p class='vt-dico-warnings'><b>Avvertenze per il committente:</b> responsabilità del committente e del proprietario secondo l’art. 8 del D.M. 37/2008.</p>
 </section>`;
}

let printIds=[];
async function printDocuments(ids){
 if(state.doc==='Di.Co.' && ids.includes('ministerial')){const mancanti=vtDicoDatiMancanti();if(mancanti.length){alert('DICHIARAZIONE NON EMETTIBILE. Prima di stampare il modello Di.Co. completare e verificare:\n\n• '+mancanti.join('\n• '));return;}}
save(false);printIds=ids.filter(id=>id!=='ministerial'||state.doc==='Di.Co.').filter(id=>id!=='projects'||hasProjectData()).filter(id=>id!=='attachments'||attachmentMeta().length>0);const missing=[['Cliente',state.client],['Ubicazione',state.address],['Responsabile tecnico',state.technician]].filter(([,x])=>!String(x||'').trim()).map(([x])=>x);if(missing.length&&!confirm('Attenzione: dati mancanti ('+missing.join(', ')+'). Vuoi generare comunque una BOZZA di stampa?'))return;
const w=window.open('','_blank');if(!w){alert('Il browser ha bloccato la finestra di stampa. Consenti i popup.');return}w.document.open();w.document.write('<!doctype html><html><head><meta charset="utf-8"></head><body style="font:16px Arial;padding:30px">Preparazione dei documenti originali per la stampa...</body></html>');w.document.close();
let realAttachmentHTML='';try{if(printIds.includes('attachments'))realAttachmentHTML=await buildRealAttachmentPages()}catch(err){w.document.body.textContent='Impossibile preparare gli allegati: '+err.message;alert('Stampa annullata: '+err.message);return}
const html=`<!doctype html><html lang='it'><head><meta charset='utf-8'><title>${esc(state.practiceNo)} - Documenti</title><base href='${escAttr(document.baseURI)}'><style>@page{size:A4;margin:17mm 15mm 20mm}*{box-sizing:border-box}body{font:10.5pt Arial,sans-serif;color:#17202a;margin:0;line-height:1.4}h1{font-size:19pt}h2{font-size:15pt;margin:15mm 0 5mm}h3{font-size:12pt;margin:8mm 0 3mm}p{margin:3mm 0;overflow-wrap:anywhere}table{width:100%;border-collapse:collapse;font-size:9pt;table-layout:fixed;margin:5mm 0}th,td{border:1px solid #8e969e;padding:2.5mm;overflow-wrap:anywhere;vertical-align:top}th{background:#eee}tr{break-inside:avoid}h2,h3{break-after:avoid}.print-page{break-after:page}.print-section{break-before:page}.print-page+.print-section{break-before:page}.cover-page{text-align:center;min-height:235mm}.big-logo{width:70mm;height:40mm;object-fit:contain;margin:12mm auto 4mm}.cover-data{text-align:left;border:1px solid #ccc;padding:7mm;margin:12mm auto;max-width:160mm}.cover-page ol{text-align:left;max-width:150mm;margin:auto}.notice{background:#f6f6f6;border-left:3px solid #666;padding:3mm}.diagram-source{border:2px solid #222;padding:4mm;text-align:center;font-weight:bold;max-width:135mm;margin:8mm auto}.diagram-row{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));border:1px solid #777;margin:4mm 0;padding:3mm;gap:3mm;break-inside:avoid;font-size:9pt}.diagram-lines{border-left:3px solid #222;margin-left:12mm;padding-left:9mm}.doc-footer{position:fixed;bottom:-13mm;left:0;right:0;border-top:1px solid #bbb;padding-top:2mm;font-size:8pt;display:flex;justify-content:space-between;gap:6mm;background:white}.doc-footer span{flex:1}.doc-footer span:last-child{text-align:right}.print-section{padding-bottom:16mm}@media screen{body{max-width:210mm;margin:auto;padding:12mm;box-shadow:0 0 10px #ccc}.doc-footer{position:static;margin-top:15mm}.print-section{border-top:2px dashed #bbb;padding-top:8mm}}
.cover-page{position:relative;text-align:left;min-height:0;height:260mm;padding:0 0 21mm;display:flex;flex-direction:column;break-after:page;page-break-after:always}.cover-head{display:grid;grid-template-columns:2.05fr 1fr;gap:8mm;align-items:start;min-height:47mm}.cover-brand img{width:100%;max-width:120mm;height:35mm;object-fit:contain;object-position:left center}.cover-services{font-size:7.7pt;letter-spacing:.05px;margin-top:1mm;white-space:nowrap}.cover-contact{border-left:1px solid #b8bec5;padding-left:5mm;font-size:8.5pt;line-height:1.45}.cover-contact hr{border:0;border-top:1px solid #d1d6dc}.cover-rule{border-top:2px solid #df0714;margin:3mm 0 11mm}.cover-heading{padding-left:4mm}.cover-law{font-size:14pt;font-weight:800;color:#66717b;display:flex;align-items:center;gap:5mm}.cover-bars{display:inline-block;width:62mm;height:4mm;background:linear-gradient(90deg,#66717b 0 30%,#e0e3e6 30% 55%,#f4a5aa 55% 75%,#e30613 75%)}.cover-heading h1{font-size:33pt;line-height:1.05;margin:4mm 0 1mm;font-weight:900;letter-spacing:-.6px;white-space:nowrap;color:#151d25}.cover-subtitle{font-size:29pt;font-weight:900;color:#e30613;line-height:1.1}.cover-short-rule{width:19mm;border-top:2px solid #e30613;margin:5mm 0}.cover-heading p{font-size:12pt;line-height:1.35;color:#53606d;margin:0 0 7mm}.cover-info{border:1px solid #c9cfd5;border-left:3px solid #e30613;border-radius:3px;padding:2mm 5mm;margin-top:1mm}.cover-field{display:grid;grid-template-columns:42% 58%;align-items:center;min-height:12mm;border-bottom:1px solid #d7dce1;gap:3mm;font-size:10pt}.cover-field:last-child{border-bottom:0}.cover-field span{color:#64707b;font-size:8pt;font-weight:700}.cover-field strong{font-size:10pt;overflow-wrap:anywhere}.cover-section-label{font-size:12pt!important;letter-spacing:.4px;margin:8mm 0 4mm!important;padding-left:4mm;border-left:3px solid #e30613}.cover-parties{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:3mm}.cover-parties>div{border-right:1px solid #c8cfd6;padding:0 3mm;font-size:10pt;overflow-wrap:anywhere}.cover-parties>div:last-child{border-right:0}.cover-parties b{font-size:7.5pt}.cover-parties p{margin:2mm 0;font-weight:700}.cover-bottom{position:absolute;bottom:0;left:-15mm;right:-15mm;min-height:17mm;background:#1e2935;color:white;display:flex;align-items:center;justify-content:space-around;padding:3mm 7mm;gap:3mm;font-size:7.5pt}.cover-bottom span{overflow-wrap:anywhere}.index-page{min-height:253mm;break-after:page;page-break-after:always}.index-kicker{border-bottom:2px solid #e30613;padding-bottom:5mm;font-size:9pt;color:#63707c}.index-page h1{font-size:23pt;margin:17mm 0 3mm}.index-page>p{color:#66717b}.index-page ol{list-style:none;margin:12mm 0;padding:0}.index-page li{display:flex;gap:7mm;border-bottom:1px solid #dce1e6;padding:5mm 0;align-items:center;font-size:12pt}.index-page li span{font-size:11pt;font-weight:800;color:#e30613}.index-note{margin-top:18mm;border-left:3px solid #e30613;padding:4mm;background:#f5f6f7;font-size:9pt}.print-section h2{color:#17202a;border-bottom:2px solid #e30613;padding-bottom:3mm}.print-section th{background:#253241;color:#fff}.verification-group{break-inside:avoid;page-break-inside:avoid;margin-bottom:5mm}.verification-group h3{margin:4mm 0 2mm}.verification-group table{margin:2mm 0;font-size:8pt}.verification-group th,.verification-group td{padding:1.6mm 2mm}.doc-footer{font-size:8pt;align-items:end}.doc-footer .signature{display:inline-block;min-width:42mm;border-bottom:1px solid #1e2935;height:6mm;vertical-align:bottom;margin-left:2mm}.cover-page .cover-bottom{bottom:0}@media print{.cover-page,.index-page{break-inside:avoid}.cover-bottom{-webkit-print-color-adjust:exact;print-color-adjust:exact}.cover-bars,.print-section th{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
/* Margine dedicato al riquadro societario: assente su copertina e indice. */
@page {size:A4;margin:17mm 15mm 39mm;
  @bottom-center {
    content:"VIMER TEK S.R.L.S.\\A P. IVA 01760570885\\A L'amministratore unico\\A \\A __________________________";
    white-space:pre;font:10pt/1.45 Arial,sans-serif;color:#17202a;
    border:1px solid #69727d;padding:3mm 8mm;text-align:center;
    width:77mm;height:25mm;
  }
}
@page copertina {size:A4;margin:0;@bottom-center {content:none;border:0}}
@page indice {size:A4;margin:17mm 15mm 20mm;@bottom-center {content:none;border:0}}
@media print {
  .template-cover{page:copertina;width:210mm!important;height:297mm!important;}
  .index-page{page:indice;break-before:page;}
  .print-section{page:auto;break-before:page;padding-bottom:5mm}
.print-section.ministerial-dico{
  font-size:10.5pt;
  line-height:1.22;
  padding-top:0;
  padding-bottom:1mm;
}
.print-section.ministerial-dico p{
  margin-top:3px;
  margin-bottom:3px;
}
.print-section.ministerial-dico h2,
.print-section.ministerial-dico h3{
  margin-top:5px;
  margin-bottom:5px;
}

  .doc-footer{display:none!important}
}
.print-signature{margin-top:14mm;padding-top:4mm;border-top:1px solid #b5bec7;
  display:flex;justify-content:flex-end;break-inside:avoid;font-size:9pt}
.print-signature span{min-width:70mm;text-align:center}
.print-signature i{display:block;border-bottom:1px solid #28333f;height:13mm}
/* Copertina definitiva: immagine originale, soli valori variabili sovrapposti. */
.template-cover{position:relative!important;width:210mm!important;height:297mm!important;min-height:0!important;padding:0!important;margin:0!important;overflow:hidden!important;display:block!important;break-after:page!important;page-break-after:always!important}
.template-bg{display:block;width:100%;height:100%;object-fit:fill}
.cover-values{position:absolute;inset:0;font-family:Arial,sans-serif;color:#17202a}
.cover-value{position:absolute;left:44.1%;width:43.1%;font-size:10pt;line-height:1.16;overflow-wrap:anywhere;max-height:4.2%;overflow:hidden}
.cover-value-0{top:50.5%}.cover-value-1{top:54.5%}.cover-value-2{top:58.3%}.cover-value-3{top:62.2%;max-height:4.5%}.cover-value-4{top:67.2%}.cover-value-5{top:71.1%}
.cover-designer,.cover-technician{position:absolute;top:82.9%;font-size:8.5pt;line-height:1.2;overflow-wrap:anywhere;max-height:5.1%;overflow:hidden}
.cover-designer{left:43%;width:19%}.cover-technician{left:73%;width:20%}
@media print{.template-cover,.template-bg{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
/* Allegati originali: ciascuna pagina è stampata per intero, senza elenco file. */
.vt-attachment-page{break-before:page;page-break-before:always;break-inside:avoid;page-break-inside:avoid;padding:0!important;margin:0;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;min-height:0}
.vt-attachment-title{width:100%;font:9pt Arial,sans-serif;color:#596571;border-bottom:1px solid #aab2bc;margin:0 0 3mm;padding-bottom:2mm;overflow-wrap:anywhere}
.vt-attachment-page img{max-width:100%;width:auto;height:auto;max-height:222mm;object-fit:contain;display:block;margin:0 auto}
.vt-unifilar-sheet{break-before:page!important;page-break-before:always;break-inside:avoid!important;} .vt-unifilar-sheet h2{margin:1mm 0 2mm!important;font-size:13pt;} .vt-unifilar-sheet .notice{margin:1mm 0 2mm;font-size:8pt;padding:1mm 2mm;} .vt-unifilar-sheet-svg{width:100%;max-width:180mm;page-break-inside:avoid;} .vt-unifilar-sheet-svg svg{display:block;width:100%;height:auto;} 
@media print{.vt-attachment-page{page:auto;break-before:page!important;break-after:page!important}.vt-attachment-page img{max-height:222mm}}

/* VIMERTEK_DI_CO_PDF_AUDIT_20261027: più spazio utile nei prospetti A4. */
@media print {
  .vt-circuits-section table{font-size:7.7pt!important;margin:2.4mm 0!important;line-height:1.12!important;}
  .vt-circuits-section th,.vt-circuits-section td{padding:1.1mm 1.5mm!important;}
  .vt-circuits-section p{margin:1.6mm 0!important;}
  .vt-circuits-section h2{margin:2mm 0 3mm!important;}
  .vt-verification-section table{font-size:7.7pt!important;margin:1.3mm 0!important;line-height:1.1!important;}
  .vt-verification-section th,.vt-verification-section td{padding:1.0mm 1.4mm!important;}
  .vt-verification-section .verification-group{margin-bottom:2mm!important;}
  .vt-verification-section .verification-group h3{margin:2mm 0 1mm!important;}
  .vt-verification-section p{margin:1.4mm 0!important;}
  .vt-verification-section .print-signature{margin-top:4mm!important;padding-top:2mm!important;}
}
/* Allegato I definitivo: firme separate e blocchi indivisibili. */
.vt-dico-law{text-align:right;font-size:8.5pt;color:#425368}
.vt-allegato-1{font-size:9.25pt!important;line-height:1.27!important}
.vt-allegato-1 h2{font-size:13.5pt;margin:4mm 0 2.5mm!important}
.vt-allegato-1 h3{font-size:10.5pt;margin:3.3mm 0 1.2mm!important}
.vt-allegato-1 p{margin:1.4mm 0!important}
.vt-dico-declarations{padding-left:5mm;margin:1.5mm 0}
.vt-dico-declarations li{margin:1mm 0}
.vt-dico-signatures{display:grid;grid-template-columns:1fr 1fr;gap:10mm;margin:7mm 0 3mm;break-inside:avoid;page-break-inside:avoid;text-align:center}
.vt-dico-signatures>div{min-height:27mm;display:flex;flex-direction:column;justify-content:space-between;align-items:center;font-size:9pt}
.vt-dico-signatures p{font-weight:600}
.vt-dico-signatures span{border-top:1px solid #17202a;padding-top:1mm;width:90%;font-size:8pt;color:#52616d}
.vt-dico-warnings{font-size:8pt!important;break-inside:avoid}
@media print{.vt-allegato-1{padding-bottom:10mm!important}.vt-dico-signatures{margin-top:7mm}}
</style></head><body>${printIds.map(id=>id==='attachments'?realAttachmentHTML:printPart(id)).join('')}</body></html>`;
w.document.open();w.document.write(html);w.document.close();w.focus();await Promise.all([...w.document.images].map(img=>img.complete?Promise.resolve():new Promise(resolve=>{img.onload=resolve;img.onerror=resolve;setTimeout(resolve,5000)})));setTimeout(()=>w.print(),450);}
function goStep(step){if(!archiveView)save(false);archiveView=false;active=Math.max(0,Math.min(tabs.length-1,step));render();window.scrollTo(0,0)}
function stepActions(){if(active===0)return '';return `<div class='card step-actions'><div class='step-title'>Passaggio ${active} di ${tabs.length-1} · ${esc(tabs[active])}</div><div class='actions'>${active>1?`<button type='button' class='secondary' onclick='goStep(${active-1})'>← Indietro · ${esc(tabs[active-1])}</button>`:`<button type='button' class='secondary' onclick='goStep(0)'>← Dashboard</button>`}${active<tabs.length-1?`<button type='button' onclick='goStep(${active+1})'>Salva e continua → ${esc(tabs[active+1])}</button>`:`<button type='button' onclick='save(true)'>Salva pratica</button>`}</div></div>`}
function render(){nav();document.querySelector('#app').innerHTML=archiveView?`<div class='card'><h2>Archivio pratiche</h2><p>Visualizza tutte le pratiche salvate, apri o elimina una pratica.</p><button class='secondary' onclick='closeArchive()'>← Torna alla dashboard</button></div>${archiveHtml(archive())||`<div class='card'>Nessuna pratica archiviata.</div>`}`:[dashboard,pratica,impianto,materials,circuits,level,checks,projectSection,attachments,unifilar,fascicolo][active]()+stepActions()+`<dialog id='helpDialog' class='help-dialog'><h3>Informazioni sul campo</h3><p id='helpText'></p><form method='dialog'><button>Chiudi</button></form></dialog>`;bind();document.querySelectorAll('[data-help]').forEach(b=>b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();document.querySelector('#helpText').textContent=b.dataset.help;document.querySelector('#helpDialog').showModal()}))}
function bind(){document.querySelectorAll('[data-k]').forEach(e=>{let ev=e.tagName==='TEXTAREA'?'input':'change';e.addEventListener(ev,()=>{state[e.dataset.k]=e.value;if(['earth','phase','voltage','power'].includes(e.dataset.k))schemaInvalidate();save(false);if(active===1&&(e.dataset.k==='doc'||e.dataset.k.startsWith('diri')))render();if(e.dataset.k==='doc')render()})});document.querySelectorAll('[data-v-global]').forEach(e=>e.addEventListener('change',()=>{let v=verifyStore();v[e.dataset.vGlobal]=e.value;save(false);if(e.dataset.vGlobal==='mode')render()}));document.querySelectorAll('[data-v-item]').forEach(e=>e.addEventListener('change',()=>{verifyEntry(e.dataset.vItem)[e.dataset.vField]=e.value;save(false)}))}
function save(msg=true){state.updatedAt=new Date().toISOString();localStorage.setItem('vt_dico',JSON.stringify(state));let a=archive(),i=a.findIndex(p=>p.practiceNo===state.practiceNo);if(i>=0)a[i]=JSON.parse(JSON.stringify(state));else a.push(JSON.parse(JSON.stringify(state)));localStorage.setItem('vt_dico_archive',JSON.stringify(a));if(msg)alert('Pratica salvata e archiviata sul dispositivo.')}
function newPractice(){if(!confirm('Creare una nuova pratica? La pratica corrente verrà salvata.'))return;save(false);state=emptyState();localStorage.setItem('vt_dico',JSON.stringify(state));archiveView=false;active=1;render()}
// VT_DELETE_CONFIRM_SIMPLE_V1: conferma sì/no, senza digitare il numero della pratica.
async function deletePractice(no){
 const a=archive(),p=a.find(x=>x.practiceNo===no);
 if(!p)return;
 if(!confirm('Sei sicuro di voler eliminare definitivamente la pratica '+no+'?\nCliente: '+(p.client||'Non indicato')+'\n\nQuesta operazione non può essere annullata.'))return;
 // Elimina anche gli eventuali allegati originali salvati nel browser per la pratica.
 const storedFiles=Array.isArray(p.attachmentFiles)?p.attachmentFiles:[];
 if(storedFiles.length){
  if(typeof attachmentDelete!=='function'){
   alert('Impossibile eliminare gli allegati originali. Pratica non cancellata.');return;
  }
  try{for(const file of storedFiles)await attachmentDelete(file.id)}
  catch(err){alert('Errore nella cancellazione degli allegati. Pratica non cancellata: '+(err.message||err));return;}
 }
 const updated=a.filter(x=>x.practiceNo!==no);
 localStorage.setItem('vt_dico_archive',JSON.stringify(updated));
 if(state.practiceNo===no){state=emptyState();localStorage.setItem('vt_dico',JSON.stringify(state));}
 active=0;render();alert('Pratica '+no+' eliminata da questo dispositivo.');
}
function openPractice(no){let p=archive().find(x=>x.practiceNo===no);if(!p)return;state=p;localStorage.setItem('vt_dico',JSON.stringify(state));archiveView=false;active=1;render()}
function addFruit(){if(!ftype.value.trim()||!+fqty.value)return;state.fruits.push({room:froom.value.trim(),brand:state.brand||'Da definire',series:state.series||'Da definire',type:ftype.value.trim(),qty:+fqty.value});save(false);render()} function delFruit(i){state.fruits.splice(i,1);save(false);render()}
function addCircuit(){if(!cname.value.trim())return;state.circuits.push({name:cname.value,prot:cprot.value,cable:ccable.value,dest:cdest.value});schemaInvalidate();save(false);render()} function delCircuit(i){state.circuits.splice(i,1);schemaInvalidate();save(false);render()}
async function addFiles(){const input=document.getElementById('files');const selected=[...(input?.files||[])];if(!selected.length){alert('Seleziona almeno un PDF o immagine.');return}const meta=attachmentMeta();let added=0;for(const f of selected){if(!(/\.pdf$|\.(png|jpe?g|webp)$/i.test(f.name))){alert('Formato non supportato: '+f.name+'. Usa PDF, JPG, PNG o WebP.');continue}if(meta.some(x=>x.name===f.name)){alert('Già presente: '+f.name+'. Rimuovi prima la versione precedente per sostituirla.');continue}const id=state.practiceNo+'::'+(window.crypto?.randomUUID?.()||Date.now()+'_'+added);try{await attachmentWrite({id,file:f})}catch(err){alert('Errore di archiviazione di '+f.name+': '+err.message);break}meta.push({id,name:f.name,size:f.size,type:f.type||''});state.attachments=state.attachments||[];if(!state.attachments.includes(f.name))state.attachments.push(f.name);added++}if(added){save(false);render();alert(added+' file originali conservati nel browser. Ora potranno essere stampati nel fascicolo.')}}
function delFile(i){state.attachments.splice(i,1);save(false);render()}
function esc(s=''){return String(s).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]))} function escAttr(s=''){return esc(s).replace(/"/g,'&quot;').replace(/'/g,'&#39;')}
document.querySelector('#save').onclick=()=>save(); render();
