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

import { AnimateInView } from '@/components/animate-in-view'
import { Container } from '@/components/layout'
import { cn } from '@/lib/utils'

import { PROMO_GROUPS, SECTION_PY } from '../../constants'
import { PromoModelCard } from '../promo-model-card'

interface PromotionsProps {
  className?: string
}

export function Promotions(_props: PromotionsProps) {
  const { t } = useTranslation()

  return (
    <section className={cn('relative z-10', SECTION_PY)}>
      <Container>
        <AnimateInView className='mb-10 max-w-lg'>
          <p className='text-muted-foreground mb-3 text-xs font-medium tracking-widest uppercase'>
            {t('Promotions')}
          </p>
          <h2 className='text-2xl leading-tight font-bold tracking-tight md:text-3xl'>
            {t('Flagship models,')}{' '}
            <span className='brand-gradient-text'>
              {t('limited-time discounts')}
            </span>
          </h2>
        </AnimateInView>

        <div className='space-y-10'>
          {PROMO_GROUPS.map((group) => (
            <div key={group.id}>
              <div className='mb-5 flex items-center gap-4'>
                <h3 className='text-muted-foreground text-xs font-semibold tracking-[0.15em] uppercase'>
                  {t(group.label)}
                </h3>
                <span aria-hidden className='bg-border/40 h-px flex-1' />
              </div>
              <ul className='grid gap-5 sm:grid-cols-2 lg:grid-cols-3'>
                {group.models.map((model, index) => (
                  <PromoModelCard
                    key={model.brand}
                    model={model}
                    delay={index * 100}
                  />
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Container>
    </section>
  )
}
