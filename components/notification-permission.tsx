"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Bell, BellOff, Shield } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

export function NotificationPermission() {
  const [permission, setPermission] = useState<NotificationPermission>("default")
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    if ("Notification" in window) {
      setPermission(Notification.permission)
      checkSubscription()
    }
  }, [])

  const checkSubscription = async () => {
    if ("serviceWorker" in navigator && "PushManager" in window) {
      try {
        const registration = await navigator.serviceWorker.ready
        const subscription = await registration.pushManager.getSubscription()
        setIsSubscribed(!!subscription)
      } catch (error) {
        console.error("Error checking subscription:", error)
      }
    }
  }

  const requestPermission = async () => {
    if (!("Notification" in window)) {
      alert("This browser does not support notifications")
      return
    }

    setIsLoading(true)
    try {
      const permission = await Notification.requestPermission()
      setPermission(permission)

      if (permission === "granted") {
        await subscribeToPush()
      }
    } catch (error) {
      console.error("Error requesting permission:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const subscribeToPush = async () => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      console.error("Push messaging is not supported")
      return
    }

    try {
      const registration = await navigator.serviceWorker.ready

      // You would need to generate VAPID keys and add them to your environment
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "your-vapid-public-key"

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      })

      // Save subscription to database
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        const subscriptionData = subscription.toJSON()
        await supabase.from("push_subscriptions").upsert({
          user_id: user.id,
          endpoint: subscriptionData.endpoint,
          p256dh: subscriptionData.keys?.p256dh,
          auth: subscriptionData.keys?.auth,
          user_agent: navigator.userAgent,
        })
      }

      setIsSubscribed(true)
    } catch (error) {
      console.error("Error subscribing to push:", error)
    }
  }

  const unsubscribeFromPush = async () => {
    if (!("serviceWorker" in navigator)) return

    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()

      if (subscription) {
        await subscription.unsubscribe()

        // Remove from database
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (user) {
          await supabase
            .from("push_subscriptions")
            .delete()
            .eq("user_id", user.id)
            .eq("endpoint", subscription.endpoint)
        }
      }

      setIsSubscribed(false)
    } catch (error) {
      console.error("Error unsubscribing:", error)
    }
  }

  // Helper function to convert VAPID key
  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
  }

  if (permission === "denied") {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <div className="flex items-center space-x-3">
            <BellOff className="h-5 w-5 text-red-600" />
            <div>
              <p className="text-sm font-medium text-red-800">Notifications Blocked</p>
              <p className="text-xs text-red-600">
                Please enable notifications in your browser settings to receive community alerts
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (permission === "granted" && isSubscribed) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Bell className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-green-800">Notifications Enabled</p>
                <p className="text-xs text-green-600">You'll receive important community updates</p>
              </div>
            </div>
            <Button onClick={unsubscribeFromPush} variant="outline" size="sm" className="bg-transparent">
              Disable
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center space-x-2 text-sm">
          <Bell className="h-4 w-4 text-blue-600" />
          <span>Enable Notifications</span>
        </CardTitle>
        <CardDescription className="text-xs">
          Stay updated with emergency alerts, event reminders, and community news
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-start space-x-3 text-xs text-blue-700">
          <Shield className="h-4 w-4 mt-0.5 text-blue-600" />
          <div>
            <p className="font-medium">Privacy Protected</p>
            <p>We only send important community updates. You can disable anytime.</p>
          </div>
        </div>
        <Button onClick={requestPermission} disabled={isLoading} className="w-full bg-blue-600 hover:bg-blue-700">
          {isLoading ? "Enabling..." : "Enable Notifications"}
        </Button>
      </CardContent>
    </Card>
  )
}
