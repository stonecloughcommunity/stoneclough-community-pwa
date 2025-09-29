import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"
import { Suspense } from "react"
import { PWAInstallPrompt } from "@/components/pwa-install-prompt"
import { PerformanceMonitor } from "@/components/performance-monitor"
import { SessionProvider } from "@/components/providers/session-provider"
import "./globals.css"

export const metadata: Metadata = {
  title: "Village Community - Stoneclough, Prestolee & Ringley",
  description: "Connect with your neighbors and stay informed about local events, services, and community needs",
  generator: "v0.app",
  manifest: "/manifest.json",
  themeColor: "#16a34a",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Village Community",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: "Village Community",
    title: "Village Community - Stoneclough, Prestolee & Ringley",
    description: "Connect with your neighbors and stay informed about local events, services, and community needs",
  },
  twitter: {
    card: "summary",
    title: "Village Community - Stoneclough, Prestolee & Ringley",
    description: "Connect with your neighbors and stay informed about local events, services, and community needs",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/icon-192.jpg" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Village Community" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="#16a34a" />
        <meta name="msapplication-tap-highlight" content="no" />
      </head>
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <SessionProvider>
          <Suspense fallback={null}>{children}</Suspense>
          <PWAInstallPrompt />
          <PerformanceMonitor />
        </SessionProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
