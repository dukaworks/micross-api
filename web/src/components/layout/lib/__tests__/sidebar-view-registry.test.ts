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
import { describe, expect, test } from 'vitest'

import { ROLE } from '@/lib/roles'

import { resolveSidebarView } from '../sidebar-view-registry'

describe('sidebar view resolution', () => {
  test('stays inside the business workspace on user management routes', () => {
    // User management predates the workspace and lives on top-level routes;
    // missing them drops the sidebar back to the root navigation.
    for (const pathname of [
      '/users',
      '/users/42',
      '/redemption-codes',
      '/subscriptions',
      '/discounts',
    ]) {
      expect(resolveSidebarView(pathname, ROLE.ADMIN)?.id).toBe(
        'business-settings'
      )
    }
  })

  test('keeps upstream supply inside the business workspace', () => {
    // Channels and the model catalog are guarded by the `admin` role, so
    // they belong to the administrator workspace. Listing them under the
    // super-admin-only system workspace left administrators with no sidebar
    // entry to reach them.
    for (const pathname of [
      '/channels',
      '/models',
      '/models/metadata',
      '/models/deployments',
    ]) {
      expect(resolveSidebarView(pathname, ROLE.ADMIN)?.id).toBe(
        'business-settings'
      )
    }
  })

  test('stays inside the business workspace on its own settings routes', () => {
    for (const pathname of [
      '/business-settings',
      '/business-settings/billing/quota',
      '/business-settings/site/branding',
    ]) {
      expect(resolveSidebarView(pathname, ROLE.ADMIN)?.id).toBe(
        'business-settings'
      )
    }
  })

  test('keeps the system workspace separate from the business one', () => {
    for (const pathname of [
      '/system-settings',
      '/system-settings/auth/oauth',
      '/system-settings/operations/logs',
      '/system-info',
    ]) {
      expect(resolveSidebarView(pathname, ROLE.SUPER_ADMIN)?.id).toBe(
        'system-settings'
      )
    }
  })

  test('falls back to the root navigation outside every workspace', () => {
    for (const pathname of [
      '/dashboard/overview',
      '/keys',
      '/usage-logs/common',
      '/wallet',
    ]) {
      expect(resolveSidebarView(pathname, ROLE.SUPER_ADMIN)).toBeNull()
    }
  })

  test('does not match lookalike prefixes', () => {
    for (const pathname of [
      '/users-archive',
      '/subscriptions-old',
      '/channels-legacy',
      '/models-archive',
      '/business-settings-legacy',
      '/system-settings-backup',
      '/system-info-archive',
    ]) {
      expect(resolveSidebarView(pathname, ROLE.SUPER_ADMIN)).toBeNull()
    }
  })

  test('keeps workspaces the user cannot enter out of the sidebar', () => {
    // Route guards stay authoritative; the sidebar must not advertise a
    // workspace whose entries would be rejected on arrival.
    for (const pathname of [
      '/users',
      '/channels',
      '/models/metadata',
      '/business-settings/billing/quota',
    ]) {
      expect(resolveSidebarView(pathname, ROLE.USER)).toBeNull()
    }

    for (const pathname of ['/system-info', '/system-settings/auth/oauth']) {
      expect(resolveSidebarView(pathname, ROLE.ADMIN)).toBeNull()
    }

    for (const pathname of ['/system-info', '/channels', '/users']) {
      expect(resolveSidebarView(pathname, ROLE.SUPER_ADMIN)).not.toBeNull()
    }
  })

  test('treats an unknown role as the lowest role', () => {
    for (const pathname of ['/users', '/channels', '/system-info']) {
      expect(resolveSidebarView(pathname)).toBeNull()
      expect(resolveSidebarView(pathname, undefined)).toBeNull()
    }
  })
})
