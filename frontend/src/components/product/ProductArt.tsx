'use client'

import { useState } from 'react'
import Image from 'next/image'
import { cn } from '../../lib/format'

interface Props {
  src?: string | null
  name: string
  brandName: string
  brandColor?: string | null
  setCode?: string | null
  categoryName?: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
  /** ảnh quan trọng ở đầu trang (ảnh chính trang chi tiết): tải ngay, không lazy */
  preload?: boolean
}

// kích thước ảnh hiển thị thực tế -> trình duyệt chỉ tải bản vừa đủ
const SIZES: Record<NonNullable<Props['size']>, string> = {
  sm: '96px',
  md: '(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 240px',
  lg: '(max-width: 1024px) 100vw, 520px',
}

/** Ảnh sản phẩm. Nếu chưa có ảnh: vẽ "box art" theo màu thương hiệu + mã set. */
export function ProductArt({ src, name, brandName, brandColor, setCode, categoryName, className, size = 'md', preload = false }: Props) {
  const [failed, setFailed] = useState(false)
  if (src && !failed) {
    return (
      <span className={cn('relative block h-full w-full bg-white', className)}>
        <Image
          src={src}
          alt={name}
          fill
          sizes={SIZES[size]}
          preload={preload}
          // ảnh ngoài (admin dán link) không qua bộ tối ưu, tránh biến server thành proxy ảnh cho mọi trang web
          unoptimized={/^https?:\/\//.test(src)}
          onError={() => setFailed(true)}
          className="object-contain"
        />
      </span>
    )
  }
  const color = brandColor || '#b91c1c'
  const code = setCode || brandName.split(/\s+/).map((w) => w[0]).join('').slice(0, 4).toUpperCase()
  if (size === 'sm') {
    // ảnh thu nhỏ: chỉ hiển thị mã, tránh tràn chữ
    return (
      <div
        className={cn('flex h-full w-full items-center justify-center p-1', className)}
        style={{ background: `linear-gradient(150deg, ${color}, #111827 120%)` }}
        aria-label={name}
        role="img"
      >
        <span className="break-all text-center text-[10px] font-black leading-tight text-white drop-shadow">{code}</span>
      </div>
    )
  }
  // cỡ chữ co giãn theo chiều rộng khung (container query) để mã dài không bị xuống dòng
  const codeFont = `${Math.min(16, 88 / Math.max(code.length, 4))}cqw`
  return (
    <div
      className={cn('relative flex h-full w-full items-center justify-center overflow-hidden', className)}
      style={{
        containerType: 'inline-size',
        background: `radial-gradient(circle at 30% 20%, ${color}55, transparent 60%), linear-gradient(145deg, #111827, #1f2937)`,
      }}
      aria-label={name}
      role="img"
    >
      {/* họa tiết */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `repeating-linear-gradient(45deg, ${color} 0 2px, transparent 2px 14px)`,
        }}
      />
      {/* hộp */}
      <div
        className="relative flex aspect-[3/4] w-[62%] flex-col items-center justify-between rounded-lg border-2 border-white/30 p-[6%] shadow-2xl"
        style={{ background: `linear-gradient(160deg, ${color}, #0f172a 130%)` }}
      >
        <span className="w-full truncate text-center font-bold uppercase tracking-widest text-white/85" style={{ fontSize: '4.2cqw' }}>
          {brandName}
        </span>
        <span className="whitespace-nowrap font-black leading-none tracking-tight text-white drop-shadow-lg" style={{ fontSize: codeFont }}>
          {code}
        </span>
        <span className="w-full truncate rounded bg-black/30 px-1 py-0.5 text-center font-semibold uppercase text-white/90" style={{ fontSize: '3.8cqw' }}>
          {categoryName ?? 'TCG'}
        </span>
      </div>
      <div className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full bg-white/10 blur-xl" />
    </div>
  )
}
