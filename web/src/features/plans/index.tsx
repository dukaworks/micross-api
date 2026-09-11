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
import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'

import { SectionPageLayout } from '@/components/layout'
import { useTopupInfo } from '@/features/wallet/hooks'
import type { UserWalletData } from '@/features/wallet/types'
import { getSelf } from '@/lib/api'

import { SubscriptionPlansCard } from './components/subscription-plans-card'

/**
 * 「套餐」页
 *
 * 从 `/wallet` 拆出来的第二件事：**买什么**。套餐、我的订阅、计费偏好三块。
 * 原来它是钱包页右栏的一张卡——和充值挤在一起，客户以为"充钱"就包含了买套餐。
 */
export function Plans() {
  const { t } = useTranslation()
  const [user, setUser] = useState<UserWalletData | null>(null)

  const { topupInfo } = useTopupInfo()

  // Fetch user data — the purchase dialog needs the balance to decide whether
  // balance redemption is available.
  const fetchUser = useCallback(async () => {
    try {
      const response = await getSelf()
      if (response.success && response.data) {
        setUser(response.data as UserWalletData)
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to fetch user data:', error)
    }
  }, [])

  useEffect(() => {
    fetchUser()
  }, [fetchUser])

  return (
    <SectionPageLayout>
      <SectionPageLayout.Title>{t('Plan')}</SectionPageLayout.Title>
      <SectionPageLayout.Content>
        <SubscriptionPlansCard
          topupInfo={topupInfo}
          userQuota={user?.quota}
          onPurchaseSuccess={fetchUser}
        />
      </SectionPageLayout.Content>
    </SectionPageLayout>
  )
}
