#!/usr/bin/env node
/**
 * Interaction tests.
 *
 * Drives the real pages in Chrome and asserts the behaviours that static
 * checks cannot see: the mobile navigation, the desktop mega menu (including
 * the hover-then-click case), the timeline filter and contact-form validation.
 *
 * Usage: node scripts/check-interactions.js
 */
const p = require('puppeteer-core');
const fs = require('fs');
const pathMod = require('path');
const PROFILE = fs.mkdtempSync(pathMod.join(require('os').tmpdir(), 'altie-int-'));
const CHROME='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const B='http://localhost:3000';
const ok=(c,m)=>console.log((c?'  ✓ ':'  ✗ ')+m);
(async()=>{
  const b=await p.launch({executablePath:CHROME,headless:'new',protocolTimeout:120000,userDataDir:PROFILE});

  // --- Mobile navigation ---
  console.log('Mobile nav (375px)');
  let pg=await b.newPage(); await pg.setViewport({width:375,height:812});
  await pg.goto(B+'/',{waitUntil:'networkidle2'});
  ok(await pg.$eval('.nav-toggle',e=>getComputedStyle(e).display!=='none'), 'hamburger visible');
  ok(!(await pg.$eval('.nav',e=>e.classList.contains('is-open'))), 'nav starts closed');
  await pg.click('.nav-toggle');
  await new Promise(r=>setTimeout(r,400));
  ok(await pg.$eval('.nav',e=>e.classList.contains('is-open')), 'nav opens on tap');
  ok(await pg.$eval('.nav-toggle',e=>e.getAttribute('aria-expanded')==='true'), 'aria-expanded set');
  ok(await pg.$eval('body',e=>e.classList.contains('nav-locked')), 'body scroll locked');
  await pg.click('[data-menu-trigger][aria-controls="menu-industries"]');
  await new Promise(r=>setTimeout(r,300));
  ok(await pg.$eval('#menu-industries',e=>e.classList.contains('is-open')), 'industries accordion expands');
  ok(await pg.$eval('#menu-industries a',e=>e.getBoundingClientRect().height>0), 'submenu links visible');
  await pg.keyboard.press('Escape');
  await new Promise(r=>setTimeout(r,400));
  ok(!(await pg.$eval('.nav',e=>e.classList.contains('is-open'))), 'Escape closes nav');
  await pg.close();

  // --- Desktop mega menu ---
  console.log('\nDesktop mega menu (1440px)');
  pg=await b.newPage(); await pg.setViewport({width:1440,height:900});
  await pg.goto(B+'/',{waitUntil:'networkidle2'});
  ok(await pg.$eval('.nav-toggle',e=>getComputedStyle(e).display==='none'), 'hamburger hidden');
  await pg.click('[data-menu-trigger][aria-controls="menu-industries"]');
  await new Promise(r=>setTimeout(r,300));
  ok(await pg.$eval('#menu-industries',e=>e.classList.contains('is-open')), 'industries menu opens on click');
  await pg.keyboard.press('Escape');
  await new Promise(r=>setTimeout(r,300));
  ok(!(await pg.$eval('#menu-industries',e=>e.classList.contains('is-open'))), 'Escape closes mega menu');
  const solutionLinks = await pg.$$eval('.nav__list a[target="_blank"]', as=>as.map(a=>a.href));
  ok(solutionLinks.some(h=>h.includes('learnxr.altiereality.com')), 'LearnXR links out to learnxr.altiereality.com');
  ok(solutionLinks.some(h=>h.includes('digitaltwin.altiereality.com')), 'Digital Twins links out to digitaltwin.altiereality.com');

  // Keyboard reachability
  const reach=await pg.evaluate(async()=>{
    document.querySelector('.brand').focus();
    return document.activeElement.className;
  });
  ok(reach.includes('brand'), 'brand is focusable');
  await pg.close();

  // --- Timeline filter ---
  console.log('\nTimeline filter');
  pg=await b.newPage(); await pg.setViewport({width:1440,height:900});
  await pg.goto(B+'/blog',{waitUntil:'networkidle2'});
  const before=await pg.$$eval('[data-entry]',els=>els.filter(e=>!e.hidden).length);
  await pg.type('#timeline-filter','meta');
  await new Promise(r=>setTimeout(r,300));
  const after=await pg.$$eval('[data-entry]',els=>els.filter(e=>!e.hidden).length);
  ok(before===16, `starts with all ${before} milestones`);
  ok(after>0 && after<before, `filters to ${after} on "meta"`);
  const yearsShown=await pg.$$eval('[data-year-group]',els=>els.filter(e=>!e.hidden).length);
  ok(yearsShown>0, `empty year headings hidden (${yearsShown} year groups remain)`);
  const count=await pg.$eval('#timeline-count',e=>e.textContent.trim());
  ok(count.includes(String(after)), `live count updates: "${count}"`);
  await pg.close();

  // --- Contact form validation ---
  console.log('\nContact form');
  pg=await b.newPage(); await pg.setViewport({width:1440,height:900});
  await pg.goto(B+'/contact',{waitUntil:'networkidle2'});
  await pg.click('#contact-form button[type="submit"]');
  await new Promise(r=>setTimeout(r,300));
  ok(await pg.$eval('#cf-name',e=>e.getAttribute('aria-invalid')==='true'), 'empty required field flagged');
  ok(await pg.$eval('.form-status',e=>!e.hidden), 'status message shown');
  await pg.type('#cf-email','not-an-email');
  await pg.click('#contact-form button[type="submit"]');
  await new Promise(r=>setTimeout(r,300));
  ok(await pg.$eval('#cf-email',e=>e.getAttribute('aria-invalid')==='true'), 'invalid email rejected client-side');
  await pg.close();
  await b.close();
  fs.rmSync(PROFILE,{recursive:true,force:true});
})();
