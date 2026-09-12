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
import type { TFunction } from 'i18next'

import {
  DISCOUNT_PLAN_STATUS,
  DISCOUNT_SOURCE,
  type DiscountSource,
} from './types'

// ============================================================================
// Labels (i18n keys; use t(labelKey) in components)
// ============================================================================

/** 折扣来源 → i18n 键 */
export const DISCOUNT_SOURCE_LABEL_KEYS: Record<string, string> = {
  [DISCOUNT_SOURCE.MODEL]: 'Model-level rule',
  [DISCOUNT_SOURCE.VENDOR]: 'Vendor-level rule',
  [DISCOUNT_SOURCE.PLAN_BASE]: 'Plan base discount',
  [DISCOUNT_SOURCE.DEFAULT]: 'Official price',
}

/** 方案状态 → i18n 键 */
export const DISCOUNT_PLAN_STATUS_LABEL_KEYS: Record<number, string> = {
  [DISCOUNT_PLAN_STATUS.ENABLED]: 'Enabled',
  [DISCOUNT_PLAN_STATUS.DISABLED]: 'Disabled',
}

/**
 * 折扣来源的展示文案。
 * 后端将来新增来源时原样显示标识，不吞掉信息，也不假装认识它。
 */
export function getDiscountSourceLabel(t: TFunction, source: string): string {
  const labelKey = DISCOUNT_SOURCE_LABEL_KEYS[source as DiscountSource]
  return labelKey ? t(labelKey) : source
}

/** 方案状态的展示文案；未绑定方案时由调用方给出自己的文案。 */
export function getDiscountPlanStatusLabel(
  t: TFunction,
  status: number
): string {
  const labelKey = DISCOUNT_PLAN_STATUS_LABEL_KEYS[status]
  return labelKey ? t(labelKey) : String(status)
}

/** 规则作用范围 → i18n 键；取值与 `model.DiscountScope*` 一致。 */
export const DISCOUNT_RULE_SCOPE_LABEL_KEYS: Record<string, string> = {
  model: 'Model',
  vendor: 'Vendor',
}

/** 规则作用范围的展示文案；遇见没见过的取值就原样显示。 */
export function getDiscountRuleScopeLabel(
  t: TFunction,
  scopeType: string
): string {
  const labelKey = DISCOUNT_RULE_SCOPE_LABEL_KEYS[scopeType]
  return labelKey ? t(labelKey) : scopeType
}

// ============================================================================
// Limits
// ============================================================================

export const DISCOUNT_SIMULATE_LIMITS = {
  /** 客户下拉一次拉多少个（后端按关键字过滤后再分页）。 */
  CUSTOMER_PAGE_SIZE: 50,
  /** 模型名长度上界，避免把超长字符串发给后端。 */
  MODEL_NAME_MAX_LENGTH: 128,
} as const

// ============================================================================
// Error Messages (i18n keys; use t(ERROR_MESSAGES.xxx) when displaying)
// ============================================================================

export const ERROR_MESSAGES = {
  SIMULATE_FAILED: 'Simulation failed',
  CUSTOMERS_LOAD_FAILED: 'Failed to load customers',
  CUSTOMER_REQUIRED: 'Select a customer',
  MODEL_REQUIRED: 'Model name is required',
  MODEL_TOO_LONG: 'Model name is too long',
} as const
