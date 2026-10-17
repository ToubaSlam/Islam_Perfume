import {searchText,t} from './preferences.js';

const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let pending;
const load=()=>pending??=(async()=>{
  const response=await fetch('course-book.json');
  if(!response.ok)throw Error('Book unavailable');
  return response.json();
})().catch(error=>{pending=null;throw error;});
const href=page=>`#learn/book/${page}`;
const active=()=>location.hash.split('/')[0]==='#learn'&&location.hash.split('/')[1]==='book';
function savedPage(){try{return Math.max(1,Math.min(40,Number(localStorage.getItem('atelier-book-page'))||6));}catch{return 6;}}

function blockHTML(block){
  if(block.type==='heading')return `<h3>${escape(block.text)}</h3>`;
  if(block.type==='paragraph')return `<p>${escape(block.text)}</p>`;
  if(block.type==='contents')return `<ul class="book-source-contents">${block.items.map(item=>`<li><a href="${href(item.page)}">${escape(item.title)} <span>· ${item.page}</span></a></li>`).join('')}</ul>`;
  if(block.type==='table')return `<div class="native-table-wrap"><table class="native-table"><thead><tr>${block.headers.map(h=>`<th scope="col">${escape(h)}</th>`).join('')}</tr></thead><tbody>${block.rows.map(row=>`<tr>${row.map(value=>`<td>${escape(value)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  if(block.type==='figure')return `<figure class="book-figure"><button type="button" class="book-figure-open" data-book-image="${escape(block.src)}" aria-label="Enlarge illustration"><img src="${escape(block.src)}" width="${block.width}" height="${block.height}" alt="${escape(block.caption)}" loading="lazy"></button><figcaption>${escape(block.caption)} <span>Click to enlarge.</span></figcaption></figure>`;
  return '';
}

function pageList(pages,query=''){
  const q=query.trim().toLowerCase();
  const shown=pages.filter(page=>!q||searchText(page).includes(q));
  if(!shown.length)return '<p role="status">No book pages match that search.</p>';
  return `<p class="small" role="status"><span>Pages found</span>: ${shown.length}</p><div class="book-page-list">${shown.map(page=>{
    const matching=page.blocks.find(block=>block.text&&searchText(block.text).includes(q));
    let snippet=q&&matching?t(matching.text):'';
    if(snippet){const at=snippet.toLowerCase().indexOf(q);const start=Math.max(0,at-70);snippet=(start?'…':'')+snippet.slice(start,start+230)+(snippet.length>start+230?'…':'');}
    return `<a href="${href(page.page)}"><span class="book-page-number">${page.page}</span><div><span class="small">${escape(page.group)}</span><h3>${escape(page.title)}</h3>${snippet?`<p>${escape(snippet)}</p>`:''}</div></a>`;
  }).join('')}</div>`;
}

export async function renderBook(requested){
  const host=document.getElementById('book-study');
  if(!host)return;
  host.hidden=false;
  host.innerHTML='<p role="status">Loading the complete book…</p>';
  const requestedHash=location.hash;
  try{
    const book=await load();
    if(!active()||location.hash!==requestedHash)return;
    const page=book.pages.find(page=>String(page.page)===requested);
    const bookmark=page?.page||savedPage();
    host.innerHTML=`<a class="back-link" href="#learn">← Quick lessons</a><header class="book-heading"><div><p class="eyebrow">COMPLETE BOOK / ARTISAN PERFUMERY</p><h1>${escape(book.title)}</h1><p class="small">${escape(book.author)} · ${escape(book.publisher)} · ${book.year}</p></div><a class="secondary" href="${href(bookmark)}">Continue reading <span>· ${bookmark}</span></a></header><p class="book-edition-note">Full course text with searchable pages, original teaching figures and separate editorial notes. Arabic text is a machine translation for study; original figure lettering is preserved.</p><nav class="book-toolbar" aria-label="Book navigation"><a class="secondary" href="#learn/book">Contents</a><label><span>Go to page</span><select id="book-page-picker"><option value="">Contents</option>${book.pages.map(p=>`<option value="${p.page}"${p.page===page?.page?' selected':''}>${p.page} · ${escape(p.title)}</option>`).join('')}</select></label><label class="book-search"><span>Search the full book</span><input id="book-search" type="search" placeholder="Try water, maceration, projection…"></label></nav><div id="book-search-results" hidden></div><div id="book-reading">${page?`<article class="book-page"><div class="book-page-heading"><p class="eyebrow">${escape(page.group)} · <span>Page</span> ${page.page} / ${book.pageCount}</p><h2 tabindex="-1" id="book-page-title">${escape(page.title)}</h2></div>${page.notes.length?`<aside class="book-editorial" aria-label="Editorial notes"><h3>Editorial notes</h3>${page.notes.map(note=>`<p>${escape(note)}</p>`).join('')}</aside>`:''}<div class="book-prose">${page.blocks.map(blockHTML).join('')}</div>${page.links.length?`<nav class="book-related" aria-label="Related tools">${page.links.map(link=>`<a class="secondary" href="${link.href}">${escape(link.label)} ↗</a>`).join('')}</nav>`:''}<nav class="book-pagination" aria-label="Reading pages">${page.page>1?`<a class="secondary" href="${href(page.page-1)}">← Previous page</a>`:'<span></span>'}<span><span>Page</span> ${page.page} / 40</span>${page.page<40?`<a class="primary" href="${href(page.page+1)}">Next page →</a>`:'<a class="primary" href="#learn/book">Contents</a>'}</nav></article>`:`<div class="book-contents"><h2>All 40 pages</h2><p class="small">Choose a topic or search the full text. Your last reading page is saved in this browser.</p>${pageList(book.pages)}</div>`}</div><dialog class="book-image-dialog"><button type="button" class="secondary" data-close-book-image>Close illustration</button><img alt=""></dialog>`;
    if(page){try{localStorage.setItem('atelier-book-page',String(page.page));}catch{}}
    host.querySelector('#book-page-picker').onchange=event=>{location.hash=event.target.value?href(event.target.value):'#learn/book';};
    host.querySelector('#book-search').oninput=event=>{
      const results=host.querySelector('#book-search-results');const query=event.target.value;
      const searching=Boolean(query.trim());host.querySelector('#book-reading').hidden=searching;results.hidden=!searching;
      if(searching)results.innerHTML=pageList(book.pages,query);
    };
    const dialog=host.querySelector('dialog');
    host.onclick=event=>{
      const trigger=event.target.closest('[data-book-image]');
      if(trigger){const image=dialog.querySelector('img');image.src=trigger.dataset.bookImage;image.alt=trigger.querySelector('img').alt;dialog.showModal();}
      if(event.target.closest('[data-close-book-image]')||event.target===dialog)dialog.close();
    };
  }catch{
    if(active())host.innerHTML='<p role="alert">The complete book could not load. Refresh to try again.</p><a href="#learn">← Quick lessons</a>';
  }
}
