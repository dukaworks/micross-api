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
// ============================================================================
// Enums (mirrors the backend constants; keep the string values in sync)
// ============================================================================

/** 这一单的折扣是从哪一层取到的；对应 `model.DiscountResolvedFrom*`。 */
export const DISCOUNT_SOURCE = {
  MODEL: 'model',
  VENDOR: 'vendor',
  PLAN_BASE: 'plan_base',
  DEFAULT: 'default',
} as const

export type DiscountSource =
  (typeof DISCOUNT_SOURCE)[keyof typeof DISCOUNT_SOURCE]

/** 规则作用范围；对应 `model.DiscountScope*`。 */
export const DISCOUNT_SCOPE = {
  MODEL: 'model',
  VENDOR: 'vendor',
} as const

/** 方案状态；对应 `model.DiscountStatus*`。 */
export const DISCOUNT_PLAN_STATUS = {
  DISABLED: 0,
  ENABLED: 1,
} as const

// ============================================================================
// Simulation result (mirrors service.DiscountSimulateResult)
// ============================================================================

export interface DiscountSimulateUser {
  id: number
  username: string
  group: string
}

export interface DiscountSimulatePlan {
  id: number
  name: string
  status: number
}

export interface DiscountSimulateRule {
  id: number
  scope_type: string
  scope_value: string
  discount: string
  priority: number
}

export interface DiscountSimulateResolution {
  /** 固定 6 位小数字符串，例如 `"0.300000"`。 */
  discount: string
  source: string
  matched_rule: DiscountSimulateRule | null
}

/**
 * 一条候选线路的试算结果。
 * 没录进货折扣时三个值字段都是 `null`——「不知道」不能显示成「赚 0 元」。
 */
export interface DiscountSimulateChannel {
  channel_id: number
  channel_name: string
  cost_ratio: string | null
  gross_margin: string | null
  passes_floor: boolean | null
}

export interface DiscountSimulateResult {
  user: DiscountSimulateUser
  model: string
  vendor: string
  plan: DiscountSimulatePlan | null
  resolution: DiscountSimulateResolution
  /** 只要有一条候选线路没录进货折扣就是 false。 */
  cost_known: boolean
  /** 后台「毛利底线」，固定 6 位小数字符串。 */
  min_margin_ratio: string
  channels: DiscountSimulateChannel[]
  /** 后端原文提示（中文），直接展示给运营看。 */
  warnings: string[]
}

// ============================================================================
// Customers (minimal shape needed to pick one for a simulation)
// ============================================================================

export interface DiscountCustomer {
  id: number
  username: string
  display_name: string
  group: string
}

// ============================================================================
// API Request/Response Types
// ============================================================================

/** Generic API response */
export interface ApiResponse<T = unknown> {
  success: boolean
  message?: string
  data?: T
}

export interface SimulateDiscountParams {
  userId: number
  model: string
  channelId?: number
}

export interface SearchCustomersParams {
  keyword?: string
  p?: number
  page_size?: number
}

/** 客户搜索结果：只看接口里我们真正会用的那几个字段，避免依赖用户模块类型。 */
export interface SearchCustomersResponse {
  success: boolean
  message?: string
  data?: {
    items: DiscountCustomer[]
    total: number
    page: number
    page_size: number
  }
}
