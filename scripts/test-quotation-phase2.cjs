const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const ts = require("typescript");

const root = path.resolve(__dirname, "..");

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function loadQuotationConfig() {
  const source = path.join(
    root,
    "src/modules/Quotations/quotationConfig.ts",
  );
  const compiled = new Module(source, module);
  compiled.filename = source;
  compiled.paths = module.paths;
  compiled._compile(
    ts.transpileModule(read("src/modules/Quotations/quotationConfig.ts"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
    }).outputText,
    source,
  );
  return compiled.exports;
}

test("quotation configuration exposes the three types and four supported states", () => {
  const config = loadQuotationConfig();

  assert.deepEqual(config.QUOTATION_TYPE_LABELS, {
    works: "Obras",
    services: "Servicios",
    consulting: "Consultorías",
  });
  assert.deepEqual(config.QUOTATION_STATUS_LABELS, {
    draft: "Borrador",
    sent: "Enviada",
    accepted: "Aceptada",
    rejected: "Rechazada",
  });
  assert.equal(
    config.QUOTATION_STATUS_OPTIONS.some(({ value }) => value === "approved"),
    false,
  );
});

test("creation requires an explicit quotation type and sends it", () => {
  const source = read("src/modules/Quotations/NewQuotation.tsx");

  assert.match(source, /useState<QuotationType \| "">\(""\)/);
  assert.match(source, /Debe seleccionar un tipo de cotización/);
  assert.match(source, /const payload = \{\s*clientId,\s*type,/s);
  assert.match(source, /Descripción de la cotización/);
});

test("edition loads and sends type while using centralized valid states", () => {
  const source = read("src/modules/Quotations/EditQuotation.tsx");

  assert.match(source, /setType\(quotation\.type\)/);
  assert.match(source, /const payload = \{\s*clientId,\s*type,\s*status,/s);
  assert.match(source, /options=\{QUOTATION_STATUS_OPTIONS\}/);
  assert.doesNotMatch(source, /\bapproved\b/);
});

test("listing sends combined filters to the paginated endpoint", () => {
  const source = read("src/modules/Quotations/QuotationTable.tsx");

  assert.match(source, /usePaginatedFetch<Quotation>/);
  assert.match(source, /`\$\{quotationApi\}paginated`/);
  for (const filter of ["clientId", "type", "status", "search"]) {
    assert.match(source, new RegExp(`${filter}:`));
  }
  assert.match(source, /label: "Tipo"/);
  assert.match(source, /pagination=\{pagination\}/);
});

test("detail renders quotation type and status", () => {
  const source = read("src/modules/Quotations/Quotation.tsx");

  assert.match(source, /getQuotationTypeLabel\(quotation\.type\)/);
  assert.match(source, /<StatusTag status=\{quotation\.status\}/);
});
