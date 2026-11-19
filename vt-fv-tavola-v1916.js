/* Vimer Tek: tavola FV integrata, topologia supportata 1/2 stringhe distinte.
   Simboli schematici, nessuna connessione o caratteristica inventata. */
(function(){
'use strict';
const e=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const val=(v,f='Da indicare')=>String(v??'').trim()||f;
const b=(g,k)=>window.vtPvBoards?.get(g,k)||'';
const nodes=()=>Array.isArray(state.vtQuadroDevices)?state.vtQuadroDevices.filter(d=>d.category==='FV'):[];
const routes=()=>state.vtPvBoardData?.routes||{};
const count=()=>Number(String(state.vtPvStringhe||'').match(/(\d+)\s*(?:string(?:a|e|he)|[x×])/i)?.[1]||0);
const storage=()=>/con accumulo/i.test(state.vtPvMode||'')||!!String(state.vtPvAccumulo||'').trim();
const pe=()=>state.vtPvUnifiedPE||{};
const ordered=(board,branches)=>branches.flatMap(branch=>nodes().filter(d=>d.board===board&&d.branch===branch));
const sets=()=>[
 {id:'DC1',list:ordered('QDC',['ST1',...(count()===1?['GEN']:[]),'DC1'])},
 {id:'DC2',list:count()===2?ordered('QDC',['ST2','DC2']):[]},
 {id:'AC',list:ordered('QAC',['INV','GEN','RETE'])},
 {id:'BAT',list:storage()?ordered('BAT',['BAT','GEN']):[]}
];
const keys={mt:['poles','rated','voltage','curve','breaking'],mtd:['poles','rated','voltage','curve','breaking','delta','rcdType'],rcd:['poles','rated','voltage','delta','rcdType'],spd:['poles','spdClass','uc','up'],sez:['poles','rated','voltage'],fus:['poles','rated','voltage','breaking','fuseType'],cont:['poles','rated','voltage'],other:['poles','rated','voltage']};
const typed=['poles','rated','voltage','curve','breaking','delta','rcdType','spdClass','uc','up','fuseType'];
const mixed=d=>typed.some(k=>!keys[d.type]?.includes(k)&&String(d[k]||'').trim());
const usable=d=>!mixed(d)&&Number(d.qty)===1&&['serie','derivazione'].includes(d.position)&&!(d.type==='spd'&&d.position!=='derivazione')&&(d.position!=='derivazione'||String(d.tapTarget||'').trim());
function issues(){
 const out=[],groups=sets(),assigned=new Set(groups.flatMap(g=>g.list));
 if(![1,2].includes(count()))out.push('Tavola unica: sono supportate una o due stringhe distinte; per altre topologie usare uno schema specialistico.');
 for(const d of nodes()){
  if(!assigned.has(d))out.push(d.tag+': assegnare il dispositivo a un ramo effettivo; il generale DC comune non può essere dedotto per due MPPT distinti.');
  if(d.position==='censimento')out.push(d.tag+': apparecchio solo censito; indicare il collegamento reale oppure escluderlo dal configuratore dello schema.');
  if(d.position==='derivazione'&&!String(d.tapTarget||'').trim())out.push(d.tag+': indicare la destinazione esatta della derivazione (PE, conduttori attivi, altro).');
  if(Number(d.qty)!==1)out.push(d.tag+': registrare separatamente ogni apparecchio per rappresentarne il collegamento.');
 }
 for(const g of groups)if(g.list.length>6)out.push(g.id+': massimo 6 dispositivi per ramo nella tavola unica attuale; occorre un elaborato più esteso.');
 for(const k of ['QDC','INV','QAC',...(storage()?['BAT']:[])]){
  if(!['si','no'].includes(pe()[k]))out.push('PE: specificare se il collegamento '+k+' → nodo PE è presente o non pertinente.');
 }
 if(!String(b('PE','terra')).trim())out.push('PE: identificare il nodo / impianto di terra.');
 if(!String(b('PE','sezione')).trim())out.push('PE: indicare la sezione dei conduttori.');
 return out;
}
const tx=(x,y,t,size=18,weight='normal',anchor='start',color='#192d40')=>'<text x="'+x+'" y="'+y+'" font-family="Arial,sans-serif" font-size="'+size+'" font-weight="'+weight+'" text-anchor="'+anchor+'" fill="'+color+'">'+e(t)+'</text>';
const line=(x,y,x2,y2,color='#24394c',dash='',width=3)=>'<path d="M'+x+' '+y+' L'+x2+' '+y2+'" stroke="'+color+'" stroke-width="'+width+'" fill="none"'+(dash?' stroke-dasharray="'+dash+'"':'')+'/>';
const rect=(x,y,w,h,stroke='#485d70',fill='white',dash='')=>'<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" stroke="'+stroke+'" stroke-width="2" fill="'+fill+'"'+(dash?' stroke-dasharray="'+dash+'"':'')+'/>';
function wrap(text,max=33){
 const s=String(text??'').trim(),out=[];let row='';
 for(const token of s.split(/\s+/)){let rest=token;while(rest.length>max){if(row){out.push(row);row='';}out.push(rest.slice(0,max));rest=rest.slice(max);}if(row&&row.length+rest.length+1>max){out.push(row);row='';}row+=(row?' ':'')+rest;}
 if(row)out.push(row);return out;
}
const multiline=(x,y,t,max=33,limit=3,size=16,anchor='start')=>{
 const rows=wrap(t,max);return rows.slice(0,limit).map((r,i)=>tx(x,y+i*(size+3),i===limit-1&&rows.length>limit?r.slice(0,-1)+'…':r,size,'normal',anchor)).join('');
};
const term=(x,y,c)=>'<circle cx="'+x+'" cy="'+y+'" r="4.5" fill="white" stroke="'+c+'" stroke-width="2.5"/>';
const earth=(x,y,c)=>line(x,y,x,y+13,c)+line(x-13,y+13,x+13,y+13,c)+line(x-8,y+19,x+8,y+19,c)+line(x-3,y+25,x+3,y+25,c);
const specs=d=>[d.poles,d.rated?d.rated+' A':'',d.curve?d.curve:'',d.breaking?d.breaking+' kA':'',d.delta?d.delta+' mA':'',d.rcdType?'tipo '+d.rcdType:'',d.spdClass,d.uc?'Uc '+d.uc+' V':'',d.up?'Up '+d.up+' kV':'',d.fuseType,d.voltage?d.voltage+' V':''].filter(Boolean).join(' · ');
const model=d=>[d.brand,d.model].filter(Boolean).join(' ');
const wire=(x,y,x2,y2,id,c)=>{const yes=routes()[id]?.status==='si';return line(x,y,x2,y2,yes?c:'#9199a2',yes?'':'9 6');};
const cable=(id)=>window.vtPvBoards?.routeLabel?.(id)||'Tratta da indicare';
const labelCable=(x,y,id,max=28,anchor='middle')=>multiline(x,y,cable(id),max,3,15,anchor);
function block(x,y,w,h,title,rows,c='#24394c'){
 let s=rect(x,y,w,h,c)+rect(x,y,w,35,c,'#eef2f5')+tx(x+12,y+24,title,19,'bold','start',c);
 let yy=y+58;for(const row of rows){const r=wrap(row,Math.floor((w-24)/8.5));for(const z of r.slice(0,2)){if(yy<y+h-6)s+=tx(x+12,yy,z,16);yy+=19;}}
 return s;
}
function symbol(x,y,d,c,vertical=false){
 let s='';const good=d.verified===true;
 const col=good?c:'#9199a2',dash=good?'':'5 4';
 if(d.type==='fus')s=rect(x-23,y-10,46,20,col,'white',dash)+line(x-23,y,x+23,y,col,dash,2);
 else if(d.type==='spd')s=rect(x-23,y-16,46,32,col,'white',dash)+tx(x,y+5,'SPD',12,'bold','middle',col);
 else {
  s=line(x-26,y,x-15,y,col,dash)+line(x+15,y,x+26,y,col,dash)+term(x-15,y,col)+term(x+15,y,col)+line(x-15,y,x+13,y-20,col,dash,2.5);
  if(['mt','mtd','rcd','cont','other'].includes(d.type)){
   s+=rect(x-25,y-32,50,24,col,'white',dash)+tx(x,y-15,({mt:'I>',mtd:'I> Δ',rcd:'Δ',cont:'K',other:'?'}[d.type]),13,'bold','middle',col);
  }
 }
 return vertical?'<g transform="rotate(90 '+x+' '+y+')">'+s+'</g>':s;
}
function drawPath(list,x1,x2,y,c,id){
 const n=Math.min(6,list.length),step=(x2-x1)/Math.max(1,n),slots=list.slice(0,n);
 let s='',last=x1;
 for(let i=0;i<n;i++){
  const d=slots[i],x=x1+step*(i+.5),ok=usable(d),series=ok&&d.position==='serie';
  if(series){s+=line(last,y,x-26,y,c)+symbol(x,y,d,c);last=x+26;}
  else if(ok&&d.position==='derivazione'){
   s+=line(x,y,x,y+27,c)+'<circle cx="'+x+'" cy="'+y+'" r="4" fill="'+c+'"/>'+symbol(x,y+48,d,c,true)+line(x,y+74,x,y+83,c);
   // The endpoint is declared independently, never guessed from device type.
   if(/^PE$/i.test(String(d.tapTarget).trim()))s+=earth(x,y+83,'#27836a');
   else s+=term(x,y+83,c);
   s+=multiline(x,y+115,d.tapTarget,Math.max(9,Math.floor(step/7.5)),2,12,'middle');
  }else{
   s+=rect(x-26,y-12,52,24,'#969da6','white','5 4')+tx(x,y+4,'?',14,'bold','middle','#747e87');
  }
  s+=multiline(x,y-53,val(d.tag),Math.max(8,Math.floor(step/8)),1,15,'middle');
  s+=multiline(x,y-36,specs(d),Math.max(8,Math.floor(step/7)),2,12,'middle');
  if(series)s+=multiline(x,y+25,model(d),Math.max(8,Math.floor(step/7)),2,12,'middle');
 }
 s+=line(last,y,x2,y,c);
 if(!list.length)s+=tx((x1+x2)/2,y-15,'Apparecchi da registrare / verificare',14,'normal','middle','#666f79');
 if(list.length>6)s+=tx((x1+x2)/2,y+145,'Altri apparecchi non rappresentati: '+(list.length-6),14,'bold','middle','#a23b22');
 return s;
}
function svg(reviewed){
 const dc='#a72c32',ac='#234f79',bat='#76529a',green='#27836a';
 const g=sets(),n=count(),wp=Number(String(state.vtPvWpModulo||'').replace(',','.')),tot=Number(String(state.vtPvNmoduli||'').replace(',','.'));
 const kWp=Number.isFinite(wp*tot)&&wp*tot>0?(wp*tot/1000).toLocaleString('it-IT',{maximumFractionDigits:3}):'—';
 let h='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1900 1120" width="100%" role="img" aria-label="Schema unifilare FV integrato" style="display:block;width:100%;height:auto;background:white">'+rect(2,2,1896,1116,'#25384a');
 h+=rect(16,16,1868,93,'#25384a','#f2f5f7')+tx(35,50,'VIMER TEK · SCHEMA UNIFILARE IMPIANTO FOTOVOLTAICO',30,'bold')+
 tx(35,81,'Pratica '+val(state.practiceNo)+'   |   Campo FV '+kWp+' kWp   |   Inverter '+val(state.vtPvPotenzaInverter)+' kW',20)+
 tx(1860,48,reviewed?'REVISIONE TECNICA '+val(state.vtPvSchemaValidatedOn):'DA VERIFICARE',18,'bold','end',reviewed?'#166444':'#ae4b20')+
 tx(1860,81,'Tavola U-01 · A3 · non in scala',17,'normal','end');
 // PV branch boxes, 2 DC lines never tied together.
 h+=block(25,160,215,126,'STRINGA FV1',[val(state.vtPvModuli),val(state.vtPvStringhe),val(b('ST1','mppt'))],dc);
 h+=rect(320,130,565,465,dc,'#fffdfd','8 5')+tx(335,153,'QDC · '+val(b('QDC','sigla')),19,'bold','start',dc);
 h+=tx(335,196,'Ramo FV1 → ingresso MPPT',16,'bold','start',dc);
 h+=wire(240,250,320,250,'st1dc',dc)+labelCable(280,202,'st1dc',13);
 h+=drawPath(g[0].list,320,885,250,dc,'DC1');
 h+=wire(885,250,1000,250,'dc1inv',dc)+labelCable(942,202,'dc1inv',14);
 if(n===2){
  h+=block(25,395,215,126,'STRINGA FV2',[val(state.vtPvModuli),val(state.vtPvStringhe),val(b('ST2','mppt'))],dc);
  h+=tx(335,431,'Ramo FV2 → ingresso MPPT',16,'bold','start',dc);
  h+=wire(240,485,320,485,'st2dc',dc)+labelCable(280,437,'st2dc',13);
  h+=drawPath(g[1].list,320,885,485,dc,'DC2');
  h+=wire(885,485,1000,485,'dc2inv',dc)+labelCable(942,437,'dc2inv',14);
 }
 h+=block(1000,178,230,387,'INVERTER DC / AC',[val(state.vtPvInverter),'Pnom '+val(state.vtPvPotenzaInverter)+' kW','Ingressi: '+val(b('INV','mppt')||state.vtPvMppt),'DC: '+val(b('INV','dc')),'Uscita AC: '+val(b('INV','ac')),'Interfaccia: '+val(b('INV','interfaccia')||state.vtPvInterfaccia)],ac);
 h+=term(1000,250,dc);if(n===2)h+=term(1000,485,dc);
 h+=rect(1305,200,525,342,ac,'#fcfdff','8 5')+tx(1320,225,'QAC · '+val(b('QAC','sigla')),18,'bold','start',ac);
 h+=wire(1230,350,1305,350,'invac',ac)+labelCable(1268,292,'invac',12);
 h+=drawPath(g[2].list,1305,1830,350,ac,'AC');
 // Connection point is below QAC to keep the output labelled without overlapping devices.
 h+=wire(1830,350,1850,350,'acgrid',ac)+wire(1850,350,1850,610,'acgrid',ac)+wire(1850,610,1710,610,'acgrid',ac);
 h+=labelCable(1748,576,'acgrid',20);
 h+=block(1390,602,320,160,'CONTATORE / RETE',[val(state.vtPvRete),'PCC: '+val(b('RETE','punto')),val(b('RETE','misuratore'))],ac);
 if(storage()){
  h+=block(25,671,240,150,'ACCUMULO',[val(state.vtPvAccumulo),val(state.vtPvAccumuloKwh)+' kWh',val(b('BAT','topologia'))],bat);
  h+=rect(320,635,565,222,bat,'#fefcff','8 5')+tx(335,660,'PROTEZIONI ACCUMULO · '+val(b('BAT','sez')),17,'bold','start',bat);
  h+=wire(265,745,320,745,'batinv',bat)+drawPath(g[3].list,320,885,745,bat,'BAT')+
   wire(885,745,1115,745,'batinv',bat)+wire(1115,745,1115,565,'batinv',bat)+labelCable(998,782,'batinv',26);
 }
 // PE endpoints are explicitly selected, no inference from free text.
 const peLine=(k,x,y)=>pe()[k]==='si'?line(x,y,x,920,green,'8 5',2.5)+'<circle cx="'+x+'" cy="920" r="4" fill="'+green+'"/>':'';
 h+=line(155,920,1620,920,green,'8 5',3)+earth(1620,920,green)+peLine('QDC',302,580)+peLine('INV',1200,565)+peLine('QAC',1320,542)+(storage()?peLine('BAT',155,821):'');
 if(pe().QDC==='si')h+=line(320,580,302,580,green,'8 5',2.5);
 h+=tx(35,895,'PE / NODO EQUIPOTENZIALE',18,'bold','start',green)+multiline(330,899,'Sezione: '+val(b('PE','sezione'))+' · Terra: '+val(b('PE','terra')),100,1,16);
 h+=tx(35,963,'Legenda: DC rosso · AC blu · accumulo viola · PE verde · grigio tratteggiato = tratta/dispositivo non confermato.',16)+
 tx(35,987,'Simboli schematici: sezionatore a contatto aperto · I> magnetotermico · Δ differenziale · F (rettangolo) fusibile · SPD in derivazione.',15)+
 tx(35,1011,'Incroci senza nodo non rappresentano una connessione. Verificare schema, caratteristiche e allegati rispetto al progetto applicabile.',15);
 const err=issues();if(err.length)h+=tx(35,1036,'Dati da completare / dispositivi non rappresentabili nel ramo: '+err.length+' · vedere avvisi nell’app.',16,'bold','start','#a23a20');
 h+=rect(20,1050,1860,54,'#25384a')+tx(34,1074,'Rif. '+val(state.vtSchemaRif||state.practiceNo),17,'bold')+
 tx(34,1094,'Schema generato dai dati dichiarati · non sostituisce il progetto ove prescritto.',14)+
 tx(1110,1074,'DIRETTORE TECNICO: '+val(state.technician),16,'bold')+line(1450,1092,1862,1092,'#25384a','',1.5);
 return h+'</svg>';
}
function panel(){
 return '<div class="card"><h3>Collegamenti equipotenziali nella tavola</h3><p class="muted">Seleziona soltanto i collegamenti PE effettivamente presenti. «Non pertinente» non equivale a un giudizio di conformità.</p><div class="grid">'+
 ['QDC','INV','QAC',...(storage()?['BAT']:[])].map(k=>'<label>'+({QDC:'Quadro DC',INV:'Inverter',QAC:'Quadro AC',BAT:'Accumulo'}[k])+' → nodo PE<select onchange="vtPvUnified.setPE(&quot;'+k+'&quot;,this.value)">'+[['','Da verificare'],['si','Presente, verificato'],['no','Non pertinente (verificato)']].map(([v,t])=>'<option value="'+v+'" '+((pe()[k]||'')===v?'selected':'')+'>'+t+'</option>').join('')+'</select></label>').join('')+'</div></div>';
}
window.vtPvUnified={svg,issues,panel,setPE(k,v){if(state.vtPro?.locked||!['QDC','INV','QAC','BAT'].includes(k)||!['','si','no'].includes(v))return;state.vtPvUnifiedPE={...pe(),[k]:v};state.vtPvSchemaValidated='';state.vtPvSchemaFingerprint='';save(false);render();}};
})();