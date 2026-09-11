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
import { useTranslation } from 'react-i18next'

import { AGENTS } from '../constants'
import { AgentLinkCard } from './agent-link-card'
import { AgentsMoreDialog } from './agents-more-dialog'

export function HeroAgents() {
  const { t } = useTranslation()
  const featured = AGENTS.filter((agent) => agent.featured)

  return (
    <div
      className='landing-animate-fade-up mt-8 w-full max-w-xl opacity-0'
      style={{ animationDelay: '240ms' }}
    >
      <div className='mb-4'>
        <span className='text-muted-foreground/50 text-[10px] font-bold tracking-[0.15em] uppercase'>
          {t('AI Agents')}
        </span>
      </div>
      <div className='grid grid-cols-2 gap-2.5 sm:grid-cols-3'>
        {featured.map((agent) => (
          <AgentLinkCard key={agent.id} agent={agent} />
        ))}
        <AgentsMoreDialog />
      </div>
    </div>
  )
}
