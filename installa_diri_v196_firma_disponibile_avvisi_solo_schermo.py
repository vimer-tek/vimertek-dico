#!/usr/bin/env python3
# Vimer Tek Di.Co. 37/08 - controllo preliminare Di.Ri. v1.9.6, avvisi solo a schermo
# Non modifica copertina, logo, unifilare, index.html o style.css.
from pathlib import Path
import subprocess
from datetime import datetime

p = Path('app.js')
if not p.exists():
    raise SystemExit('ERRORE: app.js non trovato. Eseguire nella cartella del progetto.')
s = p.read_text(encoding='utf-8')
MARKER = 'VIMERTEK_DIRI_CONTROLLO_V196'
if MARKER in s:
    # Revision of an existing installation (the original installer may already have been run).
    from datetime import datetime
    old = s
    t = s
    pdf_call = '${diriRiepilogoPdf()}'
    if t.count(pdf_call) > 1:
        raise SystemExit('ERRORE: stampa personalizzata presente più volte. Nessuna modifica.')
    t = t.replace(pdf_call, '')
    t = t.replace('NON PRONTA PER LA FIRMA', 'VERIFICHE DA COMPLETARE')
    t = t.replace('DATI PRELIMINARI COMPILATI · verifica professionale obbligatoria', 'DATI PRELIMINARI COMPILATI · controllare i requisiti')
    t = t.replace("<div class='wide' style='margin-top:18px", "<div class='wide vt-diri-solo-schermo' style='margin-top:18px")
    # Hide the on-screen assessment if the browser directly prints the application view.
    t = t.replace("return `<div class='wide vt-diri-solo-schermo'", "return `<style>@media print{.vt-diri-solo-schermo{display:none!important}}</style><div class='wide vt-diri-solo-schermo'")
    t = t.replace('Si può continuare a preparare il fascicolo in bozza e affidare la valutazione e l’eventuale rilascio a un soggetto qualificato. Accertamenti, documenti e iscrizioni devono essere controllati da chi firma.', 'I comandi di firma e stampa restano disponibili. Prima del rilascio il firmatario deve possedere i requisiti previsti dalla legge; la compilazione software non li certifica.')
    if t == old:
        print('OK - Nessuna modifica necessaria: avvisi PDF già assenti.')
        raise SystemExit(0)
    backup = Path('app_backup_prima_avvisi_solo_schermo_' + datetime.now().strftime('%Y%m%d_%H%M%S') + '.js')
    backup.write_text(old, encoding='utf-8')
    p.write_text(t, encoding='utf-8')
    try:
        check = subprocess.run(['node','--check',str(p)], capture_output=True, text=True, timeout=20)
    except Exception as e:
        p.write_text(old, encoding='utf-8')
        raise SystemExit('Controllo JavaScript non eseguibile; versione precedente ripristinata: '+str(e))
    if check.returncode:
        p.write_text(old, encoding='utf-8')
        raise SystemExit('ERRORE SINTASSI. Versione precedente ripristinata.\n'+check.stderr)
    print('OK - Modulo Di.Ri. già installato: avvisi rimossi dal PDF.')
    print('OK - I controlli rimangono visibili soltanto nell’app.')
    print('OK - Nessun blocco software aggiunto ai comandi di firma e stampa.')
    print('OK - Backup creato: '+backup.name)
    raise SystemExit(0)

anchor_functions = 'function pratica(){return'
anchor_form = "</div><div class=actions><button onclick='save(true)'>Salva pratica</button>"
anchor_change = 'state[e.dataset.k]=e.value;save(false)'
for name, anchor in [('sezione pratica', anchor_functions), ('pulsanti pratica', anchor_form), ('salvataggio campi', anchor_change)]:
    n = s.count(anchor)
    if n != 1:
        raise SystemExit(f'ATTENZIONE: punto {name} presente {n} volte (atteso 1). Nessun file modificato. Invia una foto di questo messaggio.')

js = r'''// VIMERTEK_DIRI_CONTROLLO_V196 - Valutazione PRELIMINARE su dati dichiarati, non abilitazione legale.
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

'''

# Nessuna sostituzione delle sezioni preesistenti, solo aggiunta mirata.
t = s.replace(anchor_functions, js + anchor_functions, 1)
t = t.replace(anchor_form, "${diriRiquadro()}" + anchor_form, 1)
t = t.replace(anchor_change, anchor_change + ";if(active===1&&(e.dataset.k==='doc'||e.dataset.k.startsWith('diri')))render()", 1)

backup = Path('app_backup_prima_controllo_diri_' + datetime.now().strftime('%Y%m%d_%H%M%S') + '.js')
backup.write_text(s, encoding='utf-8')
p.write_text(t, encoding='utf-8')
try:
    check = subprocess.run(['node','--check',str(p)], capture_output=True, text=True, timeout=20)
except Exception as e:
    p.write_text(s, encoding='utf-8')
    raise SystemExit('Controllo Node non eseguibile. File originale ripristinato: '+str(e))
if check.returncode:
    p.write_text(s, encoding='utf-8')
    raise SystemExit('ERRORE SINTASSI: file originale ripristinato.\n'+check.stderr)
print('OK - Modulo verifica preliminare Di.Ri. v1.9.6 installato.')
print('OK - Data visura Vimer Tek 12/02/2024 per il responsabile tecnico identificato.')
print('OK - Calcolo dei 5 anni e segnalazioni solo a schermo (non bloccanti).')
print('OK - Requisiti aggiuntivi: Di.Co. mancante, settore, ambito art. 5 e sopralluoghi.')
print('OK - Nessuna segnalazione sui requisiti aggiunta al PDF.')
print('OK - Sintassi JavaScript controllata; backup: '+backup.name)
print('Non modificati: index.html, style.css, copertina, logo, unifilare.')
