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
import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from 'react'

import type { DiscountPlan } from '../types'

/** 这一页会打开的浮层；一次只开一个。 */
export type DiscountsDialogType =
  | 'create'
  | 'update'
  | 'delete'
  | 'rules'
  | 'bindings'

type DiscountsContextType = {
  open: DiscountsDialogType | null
  setOpen: (type: DiscountsDialogType | null) => void
  /** 当前操作的方案；规则与绑定抽屉都靠它知道在改哪个方案。 */
  currentRow: DiscountPlan | null
  setCurrentRow: (row: DiscountPlan | null) => void
  refreshTrigger: number
  triggerRefresh: () => void
}

const DiscountsContext = createContext<DiscountsContextType | null>(null)

export function DiscountsProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState<DiscountsDialogType | null>(null)
  const [currentRow, setCurrentRow] = useState<DiscountPlan | null>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const triggerRefresh = useCallback(() => {
    setRefreshTrigger((previous) => previous + 1)
  }, [])

  return (
    <DiscountsContext.Provider
      value={{
        open,
        setOpen,
        currentRow,
        setCurrentRow,
        refreshTrigger,
        triggerRefresh,
      }}
    >
      {children}
    </DiscountsContext.Provider>
  )
}

export function useDiscounts() {
  const context = useContext(DiscountsContext)
  if (!context) {
    throw new Error('useDiscounts must be used within DiscountsProvider')
  }
  return context
}
