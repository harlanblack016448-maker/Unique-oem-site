const test=require('node:test'), assert=require('node:assert/strict');
const fs=require('node:fs'), vm=require('node:vm'), path=require('node:path');
const ROOT=path.join(__dirname,'..');
const R=(l,t,w,h)=>({left:l,top:t,right:l+w,bottom:t+h,width:w,height:h});

function read(rel){return fs.readFileSync(path.join(ROOT,rel),'utf8');}

test('chat FAB media selector is section-scoped (not bare main)',()=>{
  const src=read('assets/chat-widget.js');
  const m=src.match(/var FAB_MEDIA = "([^"]+)"/);
  assert.ok(m); assert.match(m[1],/^section img/); assert.doesNotMatch(m[1],/\bmain\b/);
});

test('occluding rule cancels uschat-pop fill so opacity cannot stick at 1',()=>{
  const css=read('assets/chat-widget.css');
  // Pop animation must not use fill-mode both/forwards (that pins opacity:1).
  const pop=css.match(/\.uschat-fab\.uschat-in\s*\{([^}]*)\}/);
  assert.ok(pop,'uschat-in rule');
  assert.match(pop[1],/animation:\s*uschat-pop/);
  assert.doesNotMatch(pop[1],/\bboth\b|\bforwards\b/);
  // Occluding must win against .uschat-in: cancel animation + hide for real.
  const occ=css.match(/\.uschat-fab\.uschat-in\.uschat-occluding\s*,\s*\.uschat-fab\.uschat-occluding\s*\{([^}]*)\}/);
  assert.ok(occ,'combined occluding selector (beats .uschat-in specificity)');
  assert.match(occ[1],/animation:\s*none/);
  assert.match(occ[1],/opacity:\s*0/);
  assert.match(occ[1],/visibility:\s*hidden/);
  assert.match(occ[1],/pointer-events:\s*none/);
  // Source order: occluding block after uschat-in
  assert.ok(css.indexOf('.uschat-fab.uschat-in') < css.indexOf('.uschat-fab.uschat-in.uschat-occluding'));
});

test('FAB nests inside .uschat-root; panel z-index above FAB (Close wins hits)',()=>{
  const js=read('assets/chat-widget.js');
  assert.match(js,/root\.appendChild\(fab\)/);
  assert.doesNotMatch(js,/document\.body\.appendChild\(fab\)/);
  const css=read('assets/chat-widget.css');
  const rootZ=css.match(/\.uschat-root\s*\{[^}]*z-index:\s*(\d+)/);
  const fabZ=css.match(/\.uschat-fab\s*\{[^}]*z-index:\s*(\d+)/);
  const panelZ=css.match(/\.uschat-panel\s*\{[^}]*z-index:\s*(\d+)/);
  assert.ok(rootZ && fabZ && panelZ);
  assert.equal(Number(rootZ[1]),10000);
  assert.ok(Number(panelZ[1]) > Number(fabZ[1]), `panel ${panelZ[1]} must be above fab ${fabZ[1]}`);
});

test('css drops raised FAB when quote pill is occluding',()=>{
  const css=read('assets/chat-widget.css');
  assert.match(css,/body:has\(\.sticky-cta\.is-visible\.is-occluding\) \.uschat-fab\s*\{\s*bottom:\s*calc\(24px/);
});

test('fab overlap helper detects lab-photo under raised FAB and clears otherwise',()=>{
  const src=read('assets/chat-widget.js');
  const w={
    __usChatLoaded:false,
    setTimeout(){return 1;}, clearTimeout(){},
    document:{
      readyState:'complete', activeElement:null,
      addEventListener(){}, querySelector(){return null;}, querySelectorAll(){return [];},
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
});

test('capabilities lab photos remain outside #main (regression for media scope)',()=>{
  const html=read('capabilities.html');
  const mainEnd=html.indexOf('</section>', html.indexOf('id="main"'));
  assert.ok(html.indexOf('studio-drop.jpg')>mainEnd);
});
