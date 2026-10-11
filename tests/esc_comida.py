exec(open(os.path.join(os.path.dirname(os.path.abspath(__file__)),'esc.py')).read()) if False else None
import os; exec(open(os.path.join(os.path.dirname(os.path.abspath(__file__)),'esc.py')).read())
OUT=os.environ.get('OUT','/tmp')
def c1(p,b):
    ctx,pg=nuevo(p,b,'2026-10-12T13:00:00')
    act(pg,'[data-tab=comida]'); pg.screenshot(path=OUT+'/c-comida.png')
    t0=pg.inner_text('.card >> nth=2')
    # almuerzo: pollo -> merluza
    alm=pg.locator('.card').filter(has_text='ALMUERZO').first if pg.locator('.card').filter(has_text='ALMUERZO').count() else pg.locator('.card').filter(has_text='Almuerzo').first
    pt0=alm.inner_text()
    alm.locator('[data-act=linea]').first.click(); pg.wait_for_timeout(200); pg.screenshot(path=OUT+'/c-linea.png')
    pg.locator('[data-act=lin-cambiar]').first.click(); pg.wait_for_timeout(200)
    d=ls(pg,'dia:2026-10-12'); print('lineas',d['comidas'].get('almuerzo'))
    check(d['comidas']['almuerzo']['lineas'][0]['a']!='pollo','Cambiar alimento guarda la sustitución del día')
    alm=pg.locator('.card').filter(has_text='Volver al de Jesús').first; pg.screenshot(path=OUT+'/c-cambiado.png')
    print(alm.inner_text()[-200:])
    act(pg,'[data-act=lin-paso][data-v="1"]'); d=ls(pg,'dia:2026-10-12'); print('desayuno',d['comidas'].get('desayuno'))
    check(d['comidas']['desayuno']['lineas'][0]['g']==165,'+ añade una ración (huevo 55 g)')
    act(pg,'[data-act=lin-anadir]'); pg.fill('#buscar','skyr'); pg.wait_for_timeout(200); pg.screenshot(path=OUT+'/c-anadir.png')
    check(pg.locator('[data-act=lin-add]').count()==1,'Buscador de alimentos filtra')
    act(pg,'[data-act=lin-add]'); d=ls(pg,'dia:2026-10-12'); check(d['comidas']['desayuno']['lineas'][-1]['a']=='yogurpro','Añadir alimento')
    act(pg,'[data-act=lin-guardar]'); check(ls(pg,'menuMio:1:desayuno:entreno') is not None,'Guardar como mi menú')
    pg.clock.set_fixed_time('2026-10-19T09:00:00'); pg.reload(); pg.wait_for_timeout(400); act(pg,'[data-tab=comida]')
    t=pg.inner_text('#main'); check('Skyr' in t or 'Yogur' in t and 'Volver al de Jesús' in t,'Otro día con menú 1 usa tu versión')
    act(pg,'[data-act=lin-reset]'); check(ls(pg,'menuMio:1:desayuno:entreno') is None,'Volver al de Jesús borra tu versión')
    act(pg,'[data-act=equiv]'); act(pg,'[data-act=eq-modo][data-v=todo]'); pg.screenshot(path=OUT+'/c-equiv.png')
    check(pg.locator('.sheet .card').count()>=5,'Equivalencias completas')
    check(not pg.errs,'Sin errores comida v2 '+str(pg.errs[:3]))
    ctx.close()
with sync_playwright() as p:
    b=p.chromium.launch(); run('comida v2',c1,p,b); b.close()
print('\\nRESUMEN', len(oks),'OK', len(fails),'FALLOS'); [print(' -',f) for f in fails]
