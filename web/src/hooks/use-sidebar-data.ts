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
import {
  Activity,
  Briefcase,
  Crown,
  FileText,
  FlaskConical,
  Key,
  LayoutDashboard,
  ListTodo,
  Receipt,
  Settings,
  TrendingUp,
  User,
  Wallet,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'

import type { NavItem, SidebarData } from '@/components/layout/types'
import { ROLE } from '@/lib/roles'

/**
 * Whether the dealer identity is available yet.
 *
 * Dealers (`users.subject_type = 'agent'`) arrive with P3 — until then no
 * field and no endpoint can answer "is the signed-in user a dealer", so the
 * dealer-only 「账单」 entry is defined below but switched off. It has to be
 * hidden from *every* role, administrators included: turning it on earlier
 * would put a page with nothing behind it in front of the wrong audience.
 *
 * P3 replaces this constant with the real identity check. The navigation
 * entry, the `/billing` route, its sidebar-module switch and its
 * `URL_TO_CONFIG_MAP` registration are already in place.
 */
const DEALER_IDENTITY_ENABLED = false

/**
 * Root navigation groups for the application sidebar.
 *
 * Audience layering:
 *   · General — every signed-in user: the console entry points;
 *   · Personal — the signed-in user's own money and account, split by the
 *     direction money moves: wallet (balance / top-up / redemption),
 *     plans (what you buy), earnings (referral commission, plus the dealer
 *     margin from P3), profile;
 *   · Business Management — administrators (`requiredRole: ROLE.ADMIN`);
 *   · System Management — super administrators only.
 *
 * The two management entries are drill-in workspaces: clicking either one
 * swaps the sidebar to the matching nested view (see
 * `layout/config/business-settings.config.ts` and `system-settings.config.ts`).
 */
export function useSidebarData(): SidebarData {
  const { t } = useTranslation()

  const dealerBillingItems: NavItem[] = DEALER_IDENTITY_ENABLED
    ? [
        {
          title: t('Dealer Billing'),
          url: '/billing',
          icon: Receipt,
        },
      ]
    : []

  return {
    navGroups: [
      {
        id: 'general',
        title: t('General'),
        items: [
          {
            title: t('Overview'),
            url: '/dashboard/overview',
            icon: Activity,
          },
          {
            title: t('Dashboard'),
            url: '/dashboard/models',
            icon: LayoutDashboard,
          },
          {
            title: t('API Keys'),
            url: '/keys',
            icon: Key,
          },
          {
            title: t('Usage Logs'),
            url: '/usage-logs/common',
            icon: FileText,
          },
          {
            title: t('Task Logs'),
            url: '/usage-logs/task',
            activeUrls: ['/usage-logs/drawing'],
            configUrls: ['/usage-logs/drawing', '/usage-logs/task'],
            icon: ListTodo,
          },
          {
            title: t('Test Model'),
            url: '/playground',
            icon: FlaskConical,
          },
        ],
      },
      {
        id: 'personal',
        title: t('Personal'),
        items: [
          {
            title: t('Wallet'),
            url: '/wallet',
            icon: Wallet,
          },
          {
            title: t('Plan'),
            url: '/plans',
            icon: Crown,
          },
          {
            title: t('Earnings'),
            url: '/earnings',
            icon: TrendingUp,
          },
          ...dealerBillingItems,
          {
            title: t('Profile'),
            url: '/profile',
            icon: User,
          },
        ],
      },
      {
        id: 'administration',
        title: t('Administration'),
        items: [
          {
            title: t('Business Management'),
            url: '/business-settings/billing/quota',
            configUrls: ['/business-settings'],
            icon: Briefcase,
            requiredRole: ROLE.ADMIN,
          },
          {
            title: t('System Management'),
            url: '/system-settings/auth/oauth',
            configUrls: ['/system-settings'],
            icon: Settings,
            requiredRole: ROLE.SUPER_ADMIN,
          },
        ],
      },
    ],
  }
}
