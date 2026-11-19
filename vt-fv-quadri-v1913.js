/* Vimer Tek Di.Co. 37/08 · Schede quadri FV e tratte per schema unifilare.
   I dati tecnici sono dichiarati dall'operatore. Non generare valori nominali presunti. */
(function(){
'use strict';
const active=()=>state.doc==='Di.Co.'&&state.installationType==='Fotovoltaico';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const empty=v=>String(v??'').trim()==='';
const details=()=>{if(!state.vtPvBoardData||typeof state.vtPvBoardData!=='object')state.vtPvBoardData={};const x=state.vtPvBoardData;x.sections=x.sections||{};x.routes=x.routes||{};return x;};
const get=(group,key)=>String(details().sections[group]?.[key]??'').trim();
const CATS=[
 {id:'ST1',title:'Stringa FV1',fields:[
  ['mppt','Ingresso inverter / MPPT assegnato','Es. MPPT 1 – ingresso 1'],
  ['fusibile','Protezione di stringa + / −','Sigla, corrente, tipo, oppure Non prevista'],
  ['connettori','Connettori / caratteristiche','Marca, serie, tensione nominale'],
  ['misure','Dati di progetto / misure stringa','Voc, Isc, polarità: solo dati accertati']
 ]},
 {id:'ST2',title:'Stringa FV2',fields:[
  ['mppt','Ingresso inverter / MPPT assegnato','Es. MPPT 2 – ingresso 1'],
  ['fusibile','Protezione di stringa + / −','Sigla, corrente, tipo, oppure Non prevista'],
  ['connettori','Connettori / caratteristiche','Marca, serie, tensione nominale'],
  ['misure','Dati di progetto / misure stringa','Voc, Isc, polarità: solo dati accertati']
 ]},
 {id:'QDC',title:'Quadro DC / lato corrente continua',fields:[
  ['sigla','Sigla quadro e modello involucro','Es. QDC, marca e modello'],
  ['sez','Sezionatori DC','Sigla, marca/modello, poli, corrente e tensione DC'],
  ['fusibili','Portafusibili / fusibili DC','Numero, sigle, corrente, tensione e tipo; Non previsti se assenti'],
  ['spd','Scaricatore SPD DC','Tipo, marca/modello, Ucpv, Up, protezione; Non previsto'],
  ['pe','Messa a terra SPD / quadro DC','Conduttore PE, sezione e collegamento']
 ]},
 {id:'INV',title:'Inverter e ingresso AC',fields:[
  ['mppt','Associazione MPPT / stringhe','Percorso effettivo: FV1→MPPT1, FV2→MPPT2'],
  ['dc','Tensioni/limiti DC rilevanti','Valori di targa realmente verificati'],
  ['ac','Uscita inverter AC','Fase, tensione, corrente nominale, morsetti'],
  ['interfaccia','Dispositivo/protezione interfaccia','Modello e ubicazione; specificare se integrato']
 ]},
 {id:'BAT',title:'Accumulo e protezioni batteria',fields:[
  ['topologia','Configurazione batterie / connessione','Numero, collegamento, BMS; effettivi'],
  ['sez','Sezionatore / interruttore batteria','Marca, modello, poli, A e V DC; se previsto'],
  ['fusibile','Fusibile / protezione batteria','Sigla, corrente, tipo; se presente'],
  ['pe','Equipotenzialità accumulo','Conduttore, sezione e collegamento']
 ]},
 {id:'QAC',title:'Quadro AC / lato corrente alternata',fields:[
  ['sigla','Sigla quadro e modello','Es. QAC – marca/modello'],
  ['mt','Magnetotermico / magnetotermico differenziale','Marca/modello, poli, In, curva, potere di interruzione'],
  ['rcd','Protezione differenziale','Tipo AC/A/F/B, IΔn in mA, In e sigla; o integrata nel MTD'],
  ['spd','Scaricatore SPD AC','Tipo, marca/modello, Uc, Up e protezione; Non previsto'],
  ['generale','Altre protezioni o generale','Sezionatore, contattore o interruttore generale, se installato']
 ]},
 {id:'RETE',title:'Punto di connessione alla rete',fields:[
  ['misuratore','Contatore / punto di connessione','Identificativo o descrizione, senza dati personali'],
  ['punto','Punto di innesto / quadro generale','Quadro, morsetti, dispositivo, caratteristiche'],
  ['interfaccia','Posizione protezione di interfaccia','Interna all’inverter oppure esterna: specificare']
 ]},
 {id:'PE',title:'Terra ed equipotenzialità',fields:[
  ['collegamento','Collegamento PE ai quadri e inverter','Percorso, origine, sigla conduttore'],
  ['sezione','Sezione conduttori PE ed equipotenziali','Sezione reale in mm², cavo / colore'],
  ['terra','Collegamento all’impianto di terra','Barra PE / dispersore / punto esistente identificato']
 ]}
];
const ROUTES=[
 {id:'st1dc',title:'Stringa FV1 → Quadro DC',a:'STRINGA FV1',b:'QUADRO DC'},
 {id:'st2dc',title:'Stringa FV2 → Quadro DC',a:'STRINGA FV2',b:'QUADRO DC',multi:true},
 {id:'dc1inv',title:'Quadro DC ST1 → Inverter',a:'QUADRO DC ST1',b:'INVERTER'},
 {id:'dc2inv',title:'Quadro DC ST2 → Inverter',a:'QUADRO DC ST2',b:'INVERTER',multi:true},
 {id:'invac',title:'Inverter → Quadro AC',a:'INVERTER',b:'QUADRO AC'},
 {id:'acgrid',title:'Quadro AC → Contatore / punto di rete',a:'QUADRO AC',b:'CONTATORE'},
 {id:'batinv',title:'Batterie ↔ Inverter',a:'BATTERIA ACCUMULO',b:'INVERTER',storage:true}
];
const norm=v=>String(v??'').toUpperCase().replace(/[^A-Z0-9]/g,'');
const isFV1=v=>/STRINGAFV1|STRINGA1|STRINGFV1/.test(norm(v));
const isFV2=v=>/STRINGAFV2|STRINGA2|STRINGFV2/.test(norm(v));
const isDC=v=>/QUADRODC|DCST[0-9]|QUADRODCS/.test(norm(v));
const isINV=v=>/INVERTER/.test(norm(v));
const isAC=v=>/QUADROAC|QUADROCA/.test(norm(v));
const isGrid=v=>/CONTATOR|RETE|PCC|PUNTOCONNESSIONE/.test(norm(v));
const isBattery=v=>/BATT|ACCUMUL/.test(norm(v));
function byRoute(id,from,to){
 const a=norm(from),b=norm(to),both=(f,g)=>(f(a)&&g(b))||(f(b)&&g(a));
 if(id==='st1dc')return both(isFV1,isDC);
 if(id==='st2dc')return both(isFV2,isDC);
 if(id==='dc1inv')return both(v=>isDC(v)&&(!/ST2/.test(v)),isINV);
 if(id==='dc2inv')return both(v=>isDC(v)&&/ST2/.test(v),isINV);
 if(id==='invac')return both(isINV,isAC);
 if(id==='acgrid')return both(isAC,isGrid);
 if(id==='batinv')return both(isBattery,isINV);
 return false;
}
const legacy=id=>(Array.isArray(state.vtLinks)?state.vtLinks:[])
 .filter(l=>(!l.category||l.category==='Fotovoltaico')&&byRoute(id,l.from,l.to));
const routeData=id=>details().routes[id]||{};
const confirmed=id=>routeData(id).status==='si';
const present=id=>confirmed(id)||(routeData(id).status!=='no'&&legacy(id).length>0);
const hasStorage=()=>/con accumulo/i.test(String(state.vtPvMode||''))||
 !!String(state.vtPvAccumulo||'').trim()||
 (Array.isArray(state.vtDevices)&&state.vtDevices.some(d=>/batteria|accumulo/i.test(d.type||'')));
const stringCount=()=>{
 const v=String(state.vtPvStringhe||'');
 const a=v.match(/(\d+)\s*string(?:a|e|he)\s*(?:da|di)\s*\d+\s*modul/i);
 return a?Number(a[1]):2;
};
const visibleRoutes=()=>ROUTES.filter(r=>(!r.multi||stringCount()>1)&&(!r.storage||hasStorage()));
function effective(id,k){
 const stored=routeData(id);
 if(!empty(stored[k]))return String(stored[k]).trim();
 if(k==='cable'){const old=legacy(id).map(l=>String(l.cable||'').trim()).filter(Boolean);return [...new Set(old)].join(' / ');}
 return '';
}
function issues(){
 if(!active())return [];
 const out=[];
 const board=details();
 for(const key of ['QDC','QAC']){
  const checks=key==='QDC'?['sigla','sez','fusibili','spd']:['sigla','mt','rcd','spd'];
  for(const field of checks)if(empty(get(key,field)))out.push(key+': '+(CATS.find(x=>x.id===key).fields.find(x=>x[0]===field)?.[1]||field));
 }
 for(const key of ['ST1',...(stringCount()>1?['ST2']:[])]){
  if(empty(get(key,'mppt')))out.push(key+': ingresso MPPT');
 }
 if(hasStorage())for(const field of ['topologia','sez','fusibile'])
  if(empty(get('BAT',field)))out.push('Accumulo: '+(CATS.find(x=>x.id==='BAT').fields.find(x=>x[0]===field)?.[1]||field));
 if(empty(get('PE','sezione')))out.push('Sezione del conduttore PE');
 for(const r of visibleRoutes()){
  const v=routeData(r.id);
  if(v.status!=='si'){out.push('Confermare il collegamento reale: '+r.title);continue;}
  if(empty(effective(r.id,'cable')))out.push('Indicare il cavo: '+r.title);
  if(empty(v.section))out.push('Indicare la sezione del cavo (mm²): '+r.title);
  if(empty(v.length))out.push('Indicare la lunghezza della tratta (m): '+r.title);
  if(!empty(v.section)&&!/^(\d+(?:[.,]\d+)?)(?:\s*[x×]\s*\d+(?:[.,]\d+)?)?$/.test(String(v.section).trim()))out.push('Sezione cavo non valida: '+r.title);
  if(!empty(v.length)&&!/^(\d+(?:[.,]\d+)?)$/.test(String(v.length).trim()))out.push('Lunghezza tratta non valida: '+r.title);
 }
 return out;
}
const entry=(group,key,label,placeholder)=>'<label>'+esc(label)+
 '<input type="text" value="'+esc(get(group,key))+'" placeholder="'+esc(placeholder||'')+
 '" onchange="vtPvBoards.set(&quot;'+group+'&quot;,&quot;'+key+'&quot;,this.value)"></label>';
const routeField=(id,key,label,placeholder)=>'<label>'+esc(label)+
 '<input type="text" value="'+esc(effective(id,key))+'" placeholder="'+esc(placeholder||'')+
 '" onchange="vtPvBoards.setRoute(&quot;'+id+'&quot;,&quot;'+key+'&quot;,this.value)"></label>';
function form(){
 if(!active())return '';
 const h=[];
 h.push('<div class="card"><h2>Compilazione quadri FV per schema unifilare automatico</h2>'+
 '<p class="muted">Compila solo caratteristiche effettivamente installate e verificate. Non vengono assegnati automaticamente valori di protezione, fusibili o sezioni cavo. Nei campi non pertinenti specifica «Non previsto» dopo verifica. I dati vanno direttamente nel disegno e nella legenda tecnica del fascicolo.</p>'+
 '<p><b>Pratica: '+esc(state.practiceNo||'—')+'</b> · '+esc(state.vtPvStringhe||'Stringhe da completare')+' · '+esc(state.vtPvInverter||'Inverter da specificare')+'</p></div>');
 for(const cat of CATS){
  if(cat.id==='ST2'&&stringCount()<2)continue;
  if(cat.id==='BAT'&&!hasStorage())continue;
  h.push('<div class="card"><h3>'+esc(cat.title)+'</h3><div class="grid">'+
    cat.fields.map(([key,label,placeholder])=>entry(cat.id,key,label,placeholder)).join('')+
    '</div></div>');
 }
 h.push('<div class="card"><h3>Tratte e collegamenti da riportare nello schema</h3>'+
 '<p class="muted">Per ogni collegamento seleziona «Presente e verificato» dopo aver controllato il percorso reale. Indica cavo, sezione e lunghezza. Le vecchie tratte già registrate rimangono disponibili come riferimento, ma non valgono automaticamente come conferma tecnica.</p>');
 for(const r of visibleRoutes()){
  const v=routeData(r.id);
  const old=legacy(r.id);
  const note=old.length?old.map(l=>[l.from+' → '+l.to,l.cable,l.note].filter(Boolean).join(' · ')).join(' / '):'Nessuna tratta precedente';
  h.push('<section class="verification-item"><h4>'+esc(r.title)+'</h4>'+
   '<div class="grid"><label>Stato del collegamento<select onchange="vtPvBoards.setRoute(&quot;'+r.id+'&quot;,&quot;status&quot;,this.value)">'+
   [['','Da verificare'],['si','Presente e verificato'],['no','Non presente nell’impianto']].map(([v0,title])=>
    '<option value="'+v0+'" '+((v.status||'')===v0?'selected':'')+'>'+esc(title)+'</option>').join('')+'</select></label>'+
   routeField(r.id,'cable','Tipo cavo / sigla','Es. H1Z2Z2-K oppure FS17')+
   routeField(r.id,'section','Sezione mm² (conduttori)','Es. 6 oppure 2x6')+
   routeField(r.id,'length','Lunghezza della tratta (m)','Es. 17,5')+
   routeField(r.id,'note','Identificazione cavi e altre note','Sigla, origine/destinazione, posa...')+
   '</div><p class="muted">Dati precedenti: '+esc(note)+'</p></section>');
 }
 h.push('<div class="actions"><button type="button" onclick="save(true)">Salva quadri e collegamenti</button>'+
 '<button type="button" class="secondary" onclick="goStep(9)">Vai allo schema unifilare</button></div></div>');
 return h.join('');
}
function summaryHTML(print=false){
 if(!active())return '';
 const classes=print?'print-section vt-fv-details':'card';
 let out='<section class="'+classes+'"><h2>Dettagli quadri e collegamenti FV · '+esc(state.practiceNo||'')+'</h2>'+
 '<p class="muted">Specifiche elettriche inserite dall’operatore. Le sigle e le caratteristiche devono corrispondere a progetto, componenti e installazione reale.</p>';
 for(const cat of CATS){
  if((cat.id==='ST2'&&stringCount()<2)||(cat.id==='BAT'&&!hasStorage()))continue;
  out+='<h3>'+esc(cat.title)+'</h3><table class="table"><tbody>'+
   cat.fields.map(([key,label])=>'<tr><th style="width:38%;text-align:left">'+esc(label)+'</th><td>'+esc(get(cat.id,key)||'Da specificare')+'</td></tr>').join('')+
   '</tbody></table>';
 }
 out+='<h3>Cavi e tratte</h3><table class="table"><thead><tr><th>Collegamento</th><th>Stato</th><th>Cavo</th><th>Sezione mm²</th><th>m</th><th>Note</th></tr></thead><tbody>'+
 visibleRoutes().map(r=>{const x=routeData(r.id);const status=x.status==='si'?'Verificato':x.status==='no'?'Non presente':legacy(r.id).length?'Registrato, da verificare':'Da verificare';
 return '<tr><td>'+esc(r.title)+'</td><td>'+esc(status)+'</td><td>'+esc(effective(r.id,'cable')||'—')+'</td>'+
 '<td>'+esc(x.section||'—')+'</td><td>'+esc(x.length||'—')+'</td><td>'+esc(x.note||'—')+'</td></tr>';}).join('')+
 '</tbody></table></section>';
 return out;
}
const previousCircuits=circuits;
circuits=function(){return active()?form()+previousCircuits():previousCircuits();};
const oldUnifilar=unifilar;
unifilar=function(){return active()?oldUnifilar()+summaryHTML(false):oldUnifilar();};
const oldPrintPart=printPart;
printPart=function(id){if(!active()||id!=='unifilar')return oldPrintPart(id);
 return oldPrintPart(id)+(state.vtPvPrintDetails===true?summaryHTML(true):'');
};
window.vtPvBoards={
 get,details,present,confirmed,effective,issues,summaryHTML,
 set(group,key,value){
  if(!active()||state.vtPro?.locked)return;
  const cat=CATS.find(x=>x.id===group);
  if(!cat||!cat.fields.some(x=>x[0]===key))return;
  const d=details();
  d.sections[group]=d.sections[group]||{};
  d.sections[group][key]=String(value);
  save(false);
 },
 setRoute(id,key,value){
  if(!active()||state.vtPro?.locked)return;
  if(!ROUTES.some(r=>r.id===id)||!['status','cable','section','length','note'].includes(key))return;
  const d=details();d.routes[id]=d.routes[id]||{};
  d.routes[id][key]=String(value);
  save(false);
 },
 svgRows(section,max=3){
  const cat=CATS.find(x=>x.id===section);
  if(!cat)return [];
  return cat.fields.filter(x=>!empty(get(section,x[0]))).slice(0,max).map(([k,label])=>label+': '+get(section,k));
 },
 routeLabel(id){
  const x=routeData(id);
  const parts=[effective(id,'cable'),x.section?x.section+' mm²':'',x.length?x.length+' m':''];
  return parts.filter(Boolean).join(' · ')||'Cavo/tratta da specificare';
 }
};
})();