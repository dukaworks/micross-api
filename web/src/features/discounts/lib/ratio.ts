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
import { parseRatioText } from './format'

/** 后端把折扣存成固定 6 位小数的字符串，界面提交前要凑成同样的形状。 */
const RATIO_DECIMALS = 6

/**
 * 把界面上输入的折扣规范化成后端要的 6 位小数字符串。
 *
 * 返回 null 表示这个输入不能提交——**不能悄悄改成 0 或 1**：
 * 折扣 0 等于免费、大于 1 等于加价，两者都是真会赔钱的错误，
 * 必须让填的人自己看见并改掉。
 *
 * `allowZero` 给「最低折扣」「分成比例」这类允许为 0 的字段用；
 * 折扣本身（base_discount / discount）不允许 0。
 */
export function normalizeRatioInput(
  raw: string,
  options: { allowZero?: boolean } = {}
): string | null {
  const trimmed = raw.trim()
  if (!trimmed) return null
  const value = Number(trimmed)
  if (!Number.isFinite(value)) return null
  if (value < 0 || value > 1) return null
  if (!options.allowZero && value === 0) return null
  return value.toFixed(RATIO_DECIMALS)
}

/**
 * 把后端给的 6 位小数字符串放回输入框：`"1.000000"` → `"1"`，`"0.300000"` → `"0.3"`。
 * 解析不出来（null／空串／脏数据）就返回空串，让运营重新填，而不是回显一个假的 0。
 */
export function ratioTextToInput(raw: string | null | undefined): string {
  const parsed = parseRatioText(raw)
  if (parsed === null) return ''
  return String(parsed)
}
