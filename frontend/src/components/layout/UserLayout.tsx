import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Header } from './Header'
import { MobileMenu } from './MobileMenu'
import { MobileNav } from './MobileNav'
import { Footer, FloatingContact } from './Footer'
import { ActionProvider } from '../product/ActionContext'

export function UserLayout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { pathname, search } = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [pathname, search])

  return (
    <ActionProvider>
      <div className="flex min-h-screen flex-col pb-16 md:pb-0">
        <Header onOpenMenu={() => setMenuOpen(true)} />
        <main className="mx-auto w-full max-w-7xl flex-1 px-3 py-3 md:px-4 md:py-5">
          <Outlet />
        </main>
        <Footer />
      </div>
      <FloatingContact />
      <MobileNav onOpenMenu={() => setMenuOpen(true)} />
      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </ActionProvider>
  )
}
