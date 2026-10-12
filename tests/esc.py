import json,sys,traceback
from playwright.sync_api import sync_playwright
import os
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB={}  # (alumno,clave)->row
fails=[]; oks=[]
def check(cond,msg):
    (oks if cond else fails).append(msg); print(('OK   ' if cond else 'FALLO ')+msg)
def rpc(uid, args):
    a=json.loads(args); k=(uid,a['p_clave']); r=DB.get(k); rev=a.get('p_rev') or 0
    if r is None:
        if rev!=0: return json.dumps({'ok':False,'rev':0,'valor':None})
        DB[k]={'valor':a['p_valor'],'rev':1}; return json.dumps({'ok':True,'rev':1})
    if r['rev']!=rev: return json.dumps({'ok':False,'rev':r['rev'],'valor':r['valor']})
    DB[k]={'valor':a['p_valor'],'rev':r['rev']+1}; return json.dumps({'ok':True,'rev':r['rev']+1})
def select(tabla, uid):
    if tabla!='registro': return '[]'
    return json.dumps([{'alumno':k[0],'clave':k[1],'valor':v['valor'],'rev':v['rev']} for k,v in DB.items() if k[0]==uid])
def nuevo(p,b,fecha='2026-10-12T09:00:00',estilo=None):
    ctx=b.new_context(**p.devices['iPhone 13'],timezone_id='Europe/Madrid',locale='es-ES')
    ctx.expose_function('dbRpc',rpc); ctx.expose_function('dbSelect',select)
    pg=ctx.new_page(); pg.errs=[]
    pg.on('pageerror',lambda e:pg.errs.append(str(e)))
    pg.route('**/supabase.js*',lambda r:r.fulfill(path=os.path.join(os.path.dirname(os.path.abspath(__file__)),'mock2.js'),content_type='text/javascript'))
    pg.route('**/fonts.g*/**',lambda r:r.abort())
    pg.clock.install(time=fecha)
    pg.goto('file://'+ROOT+'/index.html'); pg.wait_for_timeout(600)
    return ctx,pg
def ls(pg,k): return pg.evaluate(f"(()=>{{const u=localStorage.getItem('fs:_ultimoUid'); const ns=u?'fs:u:'+u+':':'fs:'; return JSON.parse(localStorage.getItem(['tab','estilo'].includes('{k}')?'fs:{k}':ns+'{k}'))}})()")
def act(pg,sel,i=0):
    L=pg.locator(sel); 
    if L.count()<=i: return False
    L.nth(i).click(timeout=3000); pg.wait_for_timeout(120); return True
def run(name,fn,p,b):
    print('\n== '+name)
    try: fn(p,b)
    except Exception as e: fails.append(name+': excepción '+str(e)[:300]); print('EXC',traceback.format_exc()[-800:])
