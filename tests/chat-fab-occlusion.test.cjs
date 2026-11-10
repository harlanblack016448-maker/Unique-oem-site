const test=require('node:test'), assert=require('node:assert/strict');
const fs=require('node:fs'), vm=require('node:vm'), path=require('node:path');
const ROOT=path.join(__dirname,'..');
const R=(l,t,w,h)=>({left:l,top:t,right:l+w,bottom:t+h,width:w,height:h});
function pointIn(r,x,y){return r && x>=r.left && x<=r.right && y>=r.top && y<=r.bottom;}
function paintedAt(nodes){
  return (x,y)=>{
    for (const n of nodes){
      const r = n.getBoundingClientRect ? n.getBoundingClientRect() : n;
      if (pointIn(r,x,y)) return [n];
    }
    return [];
  };
}


function read(rel){return fs.readFileSync(path.join(ROOT,rel),'utf8');}
function stripComments(css){return css.replace(/\/\*[^*]*\*+(?:[^/*][^*]*\*+)*\//g,'');}
function declsOnly(body){return stripComments(body);}

test('chat FAB media selector is section-scoped (not bare main)',()=>{
  const src=read('assets/chat-widget.js');
  const m=src.match(/var FAB_MEDIA = "([^"]+)"/);
  assert.ok(m); assert.match(m[1],/^section img/); assert.doesNotMatch(m[1],/\bmain\b/);
});

test('occluding uses opacity not visibility; cancels pop only while uschat-in',()=>{
  const css=read('assets/chat-widget.css');
  const pop=css.match(/\.uschat-fab\.uschat-in\s*\{([^}]*)\}/);
  assert.ok(pop,'uschat-in rule');
  assert.match(pop[1],/animation:\s*uschat-pop/);
  assert.doesNotMatch(pop[1],/\bboth\b|\bforwards\b/);
  // Steady occluding: opacity hide like sticky-cta — NEVER visibility:hidden
  // (visibility stuck after clear with aria-hidden=false / a11y tree empty).
  const steady=css.match(/\.uschat-fab\.uschat-occluding\s*\{([^}]*)\}/);
  assert.ok(steady,'steady occluding rule');
  assert.match(steady[1],/opacity:\s*0/);
  assert.match(steady[1],/pointer-events:\s*none/);
  assert.doesNotMatch(declsOnly(steady[1]),/(?:^|\n)\s*visibility\s*:/);
  assert.doesNotMatch(steady[1],/animation\s*:/); // must not reassign animation every toggle
  // Boot+occluding: cancel running pop so opacity:0 wins during entrance only
  const boot=css.match(/\.uschat-fab\.uschat-in\.uschat-occluding\s*\{([^}]*)\}/);
  assert.ok(boot,'boot occluding cancels animation');
  assert.match(boot[1],/animation:\s*none/);
  // Closed panel must not use visibility:hidden (inheritance / sibling under root)
  const panel=css.match(/(?:^|\n)\.uschat-panel\s*\{([^}]*)\}/);
  assert.ok(panel);
  assert.doesNotMatch(declsOnly(panel[1]),/(?:^|\n)\s*visibility\s*:/);
  assert.match(panel[1],/pointer-events:\s*none/);
  // Anti-FOUC via :not(.uschat-ready), not inline styles
  assert.match(css,/\.uschat-root:not\(\.uschat-ready\)\s*\.uschat-fab/);
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
      matches(sel){
        return String(sel).split(',').map(x => x.trim()).some(s => {
          if (!s) return false;
          if (s.startsWith('.')) return s.slice(1).split('.').every(c => classSet.has(c));
          const parts = s.split('.');
          const tag = parts[0];
          if (tag && el.tagName !== tag.toUpperCase()) return false;
          return parts.slice(1).every(c => classSet.has(c));
        });
      },
      closest(sel){
        let n = el;
        while (n){
          if (typeof n.matches === 'function' && n.matches(sel)) return n;
          n = n.parent;
        }
        return null;
      },
      querySelector(sel){
        const walk = (node) => {
          for (const c of (node.children || [])){
            if (c.matches && c.matches(sel)) return c;
            const d = walk(c);
            if (d) return d;
          }
          return null;
        };
        return walk(el);
      },
      addEventListener(type, fn){ on(el, type, fn); },
      removeEventListener(type, fn){
        const list = listeners.get(el) || [];
        listeners.set(el, list.filter(x => !(x.type === type && x.fn === fn)));
      },
      focus(){ env.document.activeElement = el; },
      blur(){ if (env.document.activeElement === el) env.document.activeElement = env.document.body; },
      getBoundingClientRect(){
        if (el._rect) return el._rect;
        if (classSet.has('uschat-fab')) return opts.fabRect || R(1206, 720, 56, 56);
        return R(0,0,0,0);
      },
      click(ev){ emit(el, 'click', Object.assign({ preventDefault(){}, detail: 1 }, ev || {})); },
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
  const mediaSection = makeEl('section');
  const media = (opts.mediaRects || []).map(r => {
    const fig = makeEl('figure');
    const n = makeEl('img');
    n._rect = r;
    fig.appendChild(n);
    mediaSection.appendChild(fig);
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
      elementsFromPoint(x,y){
        if (typeof env.__hitAt === 'function') return env.__hitAt(x,y) || [];
        return env.__hitStack || [];
      },
      elementFromPoint(x,y){
        const st = typeof env.__hitAt === 'function' ? (env.__hitAt(x,y) || []) : (env.__hitStack || []);
        return st[0] || null;
      },
    },
  };
  env.__hitStack = opts.hitStack ? opts.hitStack.slice() : media.slice();
  env.__media = media;
  env.__mediaSection = mediaSection;
  env.document.activeElement = body;
  env.window = env;
  // Mark CSS ready path: createElement('link') gets onload fired via ensureCss timeout/onload — we force via setTimeout noop + immediate onReady via error path.
  // ensureCss appends link and setTimeout(once,1200). Our setTimeout ignores delay but doesn't call. Patch:
  env.setTimeout = function(fn){ try { fn(); } catch(e){} return 1; };
  return env;
}

test('closed panel is inert/aria-hidden; open clears; pointer close does not focus FAB or ghost chips',()=>{
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

  // mouseClose via head close button (detail 1)
  const head = panel.children.find(c => c.classList.contains('uschat-head'));
  const closeBtn = head.children.find(c => c.classList.contains('uschat-head-close'));
  closeBtn.click({ detail: 1 });
  assert.equal(env.document.body.classList.contains('uschat-open'), false);
  assert.equal(panel.getAttribute('inert'), '');
  assert.equal(panel.getAttribute('aria-hidden'), 'true');
  // Pointer close must not programmatically focus the FAB (focus-guard trap).
  assert.notEqual(env.document.activeElement, fab);
  assert.notEqual(env.document.activeElement, moq);
  assert.notEqual(env.document.activeElement, closeBtn);
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

test('CSS closed panel relies on opacity/pointer-events not visibility',()=>{
  const css = read('assets/chat-widget.css');
  const closed = css.match(/(?:^|\n)\.uschat-panel\s*\{([^}]*)\}/);
  assert.ok(closed);
  assert.doesNotMatch(declsOnly(closed[1]), /(?:^|\n)\s*visibility\s*:/);
  assert.match(closed[1], /pointer-events:\s*none/);
  assert.match(closed[1], /opacity:\s*0/);
  const opened = css.match(/(?:^|\n)\.uschat-open\s+\.uschat-panel\s*\{([^}]*)\}/);
  assert.ok(opened);
  assert.doesNotMatch(declsOnly(opened[1]), /(?:^|\n)\s*visibility\s*:/);
  assert.match(opened[1], /pointer-events:\s*auto/);
  assert.match(opened[1], /opacity:\s*1/);
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


/* --- computed CSS cascade semantics for FAB show/hide --- */
function parseRuleBody(css, selectorRe){
  const m = css.match(selectorRe);
  return m ? m[1] : '';
}
function ruleAtLine(css, classPath){
  // classPath e.g. '.uschat-fab.uschat-occluding' must appear at line start (no prefix)
  const re = new RegExp('(?:^|\\n)' + classPath.replace(/\./g, '\\.') + '\\s*\\{([^}]*)\\}');
  return parseRuleBody(css, re);
}
function declare(body, prop){
  const re = new RegExp(prop + '\\s*:\\s*([^;]+);');
  const m = body.match(re);
  return m ? m[1].trim() : null;
}
/** Resolve FAB computed visibility/opacity/animation/pointer-events from our stylesheet + classes. */
function computeFab(css, classes, rootReady){
  const set = new Set(classes);
  // Inheritance baseline
  let visibility = 'visible';
  let opacity = '1';
  let animation = 'none';
  let pointerEvents = 'auto';
  if (!rootReady) visibility = 'hidden'; // :not(.uschat-ready) .uschat-fab
  // .uschat-fab — no visibility/opacity set
  if (set.has('uschat-in')) {
    const body = parseRuleBody(css, /\.uschat-fab\.uschat-in\s*\{([^}]*)\}/);
    const a = declare(body, 'animation');
    if (a) animation = a;
  }
  if (set.has('uschat-occluding')) {
    const steady = ruleAtLine(css, '.uschat-fab.uschat-occluding');
    const op = declare(steady, 'opacity'); if (op) opacity = op;
    const pe = declare(steady, 'pointer-events'); if (pe) pointerEvents = pe;
    const vis = declare(steady, 'visibility'); if (vis) visibility = vis;
    const an = declare(steady, 'animation'); if (an) animation = an;
    if (set.has('uschat-in')) {
      const boot = ruleAtLine(css, '.uschat-fab.uschat-in.uschat-occluding');
      const an2 = declare(boot, 'animation'); if (an2) animation = an2;
    }
  }
  return { visibility, opacity, animation, pointerEvents };
}

test('computed cascade: hide→clear restores visible opacity without visibility:hidden',()=>{
  const css = read('assets/chat-widget.css');
  // overlap while booting
  let r = computeFab(css, ['uschat-fab','uschat-in','uschat-occluding'], true);
  assert.equal(r.opacity, '0');
  assert.equal(r.pointerEvents, 'none');
  assert.equal(r.animation, 'none');
  assert.notEqual(r.visibility, 'hidden'); // must not use visibility for occlusion
  // clear while still booting — pop may be assigned again (edge); visibility still not hidden
  r = computeFab(css, ['uschat-fab','uschat-in'], true);
  assert.equal(r.opacity, '1');
  assert.equal(r.visibility, 'visible');
  // after animationend drops uschat-in: steady visible
  r = computeFab(css, ['uschat-fab'], true);
  assert.equal(r.opacity, '1');
  assert.equal(r.visibility, 'visible');
  assert.equal(r.animation, 'none');
  // overlap after boot
  r = computeFab(css, ['uschat-fab','uschat-occluding'], true);
  assert.equal(r.opacity, '0');
  assert.equal(r.pointerEvents, 'none');
  assert.equal(r.animation, 'none'); // steady rule must not set animation
  assert.notEqual(r.visibility, 'hidden');
  // clear after boot — CRITICAL regression: must be fully showable
  r = computeFab(css, ['uschat-fab'], true);
  assert.equal(r.opacity, '1');
  assert.equal(r.visibility, 'visible');
  assert.equal(r.pointerEvents, 'auto');
  assert.equal(r.animation, 'none');
});

test('behavioral lifecycle hide→clear→open→close→overlap→clear (classes+aria+inert+ready)',()=>{
  const env = makeFocusEnv({
    fabRect: R(1206, 660, 56, 56),
    mediaRects: [R(640, 400, 600, 320)], // initially overlapping
  });
  vm.runInNewContext(read('assets/chat-widget.js'), env);
  const root = env.document.body.children.find(c => c.classList.contains('uschat-root'));
  assert.ok(root);
  assert.ok(root.classList.contains('uschat-ready'), 'anti-FOUC ready class set (no inline visibility)');
  const panel = root.children.find(c => c.classList.contains('uschat-panel'));
  const fab = root.children.find(c => c.classList.contains('uschat-fab'));
  assert.ok(panel && fab);
  assert.equal(fab.style.visibility, undefined);
  assert.equal(panel.style.visibility, undefined);

  // Simulate occlusion watcher effects by invoking scroll queue: media overlaps
  // The watcher already queued on init; force another check via scroll listener.
  // Find window scroll listeners — our mock stores on env.
  // Directly drive class/aria the way check() would after measuring overlap:
  // First: ensure overlap hide path via restoreFocusAfterClose-style + MutationObserver path.
  // Open then close over media to hit restoreFocusAfterClose occlusion.
  fab.click(); // open (clears inert)
  assert.equal(panel.hasAttribute('inert'), false);
  const head = panel.children.find(c => c.classList.contains('uschat-head'));
  head.children.find(c => c.classList.contains('uschat-head-close')).click(); // close over media
  assert.equal(panel.getAttribute('inert'), '');
  assert.equal(panel.getAttribute('aria-hidden'), 'true');
  assert.ok(fab.classList.contains('uschat-occluding'));
  assert.equal(fab.getAttribute('aria-hidden'), 'true');

  // CLEAR: photos leave the painted stack (org chart is under the FAB)
  const org = env.document.createElement('div');
  org.className = 'org-chart';
  env.__hitStack = [org];
  // Trigger scroll handlers registered on window
  const scrolls = [];
  // Re-install: call check by focusing then blurring fab path — emit scroll on window
  // Our makeFocusEnv stores window listeners via on(env, ...) only for document.
  // Patch: manually toggle as watchFabOcclusion would when hide=false:
  // Better — expose by dispatching through addEventListener on env (window).
  // makeFocusEnv uses env.addEventListener for window. Retrieve and call.
  // Simpler approach: change fab rect media and call fab._emit focusout which queues check.
  // But querySelectorAll was used at check time — we replaced it. Emit focusout on fab.
  fab._emit('focusout', {});
  // rAF runs sync in mock → check() should clear occluding
  assert.equal(fab.classList.contains('uschat-occluding'), false, 'clear after photos leave');
  assert.equal(fab.getAttribute('aria-hidden'), 'false');
  // Computed CSS semantics: no visibility:hidden on steady clear
  const css = read('assets/chat-widget.css');
  const cleared = computeFab(css, fab.className.split(/\s+/), true);
  assert.equal(cleared.opacity, '1');
  assert.equal(cleared.visibility, 'visible');
  assert.notEqual(cleared.visibility, 'hidden');

  // OPEN
  fab.click();
  assert.ok(env.document.body.classList.contains('uschat-open'));
  assert.equal(panel.hasAttribute('inert'), false);
  assert.equal(fab.classList.contains('uschat-occluding'), false); // open suppresses hide

  // CLOSE on clear (media still below) — pointer, must not focus FAB
  head.children.find(c => c.classList.contains('uschat-head-close')).click({ detail: 1 });
  assert.equal(panel.getAttribute('inert'), '');
  assert.equal(fab.getAttribute('aria-hidden'), 'false');
  assert.notEqual(env.document.activeElement, fab, 'pointer close must not focus FAB');

  // OVERLAP again — lab photo under FAB; no blur needed because pointer close left FAB unfocused
  env.__hitStack = env.__media.slice();
  fab._emit('focusout', {});
  assert.ok(fab.classList.contains('uschat-occluding'), 'overlap hides again');
  assert.equal(fab.getAttribute('aria-hidden'), 'true');
  const hidden = computeFab(css, fab.className.split(/\s+/), true);
  assert.equal(hidden.opacity, '0');
  assert.notEqual(hidden.visibility, 'hidden');

  // CLEAR again
  env.__hitStack = [org];
  fab._emit('focusout', {});
  assert.equal(fab.classList.contains('uschat-occluding'), false, 'final clear shows FAB');
  assert.equal(fab.getAttribute('aria-hidden'), 'false');
  const final = computeFab(css, fab.className.split(/\s+/), true);
  assert.equal(final.opacity, '1');
  assert.equal(final.visibility, 'visible');
});

test('uschat-in is one-shot: animationend drops it so occlusion clear cannot restart pop',()=>{
  const env = makeFocusEnv({ fabRect: R(1206, 720, 56, 56), mediaRects: [] });
  vm.runInNewContext(read('assets/chat-widget.js'), env);
  const root = env.document.body.children.find(c => c.classList.contains('uschat-root'));
  const fab = root.children.find(c => c.classList.contains('uschat-fab'));
  // After reveal, uschat-in is present until animationend
  assert.ok(fab.classList.contains('uschat-in'), 'boot class present after reveal');
  // Fire animationend
  fab._emit('animationend', { animationName: 'uschat-pop' });
  assert.equal(fab.classList.contains('uschat-in'), false, 'boot class removed after pop');
  const css = read('assets/chat-widget.css');
  // Occlude then clear without uschat-in: animation property stays none
  fab.classList.add('uschat-occluding');
  let r = computeFab(css, fab.className.split(/\s+/), true);
  assert.equal(r.animation, 'none');
  fab.classList.remove('uschat-occluding');
  r = computeFab(css, fab.className.split(/\s+/), true);
  assert.equal(r.animation, 'none');
  assert.equal(r.opacity, '1');
  assert.equal(r.visibility, 'visible');
});


test('capabilities org section contains no FAB_MEDIA (text/html chart only)',()=>{
  const html = read('capabilities.html');
  const orgStart = html.indexOf('cap.org.kicker');
  const orgSecEnd = html.indexOf('</section>', orgStart);
  assert.ok(orgStart > 0 && orgSecEnd > orgStart);
  const org = html.slice(html.lastIndexOf('<section', orgStart), orgSecEnd);
  assert.match(org, /org-chart/);
  assert.doesNotMatch(org, /<img\b|<picture\b|<video\b|svg\.figure|model-chip/);
});

test('phantom AABB (0,0,1280x720) would keep hide true; hit-test against org chart clears',()=>{
  // Reproduces production FAIL: after labs hide, scroll to organization.
  // Lazy/offscreen lab imgs can still report a tall box at 0,0 that AABB-
  // intersects a FAB at y=720 — but the painted stack is the org chart.
  // Use a sliver of positive area (bottom 740) so a *painted* lab can hide;
  // a 720-tall box only touches the FAB edge (zero-area) and is covered
  // by the dedicated phantom+org test below.
  const phantom = R(0, 0, 1280, 740);
  const fabRect = R(1206, 720, 56, 56);
  const env = makeFocusEnv({ fabRect, mediaRects: [phantom] });
  vm.runInNewContext(read('assets/chat-widget.js'), env);

  // Proof: AABB (the previous check) stays true with the phantom box
  assert.equal(env.__fabOverlapsMedia(fabRect, [phantom], 8), true, 'AABB false-positive on phantom 1280x720@0,0');

  const root = env.document.body.children.find(c => c.classList.contains('uschat-root'));
  const fab = root.children.find(c => c.classList.contains('uschat-fab'));
  const panel = root.children.find(c => c.classList.contains('uschat-panel'));

  // hide: painted stack is the lab img (inside section>figure)
  env.__hitStack = env.__media.slice();
  fab._emit('focusout', {});
  assert.ok(fab.classList.contains('uschat-occluding'), 'hide when lab photo is under FAB');
  assert.equal(fab.getAttribute('aria-hidden'), 'true');
  const css = read('assets/chat-widget.css');
  let computed = computeFab(css, fab.className.split(/\s+/), true);
  assert.equal(computed.opacity, '0');

  // scroll clear: same phantom rects still AABB-overlap, but hit-test sees org chart
  const org = env.document.createElement('div');
  org.className = 'org-chart';
  env.__hitStack = [org];
  // leave AABB querySelectorAll pointing at the phantom-sized imgs (already in mediaRects)
  fab._emit('focusout', {});
  assert.equal(fab.classList.contains('uschat-occluding'), false, 'clear when only org chart is under FAB');
  assert.equal(fab.getAttribute('aria-hidden'), 'false');
  computed = computeFab(css, fab.className.split(/\s+/), true);
  assert.equal(computed.opacity, '1');
  assert.equal(computed.visibility, 'visible');

  // helper API: media under point is null over org, img over labs
  env.__hitStack = [org];
  assert.equal(env.__fabMediaUnderPoint(fabRect.left+28, fabRect.top+28), null);
  env.__hitStack = env.__media.slice();
  assert.ok(env.__fabMediaUnderPoint(fabRect.left+28, fabRect.top+28));
  assert.equal(env.__fabShouldOcclude(fab), true);
  env.__hitStack = [org];
  assert.equal(env.__fabShouldOcclude(fab), false);
});

test('occlusion check uses hit-test not AABB when elementsFromPoint exists',()=>{
  const js = read('assets/chat-widget.js');
  assert.match(js, /fabShouldOcclude/);
  assert.match(js, /elementsFromPoint/);
  assert.match(js, /fabMediaUnderPoint/);
  // restoreFocusAfterClose must use the same check
  const restore = js.slice(js.indexOf('function restoreFocusAfterClose'), js.indexOf('function setOpen'));
  assert.match(restore, /fabShouldOcclude/);
  assert.doesNotMatch(restore, /querySelectorAll\(FAB_MEDIA\)/);
});


test('center 10px outside image but 15x50 footprint overlap hides the FAB',()=>{
  // Bathroom hero EDGEFAIL: FAB center sits ~10px past the photo edge, but
  // the 56x56 disc still covers a ~15x50 sliver. Center-only hit-test missed it.
  const fabRect = R(1206, 720, 56, 56); // center 1234, 748
  const imgRect = R(640, 400, 584, 370); // right=1224 (10px left of center), bottom=770
  // intersection: x 1206-1224 (18px ~15), y 720-770 (50px)
  assert.equal(fabRect.left + fabRect.width/2 - imgRect.right, 10);
  assert.equal(Math.min(fabRect.right, imgRect.right) - Math.max(fabRect.left, imgRect.left), 18);
  assert.equal(Math.min(fabRect.bottom, imgRect.bottom) - Math.max(fabRect.top, imgRect.top), 50);

  const env = makeFocusEnv({ fabRect, mediaRects: [imgRect] });
  vm.runInNewContext(read('assets/chat-widget.js'), env);
  const img = env.__media[0];
  const org = env.document.createElement('div');
  org.className = 'org-chart';
  org._rect = R(0, 0, 1280, 800);
  // Painted stack follows true boxes: center (1234,748) is outside the photo.
  env.__hitAt = (x,y) => {
    if (pointIn(imgRect, x, y)) return [img];
    if (pointIn(org._rect, x, y)) return [org];
    return [];
  };
  env.__hitStack = []; // must not leak a constant stack
  const root = env.document.body.children.find(c => c.classList.contains('uschat-root'));
  const fab = root.children.find(c => c.classList.contains('uschat-fab'));
  assert.equal(env.__fabMediaUnderPoint(1234, 748), null, 'center itself is outside the photo');
  assert.equal(env.__fabShouldOcclude(fab), true, '15x50 sliver on the disc must hide');
  fab._emit('focusout', {});
  assert.ok(fab.classList.contains('uschat-occluding'));
  assert.equal(fab.getAttribute('aria-hidden'), 'true');
});

test('thin strip under the disc hides; AABB-only corner outside the disc does not',()=>{
  const fabRect = R(1206, 720, 56, 56); // center 1234,748 radius 28
  // 3px-wide vertical strip along the left of the disc (x 1206-1209), tall overlap
  const thin = R(1000, 700, 209, 80); // right=1209, so 3px into the FAB box
  const env = makeFocusEnv({ fabRect, mediaRects: [thin] });
  vm.runInNewContext(read('assets/chat-widget.js'), env);
  const img = env.__media[0];
  env.__hitAt = (x,y) => pointIn(thin, x, y) ? [img] : [];
  const fab = env.document.body.children.find(c => c.classList.contains('uschat-root'))
    .children.find(c => c.classList.contains('uschat-fab'));
  assert.equal(env.__fabShouldOcclude(fab), true, '3px painted strip on the disc hides');

  // Square-corner-only: media clips the top-left AABB corner well outside the disc
  // Closest point to center is too far (>28px) so the circle does not overlap.
  const corner = R(1200, 714, 10, 10); // covers (1200-1210, 714-724); FAB corner 1206,720
  // center 1234,748 to closest (1210,724): dx=24 dy=24, dist~33.9 > 28
  const env2 = makeFocusEnv({ fabRect, mediaRects: [corner] });
  vm.runInNewContext(read('assets/chat-widget.js'), env2);
  const img2 = env2.__media[0];
  env2.__hitAt = (x,y) => pointIn(corner, x, y) ? [img2] : [];
  const fab2 = env2.document.body.children.find(c => c.classList.contains('uschat-root'))
    .children.find(c => c.classList.contains('uschat-fab'));
  assert.equal(env2.__fabDiscOverlapsRect(1234, 748, 28, corner), false);
  assert.equal(env2.__fabShouldOcclude(fab2), false, 'square corner outside the disc must not hide');
});

test('phantom 1280x720@0,0 still AABB-hits but painted org chart at intersection clears',()=>{
  const fabRect = R(1206, 720, 56, 56);
  const phantom = R(0, 0, 1280, 720); // bottom=720, touches FAB top
  const env = makeFocusEnv({ fabRect, mediaRects: [phantom] });
  vm.runInNewContext(read('assets/chat-widget.js'), env);
  assert.equal(env.__fabOverlapsMedia(fabRect, [phantom], 8), true);
  const org = env.document.createElement('div');
  org.className = 'org-chart';
  org._rect = R(200, 200, 800, 500);
  // Intersection samples sit on the phantom layout box, but paint is the org chart
  // (or nothing in the FAB disc). Never return the img.
  env.__hitAt = (x,y) => {
    if (pointIn(org._rect, x, y)) return [org];
    return [org]; // page content, not the offscreen lab img
  };
  const fab = env.document.body.children.find(c => c.classList.contains('uschat-root'))
    .children.find(c => c.classList.contains('uschat-fab'));
  assert.equal(env.__fabShouldOcclude(fab), false);
  fab._emit('focusout', {});
  assert.equal(fab.classList.contains('uschat-occluding'), false);
  assert.equal(fab.getAttribute('aria-hidden'), 'false');
  const css = read('assets/chat-widget.css');
  const computed = computeFab(css, fab.className.split(/\s+/), true);
  assert.equal(computed.opacity, '1');
});


test('isKeyboardCloseEvent: pointer detail>=1 / pointerType vs keyboard detail 0 and Escape',()=>{
  const env = makeFocusEnv({ fabRect: R(1206, 720, 56, 56), mediaRects: [] });
  vm.runInNewContext(read('assets/chat-widget.js'), env);
  const k = env.__isKeyboardCloseEvent;
  assert.equal(k({ detail: 1 }), false);
  assert.equal(k({ detail: 2 }), false);
  assert.equal(k({ pointerType: 'mouse', detail: 1 }), false);
  assert.equal(k({ pointerType: 'touch', detail: 1 }), false);
  assert.equal(k({ pointerType: 'pen' }), false);
  assert.equal(k({ detail: 0 }), true, 'keyboard-generated click');
  assert.equal(k({ key: 'Escape' }), true);
  assert.equal(k(null), false);
});

test('pointer click close on clear: no FAB focus, then scroll to lab hides (no guard trap)',()=>{
  const env = makeFocusEnv({
    fabRect: R(1206, 720, 56, 56),
    mediaRects: [R(640, 400, 600, 400)],
  });
  vm.runInNewContext(read('assets/chat-widget.js'), env);
  const org = env.document.createElement('div');
  org.className = 'org-chart';
  env.__hitStack = [org]; // start clear
  const root = env.document.body.children.find(c => c.classList.contains('uschat-root'));
  const panel = root.children.find(c => c.classList.contains('uschat-panel'));
  const fab = root.children.find(c => c.classList.contains('uschat-fab'));
  const closeBtn = panel.children.find(c => c.classList.contains('uschat-head'))
    .children.find(c => c.classList.contains('uschat-head-close'));
  fab.click({ detail: 1 }); // open
  closeBtn.click({ detail: 1 }); // pointer close
  assert.equal(panel.getAttribute('inert'), '');
  assert.notEqual(env.document.activeElement, fab);
  // scroll to lab — FAB is not focused, occlusion may run
  env.__hitStack = env.__media.slice();
  fab._emit('focusout', {});
  assert.ok(fab.classList.contains('uschat-occluding'), 'pointer hide→clear then back to lab hides');
  assert.equal(fab.getAttribute('aria-hidden'), 'true');
  const css = read('assets/chat-widget.css');
  assert.equal(computeFab(css, fab.className.split(/\s+/), true).opacity, '0');
});

test('keyboard click detail 0 close on clear restores FAB focus; focused FAB is not hidden over lab (a11y exception)',()=>{
  const env = makeFocusEnv({
    fabRect: R(1206, 720, 56, 56),
    mediaRects: [R(640, 400, 600, 400)],
  });
  vm.runInNewContext(read('assets/chat-widget.js'), env);
  const org = env.document.createElement('div');
  org.className = 'org-chart';
  env.__hitStack = [org];
  const root = env.document.body.children.find(c => c.classList.contains('uschat-root'));
  const panel = root.children.find(c => c.classList.contains('uschat-panel'));
  const fab = root.children.find(c => c.classList.contains('uschat-fab'));
  const closeBtn = panel.children.find(c => c.classList.contains('uschat-head'))
    .children.find(c => c.classList.contains('uschat-head-close'));
  fab.click({ detail: 0 });
  closeBtn.click({ detail: 0 });
  assert.equal(env.document.activeElement, fab, 'keyboard close restores focus to opener');
  assert.equal(fab.getAttribute('aria-hidden'), 'false');
  // Intended exception: genuinely keyboard-focused FAB stays visible over media
  env.__hitStack = env.__media.slice();
  fab._emit('focusout', {}); // check still sees activeElement === fab
  assert.equal(fab.classList.contains('uschat-occluding'), false, 'do not hide keyboard-focused FAB');
  assert.equal(fab.getAttribute('aria-hidden'), 'false');
  // After blur, hide is allowed
  fab.blur();
  fab._emit('focusout', {});
  assert.ok(fab.classList.contains('uschat-occluding'));
  assert.equal(fab.getAttribute('aria-hidden'), 'true');
});

test('Escape close on clear restores FAB focus (keyboard path)',()=>{
  const env = makeFocusEnv({ fabRect: R(1206, 720, 56, 56), mediaRects: [] });
  vm.runInNewContext(read('assets/chat-widget.js'), env);
  const root = env.document.body.children.find(c => c.classList.contains('uschat-root'));
  const fab = root.children.find(c => c.classList.contains('uschat-fab'));
  fab.click({ detail: 1 });
  env.document._emit('keydown', { key: 'Escape' });
  assert.equal(env.document.activeElement, fab);
  assert.equal(env.document.body.classList.contains('uschat-open'), false);
});

test('pointer close of open FAB blurs it so the focus guard cannot trap',()=>{
  const env = makeFocusEnv({ fabRect: R(1206, 720, 56, 56), mediaRects: [] });
  vm.runInNewContext(read('assets/chat-widget.js'), env);
  const root = env.document.body.children.find(c => c.classList.contains('uschat-root'));
  const fab = root.children.find(c => c.classList.contains('uschat-fab'));
  fab.click({ detail: 1 }); // open, input focused
  fab.focus(); // pointer user clicked the open (X) FAB — browser would focus it
  fab.click({ detail: 1 }); // pointer close
  assert.notEqual(env.document.activeElement, fab);
  assert.equal(env.document.body.classList.contains('uschat-open'), false);
});
