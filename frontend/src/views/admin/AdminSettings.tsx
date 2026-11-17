'use client'

import { useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Save } from 'lucide-react'
import { toast } from 'sonner'
import { api, errorMessage } from '../../lib/api'
import type { Settings } from '../../lib/types'
import { PageLoader, Spinner } from '../../components/ui/Common'
import { PageHeader } from './AdminParts'

const GROUPS: { title: string; fields: { key: string; label: string; textarea?: boolean; hint?: string }[] }[] = [
  {
    title: 'Thông tin shop',
    fields: [
      { key: 'shop_name', label: 'Tên shop' },
      { key: 'hotline', label: 'Hotline' },
      { key: 'email', label: 'Email' },
      { key: 'address', label: 'Địa chỉ' },
      { key: 'working_hours', label: 'Giờ làm việc' },
    ],
  },
  {
    title: 'Kênh liên hệ (dùng cho nút “Liên hệ”)',
    fields: [
      { key: 'zalo', label: 'Link Zalo', hint: 'VD: https://zalo.me/0900000000' },
      { key: 'messenger', label: 'Link Messenger', hint: 'VD: https://m.me/tenpage' },
      { key: 'facebook', label: 'Link Facebook' },
    ],
  },
  {
    title: 'Tìm kiếm',
    fields: [{ key: 'popular_searches', label: 'Từ khóa phổ biến', hint: 'Phân tách bằng dấu phẩy – hiển thị khi khách bấm vào ô tìm kiếm' }],
  },
  {
    title: 'Chính sách',
    fields: [
      { key: 'policy_general', label: 'Chính sách chung', textarea: true },
      { key: 'policy_preorder', label: 'Chính sách đặt trước', textarea: true },
      { key: 'policy_proxy', label: 'Chính sách đặt hộ', textarea: true },
    ],
  },
]

export default function AdminSettings() {
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({ queryKey: ['admin-settings'], queryFn: () => api.get<Settings>('/admin/settings') })
  const [values, setValues] = useState<Settings>({})
  const [saving, setSaving] = useState(false)
  useEffect(() => {
    if (data) setValues(data)
  }, [data])

  if (isLoading) return <PageLoader />

  const save = async () => {
    setSaving(true)
    try {
      const res = await api.put<Settings>('/admin/settings', values)
      qc.setQueryData(['admin-settings'], res)
      qc.invalidateQueries({ queryKey: ['settings'] })
      toast.success('Đã lưu cài đặt')
    } catch (e) {
      toast.error(errorMessage(e))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Cài đặt"
        actions={
          <button className="btn-primary" onClick={save} disabled={saving}>
            {saving ? <Spinner /> : <Save size={18} />} Lưu cài đặt
          </button>
        }
      />
      <div className="space-y-4">
        {GROUPS.map((g) => (
          <section key={g.title} className="card space-y-4 p-4 md:p-5">
            <h3 className="font-bold">{g.title}</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              {g.fields.map((f) => (
                <div key={f.key} className={f.textarea || f.key === 'popular_searches' ? 'sm:col-span-2' : ''}>
                  <label className="label" htmlFor={`st-${f.key}`}>{f.label}</label>
                  {f.textarea ? (
                    <textarea id={`st-${f.key}`} className="input min-h-28" value={values[f.key] ?? ''} onChange={(e) => setValues({ ...values, [f.key]: e.target.value })} />
                  ) : (
                    <input id={`st-${f.key}`} className="input" value={values[f.key] ?? ''} onChange={(e) => setValues({ ...values, [f.key]: e.target.value })} />
                  )}
                  {f.hint && <p className="mt-1 text-xs text-gray-500">{f.hint}</p>}
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
