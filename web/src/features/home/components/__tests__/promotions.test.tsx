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
import { render, screen, within } from '@testing-library/react'
import i18next from 'i18next'
import { beforeAll, describe, expect, test, vi } from 'vitest'

import { Promotions } from '../sections/promotions'

class IntersectionObserverStub {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
  takeRecords(): [] {
    return []
  }
}

describe('home promotions section', () => {
  beforeAll(() => {
    i18next.addResourceBundle('en', 'translation', {
      'Global models': 'Global models',
      'China models': 'China models',
      'Up to': 'Up to',
      Input: 'Input',
      Output: 'Output',
      Cache: 'Cache',
      'Vendor list price · per 1M tokens': 'Vendor list price · per 1M tokens',
    })
    vi.stubGlobal('IntersectionObserver', IntersectionObserverStub)
  })

  test('renders two labelled groups with three flagship cards each', () => {
    render(<Promotions />)

    expect(
      screen.getByRole('heading', { name: 'Global models' })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'China models' })
    ).toBeInTheDocument()

    const groups = screen.getAllByRole('list')
    expect(groups).toHaveLength(2)
    expect(
      groups.every(
        (group) => within(group).getAllByRole('listitem').length === 3
      )
    ).toBe(true)
  })

  test('shows a discount badge and the vendor price footnote on every card', () => {
    render(<Promotions />)

    expect(screen.getAllByText('Up to')).toHaveLength(6)
    expect(screen.getAllByText('60% off')).toHaveLength(1)
    expect(screen.getAllByText('70% off')).toHaveLength(1)
    expect(screen.getAllByText('34% off')).toHaveLength(1)
    expect(
      screen.getAllByText('Vendor list price · per 1M tokens')
    ).toHaveLength(6)
  })

  test('lists every plan id together with input, output and cache prices', () => {
    render(<Promotions />)

    expect(screen.getByText('claude-fable-5')).toBeInTheDocument()
    expect(screen.getByText('gemini-3.5-flash-lite')).toBeInTheDocument()
    expect(screen.getByText('glm-5.3-flash')).toBeInTheDocument()

    expect(screen.getAllByText('Input')).toHaveLength(18)
    expect(screen.getAllByText('Output')).toHaveLength(18)
    expect(screen.getAllByText('Cache')).toHaveLength(18)
  })
})
