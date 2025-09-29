"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Bell, Save } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"

interface NotificationPreferences {
  push_enabled: boolean
  email_enabled: boolean
  emergency_alerts: boolean
  event_reminders: boolean
  prayer_updates: boolean
  community_posts: boolean
  volunteer_opportunities: boolean
  digest_frequency: string
}

export function NotificationSettings() {
  const [user, setUser] = useState<User | null>(null)
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    push_enabled: true,
    email_enabled: true,
    emergency_alerts: true,
    event_reminders: true,
    prayer_updates: true,
    community_posts: false,
    volunteer_opportunities: false,
    digest_frequency: "daily",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUser(user)
      if (user) {
        loadPreferences(user.id)
      }
    }
    getUser()
  }, [supabase])

  const loadPreferences = async (userId: string) => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase.from("notification_preferences").select("*").eq("user_id", userId).single()

      if (error && error.code !== "PGRST116") {
        throw error
      }

      if (data) {
        setPreferences(data)
      }
    } catch (error) {
      console.error("Error loading preferences:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const savePreferences = async () => {
    if (!user) return

    setIsSaving(true)
    try {
      const { error } = await supabase.from("notification_preferences").upsert({
        user_id: user.id,
        ...preferences,
        updated_at: new Date().toISOString(),
      })

      if (error) throw error
    } catch (error) {
      console.error("Error saving preferences:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const updatePreference = (key: keyof NotificationPreferences, value: boolean | string) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Bell className="w-5 h-5" />
          <span>Notification Preferences</span>
        </CardTitle>
        <CardDescription>Choose what notifications you want to receive and how often</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Delivery Methods */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">Delivery Methods</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="push_enabled">Push Notifications</Label>
                <p className="text-sm text-gray-500">Receive notifications in your browser</p>
              </div>
              <Switch
                id="push_enabled"
                checked={preferences.push_enabled}
                onCheckedChange={(checked) => updatePreference("push_enabled", checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="email_enabled">Email Notifications</Label>
                <p className="text-sm text-gray-500">Receive notifications via email</p>
              </div>
              <Switch
                id="email_enabled"
                checked={preferences.email_enabled}
                onCheckedChange={(checked) => updatePreference("email_enabled", checked)}
              />
            </div>
          </div>
        </div>

        {/* Notification Types */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">Notification Types</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="emergency_alerts">Emergency Alerts</Label>
                <p className="text-sm text-gray-500">Critical community alerts and emergencies</p>
              </div>
              <Switch
                id="emergency_alerts"
                checked={preferences.emergency_alerts}
                onCheckedChange={(checked) => updatePreference("emergency_alerts", checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="event_reminders">Event Reminders</Label>
                <p className="text-sm text-gray-500">Reminders for upcoming community events</p>
              </div>
              <Switch
                id="event_reminders"
                checked={preferences.event_reminders}
                onCheckedChange={(checked) => updatePreference("event_reminders", checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="prayer_updates">Prayer Updates</Label>
                <p className="text-sm text-gray-500">Updates on prayer requests and responses</p>
              </div>
              <Switch
                id="prayer_updates"
                checked={preferences.prayer_updates}
                onCheckedChange={(checked) => updatePreference("prayer_updates", checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="community_posts">Community Posts</Label>
                <p className="text-sm text-gray-500">New posts on the community board</p>
              </div>
              <Switch
                id="community_posts"
                checked={preferences.community_posts}
                onCheckedChange={(checked) => updatePreference("community_posts", checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="volunteer_opportunities">Volunteer Opportunities</Label>
                <p className="text-sm text-gray-500">New volunteer opportunities and requests</p>
              </div>
              <Switch
                id="volunteer_opportunities"
                checked={preferences.volunteer_opportunities}
                onCheckedChange={(checked) => updatePreference("volunteer_opportunities", checked)}
              />
            </div>
          </div>
        </div>

        {/* Digest Frequency */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">Digest Frequency</h4>
          <div className="space-y-2">
            <Label htmlFor="digest_frequency">How often would you like to receive summary emails?</Label>
            <Select
              value={preferences.digest_frequency}
              onValueChange={(value) => updatePreference("digest_frequency", value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="immediate">Immediate</SelectItem>
                <SelectItem value="daily">Daily Digest</SelectItem>
                <SelectItem value="weekly">Weekly Digest</SelectItem>
                <SelectItem value="never">Never</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button onClick={savePreferences} disabled={isSaving} className="w-full">
          <Save className="w-4 h-4 mr-2" />
          {isSaving ? "Saving..." : "Save Preferences"}
        </Button>
      </CardContent>
    </Card>
  )
}
