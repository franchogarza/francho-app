import json,sys,traceback
from playwright.sync_api import sync_playwright
import os
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB={}  # (alumno,clave)->row
fails=[]; oks=[]
def check(cond,msg):
    (oks if cond else fails).append(msg); print(('OK   ' if cond else 'FALLO ')+msg)
def upsert(rows):
    for r in json.loads(rows): DB[(r['alumno'],r['clave'])]=r
def select(uid):
    return json.dumps([{'clave':k[1],'valor':v['valor'],'actualizado':v['actualizado']} for k,v in DB.items() if k[0]==uid])
def nuevo(p,b,fecha='2026-10-12T09:00:00',estilo=None):
    ctx=b.new_context(**p.devices['iPhone 13'],timezone_id='Europe/Madrid',locale='es-ES')
    ctx.expose_function('dbUpsert',upsert); ctx.expose_function('dbSelect',select)
    pg=ctx.new_page(); pg.errs=[]
    pg.on('pageerror',lambda e:pg.errs.append(str(e)))
    pg.route('**/supabase.js*',lambda r:r.fulfill(path=os.path.join(os.path.dirname(os.path.abspath(__file__)),'mock2.js'),content_type='text/javascript'))
    pg.route('**/fonts.g*/**',lambda r:r.abort())
    pg.clock.install(time=fecha)
    pg.goto('file://'+ROOT+'/index.html'); pg.wait_for_timeout(600)
    return ctx,pg
def ls(pg,k): return pg.evaluate(f"JSON.parse(localStorage.getItem('fs:{k}'))")
def act(pg,sel,i=0):
    L=pg.locator(sel); 
    if L.count()<=i: return False
    L.nth(i).click(timeout=3000); pg.wait_for_timeout(120); return True
def run(name,fn,p,b):
    print('\n== '+name)
    try: fn(p,b)
    except Exception as e: fails.append(name+': excepción '+str(e)[:300]); print('EXC',traceback.format_exc()[-800:])
