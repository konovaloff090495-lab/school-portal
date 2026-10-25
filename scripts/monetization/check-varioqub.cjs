const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync('public/monetization/varioqub.js', 'utf8');
const config = JSON.parse(fs.readFileSync('public/monetization/experiments.json', 'utf8'));
const settle = () => new Promise(resolve => setImmediate(resolve));

function fixture(pathname = '/uchebnik/matematika/5-klass/test/') {
  const events = {};
  const pending = [];
  const scripts = [];
  const destroyed = [];
  const observers = [];
  const window = {
    location: {pathname, href: 'https://pro-schools.ru' + pathname},
    addEventListener: (name, fn) => { events[name] = fn; },
    Ya: {Context: {AdvManager: {destroy: value => destroyed.push(value.blockId)}}},
  };
  const document = {body: {}, head: {appendChild: script => scripts.push(script)}, createElement: () => ({})};
  class MutationObserver {
    constructor(fn) { this.fn = fn; observers.push(this); }
    observe() {}
    disconnect() {}
  }
  const context = vm.createContext({window, document, MutationObserver,
    fetch: () => new Promise(resolve => pending.push(resolve))});
  vm.runInContext(source, context);
  return {window, events, pending, scripts, destroyed, observers, context,
    respond(value = config) { pending.shift()({ok: true, json: async () => value}); },
    route(path) { window.location.pathname = path; window.location.href = 'https://pro-schools.ru' + path; events['ps:navigation-route'](); }};
}

(async () => {
  const f = fixture(); f.respond(); await settle();
  assert.equal(f.scripts.length, 1);
  assert.equal(f.window.ymab.a.length, 1);
  assert.equal(f.window.ymab.a[0][0], 'metrika.108789843');
  const lateCallback = f.window.ymab.a[0][3];
  f.route('/shkoly/moskva/'); f.respond(); await settle();
  lateCallback();
  assert.equal(f.window.__psVarioqubStatus, 'excluded');
  assert.ok(f.destroyed.includes('R-A-19425636-4'));
  assert.equal(f.window.ymab.a.length, 1, 'catalog must not initialize an experiment');
  f.route('/blog/test/'); f.respond(); await settle();
  assert.equal(f.scripts.length, 1, 'vendor loader must be unique');
  assert.equal(f.window.ymab.a.length, 2, 'SPA info navigation must initialize its new URL');
  f.events['ps:monetization-stop']();
  f.window.ymab.a[1][3]();
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
  console.log('Varioqub checks passed: route scope, stale response/callback, SPA init, unique loader, kill switch, invalid config.');
})();
