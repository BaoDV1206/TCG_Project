'use client'

import { useEffect, useState, type ReactNode } from 'react'
import dynamic from 'next/dynamic'
import { useLocation } from '@/lib/router'
import { Header } from './Header'
import { MobileNav } from './MobileNav'
import { Footer, FloatingContact } from './Footer'
import { ActionProvider } from '../product/ActionContext'

// menu điện thoại chỉ cần khi người dùng bấm mở -> tải sau (lazy load)
const MobileMenu = dynamic(() => import('./MobileMenu').then((m) => m.MobileMenu), { ssr: false })

/** Khung chung cho các trang khách: header, footer, thanh điều hướng dưới (điện thoại) */
export function SiteShell({ children }: { children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [menuLoaded, setMenuLoaded] = useState(false)
  const { pathname, search } = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [pathname, search])

  const openMenu = () => {
    setMenuLoaded(true)
    setMenuOpen(true)
  }

  return (
    <ActionProvider>
      <div className="flex min-h-screen flex-col pb-16 md:pb-0">
        <Header onOpenMenu={openMenu} />
        <main className="mx-auto w-full max-w-7xl flex-1 px-3 py-3 md:px-4 md:py-5">{children}</main>
        <Footer />
      </div>
      <FloatingContact />
      <MobileNav onOpenMenu={openMenu} />
      {menuLoaded && <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />}
    </ActionProvider>
  )
}
