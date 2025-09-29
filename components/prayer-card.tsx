"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Heart, Clock, MessageSquare } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"

interface PrayerCardProps {
  prayer: {
    id: string
    title: string
    content: string
    category: string
    is_anonymous: boolean
    prayer_count: number
    created_at: string
    expires_at?: string
    profiles?: {
      display_name: string
      village: string
    }
    prayer_responses?: { count: number }[]
  }
}

export function PrayerCard({ prayer }: PrayerCardProps) {
  const [isPraying, setIsPraying] = useState(false)
  const [prayerCount, setPrayerCount] = useState(prayer.prayer_count)
  const [hasPrayed, setHasPrayed] = useState(false)
  const supabase = createClient()

  const handlePray = async () => {
    if (isPraying || hasPrayed) return

    setIsPraying(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      const { error } = await supabase.from("prayer_responses").insert({
        prayer_id: prayer.id,
        user_id: user.id,
        message: "Prayed for this request",
      })

      if (!error) {
        setPrayerCount((prev) => prev + 1)
        setHasPrayed(true)
      }
    } catch (error) {
      console.error("Error recording prayer:", error)
    } finally {
      setIsPraying(false)
    }
  }

  const getCategoryColor = (category: string) => {
    const colors = {
      general: "bg-blue-100 text-blue-800",
      healing: "bg-green-100 text-green-800",
      guidance: "bg-purple-100 text-purple-800",
      thanksgiving: "bg-yellow-100 text-yellow-800",
      family: "bg-pink-100 text-pink-800",
      community: "bg-indigo-100 text-indigo-800",
    }
    return colors[category as keyof typeof colors] || colors.general
  }

  const formatCategory = (category: string) => {
    return category.charAt(0).toUpperCase() + category.slice(1)
  }

  const isExpiringSoon =
    prayer.expires_at && new Date(prayer.expires_at).getTime() - new Date().getTime() < 7 * 24 * 60 * 60 * 1000

  return (
    <Card className="hover:shadow-md transition-shadow border-l-4 border-l-blue-200">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2">
            <Badge className={getCategoryColor(prayer.category)}>{formatCategory(prayer.category)}</Badge>
            {isExpiringSoon && (
              <Badge variant="outline" className="text-orange-600 border-orange-200">
                <Clock className="w-3 h-3 mr-1" />
                Expiring soon
              </Badge>
            )}
          </div>
          <div className="text-xs text-gray-500">{new Date(prayer.created_at).toLocaleDateString("en-GB")}</div>
        </div>
        <CardTitle className="text-lg leading-tight">{prayer.title}</CardTitle>
        <CardDescription>
          {prayer.is_anonymous
            ? "Anonymous request"
            : `by ${prayer.profiles?.display_name} from ${prayer.profiles?.village}`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-gray-700 mb-4 line-clamp-3">{prayer.content}</p>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <span className="flex items-center">
              <Heart className="w-4 h-4 mr-1 text-red-400" />
              {prayerCount} prayers
            </span>
            <span className="flex items-center">
              <MessageSquare className="w-4 h-4 mr-1" />
              {prayer.prayer_responses?.[0]?.count || 0} responses
            </span>
          </div>

          <div className="flex space-x-2">
            <Button
              onClick={handlePray}
              disabled={isPraying || hasPrayed}
              size="sm"
              variant={hasPrayed ? "secondary" : "default"}
              className={hasPrayed ? "bg-green-100 text-green-800" : "bg-blue-600 hover:bg-blue-700"}
            >
              <Heart className={`w-4 h-4 mr-1 ${hasPrayed ? "fill-current" : ""}`} />
              {hasPrayed ? "Prayed" : isPraying ? "Praying..." : "Pray"}
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href={`/prayer/${prayer.id}`}>Details</Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
