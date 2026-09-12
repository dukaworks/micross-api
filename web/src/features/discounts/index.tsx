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
import { Button } from '@/components/ui/button'

import { DiscountsDialogs } from './components/discounts-dialogs'
import { DiscountsPrimaryButtons } from './components/discounts-primary-buttons'
import { DiscountsProvider } from './components/discounts-provider'
import { DiscountsSimulateDrawer } from './components/discounts-simulate-drawer'
import { DiscountsTable } from './components/discounts-table'

/**
 * 折扣页：管方案（折扣、规则、绑了谁），再给一个试算入口看实际会收多少钱。
 * 试算是「看一眼」，方案管理是「真改」，两者放一起正好对照着用。
 */
export function Discounts() {
  return (
    <DiscountsProvider>
      <DiscountsPage />
    </DiscountsProvider>
  )
}

function DiscountsPage() {
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
          <DiscountsPrimaryButtons />
        </SectionPageLayout.Actions>
        <SectionPageLayout.Content>
          <DiscountsTable />
        </SectionPageLayout.Content>
      </SectionPageLayout>

      <DiscountsDialogs />
      <DiscountsSimulateDrawer
        open={simulateOpen}
        onOpenChange={setSimulateOpen}
      />
    </>
  )
}
