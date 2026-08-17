#!/usr/bin/env node
/**
 * Pack the jiangxiao animated-webp pet asset bundle.
 *
 * Source assets live in local-assets/jiangxiao-pet/ (46 webp, ~232MB, gitignored,
 * never checked in). This script reads them, validates the 10 loop states + 36
 * transition states naming contract, generates pet.json (kind: "animated-webp"),
 * writes a deterministic store-mode zip (pet.json + 46 webp), and emits an
 * immutable hash-manifest.json (per-file sha256 + byte size + zip sha256) that
 * IS checked in as the version ledger.
 *
 * Usage:
 *   node scripts/pack-jiangxiao-pet.mjs                 # full pack: pet.json + zip + hash-manifest
 *   node scripts/pack-jiangxiao-pet.mjs --check <zip>   # verify a zip against hash-manifest.json
 *   node scripts/pack-jiangxiao-pet.mjs --init-manifest # scan local-assets, write hash-manifest
 *                                                        # with zipSha256=null (no zip built); used
 *                                                        # to seed the in-repo ledger without the
 *                                                        # 232MB pack step
 *
 * Release upload (maintainer, local; CI cannot build the zip because
 * local-assets/ is gitignored and absent from the checkout):
 *   gh release upload vX.Y.Z <zip-path> --clobber
 * The zip is named jiangxiao-pet-anim-<version>.zip where <version> is read
 * from packages/dsh-pet/package.json. release.yml is unchanged: the asset is
 * attached out-of-band by the maintainer who ran the pack. See issue 06-pack.md
 * and ADR-0001 D3/D12.
 *
 * Determinism: the zip uses store compression (webp is already compressed,
 * gzip ratio ~= 1.0 per ADR-0001), fixed DOS timestamp 0 (1980-01-01), and
 * lexicographic entry order, so the same source set always yields the same
 * zip bytes and the same zipSha256.
 *
 * No external dependencies: zip write/read is a minimal hand-rolled
 * implementation (store + deflate via node:zlib); sha256 via node:crypto.
 */
import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, resolve as resolvePath } from "node:path";
import { crc32, deflateRawSync, inflateRawSync } from "node:zlib";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolvePath(SCRIPT_DIR, "..");

/** Source assets directory (gitignored, ~232MB, not in checkout). */
const ASSET_DIR = join(REPO_ROOT, "local-assets", "jiangxiao-pet");

/** In-repo ledger + pet.json home (webp themselves are not checked in). */
const LEDGER_DIR = join(
  REPO_ROOT,
  "packages",
  "dsh-pet",
  "assets",
  "jiangxiao",
);
const HASH_MANIFEST_PATH = join(LEDGER_DIR, "hash-manifest.json");
const PET_JSON_PATH = join(LEDGER_DIR, "pet.json");

/** 10 loop states (PRD D7 JiangxiaoState). */
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

/**
 * 6 micro-expression states that appear as transition endpoints in the 36
 * transition files but are NOT pet-reachable loop states (PRD D7/D13: kept in
 * the bundle for asset completeness, not indexed by the renderer's transition
 * table). Needed to parse transition file names unambiguously, since both
 * from and to may contain hyphens (e.g. "idle->cheek-rest").
 */
const MICRO_STATES = [
  "cheek-rest",
  "chin-rest",
  "nod-smile",
  "shush",
  "shy-smile",
  "frown-wave",
];

/** All known state names that can appear as a transition endpoint. */
const KNOWN_STATES = new Set([...LOOP_STATES, ...MICRO_STATES]);

/**
 * Parse a transition file's "<from>-<to>" stem (the part between "transition-"
 * and ".webp") into { from, to } by matching against the known state vocabulary.
 * Returns null when no unambiguous (from, to) split exists. Hyphen-bearing
 * state names (cheek-rest, frown-wave, ...) make a pure regex split impossible,
 * so we walk the known state set instead.
 */
export function parseTransitionStem(stem) {
  for (const from of KNOWN_STATES) {
    const prefix = from + "-";
    if (stem.startsWith(prefix)) {
      const to = stem.slice(prefix.length);
      if (KNOWN_STATES.has(to)) return { from, to };
    }
  }
  return null;
}

/**
 * Default transition duration in milliseconds. openCodeMM does not ship a
 * per-transition duration table that this script can read, so every transition
 * gets a single conservative default. The renderer is free to override per
 * key once the openCodeMM transition table is ported (PRD D7/D8).
 */
const DEFAULT_TRANSITION_MS = 600;

