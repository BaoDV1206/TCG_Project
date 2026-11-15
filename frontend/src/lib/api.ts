const TOKEN_KEY = 'tcg_token'

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setToken(token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token)
    else localStorage.removeItem(TOKEN_KEY)
  } catch {
    /* ignore */
  }
}

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

type Query = Record<string, string | number | boolean | null | undefined>

interface Options {
  method?: string
  body?: unknown
  query?: Query
}

export function buildQuery(query?: Query): string {
  if (!query) return ''
  const params = new URLSearchParams()
  Object.entries(query).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') params.set(k, String(v))
  })
  const s = params.toString()
  return s ? `?${s}` : ''
}

async function request<T>(path: string, opts: Options, withToken: boolean): Promise<T> {
  const headers: Record<string, string> = {}
  const token = withToken ? getToken() : null
  if (token) headers.Authorization = `Bearer ${token}`
  let body: BodyInit | undefined
  if (opts.body instanceof FormData) {
    body = opts.body
  } else if (opts.body !== undefined) {
    headers['Content-Type'] = 'application/json'
    body = JSON.stringify(opts.body)
  }

  const res = await fetch(`/api${path}${buildQuery(opts.query)}`, {
    method: opts.method ?? 'GET',
    headers,
    body,
  })

  if (res.status === 401 && token) {
    // Token hết hạn / không hợp lệ: đăng xuất, thử lại với API công khai
    setToken(null)
    window.dispatchEvent(new Event('auth:expired'))
    if (path.startsWith('/public') || path.startsWith('/auth')) return request<T>(path, opts, false)
  }

  if (!res.ok) {
    let message = 'Có lỗi xảy ra, vui lòng thử lại'
    try {
      const data = await res.json()
      if (data?.message) message = data.message
    } catch {
      /* ignore */
    }
    if (res.status === 401 && !path.startsWith('/auth')) message = 'Vui lòng đăng nhập để tiếp tục'
    throw new ApiError(res.status, message)
  }
  if (res.status === 204) return undefined as T
  const text = await res.text()
  return (text ? JSON.parse(text) : undefined) as T
}

export const api = {
  get: <T>(path: string, query?: Query) => request<T>(path, { query }, true),
  post: <T>(path: string, body?: unknown, query?: Query) => request<T>(path, { method: 'POST', body, query }, true),
  put: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PUT', body }, true),
  patch: <T>(path: string, query?: Query) => request<T>(path, { method: 'PATCH', query }, true),
  del: <T>(path: string) => request<T>(path, { method: 'DELETE' }, true),
  upload: async (file: File): Promise<string> => {
    const fd = new FormData()
    fd.append('file', file)
    const res = await request<{ url: string }>('/uploads', { method: 'POST', body: fd }, true)
    return res.url
  },
}

export function errorMessage(e: unknown): string {
  if (e instanceof Error) return e.message
  return 'Có lỗi xảy ra'
}
