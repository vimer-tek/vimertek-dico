/**
 * Vimer Tek Di.Co. 37/08 - firma grafica v1.9.7b
 * Modulo autonomo per firma con dito/mouse/pennino; non modifica app.js.
 * La firma disegnata è una rappresentazione grafica, non una firma digitale.
 */
import { PDFDocument } from 'pdf-lib';

const CSS = `
#vt-firma-panel{border-left:4px solid #cc1924;margin-bottom:18px}
#vt-firma-panel .vt-sign-btn{background:#aa202a;color:white;padding:11px 18px;border:0;border-radius:6px;cursor:pointer;font-weight:700}
#vt-firma-panel p{color:#57616a}
#vt-sign-dialog{border:0;border-radius:13px;box-shadow:0 20px 70px #0008;max-width:980px;width:min(96vw,980px);max-height:94vh;overflow:auto;padding:0;color:#1d2834;background:#fff;font:15px/1.45 Arial,sans-serif}
#vt-sign-dialog::backdrop{background:#0a1725b8}
#vt-sign-dialog *{box-sizing:border-box}
#vt-sign-dialog .vt-sign-head{padding:16px 22px;background:#1f2c39;color:white;display:flex;justify-content:space-between;align-items:center;gap:10px}
#vt-sign-dialog .vt-sign-head h2{margin:0;color:white;font-size:20px}
#vt-sign-dialog .vt-sign-head button{border:1px solid #ffffffaa;background:transparent;color:white;padding:5px 12px;font-size:20px;cursor:pointer}
#vt-sign-dialog .vt-sign-body{padding:18px 22px}
#vt-sign-dialog .vt-sign-tip{background:#f2f5f8;padding:10px 13px;border-left:3px solid #304f7b;border-radius:4px;margin:10px 0 16px}
#vt-sign-dialog .vt-sign-tabs{display:flex;gap:8px;flex-wrap:wrap;margin:15px 0}
#vt-sign-dialog .vt-sign-tabs button{background:#e9edf2;border:1px solid #cbd4de;color:#142638;padding:10px 14px;border-radius:5px;cursor:pointer}
#vt-sign-dialog .vt-sign-tabs button[aria-selected=true]{background:#a41f2b;color:white;border-color:#a41f2b}
#vt-sign-dialog .vt-sign-pane[hidden]{display:none}
#vt-sign-dialog label{display:block;margin:9px 0;font-weight:600}
#vt-sign-dialog input[type=file],#vt-sign-dialog input[type=number],#vt-sign-dialog select{display:block;max-width:100%;width:100%;padding:8px;font:inherit;margin:5px 0 10px;border:1px solid #b7c0c9;border-radius:5px;background:white;color:#18232e}
#vt-sign-dialog input[type=range]{width:100%;max-width:320px;vertical-align:middle}
#vt-sign-dialog button.vt-primary{background:#aa202a;color:white;padding:11px 16px;border:0;border-radius:5px;cursor:pointer}
#vt-sign-dialog button.vt-secondary{background:#263d57;color:white;padding:10px 14px;border:0;border-radius:5px;cursor:pointer}
#vt-sign-dialog button:disabled{opacity:.5;cursor:not-allowed}
#vt-sign-dialog .vt-sign-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}
#vt-sign-dialog .vt-sign-pad{border:1.5px dashed #83909d;border-radius:6px;background:#fff;touch-action:none;width:100%;height:150px;display:block;cursor:crosshair}
#vt-sign-dialog .vt-preview-wrap{position:relative;border:1px solid #99a6b4;display:inline-block;max-width:100%;line-height:0;cursor:crosshair;background:#fff}
#vt-sign-dialog .vt-preview-wrap canvas{max-width:100%;display:block}
#vt-sign-dialog .vt-marker{position:absolute;border:2px dashed #d1202c;background:#e3262722;pointer-events:none;display:none}
#vt-sign-dialog .vt-sign-status{margin:10px 0;padding:9px 12px;border-radius:5px;background:#eef4f9;color:#20364e;white-space:pre-wrap}
#vt-sign-dialog .vt-sign-status.vt-error{background:#fff0f0;color:#a10b17}
#vt-sign-dialog .vt-saved-item{display:flex;justify-content:space-between;gap:10px;align-items:center;border-bottom:1px solid #dce2e8;padding:10px 0;flex-wrap:wrap}
#vt-sign-dialog .vt-sign-small{color:#536171;font-size:13px}
@media(max-width:740px){#vt-sign-dialog .vt-sign-grid{grid-template-columns:1fr}#vt-sign-dialog .vt-sign-body{padding:13px}}
`;

let loadedFile = null;
let originalBytes = null;
let producedGraphic = null;
let previewDoc = null;
let selectedPage = 1;
let pageCount = 0;
let previewPageWidth = 595.28;
let locationRatio = { x: .64, y: .80 }; // dall'alto a sinistra
let hasDrawn = false;
let penDown = false;
let penCtx = null;
let dialog = null;

