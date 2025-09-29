'use client'

import { useEffect } from 'react'
import { reportWebVitals, initializePerformanceMonitoring, trackPageLoad } from '@/lib/monitoring/performance'
import { usePathname } from 'next/navigation'

export function PerformanceMonitor() {
  const pathname = usePathname()

  useEffect(() => {
    // Initialize performance monitoring
    initializePerformanceMonitoring()

    // Track page load for current route
    const pageName = pathname.replace('/', '') || 'home'
    trackPageLoad(pageName)

    // Set up Web Vitals reporting
    if (typeof window !== 'undefined') {
      import('web-vitals').then(({ getCLS, getFCP, getFID, getLCP, getTTFB }) => {
        getCLS(reportWebVitals)
        getFCP(reportWebVitals)
        getFID(reportWebVitals)
        getLCP(reportWebVitals)
        getTTFB(reportWebVitals)
      })
    }
  }, [pathname])

  // This component doesn't render anything
  return null
}
