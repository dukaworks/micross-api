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
import { Database, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import { FadeIn } from '@/components/page-transition'
import {
  EMPTY_SIZE,
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  type EmptySize,
} from '@/components/ui/empty'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon?: LucideIcon
  title?: string
  description?: string
  action?: ReactNode
  /** 区块高度档位，默认 md。弹窗与小面板用 sm，整页与表格用 lg。 */
  size?: EmptySize
  className?: string
}

export function EmptyState(props: EmptyStateProps) {
  const { t } = useTranslation()
  const Icon = props.icon ?? Database

  // FadeIn 这一层带上 flex 布局，Empty 的 flex-1 才能真正撑开父容器。
  return (
    <FadeIn className='flex min-h-0 flex-1 flex-col'>
      <Empty className={cn(EMPTY_SIZE[props.size ?? 'md'], props.className)}>
        <EmptyHeader>
          <EmptyMedia variant='icon'>
            <Icon className='size-6' />
          </EmptyMedia>
          <EmptyTitle>{props.title ?? t('No Data')}</EmptyTitle>
          {props.description != null && (
            <EmptyDescription>{props.description}</EmptyDescription>
          )}
        </EmptyHeader>
        {props.action != null && <EmptyContent>{props.action}</EmptyContent>}
      </Empty>
    </FadeIn>
  )
}
