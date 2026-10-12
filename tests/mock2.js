// Supabase falso compartido entre "dispositivos" (funciones expuestas por Playwright). Imita guardar_registro con revisiones.
window.supabase = { createClient(){ let cb=null; let user=JSON.parse(localStorage.getItem('mockuser')||'null');
  const fire=(e,u)=>setTimeout(()=>cb&&cb(e,u?{user:u}:null),0);
  const sel=(tabla)=>{ const q={ _f:{}, eq(c,v){q._f[c]=v;return q;}, gte(){return q;}, order(){return q;},
      range: async()=>{ if(window.__offline) return {data:null,error:{message:'Failed to fetch'}}; return {data:JSON.parse(await window.dbSelect(tabla, q._f.alumno||'')),error:null}; },
      maybeSingle: async()=>({data:null,error:null}),
      then(res,rej){ return q.range().then(res,rej); } }; return q; };
  return { auth:{ onAuthStateChange(f){cb=f; fire('INITIAL_SESSION',user); return {data:{subscription:{unsubscribe(){}}}};},
      signUp:async({email})=>{ user={id:'u-'+email,email}; localStorage.setItem('mockuser',JSON.stringify(user)); fire('SIGNED_IN',user); return {data:{session:{user}},error:null}; },
      signInWithPassword:async({email,password})=>{ if(password!=='secreto1') return {data:{},error:{message:'Invalid login credentials'}}; user={id:'u-'+email,email}; localStorage.setItem('mockuser',JSON.stringify(user)); fire('SIGNED_IN',user); return {data:{session:{user}},error:null}; },
      signOut:async()=>{user=null; localStorage.removeItem('mockuser'); fire('SIGNED_OUT',null); return {error:null};} },
    rpc: async(fn,args)=>{ if(window.__offline) return {data:null,error:{message:'Failed to fetch'}}; if(window.__delay) await new Promise(r=>setTimeout(r,window.__delay));
      return {data:JSON.parse(await window.dbRpc(user?user.id:'', JSON.stringify(args))),error:null}; },
    from(t){ return { upsert:async()=>({error:{message:'no usar'}}), select(){ return sel(t); } }; },
    storage:{ from(){ return { upload:async(path)=>{ window.__fotos=(window.__fotos||[]).concat(path); return {error:null}; } }; } } };
} };