function byId(id) { return document.getElementById(id); }
function setStatus(message, error = false) {
  const e = byId('vt-sign-status');
  if (!e) return;
  e.textContent = message;
  e.classList.toggle('vt-error', error);
}
function getPractice() {
  try { return JSON.parse(localStorage.getItem('vt_dico') || '{}').practiceNo || 'Documento'; }
  catch { return 'Documento'; }
}
function cleanName(n) { return String(n).replace(/[^a-zA-Z0-9_.-]+/g, '_').slice(0, 100); }
function saveBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename;
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}
function getPdfFile() {
  return producedGraphic || (originalBytes ? new Blob([originalBytes], {type: 'application/pdf'}) : null);
}
function ensureUI() {
  if (!byId('vt-firma-css')) { const s = document.createElement('style'); s.id = 'vt-firma-css'; s.textContent = CSS; document.head.append(s); }
  if (byId('vt-sign-dialog')) return;
  dialog = document.createElement('dialog'); dialog.id = 'vt-sign-dialog';
  dialog.innerHTML = `
  <div class="vt-sign-head"><h2>Vimer Tek · Firma con dito o mouse</h2><button type="button" id="vt-sign-close" aria-label="Chiudi">×</button></div>
  <div class="vt-sign-body">
    <p class="vt-sign-tip"><b>Prepara il PDF:</b> da <b>Fascicolo</b> premi Stampa, scegli <b>Salva come PDF</b> e carica qui il file. Nessun documento viene inviato a server esterni.</p>
    <label for="vt-sign-pdf">PDF da firmare
      <input type="file" id="vt-sign-pdf" accept="application/pdf,.pdf">
    </label>
    <p id="vt-sign-file-info" class="vt-sign-small">Nessun PDF selezionato</p>
    <section class="vt-sign-pane" id="vt-pane-draw" role="tabpanel">
      <p class="vt-sign-small"><b>Firma grafica:</b> la firma tracciata viene inserita come immagine nel PDF e non costituisce automaticamente una firma digitale, qualificata o avanzata.</p>
      <label>Disegna la firma qui sotto (dito, mouse o pennino)
        <canvas id="vt-sign-pad" class="vt-sign-pad" aria-label="Area per disegnare la firma"></canvas>
      </label>
      <button type="button" id="vt-sign-clear" class="vt-secondary">Cancella firma</button>
      <div class="vt-sign-grid">
        <label>Pagina di riferimento
          <select id="vt-sign-page"><option value="1">1</option></select>
        </label>
        <label>Applica la firma
          <select id="vt-sign-scope">
            <option value="selected">Alla pagina selezionata</option>
            <option value="last">Solo all'ultima pagina</option>
            <option value="all-no-cover">A tutte le pagine dalla terza in poi</option>
          </select>
        </label>
      </div>
      <label>Larghezza della firma: <output id="vt-sign-size-output">45 mm</output>
        <input id="vt-sign-size" type="range" min="20" max="90" value="45" step="1">
      </label>
      <p class="vt-sign-small"><b>Posizione:</b> clicca o tocca l'anteprima nel punto dove vuoi inserire la firma. Verifica che non copra testi o timbri.</p>
      <div id="vt-preview-wrap" class="vt-preview-wrap"><canvas id="vt-sign-preview" width="440" height="620"></canvas><div id="vt-sign-marker" class="vt-marker"></div></div>
      <p><button type="button" id="vt-sign-graphic-download" class="vt-primary">Scarica PDF con firma grafica</button></p>
    </section>
    <div id="vt-sign-status" class="vt-sign-status" role="status">Pronto: carica un PDF.</div>
  </div>`;
  document.body.append(dialog);
  byId('vt-sign-close').onclick = () => dialog.close();
  byId('vt-sign-clear').onclick = clearPad;
  byId('vt-sign-pdf').onchange = handlePdf;
  byId('vt-sign-page').onchange = () => { selectedPage = Number(byId('vt-sign-page').value); renderPreview(); };
  byId('vt-sign-size').oninput = () => { byId('vt-sign-size-output').textContent = `${byId('vt-sign-size').value} mm`; updateMarker(); };
  byId('vt-preview-wrap').onclick = evt => {
    if (!loadedFile) return;
    const rect = byId('vt-sign-preview').getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    locationRatio = {x: Math.max(0, Math.min(.99, (evt.clientX - rect.left)/rect.width)), y: Math.max(0, Math.min(.99, (evt.clientY-rect.top)/rect.height))};
    updateMarker();
  };
  byId('vt-sign-graphic-download').onclick = createGraphicPdf;
  setupPad();
  dialog.addEventListener('close', () => { /* Mantieni i file soltanto in memoria fino alla riapertura. */ });
}
function setupPad() {
  const canvas = byId('vt-sign-pad');
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const cssWidth = Math.max(270, Math.round(canvas.getBoundingClientRect().width || 680));
  canvas.width = Math.round(cssWidth * dpr);
  canvas.height = Math.round(150 * dpr);
  penCtx = canvas.getContext('2d'); penCtx.scale(dpr, dpr); penCtx.strokeStyle = '#162a46'; penCtx.lineWidth = 2.7;
  penCtx.lineJoin = 'round'; penCtx.lineCap = 'round';
  function pos(e) {const rect = canvas.getBoundingClientRect();return {x: (e.clientX-rect.left)*cssWidth/rect.width,y:(e.clientY-rect.top)*150/rect.height};}
  canvas.onpointerdown = e => {e.preventDefault();penDown = true;canvas.setPointerCapture(e.pointerId);const p=pos(e);penCtx.beginPath();penCtx.moveTo(p.x,p.y);penCtx.lineTo(p.x+.05,p.y+.05);penCtx.stroke();hasDrawn=true;};
  canvas.onpointermove = e => {if(!penDown)return;e.preventDefault();const p=pos(e);penCtx.lineTo(p.x,p.y);penCtx.stroke();};
  canvas.onpointerup = canvas.onpointercancel = () => {penDown=false;};
}
function clearPad() {penCtx?.clearRect(0,0,byId('vt-sign-pad').width,byId('vt-sign-pad').height);hasDrawn = false;}
function getSignaturePng() {
  const c = byId('vt-sign-pad'); const ctx = c.getContext('2d', {willReadFrequently:true});
  const {width:w,height:h}=c; const image=ctx.getImageData(0,0,w,h).data;
  let left=w,top=h,right=-1,bottom=-1;
  for(let y=0;y<h;y++) for(let x=0;x<w;x++) if(image[(y*w+x)*4+3]>12){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}
  if(right<left)return null;
  const pad=12;left=Math.max(0,left-pad);top=Math.max(0,top-pad);right=Math.min(w-1,right+pad);bottom=Math.min(h-1,bottom+pad);
  const t=document.createElement('canvas');t.width=right-left+1;t.height=bottom-top+1;t.getContext('2d').drawImage(c,left,top,t.width,t.height,0,0,t.width,t.height);
  return t.toDataURL('image/png');
}
async function handlePdf(e) {
  const file=e.target.files?.[0];
  if (!file) return;
  if (!/\.pdf$/i.test(file.name)) {setStatus('Seleziona un file PDF.',true);return;}
  try {
    const ab=await file.arrayBuffer();
    const doc=await PDFDocument.load(ab);
    loadedFile=file; originalBytes=new Uint8Array(ab); producedGraphic=null;
    pageCount=doc.getPageCount(); selectedPage=pageCount;
    const select=byId('vt-sign-page');select.replaceChildren();
    for(let i=1;i<=pageCount;i++){const o=document.createElement('option');o.value=String(i);o.textContent=`Pagina ${i}`;select.append(o);}
    select.value=String(selectedPage);
    byId('vt-sign-file-info').textContent=`${file.name} · ${pageCount} pagine · ${(file.size/1024).toFixed(0)} KB`;
    setStatus('PDF caricato. Disegna la firma e scegli la posizione sulla pagina.');
    await renderPreview();
  } catch(err) {loadedFile=null;originalBytes=null;producedGraphic=null;setStatus('Impossibile aprire il PDF: '+String(err.message||err),true);}
}
async function getPdfJs() {
  const href=new URL('assets/pdf.min.mjs',document.baseURI).href;
  const mod=await import(/* @vite-ignore */ href);
  mod.GlobalWorkerOptions.workerSrc=new URL('assets/pdf.worker.min.mjs',document.baseURI).href;
  return mod;
}
async function renderPreview() {
  const cv=byId('vt-sign-preview');if(!cv)return;
  const ctx=cv.getContext('2d');ctx.clearRect(0,0,cv.width,cv.height);
  if(!originalBytes){ctx.fillStyle='#f0f3f5';ctx.fillRect(0,0,cv.width,cv.height);ctx.fillStyle='#455466';ctx.font='17px Arial';ctx.fillText('Carica un PDF per vedere la pagina',18,40);return;}
  try {
    const pdfjs=await getPdfJs();
    if(previewDoc){try{await previewDoc.destroy();}catch{}}
    previewDoc=await pdfjs.getDocument({data:originalBytes.slice(),useSystemFonts:true}).promise;
    const p=await previewDoc.getPage(selectedPage);
    const view=p.getViewport({scale:1});previewPageWidth=view.width;const scale=Math.min(1.45,690/view.width);
    const viewport=p.getViewport({scale});cv.width=Math.ceil(viewport.width);cv.height=Math.ceil(viewport.height);
    await p.render({canvasContext:cv.getContext('2d'),viewport}).promise;
    updateMarker();
  } catch(err) {
    cv.width=480;cv.height=680;
    const c=cv.getContext('2d');c.fillStyle='#fff';c.fillRect(0,0,cv.width,cv.height);
    c.fillStyle='#364558';c.font='16px Arial';c.fillText(`Pagina ${selectedPage} - Anteprima non disponibile`,14,38);
    c.font='13px Arial';c.fillText('La firma verrà applicata alle coordinate indicate.',14,65);
    updateMarker();
    setStatus('Anteprima PDF non disponibile. Il posizionamento deve essere verificato aprendo il PDF generato. '+String(err.message||''));
  }
}
function updateMarker() {
  const cv=byId('vt-sign-preview'),m=byId('vt-sign-marker');
  if(!cv||!m||!loadedFile){if(m)m.style.display='none';return;}
  const width=cv.getBoundingClientRect().width;
  const h=cv.getBoundingClientRect().height;
  const mm=Number(byId('vt-sign-size').value)||45;
  const w=Math.min(((mm/25.4)*72)/previewPageWidth*width,width*.9);
  const ratio=hasDrawn ? (()=>{const p=getSignaturePng();if(!p)return .28;return .28;})() : .28;
  const markerH=w*ratio;
  m.style.display='block';m.style.width=`${w}px`;m.style.height=`${markerH}px`;
  m.style.left=`${Math.max(0,Math.min(width-w,locationRatio.x*width))}px`;
  m.style.top=`${Math.max(0,Math.min(h-markerH,locationRatio.y*h))}px`;
}
async function createGraphicPdf() {
  if(!originalBytes){setStatus('Carica prima il PDF.',true);return;}
  if(!hasDrawn){setStatus('Disegna prima la firma nel riquadro.',true);return;}
  const imgData=getSignaturePng();if(!imgData){setStatus('Firma vuota.',true);return;}
  const btn=byId('vt-sign-graphic-download');btn.disabled=true;
  try {
    const doc=await PDFDocument.load(originalBytes.slice());
    const img=await doc.embedPng(imgData);
    const scope=byId('vt-sign-scope').value;
    const n=doc.getPageCount();
    const targets=scope==='last'?[n-1]:scope==='all-no-cover'?Array.from({length:Math.max(0,n-2)},(_,i)=>i+2):[selectedPage-1];
    if(!targets.length)throw Error('Non ci sono pagine dalla terza in poi. Cambia la scelta.');
    for(const i of targets){
      const page=doc.getPage(i);const w=Math.min((Number(byId('vt-sign-size').value)/25.4)*72,page.getWidth()*.9);
      const h=w*img.height/img.width;
      const x=Math.min(Math.max(0,locationRatio.x*page.getWidth()),Math.max(0,page.getWidth()-w));
      const y=Math.max(0,Math.min(page.getHeight()-h,page.getHeight()-(locationRatio.y*page.getHeight())-h));
      page.drawImage(img,{x,y,width:w,height:h});
    }
    producedGraphic=new Blob([await doc.save()],{type:'application/pdf'});
    saveBlob(producedGraphic,cleanName(loadedFile?.name.replace(/\.pdf$/i,'') || getPractice())+'_firma_grafica.pdf');
    setStatus(`Creato PDF con firma grafica su ${targets.length} pagina/e. Aprilo e controlla che la firma sia posizionata correttamente. Controlla il risultato prima di condividerlo.`);
  }catch(err){setStatus('PDF non modificato. '+String(err.message||err),true);}
  finally{btn.disabled=false;}
}
function openSigner() {
  ensureUI();dialog.showModal();
  setupPad(); // adatta il canvas alla dimensione della finestra dopo l'apertura
  hasDrawn = false;
  renderPreview();
}
function addPanel() {
  const app=byId('app');if(!app||byId('vt-firma-panel'))return;
  const selected=document.querySelector('#nav button.active');
  if(!selected||selected.textContent.trim()!=='Fascicolo')return;
  const panel=document.createElement('section');panel.id='vt-firma-panel';panel.className='card';
  panel.innerHTML=`<h2>Firma documenti</h2><p>Firma a mano libera con dito, mouse o pennino. Disegna e posiziona la firma sul PDF della pratica; CieSign non è incluso in questa versione.</p><button class="vt-sign-btn" type="button">Apri firma documenti</button>`;
  panel.querySelector('button').onclick=openSigner;
  app.prepend(panel);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
function boot(){
  if(!byId('app'))return;
  ensureUI();
  const obs=new MutationObserver(()=>addPanel());
  obs.observe(byId('app'),{childList:true});
  addPanel();
}
