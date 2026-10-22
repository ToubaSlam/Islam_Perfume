import {t,locale} from './preferences.js';
import {batch,dilution,scale,liquidPerfume,scaleTargets} from './math.js?v=scale-targets';
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=n=>Number(n.toFixed(4)).toLocaleString('en',{maximumFractionDigits:4});
const configs={
perfume:['Liquid perfume',[['size','Finished batch (mL)',50],['load','Fragrance concentration (%)',20],['drops','Drops in your trial blend',30],['conversion','Estimated drops per mL',22]],'Fragrance and carrier are calculated by volume. Drop conversions are estimates and vary by material and dropper.'],
solid:['Solid perfume',[['size','Finished batch (g)',15],['load','Fragrance (%)',5],['oil','Vegetable oil (%)',30],['butter','Vegetable butter (%)',50]],'Beeswax fills the remaining percentage. Weigh all ingredients in grams. These editable examples are not the course recipe or a validated product formula.'],
reed:['Reed diffuser',[['size','Finished batch (mL)',100],['load','Fragrance (%)',20],['dpg','Dipropylene glycol (%)',0],['water','Water (%)',0]],'Diffuser base fills the remaining volume. Starting values demonstrate arithmetic. Use the composition and fragrance load specified by your base supplier.'],
dilution:['Dilute a stock solution',[['size','Final solution (g)',10],['stock','Stock concentration (%)',100],['target','Target concentration (%)',10]],'Stock and target percentages are by weight. Add solvent to reach the final weight. Dilution cannot increase stock strength.']};
let mode='perfume';
function renderCalc(){
  const [title,fields,note]=configs[mode];
  const input=([id,label,val])=>`<label>${label}<input name="${id}" type="number" inputmode="decimal" step="any" value="${val}" min="${['size','drops','conversion','stock','target','fragranceDensity','carrierDensity'].includes(id)?'0.000001':'0'}" ${['load','oil','butter','dpg','water','stock','target'].includes(id)?'max="100"':''} required></label>`;
  $('#calculator').innerHTML=`<h3>${title}</h3><div class="two-col">${fields.map(input).join('')}</div>${mode==='perfume'?`<details class="weight-inputs"><summary>By weight (g)</summary><p class="small">Use the densities of your actual materials. The carrier conversion uses the alcohol density below.</p><div class="two-col">${input(['fragranceDensity','Fragrance oil density (g/mL)',0.9])}${input(['carrierDensity','Alcohol / carrier density (g/mL)',0.8])}</div></details><fieldset class="scale-inputs"><legend>Without taring</legend><p class="small">Place the empty bottle on your scale and enter its current reading. Targets include the bottle weight and use the densities above.</p><div class="two-col"><label>Starting scale reading (g)<input name="startingReading" type="number" inputmode="decimal" step="any" min="0" placeholder="44.681"></label><label>Scale precision<select name="scaleDecimals"><option value="2">0.01 g</option><option value="3">0.001 g</option></select></label></div></fieldset>`:''}<p class="small">Results update as you change a measurement.</p>`;
  $('#result-title').textContent=mode==='perfume'?'Your batch':title;
  $('.result-card>.eyebrow').textContent=mode==='perfume'?'Liquid perfume':'YOUR BATCH';
  $('#calc-note').textContent=note;
  calculate();
}
function resultRow(label,value,unit,fixed=false){
  const display=Number.isFinite(value)?(fixed?value.toFixed(4):fmt(value)):'—';
  return `<div class="result-row"><span>${label}</span><strong>${display}${Number.isFinite(value)?` <small>${unit}</small>`:''}</strong></div>`;
}
function scaleInstructions(v,result){
  const targets=scaleTargets(v.startingReading,result.fragranceG,result.carrierG);
  const decimals=v.scaleDecimals==='3'?3:2;
  const display=value=>Number.isFinite(value)?`${value.toFixed(decimals)} <small>g</small>`:'—';
  return `<div class="scale-targets"><h3>Without taring</h3><ol><li><span>Add fragrance oil until the scale reads</span><strong>${display(targets.afterOil)}</strong><small><span>Fragrance to add</span>: ${Number.isFinite(result.fragranceG)?fmt(result.fragranceG):'—'} g</small></li><li><span>Then add alcohol / carrier until the scale reads</span><strong>${display(targets.afterAlcohol)}</strong><small><span>Alcohol / carrier to add</span>: ${Number.isFinite(result.carrierG)?fmt(result.carrierG):'—'} g</small></li></ol><p class="small">Keep the bottle on the scale and do not tare between additions. Targets use the full calculated weights, rounded only for display.</p>${v.startingReading!==''&&Number(v.startingReading)<0?'<p class="calc-warning" role="status">Starting scale reading cannot be negative.</p>':''}</div>`;
}
function calculate(){
  const v=Object.fromEntries([...$('#calculator').elements].filter(e=>e.name).map(e=>[e.name,e.value]));
  if(mode==='perfume'){
    const result=liquidPerfume({batchML:v.size,concentration:v.load,trialDrops:v.drops,dropsPerML:v.conversion,fragranceDensity:v.fragranceDensity,carrierDensity:v.carrierDensity});
    $('#results').innerHTML=[
      resultRow('Fragrance',result.fragranceML,'mL'),resultRow('Carrier',result.carrierML,'mL'),
      resultRow('Trial blend',result.trialML,'mL',true),resultRow('Multiply trial recipe by',result.multiplier,'×',true),
      `<div class="weight-results"><h3>By weight (g)</h3>${resultRow('Fragrance',result.fragranceG,'g')}${resultRow('Carrier',result.carrierG,'g')}</div>`,
      scaleInstructions(v,result),
      ...result.warnings.map(message=>`<p class="calc-warning" role="status">${esc(message)}</p>`)
    ].join('');
    return;
  }
  const n=Object.fromEntries(Object.entries(v).map(([key,value])=>[key,value===''?NaN:Number(value)]));
  let rows;
  try{
    if(mode==='solid'){const a=batch(n.size,[n.load,n.oil,n.butter]);rows=['Fragrance','Vegetable oil','Vegetable butter','Beeswax'].map((name,i)=>[name,a[i],'g']);}
    if(mode==='reed'){const a=batch(n.size,[n.load,n.dpg,n.water]);rows=['Fragrance','Dipropylene glycol','Water','Diffuser base'].map((name,i)=>[name,a[i],'mL']);}
    if(mode==='dilution'){const a=dilution(n.size,n.stock,n.target);rows=[['Stock solution',a[0],'g'],['Additional solvent',a[1],'g']];}
    $('#results').innerHTML=rows.map(([name,value,unit])=>resultRow(name,value,unit)).join('');
  }catch(e){$('#results').innerHTML=`<p class="error">${esc(e.message)}</p>`;}
}
$('#calculator').addEventListener('input',calculate);$('#calculator').onsubmit=e=>e.preventDefault();$$('[data-mode]').forEach(b=>b.onclick=()=>{mode=b.dataset.mode;$$('[data-mode]').forEach(x=>x.setAttribute('aria-selected',x===b));renderCalc();});
$('.tabs').onkeydown=e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'].includes(e.key))return;const t=$$('[data-mode]');let i=t.indexOf(document.activeElement);if(i<0)return;e.preventDefault();i=e.key==='Home'?0:e.key==='End'?t.length-1:(i+(['ArrowRight','ArrowDown'].includes(e.key)?1:-1)+t.length)%t.length;t[i].focus();t[i].click();};
function route(){const [requested,detail]=location.hash.slice(1).split('/');const n=['learn','reference','formulas','materials','calculators','library','notebook'].includes(requested)?requested:'learn';if(n==='calculators'&&configs[detail]&&mode!==detail){mode=detail;$$('[data-mode]').forEach(x=>x.setAttribute('aria-selected',x.dataset.mode===mode));renderCalc();}$$('main>section').forEach(s=>s.hidden=s.id!==n);$$('aside nav a').forEach(a=>{a.classList.toggle('active',a.hash===`#${n}`);if(a.hash===`#${n}`)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});}window.addEventListener('hashchange',()=>{route();window.scrollTo(0,0);});route();renderCalc();
const key='islam-perfume-formulas-v1';let saved=[],editing=null;
function valid(f){return f&&typeof f.id==='string'&&typeof f.name==='string'&&f.name.trim()&&f.name.length<=120&&Number.isFinite(f.size)&&f.size>0&&(f.unit===undefined||['g','mL','drops'].includes(f.unit))&&['Fresh','Floral','Amber','Woody','Other'].includes(f.family)&&typeof f.observations==='string'&&typeof f.date==='string'&&Number.isFinite(Date.parse(f.date))&&Array.isArray(f.ingredients)&&f.ingredients.length>0&&f.ingredients.length<=100&&f.ingredients.every(i=>typeof i.name==='string'&&i.name.trim()&&['Unassigned','Top','Heart','Base'].includes(i.note)&&Number.isFinite(i.parts)&&i.parts>0);}
try{const d=JSON.parse(localStorage.getItem(key)||'[]');if(!Array.isArray(d)||!d.every(valid))throw Error();saved=d;}catch{$('#storage-status').textContent='Saved data could not be loaded. Import a backup if you have one.';}
function toast(m){$('#toast').textContent=m;$('#toast').style.display='block';setTimeout(()=>$('#toast').style.display='none',3500);}
function persist(next){try{localStorage.setItem(key,JSON.stringify(next));saved=next;listSaved();return true;}catch{toast('Could not save. Export a backup and check browser storage.');return false;}}
function addIngredient(i={name:'',note:'Top',parts:1}){const r=document.createElement('tr');r.innerHTML=`<td><input aria-label="Material name" class="material" required maxlength="150" value="${esc(i.name)}" placeholder="Material"></td><td><select aria-label="Note category" class="note">${['Unassigned','Top','Heart','Base'].map(n=>`<option ${n===i.note?'selected':''}>${n}</option>`).join('')}</select></td><td><input aria-label="Parts" class="parts" type="number" min="0.000001" step="any" value="${i.parts}" required></td><td class="grams"></td><td><button aria-label="Remove material" type="button">×</button></td>`;r.querySelector('button').onclick=()=>{r.remove();scaleFormula();};$('#ingredients').append(r);scaleFormula();}
function ingredients(){return $$('#ingredients tr').map(r=>({name:r.querySelector('.material').value.trim(),note:r.querySelector('.note').value,parts:r.querySelector('.parts').value===''?NaN:Number(r.querySelector('.parts').value)}));}
function scaleFormula(){$('#formula-amount-heading').textContent=$('#formula-unit').value;try{const i=ingredients(),a=scale(Number($('#formula-size').value),i.map(x=>x.parts));$$('#ingredients .grams').forEach((td,j)=>td.textContent=fmt(a[j]));$('#formula-total').textContent=`${fmt(i.reduce((s,x)=>s+x.parts,0))} parts → ${fmt(Number($('#formula-size').value))} ${$('#formula-unit').value} concentrate`;}catch(e){$$('#ingredients .grams').forEach(td=>td.textContent='—');$('#formula-total').textContent=e.message;}}
$('#add-ingredient').onclick=()=>addIngredient();$('#formula-form').addEventListener('input',scaleFormula);addIngredient();
const newButton=document.createElement('button');newButton.type='button';newButton.className='secondary';newButton.textContent='New formula';$('#formula-form').prepend(newButton);newButton.onclick=()=>{editing=null;$('#formula-form').reset();$('#ingredients').replaceChildren();addIngredient();$('#formula-name').focus();};
$('#formula-form').onsubmit=e=>{e.preventDefault();const f={id:editing||crypto.randomUUID(),name:$('#formula-name').value.trim(),size:Number($('#formula-size').value),unit:$('#formula-unit').value,family:$('#formula-family').value,observations:$('#observations').value,date:new Date().toISOString(),ingredients:ingredients()};if(!valid(f)){toast('Add a name and at least one complete material row.');return;}if(persist([f,...saved.filter(x=>x.id!==f.id)])){editing=f.id;toast('Formula saved on this device.');}};
function listSaved(){$('#saved-formulas').innerHTML=saved.length?saved.map(f=>`<article class="saved"><h3 data-no-translate dir="auto">${esc(f.name)}</h3><p>${esc(f.family)} · ${fmt(f.size)} ${esc(f.unit||'g')} · ${f.ingredients.length} materials</p><p>${esc(new Date(f.date).toLocaleDateString(locale()))}</p><button class="secondary" data-edit="${esc(f.id)}">Open</button><button class="secondary" data-delete="${esc(f.id)}">Delete</button></article>`).join(''):'<p class="small">Start with your first trial. Your saved formulas appear here.</p>';$$('[data-edit]').forEach(b=>b.onclick=()=>{const f=saved.find(f=>f.id===b.dataset.edit);editing=f.id;$('#formula-name').value=f.name;$('#formula-size').value=f.size;$('#formula-unit').value=f.unit||'g';$('#formula-family').value=f.family;$('#observations').value=f.observations;$('#ingredients').replaceChildren();f.ingredients.forEach(addIngredient);$('#formula-name').focus();});$$('[data-delete]').forEach(b=>b.onclick=()=>{if(confirm(t('Delete this saved formula?'))&&persist(saved.filter(f=>f.id!==b.dataset.delete))&&editing===b.dataset.delete){editing=null;$('#formula-name').value='';}});}
$('#export').onclick=()=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify({version:1,formulas:saved},null,2)],{type:'application/json'}));a.download='islam-perfume-backup.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);};
$('#import').onchange=async e=>{const file=e.target.files[0];if(!file)return;try{if(file.size>5e6)throw Error();const d=JSON.parse(await file.text());if(d.version!==1||!Array.isArray(d.formulas)||d.formulas.length>1000||!d.formulas.every(valid))throw Error();const next=[...saved];for(const f of d.formulas){const old=next.find(x=>x.id===f.id);if(!old)next.push(f);else if(JSON.stringify(old)!==JSON.stringify(f))next.push({...f,id:crypto.randomUUID(),name:(f.name+' (imported)').slice(0,120)});}if(persist(next))toast('Backup imported. Existing formulas kept.');}catch{toast('Invalid backup. Choose an exported notebook JSON file.');}e.target.value='';};listSaved();

