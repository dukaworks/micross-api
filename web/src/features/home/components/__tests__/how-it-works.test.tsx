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
import { render, screen } from '@testing-library/react'
import i18next from 'i18next'
import { beforeAll, describe, expect, test, vi } from 'vitest'

import { HowItWorks } from '../sections/how-it-works'

const STEPS = [
  {
    title: 'Configure',
    desc: 'Add your API keys, set up channels and configure access permissions',
    image: '/home/3-step/1-config-picture.jpg',
    num: '1',
  },
  {
    title: 'Connect',
    desc: 'Connect via OpenAI, Claude, Gemini and more',
    image: '/home/3-step/2-onnection.jpg',
    num: '2',
  },
  {
    title: 'Monitor',
    desc: 'Track usage, costs and performance with real-time analytics',
    image: '/home/3-step/3-monitor-picture.jpg',
    num: '3',
  },
]

class IntersectionObserverStub {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
  takeRecords(): [] {
    return []
  }
}

describe('HowItWorks cards', () => {
  beforeAll(() => {
    const bundle: Record<string, string> = {
      'Three steps': 'Three steps',
      'to get started': 'to get started',
    }
    for (const step of STEPS) {
      bundle[step.title] = step.title
      bundle[step.desc] = step.desc
    }
    i18next.addResourceBundle('en', 'translation', bundle)
    vi.stubGlobal('IntersectionObserver', IntersectionObserverStub)
  })

  test('renders three visual step cards with image, title and numbered badge in order', () => {
    render(<HowItWorks />)

    const images = screen.getAllByRole('img')
    expect(images).toHaveLength(3)

    const headings = screen.getAllByRole('heading', { level: 3 })
    expect(headings).toHaveLength(3)

    STEPS.forEach((step, index) => {
      expect(images[index]).toHaveAttribute('src', step.image)
      expect(images[index]).toHaveAttribute('alt', step.title)
      expect(headings[index]).toHaveTextContent(step.title)
      expect(screen.getByText(step.num)).toBeInTheDocument()
    })
  })
})
