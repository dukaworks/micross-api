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
import { api } from '@/lib/api'

import type {
  ApiResponse,
  DiscountCustomer,
  DiscountSimulateResult,
  SearchCustomersParams,
  SearchCustomersResponse,
  SimulateDiscountParams,
} from './types'

// ============================================================================
// Discount Simulation
// ============================================================================

/**
 * 试算「这个客户 + 这个模型」按几折、会走哪几条线路、每条赚多少。
 * 只读接口：后端不写任何表，也不改路由。
 */
export async function simulateDiscount(
  params: SimulateDiscountParams
): Promise<ApiResponse<DiscountSimulateResult>> {
  const { userId, model, channelId } = params
  const res = await api.get('/api/discount/admin/simulate', {
    params: {
      user_id: userId,
      model,
      channel_id: channelId,
    },
  })
  return res.data
}

// ============================================================================
// Customers (used to pick who to simulate for)
// ============================================================================

/**
 * 按关键字（用户名）搜索客户，给试算抽屉的下拉用。
 * 只取 id／用户名／显示名／分组四个字段，不依赖用户模块的类型。
 */
export async function searchCustomers(
  params: SearchCustomersParams = {}
): Promise<SearchCustomersResponse> {
  const { keyword = '', p = 1, page_size = 50 } = params
  const res = await api.get('/api/user/search', {
    params: {
      keyword,
      p,
      page_size,
    },
  })
  const payload = res.data as SearchCustomersResponse
  const items = payload?.data?.items
  if (!Array.isArray(items)) {
    return { ...payload, data: payload?.data }
  }
  return {
    ...payload,
    data: payload.data
      ? {
          ...payload.data,
          items: items.map((item): DiscountCustomer => ({
            id: item.id,
            username: item.username,
            display_name: item.display_name,
            group: item.group,
          })),
        }
      : undefined,
  }
}
