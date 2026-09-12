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
import { useQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { DataTablePage, useDataTable } from '@/components/data-table'
import { useMediaQuery } from '@/hooks'
import { useTableUrlState } from '@/hooks/use-table-url-state'

import { getDiscountPlans } from '../api'
import {
  ERROR_MESSAGES,
  getDiscountOwnerOptions,
  getDiscountStatusOptions,
} from '../constants'
import type { DiscountPlan } from '../types'
import { useDiscountsColumns } from './discounts-columns'
import { useDiscounts } from './discounts-provider'

const route = getRouteApi('/_authenticated/discounts/')

export function DiscountsTable() {
  const { t } = useTranslation()
  const columns = useDiscountsColumns()
  const { refreshTrigger } = useDiscounts()
  const isMobile = useMediaQuery('(max-width: 640px)')

  const {
    globalFilter,
    onGlobalFilterChange,
    columnFilters,
    onColumnFiltersChange,
    pagination,
    onPaginationChange,
    ensurePageInRange,
  } = useTableUrlState({
    search: route.useSearch(),
    navigate: route.useNavigate(),
    pagination: { defaultPage: 1, defaultPageSize: isMobile ? 10 : 20 },
    globalFilter: { enabled: true, key: 'filter' },
    columnFilters: [
      { columnId: 'status', searchKey: 'status', type: 'array' },
      { columnId: 'owner_type', searchKey: 'owner_type', type: 'array' },
    ],
  })

  const statusFilter =
    (columnFilters.find((filter) => filter.id === 'status')?.value as
      | string[]
      | undefined) ?? []
  const statusFilterValue = statusFilter[0] ?? ''
  const ownerFilter =
    (columnFilters.find((filter) => filter.id === 'owner_type')?.value as
      | string[]
      | undefined) ?? []
  const ownerFilterValue = ownerFilter[0] ?? ''

  const { data, isLoading, isFetching } = useQuery({
    queryKey: [
      'discount-plans',
      pagination.pageIndex + 1,
      pagination.pageSize,
      globalFilter,
      statusFilterValue,
      ownerFilterValue,
      refreshTrigger,
    ],
    queryFn: async () => {
      const result = await getDiscountPlans({
        page: pagination.pageIndex + 1,
        page_size: pagination.pageSize,
        keyword: globalFilter?.trim() || undefined,
        status:
          statusFilterValue === '' ? undefined : Number(statusFilterValue),
        owner_type: ownerFilterValue || undefined,
      })

      if (!result.success) {
        toast.error(result.message || t(ERROR_MESSAGES.PLANS_LOAD_FAILED))
        return { items: [] as DiscountPlan[], total: 0 }
      }

      return {
        items: result.data?.items ?? [],
        total: result.data?.total ?? 0,
      }
    },
    placeholderData: (previousData) => previousData,
  })

  const plans = data?.items ?? []

  const { table } = useDataTable({
    data: plans,
    columns,
    columnFilters,
    globalFilter,
    pagination,
    globalFilterFn: (row, _columnId, filterValue) => {
      const name = String(row.getValue('name')).toLowerCase()
      const id = String(row.getValue('id'))
      const searchValue = String(filterValue).toLowerCase()

      return name.includes(searchValue) || id.includes(searchValue)
    },
    onPaginationChange,
    onGlobalFilterChange,
    onColumnFiltersChange,
    manualPagination: true,
    manualFiltering: true,
    totalCount: data?.total || 0,
    ensurePageInRange,
  })

  const statusOptions = useMemo(() => getDiscountStatusOptions(t), [t])
  const ownerOptions = useMemo(() => getDiscountOwnerOptions(t), [t])

  return (
    <DataTablePage
      table={table}
      columns={columns}
      isLoading={isLoading}
      isFetching={isFetching}
      emptyTitle={t('No Discount Plans Found')}
      emptyDescription={t(
        'Create a discount plan to give one customer a different price than the official one.'
      )}
      skeletonKeyPrefix='discounts-skeleton'
      applyHeaderSize
      toolbarProps={{
        searchPlaceholder: t('Filter by plan name or ID...'),
        searchDebounceMs: 500,
        filters: [
          {
            columnId: 'status',
            title: t('Status'),
            options: statusOptions,
            singleSelect: true,
          },
          {
            columnId: 'owner_type',
            title: t('Owner'),
            options: ownerOptions,
            singleSelect: true,
          },
        ],
      }}
    />
  )
}
