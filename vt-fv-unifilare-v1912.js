/* Vimer Tek Di.Co. 37/08 — Schema unifilare FV generato dai dati della pratica.
   Rappresentazione elettrica a blocchi con rami di stringa distinti.
   Lo stato "verificato" richiede l'azione esplicita del responsabile tecnico.
   Non sostituisce il progetto professionale quando richiesto. */
(function(){
'use strict';
const fvActive=()=>state.doc==='Di.Co.'&&state.installationType==='Fotovoltaico';
const FIELDS=['vtPvNmoduli','vtPvWpModulo','vtPvStringhe','vtPvModuli','vtPvInverter',
 'vtPvPotenzaInverter','vtPvAccumulo','vtPvAccumuloKwh','vtPvDc','vtPvAc',
 'vtPvInterfaccia','vtPvTerra','vtPvRete','vtPvMode','vtPvDoc','vtSchemaRif',
 'vtPvMppt','vtPvDcProtectionDetail','vtPvAcProtectionDetail','vtPvBatteryProtectionDetail'];
const escXml=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const cut=(v,n=50)=>{const s=String(v??'').trim();return s.length>n?s.slice(0,n-1)+'…':s||'Da specificare';};
const number=v=>Number(String(v??'').trim().replace(',','.'));
const lines=()=>Array.isArray(state.vtLinks)?state.vtLinks.filter(x=>!x.category||x.category==='Fotovoltaico'):[];
const devices=()=>Array.isArray(state.vtDevices)?state.vtDevices.filter(x=>!x.category||x.category==='Fotovoltaico'):[];
const name=v=>String(v||'').toUpperCase().replace(/[^A-Z0-9]/g,'');
const strName=(v,i)=>['STRINGAFV'+i,'STRINGA'+i,'STRINGFV'+i].some(k=>name(v).includes(k));
const dc=v=>/QUADRODC|DCST[0-9]|QUADRODCS/.test(name(v));
const ac=v=>/QUADROAC|QUADROCA/.test(name(v));
const inverter=v=>/INVERTER/.test(name(v));
const battery=v=>/BATT|ACCUMUL/.test(name(v));
const network=v=>/CONTATOR|RETE|PCC|PUNTOCONNESSIONE/.test(name(v));
function hasConnection(a,b){
 return lines().some(l=>(a(l.from)&&b(l.to))||(b(l.from)&&a(l.to)));
}
function stringData(){
 const description=String(state.vtPvStringhe||'');
 const m=description.match(/(\d+)\s*string(?:a|e|he)\s*(?:da|di)\s*(\d+)\s*modul/i);
 const alt=description.match(/(\d+)\s*[x×]\s*(\d+)\s*modul/i);
 const hit=m||alt;
 return {count:hit?Number(hit[1]):0,each:hit?Number(hit[2]):0};
}
function hasStorage(){
 return /con accumulo/i.test(state.vtPvMode||'')||
 !!String(state.vtPvAccumulo||'').trim()||
 devices().some(d=>/batteria|accumulo/i.test(d.type||''));
}
function fingerprint(){
 return JSON.stringify({
  tipo:state.installationType,doc:state.doc,
  fields:FIELDS.map(k=>String(state[k]??'')),
  connections:lines(),components:devices()
 });
}
function isReviewed(){
 return fvActive()&&state.vtPvSchemaValidated==='Si'&&
  state.vtPvSchemaFingerprint===fingerprint()&&issues().length===0;
}
function issues(){
 const missing=[];
 const required=(label,k)=>{if(!String(state[k]??'').trim())missing.push(label);};
 required('Numero moduli FV','vtPvNmoduli');
 required('Potenza e modello dei moduli','vtPvModuli');
 required('Potenza nominale singolo modulo','vtPvWpModulo');
 required('Configurazione delle stringhe','vtPvStringhe');
 required('Marca e modello inverter','vtPvInverter');
 required('Dati quadro e protezioni DC','vtPvDc');
 required('Dati quadro e protezioni AC','vtPvAc');
 required('Punto di connessione AC / rete','vtPvRete');
 required('Terra ed equipotenzialità','vtPvTerra');
 required('Protezione di interfaccia (indicare se integrata)','vtPvInterfaccia');
 required('Assegnazione delle stringhe agli ingressi MPPT','vtPvMppt');
 required('Caratteristiche delle protezioni/sezionatori del quadro DC','vtPvDcProtectionDetail');
 required('Caratteristiche delle protezioni del quadro AC','vtPvAcProtectionDetail');
 if(hasStorage()){
  required('Protezioni e cablaggio del sistema di accumulo','vtPvBatteryProtectionDetail');
  required('Batterie: modello','vtPvAccumulo');
  required('Batterie: capacità','vtPvAccumuloKwh');
 }
 const sd=stringData(),n=number(state.vtPvNmoduli),wp=number(state.vtPvWpModulo);
 if(!Number.isFinite(n)||n<=0||!Number.isInteger(n)||!Number.isFinite(wp)||wp<=0)
  missing.push('Quantità e potenza dei moduli non valide');
 if(!sd.count||!sd.each)missing.push('Precisare le stringhe (es. 2 stringhe da 7 moduli)');
 if(sd.count*sd.each!==n&&sd.count>0&&n>0)missing.push('Numero moduli non coerente con la configurazione delle stringhe');
 if(sd.count>2)missing.push('Più di 2 stringhe: dettagliare la topologia con un elaborato specialistico');
 if(!devices().some(x=>/modulo fotovoltaico/i.test(x.type||'')))missing.push('Moduli FV non registrati nei materiali');
 if(!devices().some(x=>/inverter/i.test(x.type||'')))missing.push('Inverter non registrato nei materiali');
 if(!lines().length)missing.push('Collegamenti FV non registrati');
 for(let k=1;k<=Math.min(sd.count,2);k++){
  if(!lines().some(l=>strName(l.from,k)&&dc(l.to)||dc(l.from)&&strName(l.to,k)))
   missing.push('Manca collegamento stringa FV'+k+' → quadro DC');
 }
 if(!hasConnection(dc,inverter))missing.push('Manca collegamento quadro DC → inverter');
 if(!hasConnection(inverter,ac))missing.push('Manca collegamento inverter → quadro AC');
 if(!hasConnection(ac,network))missing.push('Manca collegamento quadro AC → punto di connessione / contatore');
 if(hasStorage()&&!hasConnection(inverter,battery))missing.push('Manca collegamento inverter ↔ accumulo');
 return [...new Set(missing)];
}
function deviceLine(re){
 const d=devices().find(x=>re.test(x.type||''));
 return d?[d.brand,d.model].filter(Boolean).join(' / '):'';
}
function describeLink(fn){
 const selection=lines().filter(fn);
 const cables=[...new Set(selection.map(l=>String(l.cable||'').trim()).filter(Boolean))];
 const tracts=[...new Set(selection.map(l=>String(l.note||'').trim()).filter(Boolean))];
 return [cables.length?'Cavo: '+cut(cables.join(' / '),45):'Cavo da indicare',
         tracts.length?'Tratte/note: '+cut(tracts.join(' / '),45):'Tratta da indicare'];
}
const textAt=(x,y,value,size=15,color='#17283c',weight='normal',anchor='start')=>
 '<text x="'+x+'" y="'+y+'" font-family="Arial,Helvetica,sans-serif" font-size="'+size+
 '" fill="'+color+'" font-weight="'+weight+'" text-anchor="'+anchor+'">'+escXml(value)+'</text>';
const link=(x1,y1,x2,y2,color='#344358',dash='')=>
 '<path d="M'+x1+' '+y1+' L'+x2+' '+y2+'" fill="none" stroke="'+color+
 '" stroke-width="3"'+(dash?' stroke-dasharray="'+dash+'"':'')+'/>';
// Un collegamento non documentato non si rappresenta come conduttore confermato.
const wire=(x1,y1,x2,y2,color,documented)=>
 link(x1,y1,x2,y2,documented?color:'#969da6',documented?'':'9 7');
function box(x,y,w,h,heading,rows,border='#34485d',color='#f3f7fb'){
 let out='<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" rx="9" fill="white" stroke="'+border+'" stroke-width="2"/>'+
 '<rect x="'+x+'" y="'+y+'" width="'+w+'" height="37" rx="9" fill="'+color+'"/>'+
 textAt(x+14,y+26,heading,18,border,'bold');
 const max=w>300?56:28;
 rows.slice(0,4).forEach((t,i)=>out+=textAt(x+13,y+57+18*i,cut(t,max),14,'#273747'));
 return out;
}
function svg(){
 const sd=stringData(),n=number(state.vtPvNmoduli),wp=number(state.vtPvWpModulo);
 const kWp=n>0&&wp>0?(n*wp/1000).toLocaleString('it-IT',{maximumFractionDigits:3}):'—';
 const invPower=String(state.vtPvPotenzaInverter||'—');
 const model=state.vtPvModuli||'Modello da specificare';
 const pvDescription=state.vtPvStringhe||'Configurazione da indicare';
 const dcProduct=deviceLine(/quadro dc|sezionatore/i);
 const acProduct=deviceLine(/quadro ac/i);
 const inverterProduct=deviceLine(/inverter/i);
 const batProduct=deviceLine(/batteria|accumulo/i);
 const s1=describeLink(l=>strName(l.from,1)&&dc(l.to)||dc(l.from)&&strName(l.to,1));
 const s2=describeLink(l=>strName(l.from,2)&&dc(l.to)||dc(l.from)&&strName(l.to,2));
 const dcLine=describeLink(l=>dc(l.from)&&inverter(l.to)||inverter(l.from)&&dc(l.to));
 const acLine=describeLink(l=>ac(l.from)&&network(l.to)||network(l.from)&&ac(l.to));
 const checked=isReviewed();
 const hasS1=lines().some(l=>(strName(l.from,1)&&dc(l.to))||(dc(l.from)&&strName(l.to,1)));
 const hasS2=lines().some(l=>(strName(l.from,2)&&dc(l.to))||(dc(l.from)&&strName(l.to,2)));
 const hasDCtoINV=hasConnection(dc,inverter);
 const hasINVtoAC=hasConnection(inverter,ac);
 const hasACtoGrid=hasConnection(ac,network);
 const hasStorageLink=hasConnection(inverter,battery);
 let h='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1195" width="100%" role="img" aria-label="Schema unifilare fotovoltaico automatico" style="display:block;width:100%;height:auto;background:white">'+
 '<rect x="2" y="2" width="996" height="1191" fill="white" stroke="#1b3045" stroke-width="3"/>'+
 '<rect x="12" y="12" width="976" height="112" fill="#f5f8fb"/>'+
 textAt(36,50,'SCHEMA UNIFILARE · IMPIANTO FOTOVOLTAICO',26,'#17283c','bold')+
 textAt(36,83,'Pratica: '+(state.practiceNo||'—')+'   |   Campo FV: '+kWp+' kWp   |   Inverter: '+invPower+' kW',16)+
 textAt(36,108,checked?'REVISIONE TECNICA CONFERMATA · '+(state.vtPvSchemaValidatedOn||''):'GENERATO DAI DATI · DA VERIFICARE',15,checked?'#0f6842':'#ac4b06','bold');
 // DC string runs are represented separately; never create an unverified parallel connection.
 h+=wire(250,306,250,337,'#b5222d',hasS1)+wire(250,337,388,337,'#b5222d',hasS1)+wire(388,337,388,365,'#b5222d',hasS1);
 if(sd.count>=2)h+=wire(750,306,750,337,'#b5222d',hasS2)+wire(750,337,612,337,'#b5222d',hasS2)+wire(612,337,612,365,'#b5222d',hasS2);
 h+=wire(388,492,388,536,'#b5222d',hasDCtoINV);
 if(sd.count>=2)h+=wire(612,492,612,536,'#b5222d',hasDCtoINV);
 h+=wire(500,676,500,755,'#18548b',hasINVtoAC);
 h+=wire(500,871,500,945,'#18548b',hasACtoGrid);
 if(hasStorage()){
  h+=wire(714,608,750,608,'#8b5fa8',hasStorageLink);
  if(hasStorageLink)h+='<path d="M719 600 L711 608 L719 616 M744 600 L752 608 L744 616" fill="none" stroke="#8b5fa8" stroke-width="2.6"/>';
 }
 // PE/equipotential connections are schematic and must be checked on site.
 h+=link(172,425,172,821,'#378065','9 7')+
    link(172,425,290,425,'#378065','9 7')+
    link(172,603,285,603,'#378065','9 7')+
    link(172,815,285,815,'#378065','9 7');
 h+=box(45,174,410,132,'STRINGA FV1',[
   sd.count?String(sd.each)+' moduli · '+cut(model,42):pvDescription,
   'Potenza modulo: '+(wp>0?wp+' Wp':'da indicare'),
   s1[0],s1[1]
 ],'#a9222a','#fcecef');
 h+=box(545,174,410,132,sd.count>=2?'STRINGA FV2':'SECONDO INGRESSO DC (DA VERIFICARE)',[
   sd.count>=2?String(sd.each)+' moduli · '+cut(model,42):'Stringa non dichiarata',
   'Totale stringhe: '+(sd.count||'da indicare'),
   s2[0],s2[1]
 ],'#a9222a','#fcecef');
 h+=box(290,365,420,127,'QUADRO DC / SEZIONAMENTO',[
   dcProduct?'Apparato: '+dcProduct:'Apparato: da identificare',
   state.vtPvDcProtectionDetail||state.vtPvDc||'Protezioni DC: da indicare',
   'Percorsi DC distinti · MPPT da verificare'
 ],'#a9222a','#fcecef');
 h+=box(285,536,430,140,'INVERTER / CONVERSIONE DC-AC',[
   state.vtPvInverter||'Marca / modello da indicare',
   'Potenza AC nominale: '+invPower+' kW',
   state.vtPvMppt?'Ingressi: '+state.vtPvMppt:'Ingressi MPPT da indicare',
   dcLine[0]
 ],'#254b77','#edf3ff');
 if(hasStorage())h+=box(750,552,223,113,'ACCUMULO',[
   state.vtPvAccumulo||batProduct||'Batterie da definire',
   'Capacità: '+(state.vtPvAccumuloKwh||'—')+' kWh',
   state.vtPvBatteryProtectionDetail||'Protezioni: da indicare'
 ],'#7652a0','#f4effa');
 h+=box(285,755,430,116,'QUADRO AC / PROTEZIONI',[
   acProduct?'Apparato: '+acProduct:'Apparato: da identificare',
   state.vtPvAcProtectionDetail||state.vtPvAc||'Protezioni AC: da indicare',
   acLine[0]
 ],'#235b86','#eaf4ff');
 h+=box(285,945,430,106,'PUNTO DI CONNESSIONE / RETE',[
   state.vtPvRete||'Sistema e punto di connessione da indicare',
   'Interfaccia: '+(state.vtPvInterfaccia||'da specificare'),
   acLine[1]
 ],'#2b5d75','#eaf6f8');
 h+=box(35,562,237,108,'PE / EQUIPOTENZIALITÀ',[
   'Collegamenti da verificare',
   state.vtPvTerra||'Dati terra da inserire'
 ],'#397a60','#effaf3');
 h+=textAt(40,1093,'DC: rosso   •   AC: blu   •   Accumulo: viola   •   PE: verde tratteggiato',14,'#34475c');
 h+=textAt(40,1112,'Grigio tratteggiato = collegamento NON registrato nella pratica',13,'#686e77');
 h+=textAt(40,1127,'Rif.: '+(state.vtSchemaRif||('FV-'+(state.practiceNo||'da numerare'))),14);
 h+=textAt(40,1155,'Collegamenti e dispositivi da confrontare con l’impianto effettivamente realizzato.',13,'#5b6877');
 h+=textAt(600,1127,'DIRETTORE TECNICO',14,'#25374b','bold');
 h+=textAt(600,1152,cut(state.technician||'Da compilare',35),14);
 h+=link(600,1176,956,1176,'#25374b');
 h+='</svg>';
 return h;
}
function detailInput(label,key){
 return '<label>'+escXml(label)+'<input type="text" value="'+escXml(state[key]||'')+
 '" onchange="vtPvUnifilar.edit(&quot;'+key+'&quot;,this.value)" placeholder="Riportare dati reali, non ipotesi"></label>';
}
const oldUnifilar=unifilar;
unifilar=function(){
 if(!fvActive())return oldUnifilar();
 const missing=issues(),checked=isReviewed();
 const note=checked?'Schema revisionato il '+escXml(state.vtPvSchemaValidatedOn||'—')+
  '. Ogni modifica tecnica richiede una nuova revisione.':
  'Schema generato automaticamente: non validato. Le connessioni non registrate non possono essere considerate accertate.';
 const t=lines();
 const table=t.length?'<table class="table"><thead><tr><th>Origine</th><th>Destinazione</th><th>Cavo</th><th>Note</th></tr></thead><tbody>'+
 t.map(x=>'<tr><td>'+escXml(x.from)+'</td><td>'+escXml(x.to)+'</td><td>'+escXml(x.cable)+'</td><td>'+escXml(x.note)+'</td></tr>').join('')+
 '</tbody></table>':'<p>Nessun collegamento registrato.</p>';
 return '<div class="card"><h2>Schema unifilare fotovoltaico automatico</h2>'+
 '<p class="muted">Elaborato A4 generato da moduli, stringhe, inverter, accumulo e collegamenti già registrati. Le linee grigie tratteggiate indicano collegamenti non registrati, non confermati. I due ingressi DC restano distinti finché non viene verificata la topologia reale.</p>'+
 '<p><b>Stato:</b> '+(checked?'Verificato dal responsabile tecnico':'Da verificare')+'. '+note+'</p>'+
 '<h3>Dati di protezione e collegamento da riportare nel disegno</h3><div class="grid">'+
 detailInput('Stringhe → ingressi MPPT effettivi','vtPvMppt')+
 detailInput('Sezionatori, SPD e altre protezioni DC: tipo e valori','vtPvDcProtectionDetail')+
 detailInput('Protezione AC: MT/MTD, differenziale, SPD: tipo e valori','vtPvAcProtectionDetail')+
 (hasStorage()?detailInput('Protezione e cablaggio dell’accumulo','vtPvBatteryProtectionDetail'):'')+
 '</div>'+
 '<div class="vt-pv-schema-preview" style="max-width:860px;margin:16px auto;border:1px solid #c7d0d9;border-radius:8px;overflow:hidden">'+svg()+'</div>'+
 (missing.length?'<h3>Da completare prima della validazione tecnica</h3><ul>'+missing.map(x=>'<li>'+escXml(x)+'</li>').join('')+'</ul>':'<p>Tutti i dati minimi per richiedere la revisione risultano compilati. La correttezza elettrica resta da controllare.</p>')+
 '<div class="actions"><button type="button" onclick="vtPvUnifilar.print()">Stampa solo schema / PDF</button>'+
 '<button type="button" class="secondary" onclick="vtPvUnifilar.download()">Scarica schema SVG</button>'+
 '<button type="button" class="secondary" onclick="vtPvUnifilar.validate()">Conferma verifica del responsabile tecnico</button>'+
 '<button type="button" class="secondary" onclick="vtPvUnifilar.reset()">Revoca verifica</button></div>'+
 '<p class="muted">Per correggere la configurazione torna su <b>Impianto</b>, <b>Frutti e materiali</b> e <b>Quadri e circuiti</b>. Dopo ogni modifica lo schema viene rigenerato e la revisione precedente non vale più.</p></div>'+
 '<div class="card"><h3>Collegamenti DC / AC utilizzati per generare lo schema</h3>'+table+'</div>';
};
const oldPrintPart=printPart;
printPart=function(id){
 if(!fvActive()||id!=='unifilar')return oldPrintPart(id);
 const check=isReviewed();
 return '<section class="print-section vt-unifilar-sheet"><h2>Schema unifilare fotovoltaico · '+escXml(state.practiceNo||'')+'</h2>'+
 '<div class="vt-unifilar-sheet-svg">'+svg()+'</div>'+
 '<p style="font-size:8pt;margin:2mm 0">Stato: '+(check?'revisionato dal responsabile tecnico':'DA VERIFICARE')+
 '. Rappresentazione automatica dei dati registrati; protezioni, sezioni, percorsi e connessioni richiedono confronto con impianto, schemi e progetto pertinenti.</p></section>';
};
const oldAvailable=availablePrintSections;
availablePrintSections=function(){
 return oldAvailable().map(([id,title])=>fvActive()&&id==='unifilar'?
  [id,'Schema unifilare fotovoltaico (A4)']:[id,title]);
};
const oldValidation=vtDicoDatiMancanti;
vtDicoDatiMancanti=function(){
 const missing=oldValidation();
 if(!fvActive())return missing;
 if(!isReviewed())missing.push('Schema unifilare fotovoltaico automatico da verificare e confermare nella sezione Unifilare');
 return [...new Set(missing)];
};
window.vtPvUnifilar={
 print(){printDocuments(['unifilar']);},
 edit(key,value){
  if(!fvActive()||!FIELDS.includes(key))return;
  state[key]=String(value);
  save(false);render();
 },
 download(){
  if(!fvActive())return;
  const blob=new Blob([svg()],{type:'image/svg+xml;charset=utf-8'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=url;
  a.download='Schema_Unifilare_FV_'+(state.practiceNo||'pratica')+'.svg';
  document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),15000);
 },
 validate(){
  if(!fvActive())return;
  const missing=issues();
  if(missing.length){alert('Non è possibile confermare lo schema. Completa prima:\n\n• '+missing.join('\n• '));return;}
  if(!confirm('Hai verificato personalmente topologia, separazione stringhe / MPPT, protezioni DC/AC, sezioni e percorsi dei cavi, accumulo, messa a terra e connessione rete rispetto all’impianto realizzato? Questa conferma non sostituisce progetto, verifiche o firma.'))return;
  if(!String(state.vtSchemaRif||'').trim())state.vtSchemaRif='UNIFILARE-FV-'+(state.practiceNo||'PRATICA');
  state.vtPvSchemaValidated='Si';
  state.vtPvSchemaValidatedOn=new Date().toISOString().slice(0,10);
  state.vtPvSchemaFingerprint=fingerprint();
  save(false);render();
 },
 reset(){
  if(!fvActive())return;
  state.vtPvSchemaValidated='';
  state.vtPvSchemaValidatedOn='';
  state.vtPvSchemaFingerprint='';
  save(false);render();
 }
};
})();