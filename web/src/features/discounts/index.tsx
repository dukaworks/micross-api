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
import { Calculator } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { SectionPageLayout } from '@/components/layout'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'

import { DiscountsSimulateDrawer } from './components/discounts-simulate-drawer'

/**
 * 折扣页：目前只提供试算入口。
 * 方案列表与规则编辑是下一步的事，这里先不假装已经有了。
 */
export function Discounts() {
  const { t } = useTranslation()
  const [simulateOpen, setSimulateOpen] = useState(false)

  return (
    <>
      <SectionPageLayout fixedContent>
        <SectionPageLayout.Title>{t('Discount Plans')}</SectionPageLayout.Title>
        <SectionPageLayout.Actions>
          <Button variant='outline' onClick={() => setSimulateOpen(true)}>
            <Calculator className='h-4 w-4' />
            {t('Simulate')}
          </Button>
        </SectionPageLayout.Actions>
        <SectionPageLayout.Content>
          <div className='flex h-full min-h-0 flex-col gap-4'>
            <Alert>
              <AlertTitle>{t('Discount Plans')}</AlertTitle>
              <AlertDescription>
                {t(
                  'The plan list and rule editor are not here yet. Use Simulate to check what a customer would pay and what each upstream route costs.'
                )}
              </AlertDescription>
            </Alert>
          </div>
        </SectionPageLayout.Content>
      </SectionPageLayout>

      <DiscountsSimulateDrawer
        open={simulateOpen}
        onOpenChange={setSimulateOpen}
      />
    </>
  )
}
