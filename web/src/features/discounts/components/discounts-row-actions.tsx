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
import type { Row } from '@tanstack/react-table'
import {
  Edit,
  Link2,
  Power,
  PowerOff,
  SlidersHorizontal,
  Trash2,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { DataTableRowActionMenu } from '@/components/data-table/core/row-action-menu'
import { Button } from '@/components/ui/button'
import {
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
} from '@/components/ui/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

import { updateDiscountPlanStatus } from '../api'
import { ERROR_MESSAGES } from '../constants'
import { DISCOUNT_PLAN_STATUS, type DiscountPlan } from '../types'
import { useDiscounts } from './discounts-provider'

interface DiscountsRowActionsProps {
  row: Row<DiscountPlan>
}

export function DiscountsRowActions({ row }: DiscountsRowActionsProps) {
  const { t } = useTranslation()
  const plan = row.original
  const { setOpen, setCurrentRow, triggerRefresh } = useDiscounts()
  const isEnabled = plan.status === DISCOUNT_PLAN_STATUS.ENABLED

  const handleToggleStatus = async () => {
    const nextStatus = isEnabled
      ? DISCOUNT_PLAN_STATUS.DISABLED
      : DISCOUNT_PLAN_STATUS.ENABLED

    const result = await updateDiscountPlanStatus(plan.id, nextStatus)
    if (result.success) {
      toast.success(isEnabled ? t('Plan disabled') : t('Plan enabled'))
      triggerRefresh()
      return
    }
    toast.error(result.message || t(ERROR_MESSAGES.PLAN_STATUS_FAILED))
  }

  return (
    <div className='-ml-1.5 flex items-center gap-1'>
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant='ghost'
              size='icon-sm'
              onClick={() => {
                setCurrentRow(plan)
                setOpen('update')
              }}
              aria-label={t('Edit')}
            />
          }
        >
          <Edit />
        </TooltipTrigger>
        <TooltipContent>{t('Edit')}</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant='ghost'
              size='icon-sm'
              onClick={() => {
                setCurrentRow(plan)
                setOpen('rules')
              }}
              aria-label={t('Rules')}
            />
          }
        >
          <SlidersHorizontal />
        </TooltipTrigger>
        <TooltipContent>{t('Rules')}</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant='ghost'
              size='icon-sm'
              onClick={() => {
                setCurrentRow(plan)
                setOpen('bindings')
              }}
              aria-label={t('Bind customers')}
            />
          }
        >
          <Link2 />
        </TooltipTrigger>
        <TooltipContent>{t('Bind customers')}</TooltipContent>
      </Tooltip>

      <DataTableRowActionMenu ariaLabel={t('Open menu')} modal={false}>
        <DropdownMenuItem onClick={handleToggleStatus}>
          {isEnabled ? (
            <>
              {t('Disable')}
              <DropdownMenuShortcut>
                <PowerOff size={16} />
              </DropdownMenuShortcut>
            </>
          ) : (
            <>
              {t('Enable')}
              <DropdownMenuShortcut>
                <Power size={16} />
              </DropdownMenuShortcut>
            </>
          )}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => {
            setCurrentRow(plan)
            setOpen('delete')
          }}
          className='text-destructive focus:text-destructive'
        >
          {t('Delete')}
          <DropdownMenuShortcut>
            <Trash2 size={16} />
          </DropdownMenuShortcut>
        </DropdownMenuItem>
      </DataTableRowActionMenu>
    </div>
  )
}
