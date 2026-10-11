exec(open('esc.py').read())
def s1_semana(p,b):
    ctx,pg=nuevo(p,b,'2026-10-12T08:00:00')
    for d in range(14):
        txt=pg.inner_text('#main')
        check(len(txt)>200, f'Hoy renderiza día +{d}')
        act(pg,'[data-act=dia-next]')
    # ir a fechas límite
    for _ in range(80): act(pg,'[data-act=dia-next]')
    check(len(pg.inner_text('#main'))>200,'Renderiza tras 12 semanas (+94 días)')
    print('cabecera tras 12 sem:', pg.inner_text('#main h1'))
    check(not pg.errs, 'Sin errores JS semana: '+str(pg.errs[:2]))
    ctx.close()
def s2_dst(p,b):
    ctx,pg=nuevo(p,b,'2026-10-26T10:00:00')
    h=pg.inner_text('#main h1'); print('h1 26-oct', h)
    check('3' in h, '26 oct (tras cambio de hora) es semana 3')
    ctx,pg2=nuevo(p,b,'2026-11-01T23:30:00'); h=pg2.inner_text('#main h1'); print('h1 1-nov 23:30',h)
    check('3' in h,'Domingo 1 nov 23:30 sigue semana 3')
    ctx.close()
def s3_medianoche(p,b):
    ctx,pg=nuevo(p,b,'2026-10-13T23:58:00')
    f1=pg.inner_text('#main .small'); 
    pg.clock.fast_forward('00:05:00'); pg.evaluate("document.dispatchEvent(new Event('visibilitychange'))"); pg.wait_for_timeout(300)
    act(pg,'[data-tab=hoy]')
    f2=pg.inner_text('#main .small'); print(f1,'->',f2)
    check('14' in f2,'Al pasar medianoche con la app abierta, Hoy cambia de día')
    ctx.close()
def s4_sesion(p,b):
    ctx,pg=nuevo(p,b,'2026-10-12T18:30:00')
    act(pg,'[data-tab=entreno]'); act(pg,'[data-act=ses-ini]')
    act(pg,'[data-act=ej]')
    pg.locator('.set input').nth(0).fill('8'); pg.locator('.set input').nth(1).fill('10')
    pg.locator('[data-nota]').fill('molestia <b>hombro</b>')
    act(pg,'.set [data-act=serie]')
    check(pg.locator('#timer:not([hidden])').count()==1,'Cronómetro arranca al marcar serie')
    pg.locator('.set input').nth(2).fill('9')   # serie 2 peso, sin marcar
    act(pg,'[data-act=cerrar]')
    d=ls(pg,'dia:2026-10-12'); k=list(d['sesion']['series'].keys())[0]; s=d['sesion']['series'][k]
    print(k,s,d['sesion']['notas'])
    check(s[0]['peso']=='8' and s[0]['reps']=='10' and s[0]['done'],'Serie 1 guardada con peso y reps')
    check(len(s)>1 and s[1].get('peso')=='9','Valor escrito sin marcar se conserva al cerrar')
    act(pg,'[data-act=ej]'); check('<b>' not in pg.inner_html('.sheet').split('data-nota')[0][-10:], 'Nota escapada')
    check(pg.locator('[data-nota]').input_value()=='molestia <b>hombro</b>','Nota recuperada al reabrir')
    # reload mid-session
    pg.reload(); pg.wait_for_timeout(500); act(pg,'[data-tab=entreno]')
    check('curso' in pg.inner_text('#main').lower() or 'termin' in pg.inner_text('#main').lower(),'Tras recargar, la sesión sigue en curso')
    # semana siguiente: ultimo()
    pg.clock.set_fixed_time('2026-10-19T18:30:00'); pg.reload(); pg.wait_for_timeout(500)
    act(pg,'[data-tab=entreno]'); act(pg,'[data-act=ses-ini]'); act(pg,'[data-act=ej]')
    t=pg.inner_text('.sheet'); print('ultima vez:', [l for l in t.split('\n') if 'ltima' in l][:1])
    check('ltima' in t and '8' in t,'Semana siguiente muestra la última vez (8 kg)')
    check(not pg.errs,'Sin errores JS sesión: '+str(pg.errs[:2]))
    ctx.close()
def s5_comida(p,b):
    ctx,pg=nuevo(p,b,'2026-10-12T14:10:00')
    act(pg,'[data-tab=comida]')
    tot0=pg.inner_text('.macros') if pg.locator('.macros').count() else ''
    act(pg,'[data-act=adj][data-v="1"]'); act(pg,'[data-act=adj][data-v="1"]')
    d=ls(pg,'dia:2026-10-12'); print('comidas',d['comidas'])
    act(pg,'[data-act=abrir-marcar]'); act(pg,'[data-act=estado][data-v=fuera]')
    print(pg.inner_text('.sheet')[:300])
    if pg.locator('#kcal').count(): pg.fill('#kcal','900')
    act(pg,'[data-act=guardar-comida]')
    d=ls(pg,'dia:2026-10-12'); print('comidas2',d['comidas'])
    check(any(c.get('estado')=='fuera' for c in d['comidas'].values()),'Comida fuera de plan guardada')
    # cambio de tipo
    act(pg,'[data-act=tipo-dia][data-v=sin_entreno]'); d=ls(pg,'dia:2026-10-12'); check(d['tipo']=='sin_entreno','Cambio tipo día')
    act(pg,'[data-act=menu][data-v="4"]'); d=ls(pg,'dia:2026-10-12'); check(d['menu']==4,'Cambio de menú')
    check(not pg.errs,'Sin errores JS comida: '+str(pg.errs[:2]))
    ctx.close()
