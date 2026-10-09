// Simple client-side login gate. Only the SHA-256 hash of "user:password" is stored here.
const HASH='fb63d76eb6fdcfded797ccad580883b28e3a78718b93769fdad2b5fb5eeaf9ea',KEY='atelier-auth';
const hex=async s=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)))].map(b=>b.toString(16).padStart(2,'0')).join('');
const unlock=()=>{document.documentElement.classList.remove('locked');document.getElementById('login')?.remove();};
let ok=false;try{ok=localStorage.getItem(KEY)===HASH;}catch{}
if(ok)unlock();else{
  const form=document.getElementById('login-form');
  form.addEventListener('submit',async e=>{e.preventDefault();
    const h=await hex(`${form.user.value.trim().toLowerCase()}:${form.pass.value}`);
    if(h===HASH){try{localStorage.setItem(KEY,h);}catch{}unlock();}
    else{document.getElementById('login-error').textContent='Wrong username or password.';form.pass.value='';form.pass.focus();}
  });
}
document.addEventListener('click',e=>{if(e.target.id==='logout'){try{localStorage.removeItem(KEY);}catch{}location.reload();}});
