// Supabase falso compartido entre "dispositivos" vía funciones expuestas por Playwright
window.supabase = { createClient(){ let cb=null; let user=JSON.parse(localStorage.getItem('mockuser')||'null');
  const fire=(e,u)=>setTimeout(()=>cb&&cb(e,u?{user:u}:null),0);
  return { auth:{ onAuthStateChange(f){cb=f; fire('INITIAL_SESSION',user); return {data:{subscription:{unsubscribe(){}}}};},
      signUp:async({email})=>{ user={id:'u-'+email,email}; localStorage.setItem('mockuser',JSON.stringify(user)); fire('SIGNED_IN',user); return {data:{session:{user}},error:null}; },
      signInWithPassword:async({email,password})=>{ if(password!=='secreto1') return {data:{},error:{message:'Invalid login credentials'}}; user={id:'u-'+email,email}; localStorage.setItem('mockuser',JSON.stringify(user)); fire('SIGNED_IN',user); return {data:{session:{user}},error:null}; },
      signOut:async()=>{user=null; localStorage.removeItem('mockuser'); fire('SIGNED_OUT',null); return {error:null};} },
    from(){ return { upsert:async(rows)=>{ if(window.__offline) return {error:{message:'Failed to fetch'}}; await window.dbUpsert(JSON.stringify(rows)); return {error:null}; },
      select(){ return { eq(c,v){ return { range:async()=>{ if(window.__offline) return {data:null,error:{message:'Failed to fetch'}}; return {data:JSON.parse(await window.dbSelect(v)),error:null}; } }; } }; } }; } };
} };
// storage falso
(function(){ const cc=window.supabase.createClient; window.supabase.createClient=function(){ const c=cc.apply(this,arguments); c.storage={from(){return{upload:async(path,blob)=>{ window.__fotos=(window.__fotos||[]).concat(path); return {error:null}; }};}}; return c; }; })();
