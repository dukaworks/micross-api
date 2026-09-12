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
import { describe, expect, test } from 'vitest'

import {
  RATIO_UNKNOWN_TEXT,
  formatMarginText,
  formatRatioText,
  parseRatioText,
} from '../format'

describe('discount ratio formatting', () => {
  test('reads the fixed 6-decimal strings the backend sends', () => {
    expect(parseRatioText('0.300000')).toBeCloseTo(0.3)
    expect(parseRatioText(' 1.000000 ')).toBe(1)
    expect(parseRatioText('-0.629630')).toBeCloseTo(-0.62963)
  })

  test('treats missing or unreadable values as unknown, never as zero', () => {
    for (const broken of [null, undefined, '', '   ', 'abc', 'NaN', 'Infinity']) {
      expect(parseRatioText(broken)).toBeNull()
      expect(formatRatioText(broken)).toBe(RATIO_UNKNOWN_TEXT)
      expect(formatMarginText(broken)).toBe(RATIO_UNKNOWN_TEXT)
    }
  })

  test('renders discounts and cost ratios as percentages', () => {
    expect(formatRatioText('0.300000')).toBe('30.00%')
    expect(formatRatioText('1.000000')).toBe('100.00%')
    expect(formatRatioText('0.000000')).toBe('0.00%')
  })

  test('renders margins with an explicit sign so a loss is obvious', () => {
    expect(formatMarginText('0.111111')).toBe('+11.11%')
    expect(formatMarginText('-0.629630')).toBe('-62.96%')
    expect(formatMarginText('0.000000')).toBe('0.00%')
  })
})
