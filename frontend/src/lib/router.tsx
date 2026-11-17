'use client'

/**
 * Lớp tương thích: cung cấp API giống react-router-dom (Link, NavLink, useNavigate, useSearchParams...)
 * nhưng chạy bằng router của Next.js. Nhờ vậy các component cũ giữ nguyên cách viết.
 */
import NextLink from 'next/link'
import {
  useParams as useNextParams,
  usePathname,
  useRouter,
  useSearchParams as useNextSearchParams,
} from 'next/navigation'
import { forwardRef, useCallback, useEffect, useMemo, type AnchorHTMLAttributes, type ReactNode } from 'react'

type AnchorProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'>

export interface LinkProps extends AnchorProps {
  to: string
  replace?: boolean
  /** false = không tải trước trang đích (dùng cho danh sách dài) */
  prefetch?: boolean
}

export const Link = forwardRef<HTMLAnchorElement, LinkProps>(function Link({ to, replace, prefetch, ...rest }, ref) {
  return <NextLink ref={ref} href={to} replace={replace} prefetch={prefetch} {...rest} />
})

function pathOf(to: string) {
  const i = to.search(/[?#]/)
  return i === -1 ? to : to.slice(0, i)
}

export interface NavLinkProps extends Omit<LinkProps, 'className' | 'children'> {
  end?: boolean
  className?: string | ((s: { isActive: boolean }) => string)
  children?: ReactNode | ((s: { isActive: boolean }) => ReactNode)
}

/** Link tự biết đang ở trang đó hay không (giống NavLink của react-router) */
export const NavLink = forwardRef<HTMLAnchorElement, NavLinkProps>(function NavLink({ to, end, className, children, ...rest }, ref) {
  const pathname = usePathname() ?? '/'
  const target = pathOf(to)
  const isActive = end || target === '/' ? pathname === target : pathname === target || pathname.startsWith(target + '/')
  return (
    <Link
      ref={ref}
      to={to}
      className={typeof className === 'function' ? className({ isActive }) : className}
      aria-current={isActive ? 'page' : undefined}
      {...rest}
    >
      {typeof children === 'function' ? children({ isActive }) : children}
    </Link>
  )
})

export function useNavigate() {
  const router = useRouter()
  return useCallback(
    (to: string, opts?: { replace?: boolean }) => {
      if (opts?.replace) router.replace(to)
      else router.push(to)
    },
    [router],
  )
}

/** Chuyển trang ngay khi render (dùng trong điều kiện bảo vệ trang) */
export function Navigate({ to, replace }: { to: string; replace?: boolean }) {
  const navigate = useNavigate()
  useEffect(() => {
    navigate(to, { replace })
  }, [navigate, to, replace])
  return null
}

export function useParams<T extends Record<string, string | undefined> = Record<string, string | undefined>>(): T {
  return (useNextParams() ?? {}) as unknown as T
}

export function useLocation() {
  const pathname = usePathname() ?? '/'
  const sp = useNextSearchParams()
  const qs = sp?.toString() ?? ''
  return useMemo(() => ({ pathname, search: qs ? `?${qs}` : '', hash: '' }), [pathname, qs])
}

type SetParams = (next: URLSearchParams | Record<string, string>, opts?: { replace?: boolean }) => void

/** [params, setParams] giống react-router; params là bản sao có thể sửa */
export function useSearchParams(): [URLSearchParams, SetParams] {
  const sp = useNextSearchParams()
  const router = useRouter()
  const pathname = usePathname() ?? '/'
  const qs = sp?.toString() ?? ''
  const params = useMemo(() => new URLSearchParams(qs), [qs])
  const setParams = useCallback<SetParams>(
    (next, opts) => {
      const s = (next instanceof URLSearchParams ? next : new URLSearchParams(next)).toString()
      const url = s ? `${pathname}?${s}` : pathname
      if (opts?.replace) router.replace(url, { scroll: false })
      else router.push(url, { scroll: false })
    },
    [router, pathname],
  )
  return [params, setParams]
}
