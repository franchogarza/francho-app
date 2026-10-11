import os; exec(open(os.path.join(os.path.dirname(os.path.abspath(__file__)),'esc.py')).read())
OUT=os.environ.get('OUT','/tmp')
def w1(p,b):
    ctx,pg=nuevo(p,b,'2026-10-12T08:00:00')
    pg.evaluate("localStorage.setItem('fs:_salud', JSON.stringify({'2026-10-12':{fecha:'2026-10-12',pasos:8450,kcal_activas:520,min_pie:42,sueno_min:405,vfc:48.3,fc_reposo:55,recibido:'2026-10-12T21:00:00Z'}}))"); pg.reload(); pg.wait_for_timeout(500)
    t=pg.inner_text('#main'); check('8,4k' in t and '6 h 45' in t,'Hoy muestra pasos y sueño del Watch'); pg.screenshot(path=OUT+'/w-hoy.png',full_page=True)
    act(pg,'[data-act=ir-cuenta]'); pg.fill('#em','f@x.com'); pg.fill('#pw','secreto1'); act(pg,'[data-act=login-crear]'); pg.wait_for_timeout(1200)
    pg.evaluate("localStorage.setItem('fs:_tokenSalud','abc123')"); act(pg,'[data-tab=hoy]'); act(pg,'[data-tab=plan]')
    act(pg,'[data-act=reloj-guia]'); pg.screenshot(path=OUT+'/w-guia.png')
    check('rpc/registrar_salud' in pg.inner_text('.sheet'),'Guía del Atajo con URL')
    check(not pg.errs,'Sin errores reloj '+str(pg.errs[:3]))
    ctx.close()
with sync_playwright() as p:
    b=p.chromium.launch(); run('reloj',w1,p,b); b.close()
print('\nRESUMEN', len(oks),'OK', len(fails),'FALLOS'); [print(' -',f) for f in fails]
