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
import { render } from '@testing-library/react'
import i18next from 'i18next'
import type { ComponentProps, ReactElement } from 'react'
import { beforeAll, describe, expect, test, vi } from 'vitest'

import { SECTION_PY } from '../../constants'
import { CTA } from '../sections/cta'
import { HowItWorks } from '../sections/how-it-works'
import { Promotions } from '../sections/promotions'
import { Stats } from '../sections/stats'

// The sections only use `Link` for their calls to action; a plain anchor keeps
// this layout test free of router plumbing.
vi.mock('@tanstack/react-router', () => ({
  Link: (props: { to: string } & ComponentProps<'a'>) => {
    const { to, ...rest } = props
    return <a href={to} {...rest} />
  },
}))

class IntersectionObserverStub {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
  takeRecords(): [] {
    return []
  }
}

/**
 * Only the vertical rhythm utilities, breakpoint prefixes included; colour and
 * border classes are irrelevant here.
 */
function verticalPadding(element: Element) {
  return element.className
    .split(/\s+/)
    .filter((cls) => /(^|:)(py|pt|pb)-/.test(cls))
}

/** The three content sections must all take their padding from `SECTION_PY`. */
function expectSharedRhythm(name: string, ui: ReactElement) {
  const { container } = render(ui)
  const root = container.querySelector('section')
  if (!root) throw new Error(`${name} should render a <section>`)

  expect(verticalPadding(root), name).toEqual(SECTION_PY.split(' '))
}

describe('home section vertical rhythm', () => {
  beforeAll(() => {
    i18next.addResourceBundle('en', 'translation', {
      Promotions: 'Promotions',
      'Flagship models,': 'Flagship models,',
      'limited-time discounts': 'limited-time discounts',
      'Global models': 'Global models',
      'China models': 'China models',
      'Three steps': 'Three steps',
      'to get started': 'to get started',
      'Ready to simplify': 'Ready to simplify',
      'your AI integration?': 'your AI integration?',
    })
    vi.stubGlobal('IntersectionObserver', IntersectionObserverStub)
  })

  test('S3, S4 and S5 share one spacing scale without local overrides', () => {
    expectSharedRhythm('S3 promotions', <Promotions />)
    expectSharedRhythm('S4 how-it-works', <HowItWorks />)
    expectSharedRhythm('S5 cta', <CTA />)
  })

  test('the stats band keeps its own narrow rhythm', () => {
    const { container } = render(<Stats />)
    const band = container.querySelector("[data-slot='container']")
    if (!band) throw new Error('stats should render a Container')

    expect(verticalPadding(band)).toEqual(['py-10', 'md:py-12'])
  })
})
