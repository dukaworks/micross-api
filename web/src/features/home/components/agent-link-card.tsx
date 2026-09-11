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
import { ArrowUpRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { cn } from '@/lib/utils'

import type { AgentItem } from '../constants'
import { AgentMark } from './agent-logos'

interface AgentLinkCardProps {
  agent: AgentItem
  showDescription?: boolean
}

export function AgentLinkCard(props: AgentLinkCardProps) {
  const { t } = useTranslation()
  const { agent } = props

  return (
    <a
      href={agent.url}
      target='_blank'
      rel='noopener noreferrer'
      className={cn(
        'group border-border/40 bg-muted/10 shadow-card hover:border-border hover:bg-muted/30 flex min-w-0 rounded-xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-card-lift',
        props.showDescription
          ? 'flex-col gap-2.5 p-4'
          : 'items-center gap-2 px-3 py-2.5'
      )}
    >
      <span className='flex min-w-0 items-center gap-2'>
        <span className='bg-background/60 grid size-8 shrink-0 place-items-center rounded-lg'>
          <AgentMark id={agent.id} />
        </span>
        <b className='truncate text-[13px] font-semibold group-hover:underline group-hover:underline-offset-3'>
          {agent.name}
        </b>
        <ArrowUpRight className='size-3 shrink-0 opacity-0 transition-opacity duration-300 group-hover:opacity-50' />
      </span>
      {props.showDescription && (
        <p className='text-muted-foreground text-xs leading-relaxed'>
          {t(agent.desc)}
        </p>
      )}
    </a>
  )
}
