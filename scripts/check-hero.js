const p=require('puppeteer-core');const fs=require('fs'),pm=require('path');
const PR=fs.mkdtempSync(pm.join(require('os').tmpdir(),'altie-hv-'));
const ok=(c,m)=>console.log((c?'  ✓ ':'  ✗ ')+m);
(async()=>{
const b=await p.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:'new',protocolTimeout:180000,userDataDir:PR});

console.log('Overlap: wheel left edge vs h1 right edge');
for (const wd of [960,1024,1136,1280,1440,1920]) {
  const pg=await b.newPage(); await pg.setViewport({width:wd,height:900});
  await pg.goto('http://localhost:3000/',{waitUntil:'networkidle2'});
  await new Promise(r=>setTimeout(r,1800));
  const g=await pg.evaluate(()=>{
    const cv=document.getElementById('hero-field'); const r=cv.getBoundingClientRect();
    const st=window.__heroDebug && window.__heroDebug();
    const h1=document.querySelector('.hero h1').getBoundingClientRect();
    const lead=document.querySelector('.hero__lead').getBoundingClientRect();
    if(!st) return {narrow:null};
    const f=1/Math.tan(st.fov/2), aspect=cv.width/cv.height, d=-st.dist;
    const leftNdc=(f/aspect)*(st.offsetX-st.radius)/d;
    const leftPx=r.left+(0.5+leftNdc/2)*r.width;
    return {narrow:st.narrow, leftPx:Math.round(leftPx), h1Right:Math.round(h1.right), leadRight:Math.round(lead.right)};
  });
  if(g.narrow===null){ console.log(`  ${wd}px  (debug hook missing)`); }
  else if(g.narrow){ ok(true, `${wd}px  backdrop mode (wheel dimmed behind copy)`); }
  else ok(g.leftPx > g.h1Right, `${wd}px  wheel@${g.leftPx} vs h1@${g.h1Right} / lead@${g.leadRight}`);
  await pg.close();
}

console.log('\nInteraction (1440px)');
const pg=await b.newPage(); await pg.setViewport({width:1440,height:900});
await pg.goto('http://localhost:3000/',{waitUntil:'networkidle2'});
await new Promise(r=>setTimeout(r,2000));

const r=await pg.evaluate(()=>{const c=document.getElementById('hero-field').getBoundingClientRect();return {l:c.left,t:c.top,w:c.width,h:c.height};});
const cx=Math.round(r.l+r.w*0.80), cy=Math.round(r.t+r.h*0.50);

// hit-test target
const hit=await pg.evaluate((x,y)=>{const e=document.elementFromPoint(x,y);return e?{tag:e.tagName,inHero:!!e.closest('.hero')}:null;},cx,cy);
ok(hit && hit.inHero, 'pointer over the wheel resolves inside .hero');

// hover label
await pg.mouse.move(cx,cy); await new Promise(r=>setTimeout(r,400));
const lab=await pg.evaluate(()=>{const l=document.getElementById('hero-carousel-label');return {hidden:l.hidden,text:l.textContent.trim()};});
ok(!lab.hidden && lab.text.length>0, `hover shows sector label: "${lab.text}"`);

// drag rotates
const before=await pg.evaluate(()=>window.__heroDebug().spin);
await pg.mouse.move(cx,cy); await pg.mouse.down();
for(let i=1;i<=10;i++){ await pg.mouse.move(cx-i*14, cy); await new Promise(r=>setTimeout(r,16)); }
await pg.mouse.up();
await new Promise(r=>setTimeout(r,300));
const after=await pg.evaluate(()=>window.__heroDebug().spin);
ok(Math.abs(after-before)>0.05, `drag rotates the wheel (spin ${before.toFixed(3)} → ${after.toFixed(3)})`);

// a drag must not navigate
ok(pg.url().endsWith('/') || pg.url().endsWith('3000/'), 'a drag did not navigate away');

// buttons still work
const btn=await pg.evaluate(()=>{const a=document.querySelector('.hero .btn--primary');const b=a.getBoundingClientRect();return {x:Math.round(b.x+b.width/2),y:Math.round(b.y+b.height/2),href:a.href};});
const blocked=await pg.evaluate((x,y)=>{const e=document.elementFromPoint(x,y);return !!(e&&e.closest('.btn'));},btn.x,btn.y);
ok(blocked,'the CTA button is still the hit target over itself');

// a11y links present
const a11y=await pg.evaluate(()=>document.querySelectorAll('.hero nav[aria-label="Sectors"] a').length);
ok(a11y===7, `keyboard/screen-reader sector links present (${a11y})`);

// a genuine tap navigates to the sector under the cursor.
// Let the throw from the drag test decay first, otherwise the wheel is still
// spinning and the blade under the cursor changes between aim and release.
await pg.evaluate(() => new Promise((done) => {
  (function wait(){
    if (Math.abs(window.__heroDebug().spinVel) < 0.02) return done();
    setTimeout(wait, 100);
  })();
}));

let picked = -1, px = cx, py = cy;
for (const fx of [0.80, 0.86, 0.74, 0.92, 0.68]) {
  px = Math.round(r.l + r.w * fx); py = Math.round(r.t + r.h * 0.52);
  await pg.mouse.move(px, py);
  await new Promise(rr => setTimeout(rr, 250));
  picked = await pg.evaluate(() => window.__heroDebug().hover);
  if (picked >= 0) break;
}
ok(picked >= 0, 'a blade is pickable under the cursor');
if (picked >= 0) {
  const route = await pg.evaluate(() => window.__ALTIE_CAROUSEL__[window.__heroDebug().hover].route);
  await pg.mouse.down(); await pg.mouse.up();
  await pg.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 8000 }).catch(() => {});
  ok(new URL(pg.url()).pathname === route,
     `tap opened ${route} (got ${new URL(pg.url()).pathname})`);
}
await pg.close(); await b.close(); fs.rmSync(PR,{recursive:true,force:true});})();
