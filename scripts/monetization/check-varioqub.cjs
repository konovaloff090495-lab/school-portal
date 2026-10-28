const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync('public/monetization/varioqub.js', 'utf8');
const config = JSON.parse(fs.readFileSync('public/monetization/experiments.json', 'utf8'));
const topConfig = JSON.parse(JSON.stringify(config));
delete config.topAd;
const settle = () => new Promise(resolve => setImmediate(resolve));

function fixture(pathname = '/uchebnik/matematika/5-klass/test/', mobile = false) {
  const events = {};
  const pending = [];
  const scripts = [];
  const destroyed = [];
  const observers = [];
  const rendered = [], documentEvents = {};
  const window = {
    location: {pathname, href: 'https://pro-schools.ru' + pathname},
    addEventListener: (name, fn) => { events[name] = fn; },
    innerWidth: mobile ? 390 : 1280, innerHeight: 720,
    matchMedia: () => ({matches: mobile}),
    requestAnimationFrame: fn => fn(), setInterval: () => 1,
    getComputedStyle: element => ({position: element.position}),
    Ya: {Context: {AdvManager: {destroy: value => destroyed.push(value.blockId), render: value => rendered.push(value)}}},
  };
  const attrs = {};
  const styles = {}, nodes = {};
  const document = {addEventListener: (name, fn) => {documentEvents[name] = fn;}, querySelector: () => null, documentElement: {style: {getPropertyValue: key => styles[key] || '', setProperty: (key, value) => {styles[key] = value;}, removeProperty: key => {delete styles[key];}}, setAttribute: (key, value) => {attrs[key] = value;}, removeAttribute: key => {delete attrs[key];}}, body: {children: []}, getElementById: id => nodes[id], head: {appendChild: element => {nodes[element.id] = element; if (element.tagName === 'SCRIPT') scripts.push(element);}}, createElement: tag => ({tagName: tag.toUpperCase()})};
  class MutationObserver {
    constructor(fn) { this.fn = fn; observers.push(this); }
    observe() {}
    disconnect() {}
  }
  const context = vm.createContext({window, document, MutationObserver,
    fetch: () => new Promise(resolve => pending.push(resolve))});
  vm.runInContext(source, context);
  return {rendered, documentEvents, window, document, styles, events, pending, scripts, destroyed, observers, context, attrs,
    respond(value = config) { pending.shift()({ok: true, json: async () => value}); },
    route(path) { window.location.pathname = path; window.location.href = 'https://pro-schools.ru' + path; events['ps:navigation-route'](); }};
}

(async () => {
  const f = fixture(); f.respond(); await settle();
  assert.equal(f.scripts.length, 1);
  assert.equal(f.window.ymab.a.length, 2);
  assert.equal(f.window.ymab.a[0][0], 'metrika.108789843');
  assert.equal(f.window.ymab.a[0][1], 'setConfig');
  assert.equal(f.window.ymab.a[0][2].enableSetYmUid, true);
  const lateCallback = f.window.ymab.a[1][3];
  lateCallback();
  assert.equal(f.attrs['data-ps-varioqub-ready'], 'true');
  f.document.body.children.push({tagName: 'DIV', position: 'fixed', getBoundingClientRect: () => ({width: 1280, height: 99, bottom: 720}), querySelector: () => ({})});
  f.events.resize();
  assert.equal(f.styles['--ps-floor-clearance'], '123px');
  f.document.body.children = [];
  f.events.resize();
  assert.equal(f.styles['--ps-floor-clearance'], undefined);
  f.route('/shkoly/moskva/'); f.respond(); await settle();
  lateCallback();
  assert.equal(f.window.__psVarioqubStatus, 'excluded');
  assert.equal(f.attrs['data-ps-varioqub-ready'], undefined);
  assert.ok(f.destroyed.includes('R-A-19425636-4'));
  assert.equal(f.window.ymab.a.length, 2, 'catalog must not initialize an experiment');
  f.route('/blog/test/'); f.respond(); await settle();
  assert.equal(f.scripts.length, 1, 'vendor loader must be unique');
  assert.equal(f.window.ymab.a.length, 4, 'SPA info navigation must initialize its new URL');
  f.events['ps:monetization-stop']();
  f.window.ymab.a[3][3]();
  assert.equal(f.window.__psVarioqubStatus, 'disabled');

  const race = fixture(); race.route('/shkola/test/');
  race.respond(); race.respond(); await settle();
  assert.equal(race.scripts.length, 0, 'stale config cannot activate a catalog ad');
  const disabled = fixture(); disabled.respond({...config, enabled: false}); await settle();
  assert.equal(disabled.scripts.length, 0);
  const invalid = fixture(); invalid.respond({...config, counterId: 1}); await settle();
  assert.equal(invalid.scripts.length, 0);
  assert.equal(invalid.window.__psVarioqubStatus, 'config_error');
  vm.runInContext(source, f.context);
  assert.equal(f.scripts.length, 1, 'duplicate script execution is inert');
  const top = fixture('/blog/test/', true); top.respond(topConfig); await settle();
  assert.equal(top.scripts.length, 0, 'direct pilot must not reactivate stopped Varioqub experiment');
  assert.equal(top.window.yaContextCb.length, 1);
  top.window.yaContextCb[0]();
  assert.equal(top.rendered.length, 1);
  assert.equal(top.rendered[0].type, 'topAd');
  assert.equal(top.rendered[0].blockId, 'R-A-19425636-5');
  top.document.body.children.push({tagName:'DIV',position:'fixed',getBoundingClientRect:()=>({width:390,height:100,top:0}),querySelector:()=>({})});
  top.rendered[0].onRender();
  assert.equal(top.styles['--ps-top-clearance'], '112px');
  top.document.body.children = []; top.events.resize();
  assert.equal(top.styles['--ps-top-clearance'], undefined, 'close must remove reserved space');
  top.documentEvents.focusin({target:{closest:()=>({})}});
  assert.ok(top.destroyed.includes('R-A-19425636-5'), 'form focus must hide overlay');
  top.route('/shkoly/moskva/'); top.respond(topConfig); await settle();
  top.rendered[0].onRender();
  assert.equal(top.styles['--ps-top-clearance'], undefined, 'late callback cannot restore catalog ad');
  assert.equal(top.attrs['data-ps-top-visible'], undefined);
  const queued = fixture('/blog/test/', true); queued.respond(topConfig); await settle();
  queued.route('/shkola/test/'); queued.window.yaContextCb[0]();
  assert.equal(queued.rendered.length, 0, 'queued render cannot escape information scope');
  const desktop = fixture(); desktop.respond(topConfig); await settle();
  assert.equal(desktop.rendered.length, 0); assert.equal(desktop.window.yaContextCb, undefined);
  const stoppedTop = fixture('/blog/test/',true); stoppedTop.respond(topConfig); await settle();
  stoppedTop.events['ps:monetization-stop'](); stoppedTop.window.yaContextCb[0]();
  assert.equal(stoppedTop.rendered.length,0,'kill switch must cancel queued Top');
  console.log('Top Ad checks passed: mobile gate, native type, header clearance, close, lead focus, scope exit, stale queue/callback, desktop exclusion and kill switch.');
  console.log('Varioqub checks passed: route scope, stale response/callback, SPA init, unique loader, kill switch, invalid config.');
})();
