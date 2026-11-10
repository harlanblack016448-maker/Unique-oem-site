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

/* --- closed-panel focus lifecycle (behavioral) --- */
function makeFocusEnv(opts){
  opts = opts || {};
  const listeners = new Map(); // el -> [{type,fn}]
  function on(el, type, fn){
    if (!listeners.has(el)) listeners.set(el, []);
    listeners.get(el).push({type, fn});
  }
  function emit(el, type, ev){
    const list = listeners.get(el) || [];
    list.filter(x => x.type === type).forEach(x => x.fn(ev || {}));
  }
  function makeEl(tag){
    const attrs = {};
    const kids = [];
    const classSet = new Set();
    const el = {
      tagName: String(tag || 'div').toUpperCase(),
      style: {},
      children: kids,
      parent: null,
      disabled: false,
      type: undefined,
      value: '',
      placeholder: '',
      href: '',
      textContent: '',
      innerHTML: '',
      get className(){ return [...classSet].join(' '); },
      set className(v){
        classSet.clear();
        String(v || '').split(/\s+/).filter(Boolean).forEach(c => classSet.add(c));
      },
      classList: {
        add(c){ classSet.add(c); },
        remove(c){ classSet.delete(c); },
        toggle(c, force){
          if (force === true) classSet.add(c);
          else if (force === false) classSet.delete(c);
          else if (classSet.has(c)) classSet.delete(c); else classSet.add(c);
          return classSet.has(c);
        },
        contains(c){ return classSet.has(c); },
      },
      setAttribute(k,v){ attrs[k] = String(v); },
      getAttribute(k){ return Object.prototype.hasOwnProperty.call(attrs,k) ? attrs[k] : null; },
      removeAttribute(k){ delete attrs[k]; },
      hasAttribute(k){ return Object.prototype.hasOwnProperty.call(attrs,k); },
      appendChild(c){ c.parent = el; kids.push(c); return c; },
      contains(n){
        let x = n;
        while (x){ if (x === el) return true; x = x.parent; }
        return false;
      },
      addEventListener(type, fn){ on(el, type, fn); },
      focus(){ env.document.activeElement = el; },
      blur(){ if (env.document.activeElement === el) env.document.activeElement = env.document.body; },
      getBoundingClientRect(){
        if (el._rect) return el._rect;
        if (classSet.has('uschat-fab')) return opts.fabRect || R(1206, 720, 56, 56);
        return R(0,0,0,0);
      },
      click(){ emit(el, 'click', { preventDefault(){} }); },
      _emit: (type, ev) => emit(el, type, ev),
      _attrs: attrs,
    };
    return el;
  }

  const body = makeEl('body');
  body.classList = {
    _s: new Set(),
    add(c){ this._s.add(c); },
    remove(c){ this._s.delete(c); },
    toggle(c, force){
      if (force === true) this._s.add(c);
      else if (force === false) this._s.delete(c);
      else if (this._s.has(c)) this._s.delete(c); else this._s.add(c);
      return this._s.has(c);
    },
    contains(c){ return this._s.has(c); },
  };
  const head = makeEl('head');
  const media = (opts.mediaRects || []).map(r => {
    const n = makeEl('img');
    n._rect = r;
    return n;
  });

  const env = {
    __usChatLoaded: false,
    setTimeout(fn){ return 1; },
    clearTimeout(){},
    localStorage: { getItem(){ return null; }, setItem(){} },
    navigator: { language: 'en' },
    location: { pathname: '/capabilities' },
    requestAnimationFrame(cb){ cb(); },
    MutationObserver: function(){ this.observe = function(){}; },
    addEventListener(){},
    fetch(){ return Promise.reject(new Error('offline')); },
    document: {
      readyState: 'complete',
      activeElement: null,
      head,
      body,
      addEventListener(type, fn){ on(env.document, type, fn); },
      _emit(type, ev){ emit(env.document, type, ev); },
      querySelector(sel){
        if (sel === 'link[data-us-chat-css]') return null;
        if (sel === '.sticky-cta') return null;
        return null;
      },
      querySelectorAll(sel){
        if (String(sel).indexOf('section img') === 0) return media;
        return [];
      },
      createElement(tag){ return makeEl(tag); },
    },
  };
  env.document.activeElement = body;
  env.window = env;
  // Mark CSS ready path: createElement('link') gets onload fired via ensureCss timeout/onload — we force via setTimeout noop + immediate onReady via error path.
  // ensureCss appends link and setTimeout(once,1200). Our setTimeout ignores delay but doesn't call. Patch:
  env.setTimeout = function(fn){ try { fn(); } catch(e){} return 1; };
  return env;
}

