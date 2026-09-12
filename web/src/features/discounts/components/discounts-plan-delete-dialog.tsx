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
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

import { deleteDiscountPlan } from '../api'
import { ERROR_MESSAGES } from '../constants'
import { useDiscounts } from './discounts-provider'

type DiscountsPlanDeleteDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DiscountsPlanDeleteDialog({
  open,
  onOpenChange,
}: DiscountsPlanDeleteDialogProps) {
  const { t } = useTranslation()
  const { currentRow, triggerRefresh } = useDiscounts()
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!currentRow) return

    setIsDeleting(true)
    try {
      const result = await deleteDiscountPlan(currentRow.id)
      if (result.success) {
        toast.success(t('Plan deleted'))
        onOpenChange(false)
        triggerRefresh()
        return
      }
      // 还被客户绑着的方案后端不让删（会返回 400 与原因），原样把话说给运营。
      toast.error(result.message || t(ERROR_MESSAGES.PLAN_DELETE_FAILED))
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <AlertDialog
      open={open}
      onOpenChange={(nextOpen) => !nextOpen && onOpenChange(false)}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('Are you sure?')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('This will permanently delete discount plan')}{' '}
            <span className='font-semibold'>{currentRow?.name}</span>
            {t('. This action cannot be undone.')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>
            {t('Cancel')}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            variant='destructive'
          >
            {isDeleting ? t('Deleting...') : t('Delete')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
