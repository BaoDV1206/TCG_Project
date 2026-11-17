'use client'

import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import type { Brand, CardSet, Category, RequestSummary, Settings } from '../lib/types'
import { useAuth } from '../context/AuthContext'

const LONG = 5 * 60 * 1000

export function useBrands() {
  return useQuery({ queryKey: ['brands'], queryFn: () => api.get<Brand[]>('/public/brands'), staleTime: LONG })
}

export function useCategories() {
  return useQuery({ queryKey: ['categories'], queryFn: () => api.get<Category[]>('/public/categories'), staleTime: LONG })
}

export function useSets(brand?: string) {
  return useQuery({
    queryKey: ['sets', brand ?? ''],
    queryFn: () => api.get<CardSet[]>('/public/sets', { brand }),
    staleTime: LONG,
  })
}

export function useSettings() {
  return useQuery({ queryKey: ['settings'], queryFn: () => api.get<Settings>('/public/settings'), staleTime: LONG })
}

export function useRequestSummary() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['request-summary'],
    queryFn: () => api.get<RequestSummary>('/requests/summary'),
    enabled: !!user,
    refetchInterval: 60_000,
  })
}

export function useDebounce<T>(value: T, delay = 250): T {
  const [v, setV] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return v
}

export function useMediaQuery(query: string): boolean {
  // false lúc đầu (server không biết kích thước màn hình), cập nhật ngay sau khi trang hiển thị
  const [matches, setMatches] = useState(false)
  useEffect(() => {
    const m = window.matchMedia(query)
    const fn = () => setMatches(m.matches)
    fn()
    m.addEventListener('change', fn)
    return () => m.removeEventListener('change', fn)
  }, [query])
  return matches
}
