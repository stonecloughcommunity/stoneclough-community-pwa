'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Settings, Shield, User, Bell, Lock, Key, ChevronRight } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { clientTwoFactorService } from '@/lib/auth/two-factor-client'

export default function SettingsPage() {
  const [twoFactorStatus, setTwoFactorStatus] = useState<TwoFactorStatus>({ 
    isEnabled: false, 
    hasBackupCodes: false 
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadTwoFactorStatus()
  }, [])

  const loadTwoFactorStatus = async () => {
    try {
      const status = await clientTwoFactorService.getTwoFactorStatus()
      setTwoFactorStatus(status)
    } catch (error) {
      console.error('Failed to load 2FA status:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const settingsCategories = [
    {
      title: 'Account & Profile',
      description: 'Manage your personal information and preferences',
      icon: User,
      items: [
        {
          title: 'Profile Information',
          description: 'Update your display name, bio, and contact details',
          href: '/profile/edit',
          badge: null,
        },
        {
          title: 'Privacy Settings',
          description: 'Control who can see your information and activity',
          href: '/settings/privacy',
          badge: null,
        },
        {
          title: 'Department Interests',
          description: 'Choose which community departments interest you most',
          href: '/settings/interests',
          badge: null,
        },
      ],
    },
    {
      title: 'Security',
      description: 'Protect your account with security features',
      icon: Shield,
      items: [
        {
          title: 'Two-Factor Authentication',
          description: 'Add an extra layer of security to your account',
          href: '/settings/security/two-factor',
          badge: twoFactorStatus.isEnabled ? 
            { text: 'Enabled', variant: 'default' as const } : 
            { text: 'Disabled', variant: 'secondary' as const },
        },
        {
          title: 'Password & Login',
          description: 'Change your password and manage login settings',
          href: '/settings/security/password',
          badge: null,
        },
        {
          title: 'Active Sessions',
          description: 'See where you\'re logged in and manage your sessions',
          href: '/settings/security/sessions',
          badge: null,
        },
      ],
    },
    {
      title: 'Notifications',
      description: 'Control how and when you receive notifications',
      icon: Bell,
      items: [
        {
          title: 'Email Notifications',
          description: 'Choose which emails you want to receive',
          href: '/settings/notifications/email',
          badge: null,
        },
        {
          title: 'Push Notifications',
          description: 'Manage browser and mobile push notifications',
          href: '/settings/notifications/push',
          badge: null,
        },
        {
          title: 'Community Updates',
          description: 'Get notified about community events and announcements',
          href: '/settings/notifications/community',
          badge: null,
        },
      ],
    },
    {
      title: 'Accessibility',
      description: 'Customize the interface for your needs',
      icon: Settings,
      items: [
        {
          title: 'Display Preferences',
          description: 'Adjust text size, contrast, and layout options',
          href: '/settings/accessibility/display',
          badge: null,
        },
        {
          title: 'Senior Mode',
          description: 'Enable simplified navigation and larger interface elements',
          href: '/settings/accessibility/senior-mode',
          badge: null,
        },
        {
          title: 'Keyboard Navigation',
          description: 'Configure keyboard shortcuts and navigation preferences',
          href: '/settings/accessibility/keyboard',
          badge: null,
        },
      ],
    },
  ]

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Settings className="w-8 h-8 text-blue-600" />
          Settings
        </h1>
        <p className="text-muted-foreground mt-2">
          Manage your account, security, and preferences
        </p>
      </div>

      <div className="space-y-8">
        {settingsCategories.map((category, categoryIndex) => (
          <div key={categoryIndex}>
            <div className="mb-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <category.icon className="w-5 h-5 text-blue-600" />
                {category.title}
              </h2>
              <p className="text-muted-foreground text-sm mt-1">
                {category.description}
              </p>
            </div>

            <div className="grid gap-4">
              {category.items.map((item, itemIndex) => (
                <Card key={itemIndex} className="hover:shadow-md transition-shadow">
                  <Link href={item.href}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-medium">{item.title}</h3>
                            {item.badge && (
                              <Badge variant={item.badge.variant}>
                                {item.badge.text}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {item.description}
                          </p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Link>
                </Card>
              ))}
            </div>

            {categoryIndex < settingsCategories.length - 1 && (
              <Separator className="mt-8" />
            )}
          </div>
        ))}
      </div>

      <div className="mt-12 p-6 bg-gray-50 rounded-lg">
        <h3 className="font-medium mb-2 flex items-center gap-2">
          <Lock className="w-4 h-4" />
          Security Status
        </h3>
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span>Two-Factor Authentication:</span>
            <Badge variant={twoFactorStatus.isEnabled ? "default" : "secondary"}>
              {twoFactorStatus.isEnabled ? "Enabled" : "Disabled"}
            </Badge>
          </div>
          {twoFactorStatus.isEnabled && (
            <div className="flex items-center justify-between">
              <span>Backup Codes:</span>
              <span className="text-muted-foreground">
                {twoFactorStatus.backupCodesRemaining || 0} remaining
              </span>
            </div>
          )}
        </div>
        {!twoFactorStatus.isEnabled && (
          <div className="mt-3">
            <Link 
              href="/settings/security/two-factor"
              className="text-blue-600 hover:underline text-sm"
            >
              Enable two-factor authentication for better security →
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
