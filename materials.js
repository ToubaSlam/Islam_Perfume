// Materials encyclopedia: the Scentipedia (Lite) export in scentipedia.json.
const $=s=>document.querySelector(s);
const safe=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const root=$('#materials-app');
let tables=[],active=0,query='';
root.innerHTML=`<div class="library-tools"><label>Search every table<input id="materials-search" type="search" placeholder="Search oils, notes, constituents, blends…"></label><div id="materials-tabs" class="library-filters" role="group" aria-label="Table"></div></div><p id="materials-status" role="status">Loading the encyclopedia…</p><div id="materials-list"></div>`;
// The first field is the entry's name; these go in the summary line instead of the body.
const summaryFields=['Botanical Name','Aromatic Note','Fragrance Wheel','Purposes','Definition','Purpose','Safe 4'];
const body=(row,fields)=>fields.slice(1).filter(f=>row[f]&&!summaryFields.includes(f)).map(f=>{const v=row[f];if(/^https?:\/\//.test(v))return `<div><dt>${safe(f)}</dt><dd><a href="${safe(v)}" target="_blank" rel="noopener">Open link ↗</a></dd></div>`;return `<div><dt>${safe(f)}</dt><dd>${safe(v)}</dd></div>`;}).join('');
function render(){
  const q=query.trim().toLowerCase();
  const show=q?tables.map((t,i)=>i):[active];
  $('#materials-tabs').innerHTML=tables.map((t,i)=>`<button class="secondary" data-table="${i}" aria-pressed="${!q&&i===active}">${safe(t.name)} <span class="count">${t.rows.length}</span></button>`).join('');
  let total=0;
  $('#materials-list').innerHTML=show.map(i=>{const t=tables[i];const rows=q?t.rows.filter(r=>Object.values(r).join(' ').toLowerCase().includes(q)):t.rows;total+=rows.length;if(!rows.length)return '';
    return `<section class="materials-table"><h2>${safe(t.name)}</h2>${!q&&t.description?`<p class="intro">${safe(t.description)}</p>`:''}<div class="materials-grid">${rows.map(r=>{const tags=summaryFields.filter(f=>r[f]).flatMap(f=>f==='Purposes'||f==='Definition'||f==='Purpose'?[[f,r[f]]]:r[f].split(',').map(v=>[f,v.trim()])).map(([f,v])=>`<span class="tag" title="${safe(f)}">${safe(v)}</span>`).join('');return `<details class="material-card"><summary><strong>${safe(r[t.fields[0]])}</strong>${tags?`<span class="tags">${tags}</span>`:''}</summary><dl>${body(r,t.fields)}</dl></details>`;}).join('')}</div></section>`;}).join('');
  $('#materials-status').textContent=q?`${total} matching entr${total===1?'y':'ies'} across all tables`:'';
}
$('#materials-tabs').addEventListener('click',e=>{const b=e.target.closest('[data-table]');if(!b)return;active=+b.dataset.table;query='';$('#materials-search').value='';render();});
$('#materials-search').addEventListener('input',e=>{query=e.target.value;render();});
try{const r=await fetch('scentipedia.json');if(!r.ok)throw Error();tables=(await r.json()).tables;render();}catch{$('#materials-status').textContent='The materials encyclopedia could not load. Refresh to try again.';}
