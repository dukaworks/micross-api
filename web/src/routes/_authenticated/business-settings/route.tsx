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
import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'

import { ROLE } from '@/lib/roles'
import { useAuthStore } from '@/stores/auth-store'

/**
 * 业务管理工作区（计费、站点、控制台内容、运营策略）。
 *
 * 与系统管理的差异：这里的配置决定「卖什么、卖给谁、怎么收钱、
 * 站点长什么样」，管理员即可操作；系统管理才要求超级管理员。
 */
export const Route = createFileRoute('/_authenticated/business-settings')({
  beforeLoad: () => {
    const { auth } = useAuthStore.getState()

    if ((auth.user?.role ?? 0) < ROLE.ADMIN) {
      throw redirect({
        to: '/403',
      })
    }
  },
  component: Outlet,
})
