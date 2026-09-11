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
import { type TFunction } from 'i18next'

import { ROLE } from '@/lib/roles'

import { BUSINESS_SETTINGS_VIEW } from '../config/business-settings.config'
import { SYSTEM_SETTINGS_VIEW } from '../config/system-settings.config'
import type { NavGroup, SidebarView } from '../types'

/**
 * Registered nested sidebar views.
 *
 * Each entry describes a contextual sidebar that replaces the root
 * navigation when the user enters that workspace (Vercel-style
 * "drill-in" pattern). Add new entries here to register a new view.
 *
 * `business-settings` and `system-settings` are split by audience rather
 * than by technical module: administrators own the business workspace,
 * super administrators own the infrastructure workspace.
 *
 * Match priority is array order; the first matching `pathPattern` wins.
 * The registered patterns are disjoint, so order is not load-bearing.
 */
const SIDEBAR_VIEWS: readonly SidebarView[] = [
  BUSINESS_SETTINGS_VIEW,
  SYSTEM_SETTINGS_VIEW,
]

/**
 * Resolve the active nested view for the given path and user role.
 *
 * A view is only returned when the user is allowed to enter it: the
 * workspace is a privilege boundary of its own, so a user who is below
 * `view.requiredRole` keeps the root navigation rather than seeing a set of
 * entries the route guards would reject. Pass `undefined` for signed-out or
 * unknown users, which is treated as the lowest role.
 *
 * @returns Matching {@link SidebarView}, or `null` when the root
 *          navigation should be displayed.
 */
export function resolveSidebarView(
  pathname: string,
  role?: number
): SidebarView | null {
  const view =
    SIDEBAR_VIEWS.find((candidate) => candidate.pathPattern.test(pathname)) ??
    null
  if (!view) return null

  const userRole = role ?? ROLE.GUEST
  if (view.requiredRole !== undefined && userRole < view.requiredRole) {
    return null
  }

  return view
}

/**
 * Backwards-compatible helper for consumers (e.g. the command palette)
 * that only need the navigation groups for the current path, without
 * caring about the view metadata.
 *
 * @returns Nav groups for the matched view, or `null` if no nested view
 *          matches or the user cannot enter it (callers should then fall
 *          back to root nav groups).
 */
export function getNavGroupsForPath(
  pathname: string,
  t: TFunction,
  role?: number
): NavGroup[] | null {
  const view = resolveSidebarView(pathname, role)
  return view ? view.getNavGroups(t) : null
}
