exec(open('esc.py').read())
def r1(p,b):
    ctx,pg=nuevo(p,b,'2026-10-12T18:30:00')
    act(pg,'[data-tab=entreno]'); act(pg,'[data-act=ses-ini]'); act(pg,'[data-act=ej]'); act(pg,'.set [data-act=serie]'); act(pg,'[data-act=cerrar]')
    act(pg,'[data-act=ent-dia][data-v="2"]'); act(pg,'[data-act=cardio]'); pg.locator('.sheet-wrap').click(position={'x':195,'y':8}); pg.wait_for_timeout(300); print('sheet abierta', pg.locator('.sheet-wrap').count())
    act(pg,'[data-act=ej]'); act(pg,'.set [data-act=serie]'); act(pg,'[data-act=cerrar]')
    d=ls(pg,'dia:2026-10-12'); 
    s1=(d['sesion'] if d['sesion']['dia']==1 else d.get('sesiones',{}).get('1'))
    check(s1 and s1['series'].get('D1-A-1',[{}])[0].get('done'),'Abrir/registrar el día 2 no borra la sesión del día 1')
    act(pg,'[data-act=ent-dia][data-v="1"]'); act(pg,'[data-act=ej]')
    check(pg.locator('.set.isdone').count()>=1,'Volver al día 1 muestra sus series hechas')
    ctx.close()
def r2(p,b):
    ctx,pg=nuevo(p,b,'2026-10-13T10:00:00')  # martes, sin entreno por plan
    act(pg,'[data-act=tipo-dia][data-v=entreno]')
    act(pg,'[data-tab=entreno]'); t=pg.inner_text('#main')
    v=pg.locator('[data-act=ent-dia][aria-pressed=true]').get_attribute('data-v'); print('dia pulsado',v)
    check(v=='2','Martes cambiado a entreno = Día 2')
    ctx.close()
def r3(p,b):
    ctx,pg=nuevo(p,b,'2026-10-12T21:00:00')
    act(pg,'[data-act=tipo-dia][data-v=viaje]'); act(pg,'[data-tab=comida]')
    act(pg,'[data-act=abrir-marcar]',2); act(pg,'[data-act=estado][data-v=fuera]')
    pg.fill('#fk','1200'); pg.fill('#fp','60'); act(pg,'[data-act=guardar-comida]')
    tot=pg.evaluate("1"); t=pg.inner_text('#main'); print(t[:400])
    check('1.' in t.split('kcal')[0] or '1200' in t,'Viaje: comida fuera de plan suma sus kcal')
    ctx.close()
def r4(p,b):
    ctx,pg=nuevo(p,b,'2026-10-12T08:00:00')
    r=pg.evaluate("(()=>{const s=document.createElement('script');return 1})()")
    # regla vía comportamiento: buscar en data un item con nueces y yogur
    items=pg.evaluate("DATOS.menus.flatMap(m=>m.comidas.flatMap(c=>c.entreno.items.concat(c.sin.items))).filter(x=>/nueces/i.test(x)&&/yogur/i.test(x))")
    print('items nueces+yogur',items[:2])
    ctx.close()
def r5(p,b):
    ctx,pg=nuevo(p,b,'2026-10-12T18:30:00')
    act(pg,'[data-tab=entreno]'); act(pg,'[data-act=ses-ini]'); act(pg,'[data-act=ej]')   # face pull: 'No, alterno lados'
    act(pg,'.set [data-act=serie]')
    check(pg.locator('#timer:not([hidden])').count()==0,'Descanso «No, alterno lados» no arranca cronómetro')
    ctx.close()
def r6(p,b):
    DB.clear(); ctx,pg=nuevo(p,b,'2026-10-12T14:10:00')
    act(pg,'[data-act=ir-cuenta]'); pg.fill('#em','f@x.com'); pg.fill('#pw','secreto1'); act(pg,'[data-act=login-crear]'); pg.wait_for_timeout(1500)
    act(pg,'[data-tab=comida]'); act(pg,'[data-act=abrir-marcar]')
    pg.set_input_files('#foto','foto.jpg'); pg.wait_for_timeout(1500)
    act(pg,'[data-act=guardar-comida]'); pg.wait_for_timeout(1000)
    d=ls(pg,'dia:2026-10-12'); c=d['comidas']['desayuno']; size=len(c.get('foto',''))
    print('mini bytes',size,'nube',c.get('fotoNube'))
    check(0<size<20000,'La foto en el móvil es una miniatura ligera')
    check(bool(c.get('fotoNube')),'La foto buena se sube a la nube')
    check(not pg.errs,'Sin errores foto '+str(pg.errs[:2]))
    ctx.close()
def r7(p,b):
    ctx,pg=nuevo(p,b,'2026-10-12T09:00:00')
    pg.evaluate("(()=>{const o=Storage.prototype.setItem; Storage.prototype.setItem=function(k,v){ if(window.__q) throw new Error('QuotaExceededError'); return o.call(this,k,v); }; window.__q=true; return 1})()")
    act(pg,'[data-act=tipo-dia][data-v=viaje]')
    check(pg.locator('.seg [aria-pressed=true]').first.inner_text().upper().startswith('VIAJE'),'Con memoria llena el cambio sigue visible en la sesión')
    check('Memoria' in (pg.inner_text('.toast') if pg.locator('.toast').count() else ''),'Avisa de memoria llena')
    ctx.close()
with sync_playwright() as p:
    b=p.chromium.launch()
    for n,f in [('sesiones',r1),('diaEntreno',r2),('viaje fuera',r3),('reglas',r4),('descanso texto',r5),('fotos',r6),('cuota',r7)]: run(n,f,p,b)
    b.close()
print('\nRESUMEN', len(oks),'OK', len(fails),'FALLOS'); [print(' -',f) for f in fails]
