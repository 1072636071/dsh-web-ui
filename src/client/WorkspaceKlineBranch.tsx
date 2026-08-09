/**
 * Workspace quote branch: the row-below "个股页" of the code-K-line idiom.
 * Rendered under the workspace group header row when the mini sparkline is
 * expanded — a full-size candlestick chart with volume sub-chart and MA
 * overlays, plus the latest-day headline (net change and close).
 */
import type { PropsLocale, PropsRuntime, PropsStore } from '@deepseek-ai/dsh-client-ui-slots'
// Type-only: pulls ui-workspace's SlotMap merge for the branch hole.
import type {} from '@deepseek-ai/dsh-client-ui-workspace/client'
import { createCodeKlineStore } from './store.ts'
import { CandlestickChart, candleNetChange } from './CandlestickChart.tsx'
import type { CodeKlineInjected } from './index.ts'
import { NS } from './locales.ts'
import css from './WorkspaceKlineBranch.module.css'

/** Branch chart geometry. */
const CHART_WIDTH = 260
const CHART_HEIGHT = 150

/** Full props of the workspace quote branch. */
export type WorkspaceKlineBranchProps =
  PropsRuntime<'sidebar.workspaces.workspaceRow.branch'>
  & PropsStore<ReturnType<typeof createCodeKlineStore>>
  & CodeKlineInjected
  & PropsLocale<typeof NS>

const cls = (name: keyof typeof css): string => css[name] ?? ''

/**
 * Render the workspace quote branch (expanded 个股页).
 * @param props - workspace owner, store, and ensure action.
 * @returns the branch panel, or nothing while the branch is collapsed.
 */
export function WorkspaceKlineBranch({ workspaceId, useStore, ensure, t }: WorkspaceKlineBranchProps) {
  const expanded = useStore(s => s.expanded.includes(workspaceId))
  if (!expanded) return null
  const entry = useStore(s => s.entries[workspaceId])
  if (entry === undefined || entry.state === 'idle') {
    ensure(workspaceId)
    return <div className={cls('branch')}>{t('row.loading')}</div>
  }
  if (entry.state === 'loading') {
    return <div className={cls('branch')}>{t('row.loading')}</div>
  }
  if (entry.candles.length === 0) {
    const reason = entry.reason === 'not-a-git-repository'
      ? t('panel.noGit')
      : entry.reason === 'scan-error'
        ? t('panel.scanError')
        : t('panel.noHistory')
    return <div className={cls('branch')}>{reason}</div>
  }
  const last = entry.candles[entry.candles.length - 1]
  if (last === undefined) return <div className={cls('branch')}>{t('panel.noHistory')}</div>
  const net = candleNetChange(last)
  return (
    <div className={cls('branch')}>
      <div className={cls('headline')} data-trend={net >= 0 ? 'up' : 'down'}>
        <span className={cls('title')}>{t('panel.title')}</span>
        <span className={cls('net')}>
          {t('row.net', { n: net })}
        </span>
        <span className={cls('close')}>
          {t('row.close', { n: last.close })}
        </span>
      </div>
      <CandlestickChart
        candles={entry.candles}
        width={CHART_WIDTH}
        height={CHART_HEIGHT}
        showVolume
        maPeriods={[5, 20]}
      />
    </div>
  )
}
