import glossary from './ar-glossary.js';
const root=document.documentElement;
const read=(key,fallback)=>{try{return localStorage.getItem(key)||fallback;}catch{return fallback;}};
let language=read('atelier-language','en');
if(!['en','ar'].includes(language))language='en';
let theme=read('atelier-theme','light');
if(!['light','dark'].includes(theme))theme='light';
let dictionary={...glossary},lookup=new Map(),exactLookup=new Map(),matcher;
const normalize=s=>String(s).replace(/\s+/g,' ').trim();
function compile(){
  exactLookup=new Map(Object.entries(dictionary).map(([k,v])=>[normalize(k),v]));
  lookup=new Map(Object.entries(dictionary).map(([k,v])=>[normalize(k).toLowerCase(),v]));
  const keys=[...lookup.keys()].sort((a,b)=>b.length-a.length);
  matcher=new RegExp(`(?<![a-z])(?:${keys.map(s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|')})(?![a-z])`,'gi');
}
compile();
export function t(s){
  if(language!=='ar'||typeof s!=='string')return s;
  const key=normalize(s),exact=exactLookup.get(key)||lookup.get(key.toLowerCase());
  if(exact)return (s.match(/^\s*/)?.[0]||'')+exact+(s.match(/\s*$/)?.[0]||'');
  return s.replace(matcher,match=>exactLookup.get(normalize(match))||lookup.get(normalize(match).toLowerCase())||match);
}
export function searchText(value){
  const strings=[];
  function walk(o){if(typeof o==='string')strings.push(o,t(o));else if(Array.isArray(o))o.forEach(walk);else if(o&&typeof o==='object')Object.values(o).forEach(walk);}
  walk(value);return strings.join(' ').toLowerCase();
}
export const locale=()=>language==='ar'?'ar':'en';
const originals=new WeakMap(),attributes=new WeakMap();
const skip=el=>el.closest('script,style,code,[data-no-translate]');
function translateDocument(){
  observer.disconnect();
  const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
  let node;
  while(node=walker.nextNode()){
    const el=node.parentElement;if(!el||skip(el))continue;
    const previous=originals.get(node);
    const source=previous&&node.data===previous.output?previous.source:node.data;
    // Keep option values stable: stored formulas and filters use English enums.
    if(el.tagName==='OPTION'&&!el.hasAttribute('value'))el.value=source;
    const output=t(source);if(node.data!==output)node.data=output;
    originals.set(node,{source,output});
  }
  for(const el of document.querySelectorAll('[placeholder],[aria-label],[alt],[title]')){
    if(skip(el))continue;
    let records=attributes.get(el)||{};
    for(const name of ['placeholder','aria-label','alt','title']){
      if(!el.hasAttribute(name))continue;
      const current=el.getAttribute(name),old=records[name];
      const source=old&&current===old.output?old.source:current,output=t(source);
      if(current!==output)el.setAttribute(name,output);
      records[name]={source,output};
    }
    attributes.set(el,records);
  }
  document.title=language==='ar'?'إسلام · مختبر العطور':'Islam · Perfume Atelier';
  observer.observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['placeholder','aria-label','alt','title']});
}
let scheduled=false;
const refresh=()=>{if(scheduled)return;scheduled=true;queueMicrotask(()=>{scheduled=false;translateDocument();});};
const observer=new MutationObserver(refresh);
function apply(){
  root.lang=language;root.dir=language==='ar'?'rtl':'ltr';root.dataset.theme=theme;
  document.querySelector('link[href="light.css"]').disabled=theme==='dark';
  document.querySelectorAll('[data-language-select]').forEach(e=>e.value=language);
  document.querySelectorAll('[data-theme-select]').forEach(e=>e.value=theme);
  document.querySelector('meta[name="theme-color"]').content=theme==='dark'?'#10121c':'#dce7ef';
  refresh();
}
const controls=()=>`<div class="preferences" aria-label="Display settings"><label><span>Language</span><select data-language-select aria-label="Language"><option value="en" lang="en" data-no-translate>English</option><option value="ar" lang="ar" data-no-translate>العربية</option></select></label><label><span>Appearance</span><select data-theme-select aria-label="Appearance"><option value="light">Light</option><option value="dark">Dark</option></select></label></div>`;
document.querySelector('main>header').insertAdjacentHTML('beforeend',controls());
document.querySelector('#login-form')?.insertAdjacentHTML('afterbegin',controls());
document.addEventListener('change',e=>{
  if(e.target.matches('[data-language-select]'))language=e.target.value;
  else if(e.target.matches('[data-theme-select]'))theme=e.target.value;
  else return;
  try{localStorage.setItem('atelier-language',language);localStorage.setItem('atelier-theme',theme);}catch{}
  apply();
});
apply();
fetch('ar.json').then(r=>{if(!r.ok)throw Error('Arabic content unavailable');return r.json();}).then(data=>{dictionary={...data,...glossary,'Language':'اللغة','Appearance':'المظهر','Light':'فاتح','Dark':'داكن','Display settings':'إعدادات العرض'};compile();refresh();}).catch(()=>{
  dictionary={...dictionary,'Language':'اللغة','Appearance':'المظهر','Light':'فاتح','Dark':'داكن','Display settings':'إعدادات العرض'};compile();refresh();
});
