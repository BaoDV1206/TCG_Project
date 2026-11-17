'use client'

import { RefreshCcw } from 'lucide-react'
import { EmptyState } from '@/components/ui/Common'

/** Lỗi khi tải trang (thường do backend tạm thời không phản hồi) */
export default function SiteError({ reset }: { error: Error; reset: () => void }) {
  return (
    <EmptyState
      title="Không tải được trang"
      description="Máy chủ đang bận hoặc tạm thời gián đoạn. Bạn thử lại sau ít giây nhé."
      action={
        <button onClick={reset} className="btn-primary">
          <RefreshCcw size={16} /> Thử lại
        </button>
      }
    />
  )
}