/** Manifest schema version (bumped only on breaking ledger shape change). */
const MANIFEST_SCHEMA_VERSION = 1;

// ---------------------------------------------------------------------------
// Asset validation
// ---------------------------------------------------------------------------

/**
 * Build the expected 46-file set: 10 loop states (<state>.webp) + 36 transition
 * states (transition-<from>-<to>.webp). The transition keys are derived from
 * the actual file names present in the source directory rather than a hardcoded
 * list, so the script adapts if the asset set grows; but the count must be
 * exactly 36 and every loop state must be present.
 */
function expectedLoopFiles() {
  return LOOP_STATES.map((s) => `${s}.webp`);
}

/**
 * Validate the file list against the 10 loop + 36 transition contract.
 * Returns { loop, transitions } on success; throws on any mismatch.
 *
 * Pure function (no fs), unit-tested directly.
 */
export function validateAssetFiles(filenames) {
  const set = new Set(filenames);
  const errors = [];

  const loop = expectedLoopFiles();
  for (const f of loop) {
    if (!set.has(f)) errors.push(`missing loop state: ${f}`);
  }

  const transitions = [];
  for (const f of filenames) {
    const m = /^transition-(.+)\.webp$/.exec(f);
    if (m) {
      const stem = m[1];
      if (!parseTransitionStem(stem)) {
        errors.push(`unparseable transition stem: ${stem} (file ${f})`);
      }
      transitions.push(f);
    } else if (!loop.includes(f)) {
      errors.push(`unrecognized file name: ${f}`);
    }
  }

  if (transitions.length !== 36) {
    errors.push(`expected 36 transition files, found ${transitions.length}`);
  }

  // Detect duplicates (shouldn't happen with a Set, but be explicit).
  if (new Set(filenames).size !== filenames.length) {
    errors.push("duplicate file names in source directory");
  }

  if (errors.length) {
    throw new Error("asset validation failed:\n  " + errors.join("\n  "));
  }

  return { loop: loop.slice().sort(), transitions: transitions.sort() };
}

// ---------------------------------------------------------------------------
// pet.json
// ---------------------------------------------------------------------------

/**
 * Build the pet.json object (kind: "animated-webp") from the validated file
 * set. Loop states map to <state>.webp; transitions map "<from>-><to>" to
 * { webp: "transition-<from>-<to>.webp", durationMs }. The transition key uses
 * an ASCII "->" separator (PRD D7 writes the arrow as a documentation glyph;
 * the on-disk key is ASCII for portability and to stay clearly outside the
 * repo's emoji ban). The renderer's transition table (issue 03) must use the
 * same key shape.
 *
 * Pure function, unit-tested directly.
 */
export function buildPetJson({ loop, transitions }) {
  const states = {};
  for (const f of loop) {
    const state = f.replace(/\.webp$/, "");
    states[state] = f;
  }

  const transitionsMap = {};
  for (const f of transitions) {
    const m = /^transition-(.+)\.webp$/.exec(f);
    if (!m) continue;
    const parsed = parseTransitionStem(m[1]);
    if (!parsed) continue;
    const key = `${parsed.from}->${parsed.to}`;
    transitionsMap[key] = { webp: f, durationMs: DEFAULT_TRANSITION_MS };
  }

  return {
    id: "jiangxiao",
    displayName: "姜晓",
    description:
      "唐风二次元角色姜晓的独立 WebP 动画宠物：10 循环态 + 36 枢纽制过渡态。",
    kind: "animated-webp",
    states,
    transitions: transitionsMap,
  };
}

// ---------------------------------------------------------------------------
// sha256
// ---------------------------------------------------------------------------

/** sha256 hex of a Buffer/Uint8Array. */
export function sha256(buf) {
  return createHash("sha256").update(buf).digest("hex");
}

// ---------------------------------------------------------------------------
// Minimal zip writer (store + deflate) and reader
// ---------------------------------------------------------------------------

const LFH_SIG = 0x04034b50;
const CFH_SIG = 0x02014b50;
const EOCD_SIG = 0x06054b50;

/** Little-endian uint8/16/32 writers. */
function u8(buf, off, v) {
  buf[off] = v & 0xff;
}
function u16(buf, off, v) {
  u8(buf, off, v);
  u8(buf, off + 1, v >>> 8);
}
function u32(buf, off, v) {
  u16(buf, off, v & 0xffff);
  u16(buf, off + 2, (v >>> 16) & 0xffff);
}

