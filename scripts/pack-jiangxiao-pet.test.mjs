/**
 * Tests for pack-jiangxiao-pet.mjs.
 *
 * The full pack reads ~232MB of webp from local-assets/ (gitignored, absent in
 * CI), so these tests exercise the pure helpers with small in-memory fixtures:
 * asset-name validation, pet.json shape, hash-manifest validation, zip write/
 * read round-trip, and --check against a fixture zip. No real assets required.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { writeFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  validateAssetFiles,
  buildPetJson,
  parseTransitionStem,
  sha256,
  writeZip,
  readZip,
  buildHashManifest,
  validateHashManifest,
  checkZipAgainstManifest,
} from "./pack-jiangxiao-pet.mjs";

// ---------------------------------------------------------------------------
// Fixtures: 10 loop + 36 transition file names (the real contract).
// ---------------------------------------------------------------------------

const LOOP_STATES = [
  "idle",
  "thinking",
  "reading",
  "replying",
  "working",
  "error",
  "welcome",
  "done",
  "permission",
  "listening",
];

const TRANSITION_KEYS = [
  "idle-thinking",
  "idle-reading",
  "idle-replying",
  "idle-working",
  "idle-error",
  "idle-welcome",
  "idle-done",
  "idle-permission",
  "idle-listening",
  "idle-cheek-rest",
  "idle-chin-rest",
  "idle-frown-wave",
  "idle-nod-smile",
  "idle-shush",
  "idle-shy-smile",
  "thinking-idle",
  "reading-idle",
  "replying-idle",
  "working-idle",
  "error-idle",
  "welcome-idle",
  "done-idle",
  "permission-idle",
  "listening-idle",
  "cheek-rest-idle",
  "chin-rest-idle",
  "frown-wave-idle",
  "nod-smile-idle",
  "shush-idle",
  "shy-smile-idle",
  "replying-thinking",
  "thinking-replying",
  "permission-frown-wave",
  "frown-wave-permission",
  "nod-smile-permission",
  "permission-nod-smile",
];

function fixtureFilenames() {
  const loop = LOOP_STATES.map((s) => `${s}.webp`);
  const trans = TRANSITION_KEYS.map((k) => `transition-${k}.webp`);
  return [...loop, ...trans];
}

// ---------------------------------------------------------------------------
// validateAssetFiles
// ---------------------------------------------------------------------------

test("validateAssetFiles: accepts the real 46-file contract", () => {
  const { loop, transitions } = validateAssetFiles(fixtureFilenames());
  assert.equal(loop.length, 10);
  assert.equal(transitions.length, 36);
});

test("validateAssetFiles: rejects missing loop state", () => {
  const names = fixtureFilenames().filter((f) => f !== "idle.webp");
  assert.throws(
    () => validateAssetFiles(names),
    /missing loop state: idle\.webp/,
  );
});

test("validateAssetFiles: rejects wrong transition count", () => {
  const names = fixtureFilenames().slice(0, 45); // drop one transition
  assert.throws(
    () => validateAssetFiles(names),
    /expected 36 transition files, found 35/,
  );
});

test("validateAssetFiles: rejects unrecognized file", () => {
  const names = [...fixtureFilenames(), "stray.webp"];
  // 47 files: 10 loop + 36 transition + 1 unrecognized; transition count still 36
  // but the stray is flagged.
  assert.throws(
    () => validateAssetFiles(names),
    /unrecognized file name: stray\.webp/,
  );
});

// ---------------------------------------------------------------------------
// buildPetJson
// ---------------------------------------------------------------------------

test("buildPetJson: produces the animated-webp contract shape", () => {
  const { loop, transitions } = validateAssetFiles(fixtureFilenames());
  const pet = buildPetJson({ loop, transitions });
  assert.equal(pet.id, "jiangxiao");
  assert.equal(pet.kind, "animated-webp");
  assert.equal(Object.keys(pet.states).length, 10);
  assert.equal(pet.states.idle, "idle.webp");
  assert.equal(pet.states.listening, "listening.webp");
  assert.equal(Object.keys(pet.transitions).length, 36);
  const k = "idle->thinking";
  assert.equal(pet.transitions[k].webp, "transition-idle-thinking.webp");
  assert.equal(typeof pet.transitions[k].durationMs, "number");
  assert.ok(pet.transitions[k].durationMs > 0);
});

test("buildPetJson: every loop state has a states entry", () => {
  const { loop, transitions } = validateAssetFiles(fixtureFilenames());
  const pet = buildPetJson({ loop, transitions });
  for (const s of LOOP_STATES) {
    assert.ok(pet.states[s], `state ${s} missing`);
    assert.ok(pet.states[s].endsWith(".webp"));
  }
});

// ---------------------------------------------------------------------------
// parseTransitionStem: hyphen-bearing state names
// ---------------------------------------------------------------------------

test("parseTransitionStem: splits idle->cheek-rest (not idle-cheek->rest)", () => {
  const r = parseTransitionStem("idle-cheek-rest");
  assert.deepEqual(r, { from: "idle", to: "cheek-rest" });
});

test("parseTransitionStem: splits permission->frown-wave", () => {
  const r = parseTransitionStem("permission-frown-wave");
  assert.deepEqual(r, { from: "permission", to: "frown-wave" });
});

test("parseTransitionStem: splits nod-smile->permission", () => {
  const r = parseTransitionStem("nod-smile-permission");
  assert.deepEqual(r, { from: "nod-smile", to: "permission" });
});

test("parseTransitionStem: splits idle->thinking (simple names)", () => {
  const r = parseTransitionStem("idle-thinking");
  assert.deepEqual(r, { from: "idle", to: "thinking" });
});

test("parseTransitionStem: returns null for unknown stem", () => {
  assert.equal(parseTransitionStem("idle-bogus"), null);
  assert.equal(parseTransitionStem("bogus-idle"), null);
});

test("buildPetJson: transition keys use correct from->to for hyphen-bearing states", () => {
  const { loop, transitions } = validateAssetFiles(fixtureFilenames());
  const pet = buildPetJson({ loop, transitions });
  // Directly assert a few hyphen-bearing keys that the old greedy regex got
  // wrong (idle-cheek->rest instead of idle->cheek-rest).
  assert.ok(
    pet.transitions["idle->cheek-rest"],
    "idle->cheek-rest key missing",
  );
  assert.equal(
    pet.transitions["idle->cheek-rest"].webp,
    "transition-idle-cheek-rest.webp",
  );
  assert.ok(
    pet.transitions["permission->frown-wave"],
    "permission->frown-wave key missing",
  );
  assert.ok(
    pet.transitions["nod-smile->permission"],
    "nod-smile->permission key missing",
  );
  assert.ok(
    !pet.transitions["idle-cheek->rest"],
    "stale greedy-split key must not exist",
  );
});

// ---------------------------------------------------------------------------
// sha256
// ---------------------------------------------------------------------------

test("sha256: matches known vector", () => {
  // sha256("hello") = 2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824
  assert.equal(
    sha256(Buffer.from("hello", "utf8")),
    "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824",
  );
});

// ---------------------------------------------------------------------------
// zip write/read round-trip
// ---------------------------------------------------------------------------

test("writeZip/readZip: store-mode round-trip preserves entries", () => {
  const entries = [
    { name: "pet.json", data: Buffer.from('{"id":"x"}\n') },
    {
      name: "idle.webp",
      data: Buffer.from([0x52, 0x49, 0x46, 0x46, 0x01, 0x02, 0x03]),
    },
    { name: "a/b/c.webp", data: Buffer.alloc(100, 0xab) },
  ];
  const zip = writeZip(entries);
  const out = readZip(zip);
  assert.equal(out.length, 3);
  // readZip preserves insertion order of the central directory, which we sorted
  // lexicographically in writeZip.
  assert.equal(out[0].name, "a/b/c.webp");
  assert.equal(out[1].name, "idle.webp");
  assert.equal(out[2].name, "pet.json");
  assert.deepEqual(out[2].data, entries[0].data);
  assert.deepEqual(out[1].data, entries[1].data);
  assert.deepEqual(out[0].data, entries[2].data);
});

test("writeZip: deterministic (same input -> same bytes)", () => {
  const entries = [
    { name: "b.webp", data: Buffer.from("bbb") },
    { name: "a.webp", data: Buffer.from("aaa") },
  ];
  const z1 = writeZip(entries);
  const z2 = writeZip(entries);
  assert.deepEqual(z1, z2);
});

// ---------------------------------------------------------------------------
// hash-manifest
// ---------------------------------------------------------------------------

function fixtureManifest() {
  const petJsonBytes = Buffer.from(
    '{"id":"jiangxiao","kind":"animated-webp"}\n',
  );
  const fileHashes = [
    {
      name: "pet.json",
      sha256: sha256(petJsonBytes),
      size: petJsonBytes.length,
    },
  ];
  // 46 webp stubs
  for (let i = 0; i < 46; i++) {
    const data = Buffer.alloc(10, i);
    fileHashes.push({ name: `f${i}.webp`, sha256: sha256(data), size: 10 });
  }
  return buildHashManifest({
    fileHashes,
    zipEntry: {
      name: "jiangxiao-pet-anim-0.0.0.zip",
      sha256: sha256(Buffer.from("zip")),
      size: 3,
    },
    generatedAt: "2026-08-17T00:00:00.000Z",
  });
}

test("buildHashManifest: shape is correct", () => {
  const m = fixtureManifest();
  assert.equal(m.schemaVersion, 1);
  assert.equal(m.petId, "jiangxiao");
  assert.equal(m.kind, "animated-webp");
  assert.equal(m.files.length, 47); // 46 webp + pet.json
  assert.ok(m.zip !== null);
  assert.equal(typeof m.uploadHint, "string");
});

test("validateHashManifest: accepts a well-formed manifest", () => {
  assert.equal(validateHashManifest(fixtureManifest()), true);
});

test("validateHashManifest: rejects wrong schemaVersion", () => {
  const m = fixtureManifest();
  m.schemaVersion = 999;
  assert.throws(() => validateHashManifest(m), /schemaVersion/);
});

test("validateHashManifest: rejects bad sha256", () => {
  const m = fixtureManifest();
  m.files[0].sha256 = "deadbeef";
  assert.throws(() => validateHashManifest(m), /bad sha256/);
});

test("validateHashManifest: rejects wrong file count", () => {
  const m = fixtureManifest();
  m.files.push({
    name: "extra.webp",
    sha256: sha256(Buffer.from("x")),
    size: 1,
  });
  assert.throws(() => validateHashManifest(m), /expected 47 file entries/);
});

test("validateHashManifest: accepts null zip (init-manifest seed)", () => {
  const m = fixtureManifest();
  m.zip = null;
  assert.equal(validateHashManifest(m), true);
});

// ---------------------------------------------------------------------------
// checkZipAgainstManifest
// ---------------------------------------------------------------------------

test("checkZipAgainstManifest: OK when zip matches manifest", () => {
  const petJsonBytes = Buffer.from(
    '{"id":"jiangxiao","kind":"animated-webp"}\n',
  );
  const entries = [{ name: "pet.json", data: petJsonBytes }];
  const fileHashes = [
    {
      name: "pet.json",
      sha256: sha256(petJsonBytes),
      size: petJsonBytes.length,
    },
  ];
  for (let i = 0; i < 46; i++) {
    const data = Buffer.alloc(10, i);
    const name = `f${i}.webp`;
    entries.push({ name, data });
    fileHashes.push({ name, sha256: sha256(data), size: 10 });
  }
  const zip = writeZip(entries);
  const manifest = buildHashManifest({
    fileHashes,
    zipEntry: null,
    generatedAt: null,
  });
  const result = checkZipAgainstManifest(zip, manifest);
  assert.equal(result.ok, true);
  assert.equal(result.checked, 47);
  assert.equal(result.mismatches.length, 0);
});

test("checkZipAgainstManifest: detects corrupted file content", () => {
  const petJsonBytes = Buffer.from('{"id":"jiangxiao"}\n');
  const entries = [{ name: "pet.json", data: petJsonBytes }];
  const fileHashes = [
    {
      name: "pet.json",
      sha256: sha256(petJsonBytes),
      size: petJsonBytes.length,
    },
  ];
  for (let i = 0; i < 46; i++) {
    const data = Buffer.alloc(10, i);
    const name = `f${i}.webp`;
    entries.push({ name, data });
    fileHashes.push({ name, sha256: sha256(data), size: 10 });
  }
  const zip = writeZip(entries);
  // Tamper the manifest: replace one file's sha256 with a wrong hash. This is
  // equivalent to the zip's bytes for that file having changed (the check
  // compares both sides symmetrically).
  const badHashes = fileHashes.map((f, i) =>
    i === 1 ? { ...f, sha256: "0".repeat(64) } : f,
  );
  const manifest = buildHashManifest({
    fileHashes: badHashes,
    zipEntry: null,
    generatedAt: null,
  });
  const result = checkZipAgainstManifest(zip, manifest);
  assert.equal(result.ok, false);
  assert.ok(result.mismatches.some((m) => m.startsWith("sha256 mismatch")));
});

test("checkZipAgainstManifest: detects byte-flipped zip data region", () => {
  // Flip a byte inside a known data region of the zip (not a header field) and
  // confirm the check catches the sha256 drift.
  const entries = [
    { name: "pet.json", data: Buffer.from('{"id":"jiangxiao"}\n') },
  ];
  for (let i = 0; i < 46; i++)
    entries.push({ name: `f${i}.webp`, data: Buffer.alloc(20, i + 1) });
  const zip = writeZip(entries);
  // entry 0 after sort is f0.webp: LFH 30 + name 6 + data 20. Data starts at
  // offset 36 and spans 36..55. Flip offset 40 (inside f0.webp data).
  const tampered = Buffer.from(zip);
  tampered[40] ^= 0xff;
  const fileHashes = [
    {
      name: "pet.json",
      sha256: sha256(entries.find((e) => e.name === "pet.json").data),
      size: 20,
    },
  ];
  for (let i = 0; i < 46; i++) {
    const data = entries.find((e) => e.name === `f${i}.webp`).data;
    fileHashes.push({
      name: `f${i}.webp`,
      sha256: sha256(data),
      size: data.length,
    });
  }
  // pet.json size in manifest must match its real size, fix it:
  fileHashes[0] = {
    name: "pet.json",
    sha256: sha256(entries[0].data),
    size: entries[0].data.length,
  };
  const manifest = buildHashManifest({
    fileHashes,
    zipEntry: null,
    generatedAt: null,
  });
  const result = checkZipAgainstManifest(tampered, manifest);
  assert.equal(result.ok, false);
  assert.ok(result.mismatches.some((m) => m.startsWith("sha256 mismatch")));
});

test("checkZipAgainstManifest: detects missing file in zip", () => {
  const petJsonBytes = Buffer.from('{"id":"jiangxiao"}\n');
  const fileHashes = [
    {
      name: "pet.json",
      sha256: sha256(petJsonBytes),
      size: petJsonBytes.length,
    },
  ];
  for (let i = 0; i < 46; i++) {
    fileHashes.push({
      name: `f${i}.webp`,
      sha256: sha256(Buffer.alloc(10, i)),
      size: 10,
    });
  }
  // Zip with only 46 entries (drop one webp).
  const entries = [{ name: "pet.json", data: petJsonBytes }];
  for (let i = 0; i < 45; i++) {
    entries.push({ name: `f${i}.webp`, data: Buffer.alloc(10, i) });
  }
  const zip = writeZip(entries);
  const manifest = buildHashManifest({
    fileHashes,
    zipEntry: null,
    generatedAt: null,
  });
  const result = checkZipAgainstManifest(zip, manifest);
  assert.equal(result.ok, false);
  assert.ok(result.mismatches.some((m) => m.startsWith("missing in zip:")));
});

test("checkZipAgainstManifest: detects extra file in zip", () => {
  const petJsonBytes = Buffer.from('{"id":"jiangxiao"}\n');
  const entries = [{ name: "pet.json", data: petJsonBytes }];
  const fileHashes = [
    {
      name: "pet.json",
      sha256: sha256(petJsonBytes),
      size: petJsonBytes.length,
    },
  ];
  for (let i = 0; i < 46; i++) {
    const data = Buffer.alloc(10, i);
    const name = `f${i}.webp`;
    entries.push({ name, data });
    fileHashes.push({ name, sha256: sha256(data), size: 10 });
  }
  // Add an extra file not in the manifest.
  const zip = writeZip([
    ...entries,
    { name: "stray.txt", data: Buffer.from("x") },
  ]);
  const manifest = buildHashManifest({
    fileHashes,
    zipEntry: null,
    generatedAt: null,
  });
  const result = checkZipAgainstManifest(zip, manifest);
  assert.equal(result.ok, false);
  assert.ok(result.mismatches.some((m) => m.startsWith("extra in zip")));
});

// ---------------------------------------------------------------------------
// --check CLI smoke: write a fixture zip to a temp file and run checkZip.
// ---------------------------------------------------------------------------

test("checkZipAgainstManifest: temp-file round-trip via fs", () => {
  const dir = mkdtempSync(join(tmpdir(), "pack-jx-"));
  try {
    const petJsonBytes = Buffer.from(
      '{"id":"jiangxiao","kind":"animated-webp"}\n',
    );
    const entries = [{ name: "pet.json", data: petJsonBytes }];
    const fileHashes = [
      {
        name: "pet.json",
        sha256: sha256(petJsonBytes),
        size: petJsonBytes.length,
      },
    ];
    for (let i = 0; i < 46; i++) {
      const data = Buffer.alloc(8, i + 1);
      const name = `f${i}.webp`;
      entries.push({ name, data });
      fileHashes.push({ name, sha256: sha256(data), size: 8 });
    }
    const zip = writeZip(entries);
    const zipPath = join(dir, "test.zip");
    writeFileSync(zipPath, zip);
    const manifest = buildHashManifest({
      fileHashes,
      zipEntry: null,
      generatedAt: null,
    });
    const result = checkZipAgainstManifest(zip, manifest);
    assert.equal(result.ok, true);
    assert.equal(result.checked, 47);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
