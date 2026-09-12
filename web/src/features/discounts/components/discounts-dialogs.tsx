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
import { DiscountsBindingsDrawer } from './discounts-bindings-drawer'
import { DiscountsPlanDeleteDialog } from './discounts-plan-delete-dialog'
import { DiscountsPlanMutateDrawer } from './discounts-plan-mutate-drawer'
import { useDiscounts } from './discounts-provider'
import { DiscountsRulesDrawer } from './discounts-rules-drawer'

/**
 * 页面上的四个浮层。关掉时顺手把「当前方案」清掉——
 * 否则下次点「新建方案」会带出上一次那一条，变成改错方案。
 */
export function DiscountsDialogs() {
  const { open, setOpen, setCurrentRow } = useDiscounts()

  const closeAndForgetRow = () => {
    setOpen(null)
    setCurrentRow(null)
  }

  return (
    <>
      <DiscountsPlanMutateDrawer
        open={open === 'create' || open === 'update'}
        isUpdate={open === 'update'}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) closeAndForgetRow()
        }}
      />
      <DiscountsPlanDeleteDialog
        open={open === 'delete'}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) closeAndForgetRow()
        }}
      />
      <DiscountsRulesDrawer
        open={open === 'rules'}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) closeAndForgetRow()
        }}
      />
      <DiscountsBindingsDrawer
        open={open === 'bindings'}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) closeAndForgetRow()
        }}
      />
    </>
  )
}