/** Little-endian uint16/32 readers. */
function r16(buf, off) {
  return buf[off] | (buf[off + 1] << 8);
}
function r32(buf, off) {
  return (
    (buf[off] |
      (buf[off + 1] << 8) |
      (buf[off + 2] << 16) |
      (buf[off + 3] << 24)) >>>
    0
  );
}

/**
 * Encode a name -> bytes zip entry. Store mode (compression 0) for
 * determinism and because webp is already compressed. Returns the raw bytes
 * plus metadata the central directory needs.
 */
function encodeEntry(name, data) {
  const nameBytes = Buffer.from(name, "utf8");
  const crc = crc32(data) >>> 0;
  const size = data.length;

  // Local file header (30 bytes) + name + data
  const lfh = Buffer.alloc(30 + nameBytes.length + size);
  u32(lfh, 0, LFH_SIG);
  u16(lfh, 4, 20); // version needed
  u16(lfh, 6, 0); // flags
  u16(lfh, 8, 0); // compression: store
  u16(lfh, 10, 0); // mod time
  u16(lfh, 12, 0); // mod date (1980-01-01)
  u32(lfh, 14, crc);
  u32(lfh, 18, size); // compressed size
  u32(lfh, 22, size); // uncompressed size
  u16(lfh, 26, nameBytes.length);
  u16(lfh, 28, 0); // extra length
  nameBytes.copy(lfh, 30);
  data.copy(lfh, 30 + nameBytes.length);

  return { nameBytes, crc, size, lfh };
}

/**
 * Write a deterministic store-mode zip. Entries are sorted by name; timestamps
 * are zero; no extra/comment fields. Pure (returns a Buffer), unit-tested.
 */
export function writeZip(entries) {
  const sorted = [...entries].sort((a, b) =>
    a.name < b.name ? -1 : a.name > b.name ? 1 : 0,
  );
  const encoded = sorted.map((e) => encodeEntry(e.name, e.data));

  // Layout: [LFH_0 + data_0][LFH_1 + data_1]...[CDH_0][CDH_1]...[EOCD]
  let offset = 0;
  const lfhChunks = [];
  const offsets = [];
  for (const e of encoded) {
    offsets.push(offset);
    lfhChunks.push(e.lfh);
    offset += e.lfh.length;
  }
  const lfhBlock = Buffer.concat(lfhChunks);

  const cdhChunks = [];
  let cdSize = 0;
  for (let i = 0; i < encoded.length; i++) {
    const e = encoded[i];
    const cdh = Buffer.alloc(46 + e.nameBytes.length);
    u32(cdh, 0, CFH_SIG);
    u16(cdh, 4, 20); // version made by
    u16(cdh, 6, 20); // version needed
    u16(cdh, 8, 0); // flags
    u16(cdh, 10, 0); // compression: store
    u16(cdh, 12, 0); // mod time
    u16(cdh, 14, 0); // mod date
    u32(cdh, 16, e.crc);
    u32(cdh, 20, e.size); // compressed size
    u32(cdh, 24, e.size); // uncompressed size
    u16(cdh, 28, e.nameBytes.length);
    u16(cdh, 30, 0); // extra
    u16(cdh, 32, 0); // comment
    u16(cdh, 34, 0); // disk number start
    u16(cdh, 36, 0); // internal attrs
    u32(cdh, 38, 0); // external attrs
    u32(cdh, 42, offsets[i]); // local header offset
    e.nameBytes.copy(cdh, 46);
    cdhChunks.push(cdh);
    cdSize += cdh.length;
  }
  const cdBlock = Buffer.concat(cdhChunks);
  const cdOffset = lfhBlock.length;

  const eocd = Buffer.alloc(22);
  u32(eocd, 0, EOCD_SIG);
  u16(eocd, 4, 0); // disk number
  u16(eocd, 6, 0); // disk with cd
  u16(eocd, 8, encoded.length); // entries on this disk
  u16(eocd, 10, encoded.length); // total entries
  u32(eocd, 12, cdSize); // cd size
  u32(eocd, 16, cdOffset); // cd offset
  u16(eocd, 20, 0); // comment length

  return Buffer.concat([lfhBlock, cdBlock, eocd]);
}

/**
 * Read a zip Buffer into { name, data } entries. Supports store (0) and
 * deflate (8) via node:zlib. Reads the central directory (not the local file
 * headers) for robustness. Pure (returns an array), unit-tested.
 */
