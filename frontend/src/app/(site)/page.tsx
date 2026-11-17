import { HydrationBoundary } from '@tanstack/react-query'
import HomePage from '@/views/HomePage'
import { JsonLd } from '@/components/seo/JsonLd'
import { SITE_URL, getHome, getSettings, prefetch, safe } from '@/lib/server'

export const metadata = { alternates: { canonical: '/' } }

export default async function Page() {
  const [state, settings] = await Promise.all([prefetch([[['home'], getHome]]), safe(getSettings())])
  const shop = settings?.shop_name || 'TCG Shop'
  return (
    <>
      {/* Google: tên website + ô tìm kiếm ngay trên kết quả tìm kiếm */}
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: shop,
          url: `${SITE_URL}/`,
          potentialAction: {
            '@type': 'SearchAction',
            target: { '@type': 'EntryPoint', urlTemplate: `${SITE_URL}/tim-kiem?q={search_term_string}` },
            'query-input': 'required name=search_term_string',
          },
        }}
      />
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'Store',
          name: shop,
          url: `${SITE_URL}/`,
          logo: `${SITE_URL}/favicon.svg`,
          telephone: settings?.hotline || undefined,
          email: settings?.email || undefined,
          address: settings?.address || undefined,
        }}
      />
      <HydrationBoundary state={state}>
        <HomePage />
      </HydrationBoundary>
    </>
  )
}