window.addEventListener('course-calculator',e=>{
  const c=e.detail;
  if(!c||!configs[c.mode])return;
  mode=c.mode;
  $$('[data-mode]').forEach(x=>x.setAttribute('aria-selected',x.dataset.mode===mode));
  renderCalc();
  for(const k of ['size','load']) if(Number.isFinite(c[k])&&$('#calculator').elements[k]) $('#calculator').elements[k].value=c[k];
  calculate();
});
window.addEventListener('course-formula-selected',e=>{
  const f=e.detail;
  if(!f||!['g','mL','drops'].includes(f.unit)||!Number.isFinite(f.target)||f.target<=0||!Array.isArray(f.ingredients))return;
  editing=null;
  $('#formula-name').value=(f.title+' (study)').slice(0,120);
  $('#formula-size').value=f.target;
  $('#formula-unit').value=f.unit;
  $('#formula-family').value='Other';
  $('#observations').value=`Source: ${f.source}, printed page ${f.sourcePage}. Original concentrate: ${f.total} ${f.unit}.\n${f.note}${f.baseNote?'\n'+f.baseNote:''}\nStudy draft: record your exact supplier materials, stock dilutions and observations.`;
  $('#ingredients').replaceChildren();
  f.ingredients.forEach(i=>addIngredient({name:i.name,note:i.note,parts:i.amount}));
  scaleFormula();
  toast('Course formula loaded as a new draft. Save when ready.');
});