export function readZip(buf) {
  // Find EOCD by scanning backwards (comment is rare; 22-byte tail is typical).
  let eocdOff = -1;
  for (let i = buf.length - 22; i >= 0; i--) {
    if (r32(buf, i) === EOCD_SIG) {
      eocdOff = i;
      break;
    }
  }
  if (eocdOff < 0) throw new Error("zip: EOCD signature not found");
  const totalEntries = r16(buf, eocdOff + 10);
  const cdOffset = r32(buf, eocdOff + 16);

  const out = [];
  let p = cdOffset;
  for (let i = 0; i < totalEntries; i++) {
    if (r32(buf, p) !== CFH_SIG)
      throw new Error(`zip: bad central directory header at ${p}`);
    const comp = r16(buf, p + 10);
    const compSize = r32(buf, p + 20);
    const uncompSize = r32(buf, p + 24);
    const nameLen = r16(buf, p + 28);
    const extraLen = r16(buf, p + 30);
    const commentLen = r16(buf, p + 32);
    const lfhOff = r32(buf, p + 42);
    const name = buf.subarray(p + 46, p + 46 + nameLen).toString("utf8");

    // Read data from the local file header (which has its own name/extra lengths).
    if (r32(buf, lfhOff) !== LFH_SIG)
      throw new Error(`zip: bad local header at ${lfhOff}`);
    const lNameLen = r16(buf, lfhOff + 26);
    const lExtraLen = r16(buf, lfhOff + 28);
    const dataStart = lfhOff + 30 + lNameLen + lExtraLen;
    const raw = buf.subarray(dataStart, dataStart + compSize);

    let data;
    if (comp === 0) {
      data = Buffer.from(raw);
    } else if (comp === 8) {
      data = inflateRawSync(raw, { maxOutputLength: uncompSize });
    } else {
      throw new Error(
        `zip: unsupported compression method ${comp} for ${name}`,
      );
    }

    if (data.length !== uncompSize) {
      throw new Error(
        `zip: size mismatch for ${name}: ${data.length} vs ${uncompSize}`,
      );
    }
    out.push({ name, data });
    p += 46 + nameLen + extraLen + commentLen;
  }
  return out;
}

// ---------------------------------------------------------------------------
// hash-manifest.json
// ---------------------------------------------------------------------------

/**
 * Build the hash-manifest object from per-file hashes and the zip hash.
 * Shape:
 *   {
 *     schemaVersion: 1,
 *     petId: "jiangxiao",
 *     kind: "animated-webp",
 *     generatedAt: ISO string (null for --init-manifest seed),
 *     files: [{ name, sha256, size }, ...] (46 webp + pet.json, sorted by name),
 *     zip: { name, sha256, size } | null,
 *     uploadHint: "gh release upload vX.Y.Z <zip> --clobber"
 *   }
 */
export function buildHashManifest({ fileHashes, zipEntry, generatedAt }) {
  const files = [...fileHashes].sort((a, b) =>
    a.name < b.name ? -1 : a.name > b.name ? 1 : 0,
  );
  return {
    schemaVersion: MANIFEST_SCHEMA_VERSION,
    petId: "jiangxiao",
    kind: "animated-webp",
    generatedAt: generatedAt ?? null,
    files,
    zip: zipEntry ?? null,
    uploadHint:
      "gh release upload vX.Y.Z <zip-path> --clobber (maintainer, local; CI cannot build: local-assets/ is gitignored)",
  };
}

/**
 * Validate a hash-manifest object structurally. Throws on any shape drift.
 * Pure function, unit-tested directly.
 */
