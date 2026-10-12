import os; exec(open(os.path.join(os.path.dirname(os.path.abspath(__file__)),'esc.py')).read())
def m1(p,b):
    DB.clear(); c,pg=nuevo(p,b,'2026-10-12T09:00:00')
    pg.evaluate("""(()=>{localStorage.clear(); localStorage.setItem('fs:dia:2026-10-12', JSON.stringify({tipo:'viaje',habitos:{sentadillas:true},comidas:{}})); localStorage.setItem('fs:_owner','u-f@x.com'); localStorage.setItem('fs:_ts:dia:2026-10-12','123'); localStorage.setItem('fs:_pend','[]'); localStorage.setItem('fs:estilo','"clasico"'); localStorage.setItem('mockuser', JSON.stringify({id:'u-f@x.com',email:'f@x.com'}));})()""")
    pg.reload(); pg.wait_for_timeout(2500)
    ks=pg.evaluate("Object.keys(localStorage)"); print(sorted(ks))
    check('fs:u:u-f@x.com:dia:2026-10-12' in ks and 'fs:dia:2026-10-12' not in ks,'Datos de la versión anterior pasan a tu cuenta')
    check(pg.locator('[data-act=tipo-dia][data-v=viaje][aria-pressed=true]').count()==1,'Se siguen viendo tras actualizar')
    check(DB.get(('u-f@x.com','dia:2026-10-12')) is not None,'Y se suben a la nube con revisión')
    check(pg.evaluate("document.documentElement.getAttribute('data-estilo')")=='clasico','Se conserva el estilo elegido')
    c.close()
with sync_playwright() as p:
    b=p.chromium.launch(); run('migración',m1,p,b); b.close()
print('\nRESUMEN', len(oks),'OK', len(fails),'FALLOS'); [print(' -',f) for f in fails]
