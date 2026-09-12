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
import type { ColumnDef } from '@tanstack/react-table'
import { useTranslation } from 'react-i18next'

import { StatusBadge } from '@/components/status-badge'
import { TableId } from '@/components/table-id'
import { formatTimestampToDate } from '@/lib/format'

import {
  getDiscountBillingModeLabel,
  getDiscountOwnerLabel,
} from '../constants'
import { formatRatioText } from '../lib'
import {
  DISCOUNT_OWNER,
  DISCOUNT_PLAN_STATUS,
  type DiscountPlan,
} from '../types'
import { DiscountsRowActions } from './discounts-row-actions'

export function useDiscountsColumns(): ColumnDef<DiscountPlan>[] {
  const { t } = useTranslation()

  return [
    {
      accessorKey: 'id',
      header: t('ID'),
      meta: { mobileHidden: true },
      cell: ({ row }) => (
        <TableId value={row.getValue('id') as number} className='w-[60px]' />
      ),
      size: 80,
    },
    {
      accessorKey: 'name',
      header: t('Name'),
      meta: { mobileTitle: true },
      cell: ({ row }) => {
        const plan = row.original
        return (
          <div className='flex flex-col'>
            <span className='font-medium'>{plan.name}</span>
            {plan.remark && (
              <span className='text-muted-foreground max-w-[320px] truncate text-xs'>
                {plan.remark}
              </span>
            )}
          </div>
        )
      },
      size: 220,
    },
    {
      accessorKey: 'owner_type',
      header: t('Owner'),
      cell: ({ row }) => {
        const plan = row.original
        const label = getDiscountOwnerLabel(t, plan.owner_type)
        return (
          <span className='text-sm'>
            {plan.owner_type === DISCOUNT_OWNER.AGENT
              ? `${label} #${plan.owner_id}`
              : label}
          </span>
        )
      },
      filterFn: (row, id, value) => value.includes(String(row.getValue(id))),
      size: 120,
    },
    {
      accessorKey: 'base_discount',
      header: t('Base discount'),
      cell: ({ row }) => (
        <span className='font-mono text-sm'>
          {formatRatioText(row.getValue('base_discount'))}
        </span>
      ),
      size: 120,
    },
    {
      accessorKey: 'min_discount',
      header: t('Minimum discount'),
      meta: { mobileHidden: true },
      cell: ({ row }) => (
        <span className='font-mono text-sm'>
          {formatRatioText(row.getValue('min_discount'))}
        </span>
      ),
      size: 130,
    },
    {
      accessorKey: 'billing_mode',
      header: t('Billing mode'),
      meta: { mobileHidden: true },
      cell: ({ row }) =>
        getDiscountBillingModeLabel(t, row.getValue('billing_mode') as string),
      size: 130,
    },
    {
      accessorKey: 'status',
      header: t('Status'),
      meta: { mobileBadge: true },
      cell: ({ row }) => {
        const isEnabled =
          row.getValue('status') === DISCOUNT_PLAN_STATUS.ENABLED
        return (
          <StatusBadge
            label={isEnabled ? t('Enabled') : t('Disabled')}
            variant={isEnabled ? 'success' : 'neutral'}
            copyable={false}
            className='-ml-1.5'
          />
        )
      },
      filterFn: (row, id, value) => value.includes(String(row.getValue(id))),
      size: 110,
    },
    {
      accessorKey: 'updated_at',
      header: t('Updated'),
      meta: { mobileHidden: true },
      cell: ({ row }) => (
        <span className='text-muted-foreground font-mono text-xs'>
          {formatTimestampToDate(row.getValue('updated_at') as number)}
        </span>
      ),
      size: 170,
    },
    {
      id: 'actions',
      header: () => t('Actions'),
      cell: ({ row }) => <DiscountsRowActions row={row} />,
      meta: { pinned: 'right' as const },
      size: 130,
    },
  ]
}
