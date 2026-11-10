const test=require('node:test'), assert=require('node:assert/strict');
const fs=require('node:fs'), vm=require('node:vm'), path=require('node:path');
const ROOT=path.join(__dirname,'..');
const R=(l,t,w,h)=>({left:l,top:t,right:l+w,bottom:t+h,width:w,height:h});

test('chat FAB media selector is section-scoped (not bare main)',()=>{
  const src=fs.readFileSync(path.join(ROOT,'assets/chat-widget.js'),'utf8');
  const m=src.match(/var FAB_MEDIA = "([^"]+)"/);
  assert.ok(m,'FAB_MEDIA defined');
  assert.match(m[1],/^section img/);
  assert.doesNotMatch(m[1],/\bmain\b/);
  assert.match(m[1],/\.model-chip/);
  assert.match(src,/watchFabOcclusion/);
  assert.match(src,/uschat-occluding/);
  assert.match(src,/uschat-open/);
});

test('css fades occluding FAB and drops raised FAB when quote pill is occluding',()=>{
  const css=fs.readFileSync(path.join(ROOT,'assets/chat-widget.css'),'utf8');
  assert.match(css,/\.uschat-fab\.uschat-occluding\s*\{\s*opacity:\s*0;\s*pointer-events:\s*none\s*;?\s*\}/);
  assert.match(css,/body:has\(\.sticky-cta\.is-visible\.is-occluding\) \.uschat-fab\s*\{\s*bottom:\s*calc\(24px/);
});

test('fab overlap helper detects lab-photo under raised FAB and clears otherwise',()=>{
  const src=fs.readFileSync(path.join(ROOT,'assets/chat-widget.js'),'utf8');
  const timers=[];
  const w={
    __usChatLoaded:false,
    setTimeout(fn){timers.push(fn);return 1;},
    clearTimeout(){},
    document:{
      readyState:'complete',
      activeElement:null,
      addEventListener(){},
      querySelector(){return null;},
      querySelectorAll(){return [];},
      createElement(){return {style:{},setAttribute(){},removeAttribute(){},appendChild(){},classList:{add(){},toggle(){},contains(){return false;}},addEventListener(){},contains(){return false;},getBoundingClientRect(){return R(0,0,56,56);}};},
      head:{appendChild(){}},
      body:{appendChild(){},classList:{contains(){return false;},toggle(){}},addEventListener(){},querySelector(){return null;}},
    },
    localStorage:{getItem(){return null;},setItem(){}},
    navigator:{language:'en'},
    requestAnimationFrame(cb){cb();},
    MutationObserver:function(){this.observe=function(){};},
    addEventListener(){},
  };
  w.window=w;
  vm.runInNewContext(src,w);
  assert.equal(typeof w.__fabOverlapsMedia,'function');
  const fab=R(1206,660,56,56);
  assert.equal(w.__fabOverlapsMedia(fab,[R(640,400,600,320)],8),true);
  assert.equal(w.__fabOverlapsMedia(fab,[R(100,100,400,200)],8),false);
  assert.equal(w.__fabOverlapsMedia(fab,[],8),false);
});

test('capabilities lab photos remain outside #main (regression for media scope)',()=>{
  const html=fs.readFileSync(path.join(ROOT,'capabilities.html'),'utf8');
  const mainEnd=html.indexOf('</section>', html.indexOf('id="main"'));
  assert.ok(html.indexOf('studio-drop.jpg')>mainEnd);
});
