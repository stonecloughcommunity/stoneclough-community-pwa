"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Wifi, WifiOff, Upload, CheckCircle } from "lucide-react"

interface OfflinePost {
  id: string
  title: string
  content: string
  type: string
  timestamp: number
}

export function OfflineSync() {
  const [isOnline, setIsOnline] = useState(true)
  const [offlinePosts, setOfflinePosts] = useState<OfflinePost[]>([])
  const [syncing, setSyncing] = useState(false)

  useEffect(() => {
    // Monitor online/offline status
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    // Check initial status
    setIsOnline(navigator.onLine)

    // Load offline posts from localStorage
    loadOfflinePosts()

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  const loadOfflinePosts = () => {
    try {
      const stored = localStorage.getItem("offline-posts")
      if (stored) {
        setOfflinePosts(JSON.parse(stored))
      }
    } catch (error) {
      console.error("Failed to load offline posts:", error)
    }
  }

  const syncOfflinePosts = async () => {
    if (!isOnline || offlinePosts.length === 0) return

    setSyncing(true)
    const remainingPosts: OfflinePost[] = []

    for (const post of offlinePosts) {
      try {
        const response = await fetch("/api/community/posts", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: post.title,
            content: post.content,
            post_type: post.type,
          }),
        })

        if (!response.ok) {
          remainingPosts.push(post)
        }
      } catch (error) {
        console.error("Failed to sync post:", error)
        remainingPosts.push(post)
      }
    }

    setOfflinePosts(remainingPosts)
    localStorage.setItem("offline-posts", JSON.stringify(remainingPosts))
    setSyncing(false)

    // Trigger background sync if available
    if ("serviceWorker" in navigator && "sync" in window.ServiceWorkerRegistration.prototype) {
      try {
        const registration = await navigator.serviceWorker.ready
        await registration.sync.register("community-posts-sync")
      } catch (error) {
        console.error("Background sync registration failed:", error)
      }
    }
  }

  if (!isOnline && offlinePosts.length === 0) {
    return (
      <Card className="border-orange-200 bg-orange-50">
        <CardContent className="flex items-center space-x-3 pt-6">
          <WifiOff className="h-5 w-5 text-orange-600" />
          <div>
            <p className="text-sm font-medium text-orange-800">You're offline</p>
            <p className="text-xs text-orange-600">Your posts will be saved and synced when you're back online</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (offlinePosts.length === 0) return null

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center space-x-2 text-sm">
          {isOnline ? <Wifi className="h-4 w-4 text-blue-600" /> : <WifiOff className="h-4 w-4 text-orange-600" />}
          <span>Offline Posts</span>
          <Badge variant="secondary">{offlinePosts.length}</Badge>
        </CardTitle>
        <CardDescription className="text-xs">
          {isOnline
            ? "Posts created while offline are ready to sync"
            : "These posts will sync automatically when you're back online"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {offlinePosts.slice(0, 3).map((post) => (
          <div key={post.id} className="flex items-start space-x-3 text-sm">
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 truncate">{post.title}</p>
              <p className="text-gray-600 text-xs truncate">{post.content}</p>
              <p className="text-gray-500 text-xs">{new Date(post.timestamp).toLocaleString()}</p>
            </div>
            <Badge variant="outline" className="text-xs">
              {post.type}
            </Badge>
          </div>
        ))}

        {offlinePosts.length > 3 && (
          <p className="text-xs text-gray-500 text-center">+{offlinePosts.length - 3} more posts</p>
        )}

        {isOnline && (
          <Button onClick={syncOfflinePosts} disabled={syncing} size="sm" className="w-full">
            {syncing ? (
              <>
                <Upload className="h-4 w-4 mr-2 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Sync Now
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
