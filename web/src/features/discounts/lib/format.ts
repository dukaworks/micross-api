/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/
/**
 * 未录入／解析不出的占位符。
 * 后端给 `null` 表示「不知道这个数」，界面绝不能把它显示成 0——
 * 那会让运营以为「这条线路稳赚/稳亏」。
 */
export const RATIO_UNKNOWN_TEXT = '—'

/**
 * 解析后端给的 6 位小数字符串（折扣、进货折扣、毛利）。
 * `null`／空串／解析不出都返回 `null`，由调用方决定怎么显示。
 */
export function parseRatioText(raw: string | null | undefined): number | null {
  if (raw == null) return null
  const trimmed = raw.trim()
  if (!trimmed) return null
  const value = Number(trimmed)
  if (!Number.isFinite(value)) return null
  return value
}

/** `0.300000` → `"30.00%"`；`null`／空 → `"—"` */
export function formatRatioText(raw: string | null | undefined): string {
  const value = parseRatioText(raw)
  if (value === null) return RATIO_UNKNOWN_TEXT
  return `${(value * 100).toFixed(2)}%`
}

/** `0.111111` → `"+11.11%"`；`-0.629630` → `"-62.96%"`；`null` → `"—"` */
export function formatMarginText(raw: string | null | undefined): string {
  const value = parseRatioText(raw)
  if (value === null) return RATIO_UNKNOWN_TEXT
  const percent = (value * 100).toFixed(2)
  return value > 0 ? `+${percent}%` : `${percent}%`
}
