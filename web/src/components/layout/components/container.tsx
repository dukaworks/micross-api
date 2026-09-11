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
import { cn } from '@/lib/utils'

/**
 * Content width scale. Pages declare intent through these tokens instead of
 * writing `mx-auto max-w-*` by hand, so every surface shares one skeleton.
 * See `.docs/frontend/layout-system.md`.
 */
export type ContainerWidth = 'narrow' | 'default' | 'wide' | 'full'

/** Shared horizontal padding scale: 16px / 24px / 32px. */
export const CONTAINER_PADDING = 'px-4 sm:px-6 lg:px-8'

/** Maps a width token to its max-width utility. */
export const CONTAINER_WIDTH_CLASS: Record<ContainerWidth, string> = {
  narrow: 'max-w-container-sm',
  default: 'max-w-container',
  wide: 'max-w-container-lg',
  full: 'max-w-none',
}

type ContainerProps = React.ComponentProps<'div'> & {
  /** Content width token. Defaults to `default` (1280px). */
  width?: ContainerWidth
  /** Renders the element as `<main>`; useful for page-level regions. */
  as?: 'div' | 'main'
}

/**
 * Centers page content and caps its width.
 *
 * `full` keeps the horizontal padding so content never touches the viewport
 * edge — use it only for workspaces that genuinely need the whole width.
 */
export function Container(props: ContainerProps) {
  const { width = 'default', as = 'div', className, ...rest } = props
  const Element = as

  return (
    <Element
      data-slot='container'
      data-width={width}
      className={cn(
        'mx-auto w-full',
        CONTAINER_PADDING,
        CONTAINER_WIDTH_CLASS[width],
        className
      )}
      {...rest}
    />
  )
}