export function validateHashManifest(manifest) {
  const errors = [];
  if (manifest.schemaVersion !== MANIFEST_SCHEMA_VERSION) {
    errors.push(
      `schemaVersion must be ${MANIFEST_SCHEMA_VERSION}, got ${manifest.schemaVersion}`,
    );
  }
  if (manifest.petId !== "jiangxiao")
    errors.push(`petId must be "jiangxiao", got ${manifest.petId}`);
  if (manifest.kind !== "animated-webp")
    errors.push(`kind must be "animated-webp", got ${manifest.kind}`);
  if (!Array.isArray(manifest.files)) errors.push("files must be an array");
  else {
    for (const f of manifest.files) {
      if (typeof f.name !== "string" || !f.name)
        errors.push(`bad file name: ${JSON.stringify(f.name)}`);
      if (typeof f.sha256 !== "string" || !/^[0-9a-f]{64}$/.test(f.sha256)) {
        errors.push(`bad sha256 for ${f.name}: ${f.sha256}`);
      }
      if (typeof f.size !== "number" || f.size < 0)
        errors.push(`bad size for ${f.name}: ${f.size}`);
    }
    // 46 webp + 1 pet.json = 47 entries
    if (manifest.files.length !== 47) {
      errors.push(
        `expected 47 file entries (46 webp + pet.json), got ${manifest.files.length}`,
      );
    }
  }
  if (manifest.zip !== null && typeof manifest.zip === "object") {
    const z = manifest.zip;
    if (typeof z.name !== "string" || !z.name) errors.push("zip.name missing");
    if (typeof z.sha256 !== "string" || !/^[0-9a-f]{64}$/.test(z.sha256)) {
      errors.push(`zip.sha256 bad: ${z.sha256}`);
    }
    if (typeof z.size !== "number" || z.size < 0)
      errors.push(`zip.size bad: ${z.size}`);
  } else if (manifest.zip !== null) {
    errors.push("zip must be null or an object");
  }
  if (errors.length) {
    throw new Error(
      "hash-manifest validation failed:\n  " + errors.join("\n  "),
    );
  }
  return true;
}

/**
 * Verify a zip Buffer against a hash-manifest object. Checks every manifest
 * file entry is present in the zip with matching sha256 and size. Returns
 * { ok, checked, mismatches } on success; throws on structural failure.
 */
export function checkZipAgainstManifest(zipBuf, manifest) {
  validateHashManifest(manifest);
  const entries = readZip(zipBuf);
  const byName = new Map(entries.map((e) => [e.name, e.data]));

  const mismatches = [];
  let checked = 0;
  for (const f of manifest.files) {
    const data = byName.get(f.name);
    if (!data) {
      mismatches.push(`missing in zip: ${f.name}`);
      continue;
    }
    checked++;
    if (data.length !== f.size) {
      mismatches.push(
        `size mismatch ${f.name}: zip ${data.length} vs manifest ${f.size}`,
      );
      continue;
    }
    const h = sha256(data);
    if (h !== f.sha256) {
      mismatches.push(
        `sha256 mismatch ${f.name}: zip ${h} vs manifest ${f.sha256}`,
      );
    }
  }

  // Extra files in zip not in manifest.
  for (const name of byName.keys()) {
    if (!manifest.files.some((f) => f.name === name)) {
      mismatches.push(`extra in zip, not in manifest: ${name}`);
    }
  }

  return { ok: mismatches.length === 0, checked, mismatches };
}

// ---------------------------------------------------------------------------
// Filesystem helpers
// ---------------------------------------------------------------------------

/** Read all webp files from the asset directory as { name, data }. */
function readAssetFiles() {
  if (!existsSync(ASSET_DIR)) {
    throw new Error(
      `asset directory not found: ${ASSET_DIR}\n(local-assets/ is gitignored; clone the source assets first)`,
    );
  }
  const names = readdirSync(ASSET_DIR).filter((f) => f.endsWith(".webp"));
  const { loop, transitions } = validateAssetFiles(names);
  const all = [...loop, ...transitions].sort();
  return all.map((name) => ({
    name,
    data: readFileSync(join(ASSET_DIR, name)),
  }));
}

/** Read dsh-pet package version for the zip name. */
function petVersion() {
  const pkg = JSON.parse(
    readFileSync(
      join(REPO_ROOT, "packages", "dsh-pet", "package.json"),
      "utf8",
    ),
  );
  return pkg.version;
}

// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------

function cmdInitManifest() {
  const files = readAssetFiles();
  const petJson = buildPetJson(validateAssetFiles(files.map((f) => f.name)));
  const petJsonBytes = Buffer.from(
    JSON.stringify(petJson, null, 2) + "\n",
    "utf8",
  );

  const fileHashes = [
    {
      name: "pet.json",
      sha256: sha256(petJsonBytes),
      size: petJsonBytes.length,
    },
    ...files.map((f) => ({
      name: f.name,
      sha256: sha256(f.data),
      size: f.data.length,
    })),
  ];

  const manifest = buildHashManifest({
    fileHashes,
    zipEntry: null,
    generatedAt: null,
  });
  validateHashManifest(manifest);

  mkdirSync(LEDGER_DIR, { recursive: true });
  writeFileSync(PET_JSON_PATH, petJsonBytes);
  writeFileSync(
    HASH_MANIFEST_PATH,
    Buffer.from(JSON.stringify(manifest, null, 2) + "\n", "utf8"),
  );

  console.log(`[pack-jiangxiao-pet] wrote ${PET_JSON_PATH}`);
  console.log(
    `[pack-jiangxiao-pet] wrote ${HASH_MANIFEST_PATH} (zipSha256=null, ${fileHashes.length} file entries)`,
  );
  console.log(
    "[pack-jiangxiao-pet] run full pack (no args) to build the zip and fill zipSha256",
  );
}

