import os,sys
from playwright.sync_api import sync_playwright
root='/home/claude/francho-app'; out='shots'; estilo=sys.argv[1]
with sync_playwright() as p:
    b=p.chromium.launch()
    ctx=b.new_context(**p.devices['iPhone 13'], timezone_id='Europe/Madrid', locale='es-ES')
    pg=ctx.new_page(); errs=[]
    pg.on('pageerror',lambda e:errs.append(str(e)))
    pg.route('**/*supabase.co/**',lambda r:r.abort())
    pg.goto('file://'+root+'/index.html'); pg.evaluate(f"localStorage.setItem('fs:estilo', JSON.stringify('{estilo}'))"); pg.reload(); pg.wait_for_timeout(1500)
    n=[0]
    def shot(name):
        n[0]+=1; pg.wait_for_timeout(250); pg.screenshot(path=f'{out}/{estilo}-{n[0]:02d}-{name}.png')
    def click(sel,i=0):
        L=pg.locator(sel)
        if L.count()>i:
            try: L.nth(i).click(timeout=3000); return True
            except Exception as e: print('noclick',sel); return False
        print('missing',sel); return False
    def close():
        if pg.locator('[data-act=cerrar]').count(): pg.locator('[data-act=cerrar]').first.click(timeout=3000)
        elif pg.locator('.sheet-wrap').count(): pg.mouse.click(195,20)
        pg.wait_for_timeout(150)
    shot('hoy'); pg.mouse.wheel(0,600); shot('hoy2'); pg.mouse.wheel(0,-2000)
    click('[data-act=hab]'); click('[data-act=marcar-rapido]'); shot('hoy-marcado')
    click('[data-tab=entreno]'); shot('entreno'); pg.mouse.wheel(0,700); shot('entreno2'); pg.mouse.wheel(0,-3000)
    if click('[data-act=ses-ini]'): shot('sesion')
    if click('[data-act=ej]'): shot('ejercicio')
    if click('[data-act=serie]'): shot('serie-timer')
    close()
    if click('[data-act=cardio]'): shot('cardio'); close()
    if click('[data-act=metodo]'): shot('metodo'); close()
    click('[data-tab=comida]'); shot('comida'); pg.mouse.wheel(0,700); shot('comida2'); pg.mouse.wheel(0,-3000)
    for a in ['abrir-marcar','semana','platos','equiv']:
        if click(f'[data-act={a}]'): shot(a); close()
    click('[data-tab=progreso]'); shot('progreso'); pg.mouse.wheel(0,700); shot('progreso2'); pg.mouse.wheel(0,-3000)
    if click('[data-act=pesarme]'): shot('pesarme'); close()
    click('[data-tab=plan]'); shot('plan'); pg.mouse.wheel(0,3000); shot('plan2')
    print('errors',errs)
    b.close()
