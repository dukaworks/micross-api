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

import { SectionPageLayout } from '@/components/layout'

/**
 * 「账单」页 —— 经销商专享（占位）
 *
 * 定位：只给经销商看自己的**收入与盈利**（进货价与零售价的差价、结算周期、
 * 可提现/可转额度）。
 *
 * 为什么单独一项而不是并进 `/earnings`：
 * 经销商差价与推广佣金共用一个资金闭环（都只能转成额度继续消费，不可提现），
 * 但经销商自己需要一张只看经营结果的对账单，所以按产品决定拆成两个门面。
 *
 * 当前状态：页面骨架，尚无任何数据。
 * 数据依赖 P3 的经销商身份（`users.subject_type = 'agent'`）与定价链路
 * （P1 折扣内核 / P2 成本），因此这一版只占位，不做接口。
 * 导航项在 `use-sidebar-data.ts` 中由 `DEALER_IDENTITY_ENABLED` 控制，
 * 开关未打开时对所有角色（含管理员）隐藏，避免先露出一个空页面。
 */
export function DealerBilling() {
  const { t } = useTranslation()

  return (
    <SectionPageLayout>
      <SectionPageLayout.Title>{t('Dealer Billing')}</SectionPageLayout.Title>
      <SectionPageLayout.Content>
        <div className='flex w-full flex-col gap-2'>
          <p className='text-sm font-medium'>{t('Coming Soon!')}</p>
          <p className='text-muted-foreground text-sm'>
            {t('Dealer Billing Placeholder Description')}
          </p>
        </div>
      </SectionPageLayout.Content>
    </SectionPageLayout>
  )
}
