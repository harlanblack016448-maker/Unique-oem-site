const test=require('node:test'), assert=require('node:assert/strict');
const create=require('../assets/growth.js');
function store(){const map=new Map();return {getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,v),removeItem:k=>map.delete(k),map};}
function setup(broken=false){
 const scripts=[], events=[], w={localStorage:store(),sessionStorage:store(),crypto:{randomUUID:()=> 'unique'},location:{pathname:'/solutions/8-electrode-oem',search:'?utm_source=linkedin&utm_campaign=a&email=secret',reload(){this.reloads=(this.reloads||0)+1;}},document:{addEventListener(){},getElementById(){return null;},createElement:()=>({}),head:{appendChild:s=>scripts.push(s)}}};
 if(broken) for(const name of ['localStorage','sessionStorage'])w[name]={getItem(){throw Error('blocked');},setItem(){throw Error('blocked');},removeItem(){throw Error('blocked');}};
 const app=create(w);return {w,app,scripts,events};
}
test('no decision or denial loads no script and stores no source',()=>{
 const {w,app,scripts}=setup();app.capture();assert.equal(w.sessionStorage.map.size,0);assert.equal(scripts.length,0);
 app.setChoice('denied');app.trackLead('123','one',true);assert.equal(scripts.length,0);assert.equal(w.sessionStorage.map.size,0);
 assert.equal(app.source().utm_source,'linkedin');assert.equal(app.source().email,undefined);
});
test('grant loads once; current campaign wins and ordinary navigation preserves last campaign',()=>{
 const {w,app,scripts}=setup();app.setChoice('granted');app.setChoice('granted');assert.equal(scripts.length,1);
 w.location.pathname='/contact';w.location.search='';app.capture();assert.equal(app.source().utm_campaign,'a');assert.equal(app.source().landing_path,'/solutions/8-electrode-oem');
 w.location.search='?utm_source=linkedin&utm_campaign=b';app.capture();w.location.search='';assert.equal(app.source().utm_campaign,'b');
 const meta=app.metadata('US-1');assert.equal(meta.inquiry_path,'/contact');assert.equal(meta.inquiry_id,'US-1');assert.ok(meta.submitted_at);
});
test('event sends no personal data and deduplicates; earlier nonconsented success is not backfilled',()=>{
 const {w,app}=setup();app.setChoice('granted');const calls=[];w.lintrk=(...args)=>calls.push(args);
 app.trackLead('123','one',false);assert.equal(calls.length,0);app.trackLead('123','two',true);app.trackLead('123','two',true);
 assert.equal(calls.length,1);assert.deepEqual(calls[0],['track',{conversion_id:'123'}]);
 w.lintrk=()=>{throw Error('blocked')};assert.doesNotThrow(()=>app.trackLead('123','three',true));
});
test('revoke clears session and pending events, reloads and cannot track afterwards',()=>{
 const {w,app}=setup();app.setChoice('granted');app.trackLead('123','one',true);assert.ok(w.lintrk.q.length);
 app.setChoice('denied');assert.equal(w.sessionStorage.map.size,0);assert.equal(w.lintrk.q.length,0);assert.equal(w.location.reloads,1);app.trackLead('123','two',true);assert.equal(w.lintrk.q.length,0);
});
test('blocked storage cannot break the form metadata or grant; sources do not persist',()=>{
 const {w,app}=setup(true);assert.doesNotThrow(()=>app.setChoice('granted'));assert.equal(app.choice(),'granted');assert.equal(app.metadata('US-1').utm_source,'linkedin');
 w.location.search='';assert.equal(app.metadata('US-2').source_status,'unknown');
});
test('expiry/version invalidation and URL field limits',()=>{
 const {w,app}=setup();w.localStorage.setItem('us_ads_consent',JSON.stringify({version:1,value:'granted',expires:Date.now()-1}));assert.equal(app.choice(),null);
 w.localStorage.setItem('us_ads_consent',JSON.stringify({version:2,value:'granted',expires:Date.now()+1000}));assert.equal(app.choice(),null);
 w.location.search='?utm_content='+encodeURIComponent('x'.repeat(300)+'\n')+'&_subject=evil';const m=app.metadata('US-1');assert.equal(m.utm_content.length,160);assert.equal(m._subject,undefined);assert.equal(m.source_status,'tagged');
});
