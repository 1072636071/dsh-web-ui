#!/usr/bin/env node
'use strict'

/**
 * dsh-task-board — one-command mount/unmount for the task-board GUI plugin.
 *
 * mount   : create the profile node_modules symlink for
 *           @deepseek-ai/dsh-client-ui-task-board and append the plugin's
 *           managed section to ~/.dsh/cordis.patch.yml (hot-reloaded by the
 *           config watcher; a page refresh shows the sidebar entry).
 * unmount : remove the managed section and the symlink — the GUI fully
 *           reverts; task data stays in the browser (localStorage).
 * status  : report the current mount state.
 *
 * The managed section is delimited by its own markers, so other managed
 * sections (dsh-skin, dsh-web-ui skin center, personal rows) are never
 * touched.
 */

import fs from 'node:fs'
import path from 'node:path'

const HOME = process.env.HOME
const PATCH = path.join(HOME, '.dsh', 'cordis.patch.yml')
const PROFILE_MODULES = path.join(HOME, '.dsh', 'profiles', 'node_modules')
const PKG = '@deepseek-ai/dsh-client-ui-task-board'
const ID = 'ui-task-board'
const REPO = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..')

const START = '# --- dsh-task-board (managed by the dsh-task-board repo; do not edit) ---'
const END = '# --- end dsh-task-board ---'

function managedSection() {
  return `${START}\n- insert:\n    - id: ${ID}\n      name: '${PKG}'\n${END}`
}

function readPatch() {
  return fs.existsSync(PATCH) ? fs.readFileSync(PATCH, 'utf8') : ''
}

function stripSection(patch) {
  const start = patch.indexOf(START)
  if (start === -1) return patch
  const end = patch.indexOf(END, start)
  if (end === -1) {
    throw new Error('dsh-task-board managed section is unterminated; fix ~/.dsh/cordis.patch.yml manually')
  }
  return patch.slice(0, start) + patch.slice(end + END.length)
}

function symlinkPath() {
  return path.join(PROFILE_MODULES, PKG)
}

function symlinkExists() {
  return fs.existsSync(symlinkPath())
}

function checkBuilt() {
  const client = path.join(REPO, 'lib', 'client.js')
  if (!fs.existsSync(client)) {
    console.warn(`⚠  ${client} 不存在——请先在仓库里运行 npm run build（构建出 lib/client.js）再挂载。`)
    return false
  }
  return true
}

function mount() {
  if (!fs.existsSync(path.join(REPO, 'package.json'))) {
    throw new Error(`仓库缺少 package.json：${REPO}`)
  }
  checkBuilt()

  // 1. profile symlink (same wiring as the skin plugins).
  const scoped = path.join(PROFILE_MODULES, '@deepseek-ai')
  fs.mkdirSync(scoped, { recursive: true })
  if (symlinkExists()) {
    console.log(`✓ symlink 已存在：${symlinkPath()}`)
  } else {
    fs.symlinkSync(REPO, symlinkPath(), 'dir')
    console.log(`✓ symlink：${symlinkPath()} → ${REPO}`)
  }

  // 2. managed patch section.
  const patch = readPatch()
  if (patch.includes(START)) {
    console.log('✓ cordis.patch.yml 已包含 dsh-task-board 段（跳过）')
  } else {
    const separator = patch === '' || patch.endsWith('\n') ? '' : '\n'
    const addition = `${separator}${patch === '' ? '' : '\n'}${managedSection()}\n`
    fs.appendFileSync(PATCH, addition)
    console.log(`✓ 已把 dsh-task-board 段追加到 ${PATCH}`)
  }

  console.log('\n完成。配置 watcher 会在数秒内热载入；刷新 dsh web GUI 页面即可看到侧边栏「任务看板」入口。')
}

function unmount() {
  // 1. managed patch section.
  const patch = readPatch()
  if (patch.includes(START)) {
    const cleaned = stripSection(patch).replace(/\n{3,}/g, '\n\n').replace(/\n+$/, '\n')
    fs.writeFileSync(PATCH, cleaned)
    console.log('✓ 已移除 cordis.patch.yml 中的 dsh-task-board 段（其它段不受影响）')
  } else {
    console.log('· cordis.patch.yml 无 dsh-task-board 段（跳过）')
  }

  // 2. profile symlink.
  if (symlinkExists()) {
    fs.unlinkSync(symlinkPath())
    console.log('✓ 已移除 symlink')
  } else {
    console.log('· symlink 不存在（跳过）')
  }

  console.log('\n完成。刷新页面后 GUI 恢复原状；任务数据保留在浏览器 localStorage（如需清除：浏览器控制台执行 localStorage.removeItem("dsh.taskBoard.v1")）。')
}

function status() {
  const patch = readPatch()
  console.log(`插件 id    : ${ID}`)
  console.log(`仓库       : ${REPO}`)
  console.log(`symlink    : ${symlinkExists() ? '已挂载' : '未挂载'} (${symlinkPath()})`)
  console.log(`patch 段   : ${patch.includes(START) ? '已写入' : '未写入'} (${PATCH})`)
  console.log(`lib/client.js: ${fs.existsSync(path.join(REPO, 'lib', 'client.js')) ? '已构建' : '未构建'}`)
}

const command = process.argv[2]
if (command === 'mount') mount()
else if (command === 'unmount') unmount()
else if (command === 'status') status()
else {
  console.error('用法: node scripts/dsh-task-board.js <mount|unmount|status>')
  process.exit(1)
}
