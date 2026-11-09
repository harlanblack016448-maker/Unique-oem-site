const test=require('node:test'), assert=require('node:assert/strict');
const fs=require('node:fs'), vm=require('node:vm'), path=require('node:path');
function load(){const w={document:{addEventListener(){}}};w.window=w;vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../assets/partials.js'),'utf8'),w);return w.__ctaOverlapsMedia;}
const R=(l,t,w,h)=>({left:l,top:t,right:l+w,bottom:t+h,width:w,height:h});
// 1024x504 viewport, pill right:24 bottom:24 (~92x40) as in the 2026-11-08 QA shots.
const cta=R(900,440,92,40);
test('photo whose bottom-right corner sits under the pill is detected',()=>{
 const f=load();assert.equal(f(cta,[R(526,110,382,382)],8),true); // kitchen feature photo, ~8px under
 assert.equal(f(cta,[R(506,428,478,300)],8),true); // capabilities line photo
});
test('clear media, hidden media, and text-only areas do not hide the pill',()=>{
 const f=load();assert.equal(f(cta,[R(104,100,400,300),R(0,0,0,0)],8),false);assert.equal(f(cta,[],8),false);
 assert.equal(f(cta,[R(526,110,360,320)],8),false); // ends >8px left/above pill
});
test('css fades only the desktop pill and keeps mobile bar untouched',()=>{
 const css=fs.readFileSync(path.join(__dirname,'../assets/style.css'),'utf8');
 const desk=css.slice(css.indexOf('@media(min-width:821px){\n  .sticky-cta{'));
 assert.match(desk.slice(0,desk.indexOf('\n}\n')),/\.sticky-cta\.is-visible\.is-occluding\{opacity:0;[^}]*pointer-events:none\}/);
 const mob=css.slice(css.indexOf('@media(max-width:820px){\n  .sticky-cta{'));assert.doesNotMatch(mob.slice(0,mob.indexOf('\n}\n')),/is-occluding/);
});
