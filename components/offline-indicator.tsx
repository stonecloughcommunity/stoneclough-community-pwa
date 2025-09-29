"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { WifiOff, Wifi } from "lucide-react"

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true)
  const [showIndicator, setShowIndicator] = useState(false)

  useEffect(() => {
    const updateOnlineStatus = () => {
      const online = navigator.onLine
      setIsOnline(online)

      if (!online) {
        setShowIndicator(true)
      } else {
        // Show "back online" briefly
        if (!isOnline) {
          setShowIndicator(true)
          setTimeout(() => setShowIndicator(false), 3000)
        }
      }
    }

    updateOnlineStatus()

    window.addEventListener("online", updateOnlineStatus)
    window.addEventListener("offline", updateOnlineStatus)

    return () => {
      window.removeEventListener("online", updateOnlineStatus)
      window.removeEventListener("offline", updateOnlineStatus)
    }
  }, [isOnline])

  if (!showIndicator) return null

  return (
    <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50">
      <Badge
        variant={isOnline ? "default" : "destructive"}
        className={`${isOnline ? "bg-green-600" : "bg-red-600"} text-white shadow-lg animate-in slide-in-from-top-2`}
      >
        {isOnline ? (
          <>
            <Wifi className="w-3 h-3 mr-1" />
            Back online
          </>
        ) : (
          <>
            <WifiOff className="w-3 h-3 mr-1" />
            You're offline
          </>
        )}
      </Badge>
    </div>
  )
}
