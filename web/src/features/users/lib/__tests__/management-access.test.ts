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

import {
  managementSectionsForRole,
  parseSidebarModules,
  serializeSidebarModules,
  updateSectionConfig,
} from '../management-access'

describe('management access sidebar modules', () => {
  test('treats an empty stored value as fully visible', () => {
    const config = parseSidebarModules(null)

    expect(config.business.enabled).toBe(true)
    expect(config.business.users).toBe(true)
    expect(config.business.channels).toBe(true)
    // Channels moved out of the system workspace; a stale entry there must
    // not resurface as a toggle that controls nothing.
    expect(config.system.channels).toBeUndefined()
  })

  test('keeps explicit false as hidden and defaults missing modules to visible', () => {
    const config = parseSidebarModules('{"business":{"users":false}}')

    expect(config.business.users).toBe(false)
    expect(config.business.billing).toBe(true)
    expect(config.business.enabled).toBe(true)
  })

  test('keeps a disabled section disabled', () => {
    const config = parseSidebarModules('{"system":{"enabled":false}}')

    expect(config.system.enabled).toBe(false)
  })

  test('preserves sections owned by other pages across a round trip', () => {
    const stored = '{"console":{"log":false},"personal":{"profile":false}}'

    const serialized = serializeSidebarModules(parseSidebarModules(stored))
    const reparsed = JSON.parse(serialized) as Record<
      string,
      Record<string, boolean>
    >

    expect(reparsed.console.log).toBe(false)
    expect(reparsed.personal.profile).toBe(false)
    expect(reparsed.business.users).toBe(true)
  })

  test('falls back to fully visible on malformed json', () => {
    const config = parseSidebarModules('not-json')

    expect(config.business.enabled).toBe(true)
    expect(config.system.enabled).toBe(true)
  })

  test('survives repeated parsing without flipping values', () => {
    const first = parseSidebarModules('{"business":{"users":false}}')
    const second = parseSidebarModules(serializeSidebarModules(first))

    expect(second.business.users).toBe(false)
    expect(second.business.enabled).toBe(true)
  })

  test('updates a single module without touching its siblings', () => {
    const config = parseSidebarModules(null)
    const updated = updateSectionConfig(config, 'business', { users: false })

    expect(updated.business.users).toBe(false)
    expect(updated.business.billing).toBe(true)
    expect(updated.business.channels).toBe(true)
    expect(config.business.users).toBe(true)
  })

  test('updates a section toggle without touching its modules', () => {
    const config = parseSidebarModules(null)
    const updated = updateSectionConfig(config, 'business', { enabled: false })

    expect(updated.business.enabled).toBe(false)
    expect(updated.business.users).toBe(true)
  })

  test('only offers workspaces the target role can enter', () => {
    expect(managementSectionsForRole(ROLE.USER).map((s) => s.key)).toEqual([])
    expect(managementSectionsForRole(ROLE.ADMIN).map((s) => s.key)).toEqual([
      'business',
    ])
    expect(
      managementSectionsForRole(ROLE.SUPER_ADMIN).map((s) => s.key)
    ).toEqual(['business', 'system'])
  })
})
