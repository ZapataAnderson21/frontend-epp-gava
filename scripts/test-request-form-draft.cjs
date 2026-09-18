const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
require.extensions['.ts'] = (mod, filename) => mod._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, filename);
const { FormDraftStore } = require('../src/utils/formDraft.ts');
const { isRequestFormDraft } = require('../src/utils/requestFormDraft.ts');
const blank = { schemaVersion: 1, createdRequestId: null, projectId: 0, description: '', deliveryDueDate: '', activeFamily: 'epp', elementRequests: [], requestWorkers: [], elementPlans: {}, pendingPlanning: null };
function setup() {
  const local = new Map(); const remote = new Map(); let failure = 0; let writes = 0;
  const storage = { getItem: key => local.get(key) ?? null, setItem: (key, value) => local.set(key, value) };
  const request = async (url, options) => {
    if (failure) return new Response('{}', { status: failure });
    const current = remote.get(url) ?? { version: 0, payload: null };
    if (options.method !== 'PUT') return Response.json(current);
    const { expectedVersion, payload } = JSON.parse(options.body);
    if (current.version !== expectedVersion) return new Response('{}', { status: 409 });
    writes++; const next = { version: expectedVersion + 1, payload }; remote.set(url, next); return Response.json(next);
  };
  return { local, remote, storage, request, set failure(v) { failure = v; }, get writes() { return writes; },
    create(key = 'user:1/new') {
      let restored;
      const store = new FormDraftStore(key, key, blank, data => { restored = data; }, () => {}, storage, request, isRequestFormDraft);
      return { store, get restored() { return restored; } };
    } };
}
test('description before project selection is protected locally and remotely', async () => {
  const env = setup(); const a = env.create(); await a.store.sync(); assert.equal(env.writes, 0);
  a.store.change({ ...blank, description: 'A' }); assert.equal(JSON.parse(env.local.get('user:1/new')).payload.description, 'A');
  await a.store.sync(); assert.equal(env.remote.get('user:1/new').payload.projectId, 0); a.store.stop();
});
test('date, repeated items, quantities, notes, worker plans and pending modal survive expired session/reload', async () => {
  const env = setup(); const a = env.create(); await a.store.sync();
  const plan = { elementRequestId: 0, requestWorkerId: 3, plannedQuantity: 2, size: 'M', notes: 'nota' };
  const data = { ...blank, projectId: 2, deliveryDueDate: '2026-09-21T10:00', createdRequestId: 7,
    elementRequests: [1, 2].map(i => ({ lineKey: 'line-' + i, elementId: 5, quantityRequested: i, unit: 'unidad', requestId: 0, notes: 'línea ' + i })),
    requestWorkers: [{ workerId: 3, requestWorkerId: 0, requestId: 0 }], elementPlans: { 5: [plan] }, pendingPlanning: { lineKey: 'line-1', plans: [plan] } };
  env.failure = 401; a.store.change(data); await a.store.sync(); assert.equal(a.store.status, 'session'); a.store.stop();
  const b = env.create(); assert.deepEqual(b.restored, data); env.failure = 0; await b.store.sync(); assert.equal(b.store.status, 'synced'); b.store.stop();
});
test('users, general new, project new and existing request scopes never mix', async () => {
  const env = setup(); const a = env.create(); a.store.change({ ...blank, description: 'private' }); await a.store.sync();
  for (const key of ['user:2/new', 'user:1/project-2', 'user:1/7']) { const b = env.create(key); await b.store.sync(); assert.equal(b.restored, undefined); b.store.stop(); }
  a.store.stop();
});
test('pending changes survive failed sync and version conflicts preserve both versions', async () => {
  const env = setup(); const a = env.create(); await a.store.sync();
  a.store.change({ ...blank, description: 'local' }); env.remote.set('user:1/new', { version: 1, payload: { ...blank, description: 'remote' } });
  await a.store.sync(); assert.equal(a.store.status, 'conflict'); assert.equal(JSON.parse(env.local.get('user:1/new')).payload.description, 'local');
  a.store.resolve(true); assert.equal(a.restored.description, 'remote'); a.store.stop();
});
test('completion does not revive after reload; incomplete shapes are rejected', async () => {
  const env = setup(); const a = env.create(); a.store.change({ ...blank, description: 'saved' }); await a.store.sync(); await a.store.complete(); a.store.stop();
  const b = env.create(); await b.store.sync(); assert.equal(b.restored, undefined); assert.equal(env.remote.get('user:1/new').payload, null); b.store.stop();
  assert.equal(isRequestFormDraft({ ...blank, elementRequests: [null] }), false);
  assert.equal(isRequestFormDraft({ ...blank, elementPlans: { 5: [{}] } }), false);
});
test('a response arriving after leaving the form cannot overwrite the next session', async () => {
  const env = setup(); let finishBody; let signalBody;
  const started = new Promise(resolve => { signalBody = resolve; });
  const request = async (url, options) => options.method === 'PUT'
    ? { ok: true, status: 200, json: () => new Promise(resolve => { finishBody = resolve; signalBody(); }) }
    : env.request(url, options);
  const store = new FormDraftStore('key', 'url', blank, () => {}, () => {}, env.storage, request, isRequestFormDraft);
  await store.sync(); store.change({ ...blank, description: 'old' });
  const pending = store.sync(); await started; store.stop();
  env.storage.setItem('key', 'new session draft'); finishBody({ version: 1, payload: { ...blank, description: 'old' } });
  await pending; assert.equal(env.storage.getItem('key'), 'new session draft');
});
