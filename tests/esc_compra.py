import os; exec(open(os.path.join(os.path.dirname(os.path.abspath(__file__)),'esc.py')).read())
OUT=os.environ.get('OUT','/tmp')
def k1(p,b):
    ctx,pg=nuevo(p,b,'2026-10-11T19:00:00')
    act(pg,'[data-tab=comida]'); act(pg,'[data-act=compra]'); pg.wait_for_timeout(200)
    t=pg.inner_text('.sheet'); print(t[:1500])
    pg.screenshot(path=OUT+'/k-compra.png',full_page=False)
    check('Pechuga de pollo' in t and 'Arroz' in t,'Lista incluye pollo y arroz')
    act(pg,'[data-act=compra-check]'); k=[x for x in pg.evaluate("Object.keys(localStorage)") if x.startswith('fs:compra:')]
    check(k,'Marcar producto se guarda')
    check(not pg.errs,'Sin errores compra '+str(pg.errs[:3]))
    ctx.close()
with sync_playwright() as p:
    b=p.chromium.launch(); run('compra',k1,p,b); b.close()
print('\nRESUMEN', len(oks),'OK', len(fails),'FALLOS'); [print(' -',f) for f in fails]
