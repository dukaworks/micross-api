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

import { CONTAINER_WIDTH_CLASS, type ContainerWidth } from './container'

type MainProps = React.HTMLAttributes<HTMLElement> & {
  /**
   * Content width token (see `.docs/frontend/layout-system.md`). Defaults to
   * `full` so existing admin pages keep their current layout; a page opts into
   * a capped width explicitly.
   */
  width?: ContainerWidth
}

export function Main({ className, width = 'full', ...props }: MainProps) {
  return (
    <main
      data-slot='main'
      data-width={width}
      className={cn(
        'flex min-h-0 flex-1 flex-col overflow-hidden',
        'mx-auto w-full',
        CONTAINER_WIDTH_CLASS[width],
        className
      )}
      {...props}
    />
  )
}
