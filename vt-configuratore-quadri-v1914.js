/* Vimer Tek Di.Co. 37/08 · Configuratore quadri FV e impianti elettrici.
   Niente valori presunti: ogni componente è verificato e posizionato dall'operatore. */
(function(){
'use strict';
const fv=()=>state.doc==='Di.Co.'&&state.installationType==='Fotovoltaico';
const enabled=()=>fv()||(state.doc==='Di.Co.'&&(!state.installationType||state.installationType==='Impianto elettrico'));
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const cut=(x,n=65)=>{const s=String(x??'');return s.length>n?s.slice(0,n-1)+'…':s;};
const types=[['mt','Magnetotermico'],['mtd','Magnetotermico differenziale'],['rcd','Differenziale'],['spd','Scaricatore SPD'],['sez','Sezionatore'],['fus','Fusibile'],['cont','Contattore'],['other','Altro apparecchio']];
const typeName=t=>types.find(x=>x[0]===t)?.[1]||'Apparecchio';
const placements=[['','Da definire'],['serie','In serie'],['derivazione','In derivazione'],['censimento','Solo censimento']];
const all=()=>{if(!Array.isArray(state.vtQuadroDevices))state.vtQuadroDevices=[];return state.vtQuadroDevices;};
const current=()=>all().filter(x=>x.category===(fv()?'FV':'ELETTRICO'));
const boards=()=>{
 if(fv())return [['QDC','Quadro DC'],['QAC','Quadro AC'],['BAT','Protezione accumulo']];
 const xs=Array.isArray(state.schemaBoards)?state.schemaBoards:[];
 return [['QG','Quadro generale'],...xs.map(x=>[String(x.id||x.name||''),String(x.name||x.id||'')]).filter(x=>x[0])];
};
const branches=b=>{
 if(fv()){
  if(b==='QDC')return [['ST1','Ingresso stringa FV1'],['ST2','Ingresso stringa FV2'],['DC1','Uscita MPPT 1'],['DC2','Uscita MPPT 2'],['GEN','Generale DC']];
  if(b==='BAT')return [['BAT','Linea batterie'],['GEN','Generale accumulo']];
  return [['INV','Ingresso inverter'],['RETE','Uscita verso rete'],['GEN','Generale AC']];
 }
 const items=Array.isArray(state.schemaItems)?state.schemaItems:(state.circuits||[]);
 return [['GEN','Generale'],...items.map(x=>String(x.name||'').trim()).filter(Boolean).map(x=>['C:'+x,'Circuito '+x])];
};
const boardLabel=b=>boards().find(x=>x[0]===b)?.[1]||b;
const branchLabel=(b,k)=>branches(b).find(x=>x[0]===k)?.[1]||k;
const get=(d,k)=>String(d?.[k]??'').trim();
let editingId='';
const editing=()=>current().find(x=>x.id===editingId)||null;
const fields=[
 ['tag','Sigla apparecchio','QF1 / ID1 / SPD1'],
 ['brand','Marca','Produttore'],
 ['model','Modello / codice','Codice di targa'],
 ['qty','Quantità','1'],
 ['poles','Poli','1P+N / 2P / 4P'],
 ['rated','Corrente nominale In (A)','20'],
 ['voltage','Tensione nominale (V)','230 AC / 1000 DC'],
 ['curve','Curva magnetotermico','C / B / D'],
 ['breaking','Potere di interruzione (kA)','6'],
 ['delta','IΔn differenziale (mA)','30 / 300'],
 ['rcdType','Tipo differenziale','A / F / B / AC'],
 ['spdClass','Classe SPD','T1 / T2 / T1+T2'],
 ['uc','SPD Uc / Ucpv (V)','275 / 1000'],
 ['up','SPD Up (kV)','Da scheda tecnica'],
 ['fuseType','Classe fusibile','gPV / gG / ...'],
 ['installation','Collegamento / PE / coordinamento','Da specificare realmente'],
 ['tapTarget','Destinazione derivazione (solo se in derivazione)','Es. PE, tra + e −, L-N, morsetti identificati'],
 ['notes','Note tecniche','Ubicazione, circuito, targa']
];
const commonFields=['tag','brand','model','qty','installation','tapTarget','notes'];
const specificFields={mt:['poles','rated','voltage','curve','breaking'],mtd:['poles','rated','voltage','curve','breaking','delta','rcdType'],rcd:['poles','rated','voltage','delta','rcdType'],spd:['poles','spdClass','uc','up'],sez:['poles','rated','voltage'],fus:['poles','rated','voltage','breaking','fuseType'],cont:['poles','rated','voltage'],other:['poles','rated','voltage']};
const applicable=(type,key)=>commonFields.includes(key)||(specificFields[type]||[]).includes(key);
const conflicts=d=>fields.filter(x=>!applicable(d.type,x[0])&&get(d,x[0])).map(x=>x[0]);
const opt=(k,label,value)=>'<option value="'+esc(k)+'"'+(k===value?' selected':'')+'>'+esc(label)+'</option>';
const sel=(k,label,vals,value)=>'<label>'+esc(label)+'<select data-vtdev="'+k+'">'+vals.map(x=>opt(x[0],x[1],value)).join('')+'</select></label>';
const inp=(k,label,placeholder,value,type)=>'<label data-vtdev-field="'+k+'"'+(applicable(type,k)?'':' hidden style="display:none"')+'>'+esc(label)+'<input data-vtdev="'+k+'" placeholder="'+esc(placeholder)+'" value="'+esc(value)+'"'+(applicable(type,k)?'':' disabled')+'></label>';
const btn=(label,action,id='',style='secondary')=>'<button type="button" class="'+style+'" data-vtdevice-action="'+action+'" data-id="'+esc(id)+'">'+esc(label)+'</button>';
const description=d=>[d.tag,[d.brand,d.model].filter(Boolean).join(' '),Number(d.qty)>1?'Quantità '+d.qty:'',d.poles?d.poles:'',d.rated?d.rated+' A':'',d.curve?'curva '+d.curve:'',d.breaking?d.breaking+' kA':'',d.delta?'IΔn '+d.delta+' mA':'',d.rcdType?'tipo '+d.rcdType:'',d.spdClass?'SPD '+d.spdClass:'',d.uc?'Uc/Ucpv '+d.uc+' V':'',d.up?'Up '+d.up+' kV':'',d.fuseType?'fusibile '+d.fuseType:'',d.voltage?d.voltage+' V':''].filter(Boolean).join(' · ');
function issues(){
 if(!enabled())return [];
 let results=[];
 for(const d of current()){
  const label=d.tag||typeName(d.type);
  if(!d.tag||!d.board||!d.branch)results.push(label+': identificazione quadro, ramo e sigla mancante');
  if(!d.position)results.push(label+': scegliere la posizione in serie / derivazione / solo elenco');
  if(conflicts(d).length)results.push(label+': caratteristiche di apparecchi diversi nella stessa scheda; separare i dispositivi e ricontrollare');
  if(!boards().some(x=>x[0]===d.board)||!branches(d.board).some(x=>x[0]===d.branch))results.push(label+': quadro o ramo non più disponibile');
  if(['mt','mtd'].includes(d.type)&&(!d.curve||!d.breaking))results.push(label+': curva o potere di interruzione da specificare');
  if(d.type==='spd'&&!d.up)results.push(label+': Up SPD da specificare');
  if(d.verified!==true)results.push(label+': verificare apparecchio e dati di targa');
  if(!d.brand||!d.model)results.push(label+': marca/modello mancanti');
  if(!/^[1-9][0-9]{0,2}$/.test(String(d.qty||'')))results.push(label+': quantità non valida');
  if(['mt','mtd','rcd','sez','fus','cont'].includes(d.type)&&(!d.poles||!d.rated))results.push(label+': poli o In mancanti');
  if(['rcd','mtd'].includes(d.type)&&(!d.delta||!d.rcdType))results.push(label+': tipo RCD o IΔn mancante');
  if(d.type==='spd'&&(!d.spdClass||!d.uc))results.push(label+': classe o Uc/Ucpv SPD mancante');
  if(d.type==='spd'&&d.position==='serie')results.push(label+': SPD registrato in serie: verifica la topologia e usa la derivazione pertinente');
  if(d.type==='fus'&&!d.fuseType)results.push(label+': classe fusibile mancante');
  if(d.position==='derivazione'&&!d.installation)results.push(label+': collegamento derivazione/PE da indicare');
  if((d.position==='serie'||fv()&&d.position==='derivazione')&&Number(d.qty)>1)results.push(label+': più dispositivi in serie: inserirli individualmente');
 }
 return results;
}
function form(){
 if(!enabled())return '';
 const d=editing()||{},brds=boards(),board=brds.some(x=>x[0]===d.board)?d.board:(brds[0]?.[0]||'QG');
 const br=branches(board),branch=br.some(x=>x[0]===d.branch)?d.branch:(br[0]?.[0]||'GEN');
 const old=(fv()&&Array.isArray(state.vtDevices)?state.vtDevices.filter(x=>!x.category||x.category==='Fotovoltaico'):[]);
 let h='<div class="card" id="vtdevice-configurator"><h2>Configuratore apparecchi dei quadri</h2>'+
 '<p class="muted">Registra quanti apparecchi sono effettivamente installati, scegli il quadro, il ramo e se sono in serie o in derivazione. L’ordine nel riepilogo determina l’ordine grafico sul ramo. Le protezioni vengono riportate nello schema e nel fascicolo.</p>'+
 '<h3>'+(editingId?'Modifica apparecchio':'Aggiungi apparecchio')+'</h3><div class="grid">'+
 sel('board','Quadro',brds,board)+sel('branch','Ramo / circuito',br,branch)+
 sel('type','Tipo di apparecchio',types,d.type||'mt')+sel('position','Posizione nello schema',placements,d.position||'')+
 fields.map(x=>inp(x[0],x[1],x[2],d[x[0]]||(x[0]==='qty'?'1':''),d.type||'mt')).join('')+'</div>'+
 (editingId&&conflicts(d).length?'<p role="alert" style="color:#a32920"><b>Attenzione:</b> questa vecchia scheda contiene dati di altri tipi di apparecchio: '+esc(conflicts(d).map(k=>fields.find(x=>x[0]===k)[1]+': '+d[k]).join(' · '))+'. Trascrivili nelle schede separate. Al salvataggio verranno conservati nello storico, non nel simbolo di questo apparecchio.</p>':'')+
 '<label style="display:flex;align-items:center;gap:10px;flex-wrap:nowrap"><input style="width:auto;flex:none" data-vtdev="verified" type="checkbox"'+(d.verified&&!conflicts(d).length?' checked':'')+'> Confermo di aver controllato le caratteristiche dell’apparecchio e la sua installazione</label>';
 if(editingId&&Array.isArray(d.previousMixedFields)&&d.previousMixedFields.length){
  h+='<details><summary>Storico dati separati dalla scheda</summary>'+d.previousMixedFields.map(x=>'<p>'+esc(Object.entries(x.fields||{}).map(([k,v])=>(fields.find(f=>f[0]===k)?.[1]||k)+': '+v).join(' · '))+'</p>').join('')+'</details>';
 }
 if(old.length){
  h+='<div class="grid"><label>Materiale già presente nella pratica<select id="vtdevice-material">'+opt('','Seleziona per copiare marca e modello','')+
  old.map((x,i)=>opt(String(i),[x.type,x.brand,x.model].filter(Boolean).join(' · '),'')).join('')+'</select></label>'+
  '<div class="actions">'+btn('Copia marca e modello','copyMaterial')+'</div></div>';
 }
 h+='<div class="actions">'+btn(editingId?'Salva modifiche':'+ Aggiungi apparecchio','save','','')+
 btn('Annulla / nuovo','cancel')+btn('Apri schema unifilare','openSchema')+'</div>'+
 '<p class="muted">SPD: scegliere «In derivazione» se corrisponde alla connessione reale. I campi non pertinenti possono restare vuoti; le grandezze non vengono mai assegnate dal programma.</p></div>';
 const rows=current().map(x=>'<tr><td><b>'+esc(x.tag)+'</b><div>'+esc(typeName(x.type))+'</div></td><td>'+esc(boardLabel(x.board))+'<div>'+esc(branchLabel(x.board,x.branch))+'</div></td><td>'+esc(description(x))+'</td><td>'+esc(placements.find(p=>p[0]===x.position)?.[1]||'Da definire')+'</td><td><div class="actions">'+btn('Modifica','edit',x.id)+btn('↑','up',x.id)+btn('↓','down',x.id)+btn('×','remove',x.id,'danger')+'</div></td></tr>').join('');
 h+='<div class="card"><h3>Dispositivi registrati ('+current().length+')</h3>'+
 (rows?'<div style="overflow-x:auto"><table class="table"><thead><tr><th>Sigla / tipo</th><th>Quadro / ramo</th><th>Caratteristiche</th><th>Collegamento</th><th>Azioni</th></tr></thead><tbody>'+rows+'</tbody></table></div>':'<p>Nessun apparecchio registrato nel configuratore.</p>')+
 (issues().length?'<p class="muted"><b>Da completare:</b> '+esc(issues().slice(0,8).join(' · '))+'</p>':'')+'</div>';
 return h;
}
function read(){
 const box=document.getElementById('vtdevice-configurator');if(!box)return null;
 const d={};for(const k of ['board','branch','type','position',...fields.map(x=>x[0]),'verified']){
  const el=box.querySelector('[data-vtdev="'+k+'"]');if(el)d[k]=k==='verified'?el.checked:String(el.value||'').trim();
 }
 return d;
}
function invalid(){state.vtPvSchemaValidated='';state.vtPvSchemaValidatedOn='';state.vtPvSchemaFingerprint='';state.schemaValidated='';state.schemaValidatedOn='';}
function locked(){if(state.vtPro?.locked){alert('Revisione chiusa: prima apri una nuova revisione modificabile.');return true;}return false;}
function uuid(){return window.crypto?.randomUUID?.()||('app'+Date.now().toString(36)+Math.random().toString(36).slice(2,9));}
const svgText=(x,y,v,size=15,bold=false)=>'<text x="'+x+'" y="'+y+'" font-size="'+size+'" font-family="Arial,sans-serif" font-weight="'+(bold?'bold':'normal')+'" fill="#253a51">'+esc(cut(v,78))+'</text>';
function diagram(){
 if(!enabled()||!current().length)return '';
 const groups=[];
 for(const d of current()){
  let g=groups.find(g=>g.board===d.board&&g.branch===d.branch);
  if(!g){g={board:d.board,branch:d.branch,items:[]};groups.push(g);}
  g.items.push(d);
 }
 const pages=[];
 for(const g of groups)for(let i=0;i<g.items.length;i+=5)pages.push({...g,items:g.items.slice(i,i+5),page:1+Math.floor(i/5),pages:Math.ceil(g.items.length/5)});
 return pages.map(g=>{
  const h=Math.max(300,170+g.items.length*120),cx=185;
  let s='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 940 '+h+'" width="100%" role="img" aria-label="Schema unifilare '+esc(boardLabel(g.board))+' '+esc(branchLabel(g.board,g.branch))+'" style="display:block;width:100%;height:auto">'+
  '<rect x="2" y="2" width="936" height="'+(h-4)+'" fill="white" stroke="#405466" stroke-width="2"/>'+
  '<rect x="15" y="15" width="910" height="44" fill="#edf2f7"/>'+
  svgText(28,44,boardLabel(g.board)+' · '+branchLabel(g.board,g.branch)+(g.pages>1?' · '+g.page+'/'+g.pages:''),23,true)+
  svgText(95,83,'Ingresso del ramo · verificare origine',13)+
  '<path d="M'+cx+' 96 V'+(h-60)+'" stroke="#264f75" stroke-width="3" fill="none"/>';
  g.items.forEach((d,i)=>{
   const y=138+i*120,p=conflicts(d).length?'':d.position;
   if(p==='serie'){
    s+='<rect x="'+(cx-38)+'" y="'+(y-27)+'" width="76" height="54" fill="white" stroke="#1e5579" stroke-width="3"/>'+
    '<path d="M'+(cx-22)+' '+(y+18)+' L'+(cx+22)+' '+(y-18)+'" stroke="#1e5579" stroke-width="3" fill="none"/>'+
    svgText(cx-8,y+7,d.type==='rcd'||d.type==='mtd'?'Δ':d.type==='fus'?'F':d.type==='sez'?'S':'Q',17,true);
   }else if(p==='derivazione'){
    s+='<path d="M'+cx+' '+y+' H315" fill="none" stroke="#19848b" stroke-width="3"/>'+
    '<circle cx="'+cx+'" cy="'+y+'" r="5" fill="#19848b"/>'+
    '<rect x="315" y="'+(y-26)+'" width="76" height="52" fill="white" stroke="#19848b" stroke-width="2.5"/>'+
    svgText(327,y+6,d.type==='spd'?'SPD':d.type==='fus'?'F':'DER',17,true);
    if(d.type==='spd')s+='<path d="M353 '+(y+27)+' v15 m-12 0 h24 m-19 5 h14 m-9 5 h4" stroke="'+(d.installation&&d.verified?'#16856b':'#949da8')+'"'+(d.installation&&d.verified?'':' stroke-dasharray="6 4"')+' stroke-width="2" fill="none"/>';
   }else{
    s+='<rect x="306" y="'+(y-25)+'" width="85" height="50" fill="#fafafa" stroke="#949da8" stroke-width="2" stroke-dasharray="7 5"/>'+
    svgText(314,y+4,p==='censimento'?'ELENCO':conflicts(d).length?'DATI MISTI':'NON DEF.',12);
   }
   s+=svgText(420,y-17,d.tag+' · '+typeName(d.type),16,true)+
    svgText(420,y+5,description(d).split(' · ').slice(0,4).join(' · '),13)+
    svgText(420,y+23,description(d).split(' · ').slice(4,8).join(' · '),12)+
    svgText(420,y+41,description(d).split(' · ').slice(8).join(' · '),12)+
    svgText(420,y+59,conflicts(d).length?'Separare le caratteristiche dei dispositivi':p==='serie'?'Dispositivo in serie':p==='derivazione'?'Dispositivo in derivazione':p==='censimento'?'Solo censimento':'Connessione non definita',12);
  });
  s+=svgText(95,h-26,'Uscita ramo · confrontare con lo schema dei collegamenti',13)+'</svg>';
  return '<section class="vt-quadri-schema" style="break-inside:avoid;margin:12px 0"><h3>'+esc(boardLabel(g.board))+' · '+esc(branchLabel(g.board,g.branch))+'</h3>'+s+'</section>';
 }).join('');
}
function table(){
 const rows=current().map(d=>'<tr><td>'+esc(boardLabel(d.board)+' / '+branchLabel(d.board,d.branch))+'</td><td>'+esc(d.tag)+'</td><td>'+esc(typeName(d.type))+'</td><td>'+esc(d.brand+' '+d.model)+'</td><td>'+esc([description(d),d.installation,d.tapTarget,d.notes].filter(Boolean).join(' · '))+'</td><td>'+esc(d.position||'Da definire')+'</td></tr>').join('');
 return '<section class="print-section"><h2>Dispositivi e protezioni registrati nei quadri</h2><p>Le caratteristiche sono dichiarate dall’installatore e devono corrispondere alle targhette ed al progetto applicabile.</p><table><thead><tr><th>Quadro / ramo</th><th>Sigla</th><th>Tipo</th><th>Marca / modello</th><th>Caratteristiche</th><th>Posizione</th></tr></thead><tbody>'+rows+'</tbody></table></section>';
}
const oldCircuits=circuits;
circuits=function(){
 const existing=oldCircuits();
 if(!enabled())return existing;
 return fv()?form()+existing:existing+form();
};
const oldUnifilar=unifilar;
unifilar=function(){return oldUnifilar()+(enabled()&&!fv()&&current().length?'<div class="card"><h2>Schema dispositivi e protezioni per ramo</h2><p class="muted">I simboli sono collocati solo nella posizione scelta, senza creare collegamenti fra rami non documentati.</p>'+diagram()+'</div>':'');};
const oldPrintPart=printPart;
printPart=function(id){
 const base=oldPrintPart(id);
 if(!enabled()||id!=='unifilar'||!current().length)return base;
 if(fv())return state.vtPvPrintDetails===true?base+table():base;
 return base+'<section class="print-section"><h2>Dettaglio protezioni dei quadri</h2>'+diagram()+'</section>'+table();
};
if(window.vtPvBoards){
 const oldIssues=window.vtPvBoards.issues;
 window.vtPvBoards.issues=function(){
  const r=oldIssues();if(!fv())return r;
  for(const [key,label] of [['QDC','quadro DC'],['QAC','quadro AC']]){
   const text=(key==='QDC'?state.vtPvDc:state.vtPvAc)||'';
   const materials=Array.isArray(state.vtDevices)?state.vtDevices:[];
   const relevant=String(text).toUpperCase().includes(key==='QDC'?'QUADRO DC':'QUADRO AC')||
      materials.some(x=>String(x.type||'').toUpperCase().includes(key==='QDC'?'QUADRO DC':'QUADRO AC'))||
      Object.values(state.vtPvBoardData?.sections?.[key]||{}).some(x=>String(x||'').trim());
   if(relevant&&!current().some(d=>d.board===key))r.push('Aggiungere dispositivi nel '+label);
  }
  // The operator has already declared these protections in the board sheets.
  // Do not guess part numbers or quantities: ask them to register individual devices.
  const required=[
   ['QDC','sez',['sez'],'sezionatore DC'],
   ['QDC','fusibili',['fus'],'fusibili DC'],
   ['QDC','spd',['spd'],'SPD DC'],
   ['QAC','mt',['mt','mtd'],'magnetotermico / MTD AC'],
   ['QAC','rcd',['rcd','mtd'],'differenziale AC'],
   ['QAC','spd',['spd'],'SPD AC']
  ];
  for(const [board,field,types,label] of required){
   const value=String(state.vtPvBoardData?.sections?.[board]?.[field]||'').trim();
   if(!value||/^(?:non previst[oi]|assent[ei]|non applicabile|nessun[oa]?)\b/i.test(value))continue;
   if(!current().some(d=>d.board===board&&types.includes(d.type)&&!conflicts(d).length&&['serie','derivazione'].includes(d.position)))
    r.push('Configuratore: registrare separatamente '+label+' dichiarato nella scheda '+board);
  }
  r.push(...issues());return [...new Set(r)];
 };
}
const api={
 issues,diagram,
 save(){
  if(locked())return;
  const d=read();if(!d)return;
  if(!boards().some(b=>b[0]===d.board)||!branches(d.board).some(b=>b[0]===d.branch))return alert('Seleziona un quadro e un ramo validi.');
  if(!types.some(x=>x[0]===d.type)||!d.tag)return alert('Indica tipo e sigla apparecchio.');
  if(d.type==='spd'&&d.position==='serie')return alert('Uno SPD non va rappresentato come dispositivo in serie nel ramo. Indica la derivazione effettiva oppure lascia Da definire.');
  if(!/^[1-9][0-9]{0,2}$/.test(d.qty||''))return alert('Quantità: inserisci un intero positivo.');
  if(current().some(x=>x.tag.toUpperCase()===d.tag.toUpperCase()&&x.id!==editingId))return alert('Sigla già utilizzata in questo configuratore.');
  const invalidKeys=conflicts(d);
  if(invalidKeys.length){
   if(!confirm('Sono presenti dati non pertinenti al tipo selezionato. Verranno conservati nello storico della scheda, ma non nello schema di questo apparecchio. Confermi? Registra separatamente gli altri apparecchi.'))return;
   const archived=Object.fromEntries(invalidKeys.map(k=>[k,d[k]]));
   d.previousMixedFields=[...(editing()?.previousMixedFields||[]),{date:new Date().toISOString(),fields:archived}];
   for(const k of invalidKeys)d[k]='';
   d.verified=false;
  }
  if(editingId){const i=all().findIndex(x=>x.id===editingId);if(i<0)return;all()[i]={...all()[i],...d};}
  else all().push({...d,id:uuid(),category:fv()?'FV':'ELETTRICO'});
  editingId='';invalid();save(false);render();
 },
 edit(id){if(locked())return;if(!current().some(x=>x.id===id))return;editingId=id;render();document.getElementById('vtdevice-configurator')?.scrollIntoView({behavior:'smooth',block:'start'});},
 cancel(){editingId='';render();},
 remove(id){if(locked())return;const d=current().find(x=>x.id===id);if(!d||!confirm('Eliminare '+d.tag+' dal configuratore?'))return;const i=all().findIndex(x=>x.id===id);if(i>=0)all().splice(i,1);if(editingId===id)editingId='';invalid();save(false);render();},
 move(id,n){
  if(locked())return;const a=all(),i=a.findIndex(x=>x.id===id);if(i<0)return;
  const d=a[i],idx=a.map((x,j)=>({x,j})).filter(o=>o.x.category===d.category&&o.x.board===d.board&&o.x.branch===d.branch).map(o=>o.j);
  const k=idx.indexOf(i),j=idx[k+n];if(j===undefined)return;[a[i],a[j]]=[a[j],a[i]];invalid();save(false);render();
 },
 typeChanged(){
  const root=document.getElementById('vtdevice-configurator');
  const type=root?.querySelector('[data-vtdev="type"]')?.value;
  if(!root||!type)return;
  for(const label of root.querySelectorAll('[data-vtdev-field]')){
   const shown=applicable(type,label.dataset.vtdevField);
   label.hidden=!shown;label.style.display=shown?'':'none';
   const el=label.querySelector('input');if(el)el.disabled=!shown;
  }
  const pos=root.querySelector('[data-vtdev="position"]');
  if(pos&&type==='spd'&&pos.value==='serie')pos.value='';
 },
 boardChanged(){
  const root=document.getElementById('vtdevice-configurator'),b=root?.querySelector('[data-vtdev="board"]')?.value,d=root?.querySelector('[data-vtdev="branch"]');
  if(!b||!d)return;d.innerHTML=branches(b).map(x=>opt(x[0],x[1],'')).join('');
 },
 copyMaterial(){
  if(locked()||!fv())return;
  const root=document.getElementById('vtdevice-configurator'),el=root?.querySelector('#vtdevice-material');if(!el||el.value==='')return alert('Seleziona un materiale.');
  const x=(state.vtDevices||[]).filter(x=>!x.category||x.category==='Fotovoltaico')[Number(el.value)];if(!x)return;
  const b=root.querySelector('[data-vtdev="brand"]'),m=root.querySelector('[data-vtdev="model"]');
  if(b&&!b.value)b.value=x.brand||'';if(m&&!m.value)m.value=x.model||'';
  const verified=root.querySelector('[data-vtdev="verified"]');if(verified)verified.checked=false;
  alert('Copia eseguita. Verifica che marca e modello corrispondano all’apparecchio prima di salvare.');
 }
};
window.vtQuadroConfigurator=api;
document.addEventListener('change',e=>{
 if(e.target?.matches?.('#vtdevice-configurator [data-vtdev="board"]'))api.boardChanged();
 if(e.target?.matches?.('#vtdevice-configurator [data-vtdev="type"]'))api.typeChanged();
 if(e.target?.matches?.('#vtdevice-configurator [data-vtdev]:not([data-vtdev="verified"])')){
  const v=document.querySelector('#vtdevice-configurator [data-vtdev="verified"]');if(v)v.checked=false;
 }
});
document.addEventListener('click',e=>{
 const el=e.target?.closest?.('[data-vtdevice-action]');if(!el)return;
 const a=el.dataset.vtdeviceAction,id=el.dataset.id;
 if(a==='save')api.save();else if(a==='edit')api.edit(id);else if(a==='cancel')api.cancel();
 else if(a==='remove')api.remove(id);else if(a==='up')api.move(id,-1);else if(a==='down')api.move(id,1);
 else if(a==='copyMaterial')api.copyMaterial();else if(a==='openSchema')goStep(9);
});
})();