function cmdPack() {
  const files = readAssetFiles();
  const petJson = buildPetJson(validateAssetFiles(files.map((f) => f.name)));
  const petJsonBytes = Buffer.from(
    JSON.stringify(petJson, null, 2) + "\n",
    "utf8",
  );

  // zip entries: pet.json + 46 webp, deterministic order
  const zipEntries = [
    { name: "pet.json", data: petJsonBytes },
    ...files.map((f) => ({ name: f.name, data: f.data })),
  ];
  const zipBuf = writeZip(zipEntries);
  const zipSha = sha256(zipBuf);
  const version = petVersion();
  const zipName = `jiangxiao-pet-anim-${version}.zip`;
  const zipOutPath = join(REPO_ROOT, zipName);

  // Write zip to repo root (gitignored via local-assets? No: write to .temp/ to
  // avoid polluting the tree; maintainer moves it as needed).
  const tempDir = join(REPO_ROOT, ".temp", "output");
  mkdirSync(tempDir, { recursive: true });
  const zipPath = join(tempDir, zipName);
  writeFileSync(zipPath, zipBuf);

  // hash-manifest
  const fileHashes = [
    {
      name: "pet.json",
      sha256: sha256(petJsonBytes),
      size: petJsonBytes.length,
    },
    ...files.map((f) => ({
      name: f.name,
      sha256: sha256(f.data),
      size: f.data.length,
    })),
  ];
  const manifest = buildHashManifest({
    fileHashes,
    zipEntry: { name: zipName, sha256: zipSha, size: zipBuf.length },
    generatedAt: new Date().toISOString(),
  });
  validateHashManifest(manifest);

  mkdirSync(LEDGER_DIR, { recursive: true });
  writeFileSync(PET_JSON_PATH, petJsonBytes);
  writeFileSync(
    HASH_MANIFEST_PATH,
    Buffer.from(JSON.stringify(manifest, null, 2) + "\n", "utf8"),
  );

  console.log(`[pack-jiangxiao-pet] wrote ${PET_JSON_PATH}`);
  console.log(`[pack-jiangxiao-pet] wrote ${HASH_MANIFEST_PATH}`);
  console.log(
    `[pack-jiangxiao-pet] wrote zip: ${zipPath} (${(zipBuf.length / 1024 / 1024).toFixed(1)} MB, sha256=${zipSha})`,
  );
  console.log(
    `[pack-jiangxiao-pet] upload with: gh release upload v${version} ${zipPath} --clobber`,
  );
}

function cmdCheck(zipPath) {
  if (!zipPath) {
    console.error(
      "usage: node scripts/pack-jiangxiao-pet.mjs --check <zip-path>",
    );
    process.exit(2);
  }
  if (!existsSync(HASH_MANIFEST_PATH)) {
    console.error(
      `hash-manifest not found: ${HASH_MANIFEST_PATH}\n(run --init-manifest or full pack first)`,
    );
    process.exit(1);
  }
  const manifest = JSON.parse(readFileSync(HASH_MANIFEST_PATH, "utf8"));
  const zipBuf = readFileSync(zipPath);
  const result = checkZipAgainstManifest(zipBuf, manifest);
  if (result.ok) {
    console.log(
      `[pack-jiangxiao-pet] check OK: ${result.checked} files verified against ${HASH_MANIFEST_PATH}`,
    );
  } else {
    console.error(
      `[pack-jiangxiao-pet] check FAILED: ${result.mismatches.length} mismatch(es)`,
    );
    for (const m of result.mismatches) console.error("  " + m);
    process.exit(1);
  }
}

function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    cmdPack();
  } else if (args[0] === "--check") {
    cmdCheck(args[1]);
  } else if (args[0] === "--init-manifest") {
    cmdInitManifest();
  } else {
    console.error(
      "usage: node scripts/pack-jiangxiao-pet.mjs [--check <zip> | --init-manifest]",
    );
    process.exit(2);
  }
}

if (resolvePath(process.argv[1] ?? "") === fileURLToPath(import.meta.url)) {
  main();
}
