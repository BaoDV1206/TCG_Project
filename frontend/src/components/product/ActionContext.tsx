import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import type { ProductStatus } from '../../lib/types'
import { ActionModal } from './ActionModal'

export interface ActionProduct {
  id: number
  name: string
  slug: string
  status: ProductStatus
  price: number | null
  depositPercent: number | null
  remainingSlots: number | null
  perUserLimit?: number | null
  releaseDate: string | null
  thumbnail: string | null
  brandName: string
  brandColor: string | null
  setCode: string | null
  categoryName: string
}

interface ActionState {
  open: (p: ActionProduct, quantity?: number) => void
}

const Ctx = createContext<ActionState | null>(null)

/** Cho phép mở popup Liên hệ / Đặt trước từ bất kỳ thẻ sản phẩm nào */
export function ActionProvider({ children }: { children: ReactNode }) {
  const [product, setProduct] = useState<ActionProduct | null>(null)
  const [qty, setQty] = useState(1)
  const open = useCallback((p: ActionProduct, quantity = 1) => {
    setQty(quantity)
    setProduct(p)
  }, [])
  return (
    <Ctx.Provider value={{ open }}>
      {children}
      {product && <ActionModal product={product} initialQuantity={qty} onClose={() => setProduct(null)} />}
    </Ctx.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useProductAction() {
  const c = useContext(Ctx)
  if (!c) throw new Error('useProductAction must be inside ActionProvider')
  return c
}
