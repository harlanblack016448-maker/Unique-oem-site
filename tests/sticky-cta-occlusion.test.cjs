const test=require('node:test'), assert=require('node:assert/strict');
const fs=require('node:fs'), vm=require('node:vm'), path=require('node:path');
const ROOT=path.join(__dirname,'..');
function load(){const w={document:{addEventListener(){}}};w.window=w;vm.runInNewContext(fs.readFileSync(path.join(ROOT,'assets/partials.js'),'utf8'),w);return w.__ctaOverlapsMedia;}
const R=(l,t,w,h)=>({left:l,top:t,right:l+w,bottom:t+h,width:w,height:h});
const cta=R(900,440,92,40);
test('photo whose bottom-right corner sits under the pill is detected',()=>{
 const f=load();assert.equal(f(cta,[R(526,110,382,382)],8),true);
 assert.equal(f(cta,[R(506,428,478,300)],8),true);
});
test('clear media, hidden media, and text-only areas do not hide the pill',()=>{
 const f=load();assert.equal(f(cta,[R(104,100,400,300),R(0,0,0,0)],8),false);assert.equal(f(cta,[],8),false);
 assert.equal(f(cta,[R(526,110,360,320)],8),false);
});
test('css fades only the desktop pill and keeps mobile bar untouched',()=>{
 const css=fs.readFileSync(path.join(ROOT,'assets/style.css'),'utf8');
 const desk=css.slice(css.indexOf('@media(min-width:821px){\n  .sticky-cta{'));
 assert.match(desk.slice(0,desk.indexOf('\n}\n')),/\.sticky-cta\.is-visible\.is-occluding\{opacity:0;pointer-events:none\}/);
 const mob=css.slice(css.indexOf('@media(max-width:820px){\n  .sticky-cta{'));assert.doesNotMatch(mob.slice(0,mob.indexOf('\n}\n')),/is-occluding/);
});
test('media selector covers section photos outside #main (capabilities labs)',()=>{
 const src=fs.readFileSync(path.join(ROOT,'assets/partials.js'),'utf8');
 const m=src.match(/const CTA_MEDIA = "([^"]+)"/);
 assert.ok(m);assert.match(m[1],/^section img/);assert.doesNotMatch(m[1],/\bmain\b/);
 assert.match(m[1],/\.model-chip/);
 // capabilities lab imgs are siblings of #main, not descendants
 const html=fs.readFileSync(path.join(ROOT,'capabilities.html'),'utf8');
 assert.match(html,/id="main"/);
 assert.match(html,/studio-chamber\.jpg/);
 assert.match(html,/studio-drop\.jpg/);
 const mainEnd=html.indexOf('</section>', html.indexOf('id="main"'));
 assert.ok(mainEnd>0);
 assert.ok(html.indexOf('studio-drop.jpg')>mainEnd, 'lab photo must sit outside #main hero');
});
test('sticky CTA is hidden while #inquire is intersecting (hero already out)',()=>{
 const src=fs.readFileSync(path.join(ROOT,'assets/partials.js'),'utf8');
 assert.match(src,/document\.getElementById\("inquire"\)/);
 assert.match(src,/bar\.classList\.toggle\("is-visible", heroOut && !inquireIn && !footerIn\)/);
 assert.match(src,/if \(inquire && e\.target === inquire\) inquireIn = e\.isIntersecting/);
});
test('sticky CTA stays hidden at the footer after #inquire has scrolled out',()=>{
 // Home/bathroom mobile: once #inquire leaves the viewport, inquireIn
 // flips false and the full-width bar covered footer copyright. Observe
 // .site-footer with the same 0.12 threshold and require !footerIn.
 const src=fs.readFileSync(path.join(ROOT,'assets/partials.js'),'utf8');
 assert.match(src,/document\.querySelector\("\.site-footer"\)/);
 assert.match(src,/if \(footer && e\.target === footer\) footerIn = e\.isIntersecting/);
 assert.match(src,/if \(footer\) io\.observe\(footer\)/);
 assert.match(src,/bar\.classList\.toggle\("is-visible", heroOut && !inquireIn && !footerIn\)/);
});
test('desktop lab-grid uses the same right gutter as model-grid so chips clear the pill and FAB',()=>{
 const css=fs.readFileSync(path.join(ROOT,'assets/style.css'),'utf8');
 const desk=css.slice(css.indexOf('@media(min-width:821px){\n  .sticky-cta{'));
 // The gutter lives in this desktop block beside the pill rules.
 assert.match(desk, /\.model-grid,\s*\.grid-3,\s*\.lab-grid\{padding-right:168px\}/);
 assert.match(css, /\.site-footer\{padding:56px 16px calc\(96px \+ var\(--ads-lift, 0px\)\)\}/);
 assert.match(css, /padding:72px 32px calc\(96px \+ var\(--ads-lift, 0px\)\)/);
});
test('product and marketing CTA bands share the #inquire hook the observer already uses',()=>{
 // Old fail: bathroom (and the same tile-dark-2 destination on kitchen,
 // capabilities, about) had the inline quote button but no id="inquire",
 // so inquireIn stayed false and the fixed pill remained visible on the
 // destination copy. index.html and 8-electrode.html already had the id.
 const pages=[
  'products/bathroom.html',
  'products/kitchen.html',
  'products/8-electrode.html',
  'capabilities.html',
  'about.html',
  'index.html',
 ];
 for (const rel of pages){
  const html=fs.readFileSync(path.join(ROOT,rel),'utf8');
  const marks=[...html.matchAll(/<section[^>]*id="inquire"[^>]*>/g)];
  assert.equal(marks.length, 1, rel+' must have exactly one #inquire');
  const i=html.indexOf('id="inquire"');
  const after=html.slice(i, i+900);
  assert.ok(/btn-pill/.test(after) || /id="lead-form"/.test(after),
    rel+' #inquire must contain the inline quote CTA or the inquire form');
 }
 const bathroom=fs.readFileSync(path.join(ROOT,'products/bathroom.html'),'utf8');
 assert.match(bathroom, /<section class="tile tile-dark-2" id="inquire"/);
 assert.match(bathroom, /data-i18n="b\.cta\.title"/);
});