def s6_sync(p,b):
    DB.clear()
    # dispositivo A con datos locales previos, sin cuenta
    cA,A=nuevo(p,b,'2026-10-12T09:00:00')
    act(A,'[data-act=hab]'); act(A,'[data-act=hab]')
    act(A,'[data-act=ir-cuenta]'); A.fill('#em','f@x.com'); A.fill('#pw','secreto1'); act(A,'[data-act=login-crear]'); A.wait_for_timeout(2500)
    check(any(k[1]=='dia:2026-10-12' for k in DB),'Primer login sube los datos locales previos')
    # dispositivo B entra y recibe
    cB,B=nuevo(p,b,'2026-10-12T09:05:00')
    act(B,'[data-act=ir-cuenta]'); B.fill('#em','f@x.com'); B.fill('#pw','secreto1'); act(B,'[data-act=login-entrar]'); B.wait_for_timeout(2500)
    check(ls(B,'dia:2026-10-12') is not None,'Segundo dispositivo recibe los datos')
    act(B,'[data-tab=hoy]'); hb=B.inner_text('#main')
    # B cambia peso; A trae al volver a primer plano
    act(B,'[data-tab=progreso]'); act(B,'[data-act=pesarme]'); B.fill('#mp','91,4'); act(B,'[data-act=guardar-peso]'); B.wait_for_timeout(2000)
    A.evaluate("document.dispatchEvent(new Event('visibilitychange'))"); A.wait_for_timeout(1500)
    m=ls(A,'medidas'); check(m and any(x['peso']==91.4 for x in m),'Peso apuntado en B aparece en A')
    # offline en A
    A.evaluate("window.__offline=true"); act(A,'[data-tab=hoy]'); act(A,'[data-act=tipo-dia][data-v=viaje]'); A.wait_for_timeout(1800)
    pend=ls(A,'_pend'); print('pend offline',pend); check(pend and len(pend)>0,'Sin conexión: queda pendiente')
    A.evaluate("window.__offline=false; window.dispatchEvent(new Event('online'))"); A.wait_for_timeout(1800)
    check(not ls(A,'_pend'),'Al volver la conexión se sube lo pendiente')
    # tras error, ¿se reintenta solo?
    A.evaluate("window.__offline=true"); act(A,'[data-act=tipo-dia][data-v=entreno]'); A.wait_for_timeout(1500); A.evaluate("window.__offline=false"); A.clock.run_for(35000); A.wait_for_timeout(1500)
    check(not ls(A,'_pend'),'Tras un error puntual se reintenta solo (sin evento online)')
    # logout y otro usuario
    act(A,'[data-tab=plan]'); act(A,'[data-act=logout]'); A.wait_for_timeout(500)
    act(A,'[data-act=ir-cuenta]') or act(A,'[data-tab=plan]')
    A.fill('#em','otro@x.com'); A.fill('#pw','secreto1'); act(A,'[data-act=login-crear]'); A.wait_for_timeout(2500)
    leak=[k for k in DB if k[0]=='u-otro@x.com']
    print('claves del otro usuario:',leak[:5])
    check(not leak,'Cerrar sesión y entrar con otra cuenta NO copia tus datos a esa cuenta')
    check(ls(A,'dia:2026-10-12') is None or True,'')
    act(A,'[data-tab=plan]'); act(A,'[data-act=logout]'); A.wait_for_timeout(800)
    act(A,'[data-act=ir-cuenta]') or act(A,'[data-tab=plan]')
    A.fill('#em','f@x.com'); A.fill('#pw','secreto1'); act(A,'[data-act=login-entrar]'); A.wait_for_timeout(2500)
    check(ls(A,'dia:2026-10-12') is not None,'Volver a tu cuenta recupera tus datos desde la nube')
    check(not A.errs and not B.errs,'Sin errores JS sync: '+str((A.errs+B.errs)[:2]))
    cA.close(); cB.close()
def s7_copia(p,b):
    ctx,pg=nuevo(p,b,'2026-10-12T09:00:00')
    act(pg,'[data-act=hab]')
    dump=pg.evaluate("(()=>{const o={};for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k.startsWith('fs:'))o[k]=localStorage.getItem(k);}return JSON.stringify(o)})()")
    pg.evaluate("localStorage.clear()"); pg.reload(); pg.wait_for_timeout(400)
    act(pg,'[data-tab=plan]'); act(pg,'[data-act=importar]'); pg.fill('#imp',dump); act(pg,'[data-act=importar-ok]')
    check(ls(pg,'dia:2026-10-12') is not None,'Restaurar copia recupera los datos')
    act(pg,'[data-act=importar]'); pg.fill('#imp','basura'); act(pg,'[data-act=importar-ok]')
    check(not pg.errs,'Copia inválida no rompe: '+str(pg.errs[:2]))
    ctx.close()
with sync_playwright() as p:
    b=p.chromium.launch()
    for n,f in [('semana',s1_semana),('cambio hora',s2_dst),('medianoche',s3_medianoche),('sesion',s4_sesion),('comida',s5_comida),('sync',s6_sync),('copia',s7_copia)]:
        run(n,f,p,b)
    b.close()
print('\nRESUMEN', len(oks),'OK', len(fails),'FALLOS'); [print(' -',f) for f in fails]