test('closed panel is inert/aria-hidden; open clears; close restores focus without ghost chips',()=>{
  const env = makeFocusEnv({
    fabRect: R(1206, 720, 56, 56),
    mediaRects: [], // no occlusion — FAB should receive focus back
  });
  const src = read('assets/chat-widget.js');
  vm.runInNewContext(src, env);

  const root = env.document.body.children.find(c => c.classList.contains('uschat-root'));
  assert.ok(root, 'root mounted');
  const panel = root.children.find(c => c.className === 'uschat-panel' || c.classList.contains('uschat-panel'));
  const fab = root.children.find(c => c.classList.contains('uschat-fab'));
  assert.ok(panel && fab);

  // initialize closed: inert + aria-hidden
  assert.equal(panel.getAttribute('inert'), '');
  assert.equal(panel.getAttribute('aria-hidden'), 'true');
  assert.equal(env.document.body.classList.contains('uschat-open'), false);

  // chips exist and would be tabbable without inert
  const chips = panel.children.find(c => c.classList.contains('uschat-chips'));
  assert.ok(chips && chips.children.length >= 1);
  const moq = chips.children[0];
  assert.match(moq.textContent, /MOQ/i);

  // open via FAB click
  fab.click();
  assert.equal(env.document.body.classList.contains('uschat-open'), true);
  assert.equal(panel.hasAttribute('inert'), false);
  assert.equal(panel.getAttribute('aria-hidden'), 'false');
  // input focused on open
  const inputbar = panel.children.find(c => c.classList.contains('uschat-inputbar'));
  const input = inputbar.children.find(c => c.tagName === 'INPUT');
  assert.equal(env.document.activeElement, input);

  // simulate user tabbing to MOQ chip while open (allowed)
  moq.focus();
  assert.equal(env.document.activeElement, moq);

  // mouseClose via head close button
  const head = panel.children.find(c => c.classList.contains('uschat-head'));
  const closeBtn = head.children.find(c => c.classList.contains('uschat-head-close'));
  closeBtn.click();
  assert.equal(env.document.body.classList.contains('uschat-open'), false);
  assert.equal(panel.getAttribute('inert'), '');
  assert.equal(panel.getAttribute('aria-hidden'), 'true');
  // focus restored to FAB opener (visible, no occlusion)
  assert.equal(env.document.activeElement, fab);
  // ghost chip must not remain focused
  assert.notEqual(env.document.activeElement, moq);
});

test('Escape close applies inert and restores focus to FAB when not occluding',()=>{
  const env = makeFocusEnv({ fabRect: R(1206, 720, 56, 56), mediaRects: [] });
  vm.runInNewContext(read('assets/chat-widget.js'), env);
  const root = env.document.body.children.find(c => c.classList.contains('uschat-root'));
  const panel = root.children.find(c => c.classList.contains('uschat-panel'));
  const fab = root.children.find(c => c.classList.contains('uschat-fab'));
  fab.click();
  assert.ok(env.document.body.classList.contains('uschat-open'));
  const chips = panel.children.find(c => c.classList.contains('uschat-chips'));
  chips.children[0].focus();
  env.document._emit('keydown', { key: 'Escape' });
  assert.equal(env.document.body.classList.contains('uschat-open'), false);
  assert.equal(panel.getAttribute('inert'), '');
  assert.equal(panel.getAttribute('aria-hidden'), 'true');
  assert.equal(env.document.activeElement, fab);
});

test('mouseClose over lab media: closed panel inert; FAB occluded not focused (no ghost focus)',()=>{
  // Raised FAB rect overlaps lab photo — occlusion path
  const env = makeFocusEnv({
    fabRect: R(1206, 660, 56, 56),
    mediaRects: [R(640, 400, 600, 320)],
  });
  vm.runInNewContext(read('assets/chat-widget.js'), env);
  const root = env.document.body.children.find(c => c.classList.contains('uschat-root'));
  const panel = root.children.find(c => c.classList.contains('uschat-panel'));
  const fab = root.children.find(c => c.classList.contains('uschat-fab'));
  fab.click();
  const chips = panel.children.find(c => c.classList.contains('uschat-chips'));
  chips.children[0].focus();
  const head = panel.children.find(c => c.classList.contains('uschat-head'));
  head.children.find(c => c.classList.contains('uschat-head-close')).click();
  assert.equal(panel.getAttribute('inert'), '');
  assert.equal(panel.getAttribute('aria-hidden'), 'true');
  assert.ok(fab.classList.contains('uschat-occluding'));
  assert.equal(fab.getAttribute('aria-hidden'), 'true');
  assert.equal(fab.getAttribute('tabindex'), '-1');
  // Must NOT leave focus on MOQ chip; must NOT focus occluded FAB
  assert.notEqual(env.document.activeElement, chips.children[0]);
  assert.notEqual(env.document.activeElement, fab);
});

test('CSS closed panel uses visibility:hidden; open makes visible (no ghost pointer/focus)',()=>{
  const css = read('assets/chat-widget.css');
  const closed = css.match(/\.uschat-panel\s*\{([^}]*)\}/);
  assert.ok(closed);
  assert.match(closed[1], /visibility:\s*hidden/);
  assert.match(closed[1], /pointer-events:\s*none/);
  const opened = css.match(/\.uschat-open\s+\.uschat-panel\s*\{([^}]*)\}/);
  assert.ok(opened);
  assert.match(opened[1], /visibility:\s*visible/);
  assert.match(opened[1], /pointer-events:\s*auto/);
});

test('setOpen source sets inert on close and clears on open; restores focus helper present',()=>{
  const js = read('assets/chat-widget.js');
  assert.match(js, /panel\.setAttribute\("inert",\s*""\)/);
  assert.match(js, /panel\.removeAttribute\("inert"\)/);
  assert.match(js, /restoreFocusAfterClose/);
  assert.match(js, /aria-hidden",\s*"true"/);
  // init closed inert before mount
  const initIdx = js.indexOf('panel.setAttribute("inert"');
  const appendIdx = js.indexOf('root.appendChild(panel)');
  assert.ok(initIdx > 0 && initIdx < appendIdx);
});
