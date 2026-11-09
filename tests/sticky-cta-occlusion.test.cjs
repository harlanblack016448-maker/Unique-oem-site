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
