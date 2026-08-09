/**
 * Standalone tsdown preset for the dsh skin client bundles (this repo).
 *
 * Self-contained port of the DSH checkout's `packages/client/tsdown.client.ts`
 * preset — the official standard for dshClient plugin bundles. It must not
 * import anything from the DSH monorepo: the skins repo is installed
 * standalone (git or path) and built by each package's `prepare` script with
 * no project references and no type checking, exactly like the official
 * turtle-ui example plugin.
 *
 * Emits the closure-factory artifact the loader expects: the bundle calls
 * `window.__ModuleLoader__.load({id, factory})` and resolves externals
 * through the injected require (the loader module table — cordis DI entities,
 * no globals, no import map). CSS Modules are compiled by lightningcss inside
 * the bundle: importing `x.module.css` yields the hashed class map, and the
 * css text auto-injects a `<style data-plugin="<id>">` tag at factory
 * execution (the loader removes plugin-owned tags on unload).
 */
import { readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { basename, dirname, resolve as resolvePath, sep } from 'node:path'
import type { UserConfig } from 'tsdown'
import { transform } from 'lightningcss'

/**
 * Virtual-id wrapper keeping module CSS away from tsdown's own css pipeline
 * (which requires @tsdown/css). The suffix matters: tsdown's guard matches ids
 * ending in `.css`, so the virtual id must not.
 */
const CSS_VIRTUAL_PREFIX = '\0dsh-css:'
const CSS_VIRTUAL_SUFFIX = '.mjs'

/**
 * Externals resolved from the loader module table: the shared browser
 * platform modules the shell seeds (mirror of the checkout's
 * `packages/client/web/src/platform.ts` PLATFORM_MODULES) plus the runtime
 * store exemption. Anything else is inlined into the bundle.
 */
const CLIENT_EXTERNALS: readonly string[] = [
  'react', 'react/jsx-runtime', 'react-dom', 'react-dom/client', 'cordis',
  '@deepseek-ai/dsh-client-ui-slots',
  '@deepseek-ai/dsh-client-web-react',
  '@deepseek-ai/dsh-client-ui-primitives',
  '@deepseek-ai/dsh-client-schema-form',
  '@deepseek-ai/dsh-client-runtime/client',
]

/**
 * Wire/type layers a client bundle may inline: browser-safe contract surfaces
 * with no runtime identity to share (no Symbol/instanceof/singleton state).
 * Everything else under @deepseek-ai/* is either a module-table entry
 * (external) or a leak the purity gate rejects.
 */
const INLINE_SAFE = /^@deepseek-ai\/dsh-(host-apiproxy|session|llm|tools|brand)(\/|$)/

/** Generated descriptor/codec contribution with no shared runtime identity. */
const GENERATED_REMOTE = /^@deepseek-ai\/dsh-[a-z0-9]+(?:-[a-z0-9]+)*\/remote$/

interface ClientBundleOptions {
  /** Overrides for the package's node-half library config. */
  readonly lib?: UserConfig
}

/**
 * Build the tsdown config(s) for one skin plugin package: the node-half lib
 * build (index.js) plus the browser client bundle (client.js). Both halves
 * land in `lib/`; `clean` stays off because the two configs share the output
 * directory. Exported as the resolver function tsdown accepts, mirroring the
 * checkout preset's shape (the env is ignored — standalone builds have no
 * build faces).
 * @param id - plugin id (package name), stamped into the __ModuleLoader__.load
 * handoff and onto the injected style tags.
 * @param libEntry - node-half entries (usually `['lib/types/index.js']`).
 * @param options - lib overrides for packages needing extra node-half output.
 * @returns tsdown config resolver emitting the lib and client configs.
 */
export function clientBundle(
  id: string,
  libEntry: readonly string[],
  options: ClientBundleOptions = {},
): (inlineConfig: Pick<UserConfig, 'env'>) => UserConfig[] {
  const lib: UserConfig = {
    name: id,
    entry: [...libEntry],
    outDir: 'lib',
    format: ['esm'],
    platform: 'node',
    target: 'es2024',
    fixedExtension: false,
    dts: false,
    clean: false,
    ...options.lib,
  }
  return () => [lib, clientConfig(id)]
}

function clientConfig(id: string): UserConfig {
  return {
    name: `${id}/client`,
    entry: { client: 'src/client/index.ts' },
    // Browser bundle lands next to the node half (single lib/ artifact dir;
    // the entryFileNames pin keeps it exactly lib/client.js). clean must stay
    // off — a default clean would wipe the node-half output emitted above.
    outDir: 'lib',
    format: 'cjs',
    platform: 'browser',
    // Types ship from lib/types (committed tsc output); dts here would wrap
    // the banner/footer into .d.cts and break parsing.
    dts: false,
    // Plugin code is fetched outside Vite's module graph, so its own bundle
    // must carry the TS/TSX mapping consumed by browser profiling tools.
    sourcemap: true,
    clean: false,
    external: [...CLIENT_EXTERNALS],
    // tsdown auto-externalizes package dependencies; anything NOT in the
    // loader module table must inline instead (wire/type layers, zod, clsx —
    // every non-shared dep). A require() the table cannot answer is a
    // guaranteed runtime throw, so the rule is the table list itself: no
    // opinion for table entries (external above wins), bundle everything else.
    noExternal: (source: string) => (CLIENT_EXTERNALS.includes(source) ? undefined : true),
    // Browser bundles inline node-idiom deps (zustand/immer read
    // process.env.NODE_ENV; zustand's esm build also probes
    // import.meta.env.MODE, which a CJS output cannot carry — rolldown flags
    // EMPTY_IMPORT_META). Both keys honor the build's NODE_ENV so a dev build
    // keeps the dev-branch semantics; artifacts default to production. The
    // bare `import.meta.env` key is required alongside the precise MODE key:
    // zustand probes `import.meta.env ? import.meta.env.MODE : ...`.
    define: {
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV ?? 'production'),
      'import.meta.env.MODE': JSON.stringify(process.env.NODE_ENV ?? 'production'),
      'import.meta.env': JSON.stringify({ MODE: process.env.NODE_ENV ?? 'production' }),
    },
    plugins: [{
      // Bundle purity gate (mirror of the module-edge rules): platform seed
      // entries stay external, inline-safe wire layers inline, and every
      // other @deepseek-ai value import is a build error — a cross-plugin
      // value import either inlines a duplicate runtime instance or requires
      // a specifier the frozen module table cannot answer. Cross-plugin
      // collaboration goes through cordis services instead. Type-only imports
      // are erased and never reach this gate.
      name: 'dsh-client-bundle-purity',
      resolveId(source: string) {
        if (!source.startsWith('@deepseek-ai/')) return null
        if (CLIENT_EXTERNALS.includes(source)) return null // platform module: external wins
        if (INLINE_SAFE.test(source) || GENERATED_REMOTE.test(source)) return null // wire contribution: inline is the point
        throw new Error(
          `client bundle purity: "${source}" is not a platform module (CLIENT_EXTERNALS), an inline-safe wire layer, or a generated /remote contribution — `
          + 'cross-plugin value imports are forbidden; collaborate through cordis services (type-only imports are erased and never reach this gate)',
        )
      },
    }, {
      name: 'dsh-css-modules-inline',
      resolveId(source: string, importer: string | undefined) {
        if (!source.endsWith('.module.css')) return null
        const abs = importer !== undefined ? sourceAssetPath(source, importer) : source
        return CSS_VIRTUAL_PREFIX + abs + CSS_VIRTUAL_SUFFIX
      },
      async load(virtualId: string) {
        if (!virtualId.startsWith(CSS_VIRTUAL_PREFIX)) return null
        const fileId = virtualId.slice(CSS_VIRTUAL_PREFIX.length, -CSS_VIRTUAL_SUFFIX.length)
        // The virtual id otherwise hides the physical stylesheet from Rolldown's watch graph.
        this.addWatchFile(fileId)
        const source = await readFile(fileId)
        const { code, exports: cssExports } = transform({
          filename: fileId,
          code: source,
          cssModules: { pattern: '[hash]_[local]' },
          minify: true,
        })
        const classMap: Record<string, string> = {}
        // Sort deterministically: lightningcss's cssExports iteration order is
        // process-dependent (hash-map seeds), which would otherwise churn the
        // emitted lib/client.js on every rebuild.
        for (const [local, exp] of Object.entries(cssExports ?? {}).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0)) {
          classMap[local] = exp.name
        }
        // One <style data-plugin> per module file; idempotent under re-evaluation.
        return [
          `const css = ${JSON.stringify(code.toString())};`,
          `const tagId = ${JSON.stringify(`${id}/${basename(fileId)}`)};`,
          'if (typeof document !== \'undefined\' && document.querySelector(\'style[data-plugin-css=\' + JSON.stringify(tagId) + \']\') === null) {',
          '  const tag = document.createElement(\'style\');',
          `  tag.dataset.plugin = ${JSON.stringify(id)};`,
          '  tag.dataset.pluginCss = tagId;',
          '  tag.textContent = css;',
          '  document.head.appendChild(tag);',
          '}',
          `export default ${JSON.stringify(classMap)};`,
        ].join('\n')
      },
    }],
    outputOptions: {
      entryFileNames: 'client.js',
      // The map is served from /plugins/<scoped-package>/client.js.map; the
      // browser resolves its local sources back into this package's src tree.
      banner: `window.__ModuleLoader__.load({ id: ${JSON.stringify(id)}, factory: (require) => {`,
      footer: 'return module.exports; } });',
      intro: 'var module = { exports: {} }; var exports = module.exports;',
    },
  }
}

/** Resolve an emitted JS asset import against its source-tree counterpart. */
function sourceAssetPath(source: string, importer: string): string {
  const emitted = resolvePath(dirname(importer), source)
  if (existsSync(emitted)) return emitted
  const marker = `${sep}lib${sep}types${sep}`
  const boundary = emitted.indexOf(marker)
  if (boundary < 0) return emitted
  return resolvePath(emitted.slice(0, boundary), 'src', emitted.slice(boundary + marker.length))
}
