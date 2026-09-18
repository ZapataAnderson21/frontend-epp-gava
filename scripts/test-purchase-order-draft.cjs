const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const source = path.resolve(__dirname, '../src/utils/purchaseOrderDraft.ts');
require.extensions['.ts'] = (mod, filename) => mod._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, filename);
const compiled = new Module(source, module);
compiled.filename = source;
compiled.paths = module.paths;
compiled._compile(ts.transpileModule(fs.readFileSync(source, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, source);
const { PurchaseOrderDraftStore, isPurchaseOrderDraft } = compiled.exports;
const blank = { schemaVersion: 1, code: '', supplierId: 0, quotation: '', destination: '', deliveryLocation: '', carePerson: '', dniCarePerson: '', observations: '', paymentMethod: '', paymentConditions: '', paymentConditions1: '', paymentConditions2: '', purchaseOrderType: '', generalConditions: [''], qualityConditions: [''], items: [], rpoIds: [] };
const memory = () => { const values = new Map(); return { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) }; };
function server() {
  const rows = new Map();
  let failure = '';
  let loseResponse = false;
  let puts = 0;
  return { rows, set failure(value) { failure = value; }, set loseResponse(value) { loseResponse = value; }, get puts() { return puts; },
    fetch: async (url, options) => {
      if (failure === 'offline') throw new TypeError('Offline');
      if (failure) return new Response('{}', { status: Number(failure) });
      const remote = rows.get(url) ?? { payload: null, version: 0 };
      if (options.method === 'PUT') {
        const body = JSON.parse(options.body);
        if (body.expectedVersion !== remote.version) return new Response('{}', { status: 409 });
        puts++;
        const next = { payload: body.payload, version: remote.version + 1 };
        rows.set(url, next);
        if (loseResponse) { loseResponse = false; throw new Error('Connection lost after commit'); }
        return Response.json(next);
      }
      return Response.json(remote);
    },
  };
}
function create(api, storage = memory(), key = 'user:1/project:2/new', initial = blank) {
  let restored;
  const store = new PurchaseOrderDraftStore(key, key, initial, value => { restored = value; }, () => {}, storage, api.fetch);
  return { store, storage, get restored() { return restored; } };
}

test('first datum persists immediately, syncs, and restores on another computer', async () => {
  const api = server(); const first = create(api);
  await first.store.sync(); assert.equal(api.puts, 0);
  first.store.change({ ...blank, code: 'A' });
  assert.equal(JSON.parse(first.storage.getItem('user:1/project:2/new')).payload.code, 'A');
  await first.store.sync(); assert.equal(first.store.status, 'synced');
  const other = create(api); await other.store.sync(); assert.equal(other.restored.code, 'A');
  first.store.stop(); other.store.stop();
});
test('offline and expired session preserve all fields through remount, then retry', async () => {
  const api = server(); const first = create(api); await first.store.sync();
  const data = { ...blank, code: 'offline', paymentConditions1: 'Crédito', paymentConditions2: '30 días - entrega', paymentConditions: 'Crédito - 30 días - entrega', generalConditions: ['uno', 'dos'], qualityConditions: ['ISO'], items: [{ orderNumber: 1, resourceId: 2, description: 'Recurso', unit: 'm', quantity: '1.5', unitPurchasePrice: '20', unitSalesPrice: '30', subtotal: 30 }], rpoIds: [42] };
  api.failure = 'offline'; first.store.change(data); await first.store.sync(); first.store.stop();
  const resumed = create(api, first.storage); assert.deepEqual(resumed.restored, data);
  api.failure = '401'; await resumed.store.sync(); assert.equal(resumed.store.status, 'session');
  api.failure = ''; await resumed.store.sync(); assert.equal(resumed.store.status, 'synced'); resumed.store.stop();
});
test('scopes isolate users, projects and existing orders', async () => {
  const api = server(); const storage = memory(); const a = create(api, storage); a.store.change({ ...blank, code: 'private' }); await a.store.sync();
  for (const key of ['user:2/project:2/new', 'user:1/project:3/new', 'user:1/project:2/99']) {
    const other = create(api, storage, key); await other.store.sync(); assert.equal(other.restored, undefined); other.store.stop();
  }
  a.store.stop();
});
test('two devices cannot silently overwrite; user can explicitly choose local or remote', async () => {
  const api = server(); const a = create(api); const b = create(api);
  await a.store.sync(); await b.store.sync();
  a.store.change({ ...blank, code: 'A' }); await a.store.sync();
  b.store.change({ ...blank, code: 'B' }); await b.store.sync(); assert.equal(b.store.status, 'conflict');
  b.store.resolve(false); await b.store.sync(); assert.equal(api.rows.values().next().value.payload.code, 'B');
  a.store.change({ ...blank, code: 'C' }); await a.store.sync(); assert.equal(a.store.status, 'conflict');
  a.store.resolve(true); assert.equal(a.restored.code, 'B'); a.store.stop(); b.store.stop();
});
test('lost write acknowledgment reconciles without duplicating writes', async () => {
  const api = server(); const a = create(api); await a.store.sync();
  a.store.change({ ...blank, code: 'A' }); api.loseResponse = true; await a.store.sync(); assert.equal(a.store.status, 'error');
  await a.store.sync(); assert.equal(a.store.status, 'synced'); assert.equal(api.puts, 1); a.store.stop();
});
test('successful completion retains a revision tombstone and offline cleanup survives reload', async () => {
  const api = server(); const a = create(api); a.store.change({ ...blank, code: 'done' }); await a.store.sync();
  api.failure = 'offline'; await a.store.complete(); a.store.stop();
  const b = create(api, a.storage); assert.equal(b.restored, undefined);
  api.failure = ''; await b.store.sync(); assert.equal(api.rows.values().next().value.payload, null);
  assert.equal(api.rows.values().next().value.version, 2); b.store.stop();
});
test('edit baseline is not a new draft; corrupted draft is not applied or overwritten', async () => {
  const api = server(); const a = create(api, memory(), 'edit', { ...blank, code: 'existing' }); await a.store.sync(); assert.equal(api.puts, 0); a.store.stop();
  const storage = memory(); storage.setItem('edit', JSON.stringify({ version: 1, dirty: true, payload: { code: 'incomplete' } }));
  const b = create(api, storage, 'edit'); await b.store.sync(); assert.equal(b.store.status, 'invalid'); assert.equal(b.restored, undefined); b.store.stop();
  assert.equal(isPurchaseOrderDraft({ ...blank, items: [null] }), false);
});
