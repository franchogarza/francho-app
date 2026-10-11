import os; exec(open(os.path.join(os.path.dirname(os.path.abspath(__file__)),'esc.py')).read())
OUT=os.environ.get('OUT','/tmp'); FOTO=os.environ.get('FOTO') or os.path.join(os.path.dirname(os.path.abspath(__file__)),'foto.jpg')
def f1(p,b):
    DB.clear(); ctx,pg=nuevo(p,b,'2026-10-12T08:00:00')
    act(pg,'[data-act=ir-cuenta]'); pg.fill('#em','f@x.com'); pg.fill('#pw','secreto1'); act(pg,'[data-act=login-crear]'); pg.wait_for_timeout(1200)
    act(pg,'[data-tab=progreso]'); act(pg,'[data-act=pesarme]'); pg.screenshot(path=OUT+'/f-medirme.png')
    pg.fill('#m-peso','91,8'); pg.fill('#m-cintura','94'); pg.fill('#m-brazo','36,5'); pg.fill('#m-grasa','21,5'); act(pg,'[data-act=guardar-peso]')
    m=ls(pg,'medidas'); print(m); check(m[-1].get('brazo')==36.5 and m[-1].get('grasa')==21.5,'Guarda perímetros y % grasa')
    act(pg,'[data-act=metrica][data-v=grasa]'); pg.screenshot(path=OUT+'/f-cuerpo.png')
    check('21,5' in pg.inner_text('#main'),'Gráfica de % grasa')
    act(pg,'[data-act=fotos-prog]'); 
    for pose in ['frente','perfil']:
        with pg.expect_file_chooser() as fc: act(pg,f'[data-act=foto-prog][data-v={pose}]')
        fc.value.set_files(FOTO); pg.wait_for_timeout(1200)
    F=ls(pg,'fotosProg'); print('fotos', [(f['fecha'],list(f.keys())) for f in F]); 
    check(F and F[0].get('frente',{}).get('nube'),'Foto de progreso subida a la nube')
    pg.screenshot(path=OUT+'/f-fotos.png')
    act(pg,'[data-act=cerrar]')
    # fuerza: 2 sesiones de día 1
    for fecha,peso in [('2026-10-12T18:30:00','40'),('2026-10-19T18:30:00','42.5')]:
        pg.clock.set_fixed_time(fecha); pg.reload(); pg.wait_for_timeout(500)
        act(pg,'[data-tab=entreno]'); act(pg,'[data-act=ses-ini]')
        pg.locator('[data-act=ej][data-b=B][data-e="4"]').click(); pg.wait_for_timeout(200)
        pg.locator('.set input').nth(0).fill(peso); pg.locator('.set input').nth(1).fill('5'); act(pg,'.set [data-act=serie]')
        if pg.locator('[data-act=t-skip]').count(): act(pg,'[data-act=t-skip]')
        act(pg,'[data-act=cerrar]')
    pg.clock.set_fixed_time('2026-10-26T18:30:00'); pg.reload(); pg.wait_for_timeout(500)
    act(pg,'[data-tab=entreno]'); pg.locator('[data-act=ej][data-b=B][data-e="4"]').click(); pg.wait_for_timeout(200)
    t=pg.inner_text('.sheet'); print([l for l in t.split('\n') if 'RM' in l or 'Mejor' in l])
    check('1RM ≈ 51' in t,'Ficha muestra 1RM estimado (42,5×5 RIR1 ≈ 51)')
    pg.screenshot(path=OUT+'/f-ej.png'); act(pg,'[data-act=cerrar]')
    act(pg,'[data-tab=progreso]'); act(pg,'[data-act=prog-modo][data-v=fuerza]'); pg.screenshot(path=OUT+'/f-fuerza.png')
    check('Press banca' in pg.inner_text('#main'),'Progreso → Fuerza lista el ejercicio')
    check(not pg.errs,'Sin errores fase 2 '+str(pg.errs[:3]))
    ctx.close()
with sync_playwright() as p:
    b=p.chromium.launch(); run('fase2',f1,p,b); b.close()
print('\nRESUMEN', len(oks),'OK', len(fails),'FALLOS'); [print(' -',f) for f in fails]
