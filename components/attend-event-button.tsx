"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { UserPlus, UserMinus } from "lucide-react"
import { useRouter } from "next/navigation"

interface AttendEventButtonProps {
  eventId: string
  isAttending: boolean
  isFull: boolean
}

export function AttendEventButton({ eventId, isAttending, isFull }: AttendEventButtonProps) {
  const [loading, setLoading] = useState(false)
  const [attending, setAttending] = useState(isAttending)
  const router = useRouter()
  const supabase = createClient()

  const handleAttendance = async () => {
    setLoading(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      if (attending) {
        // Remove attendance
        const { error } = await supabase.from("event_attendees").delete().eq("event_id", eventId).eq("user_id", user.id)

        if (error) throw error
        setAttending(false)
      } else {
        // Add attendance
        const { error } = await supabase.from("event_attendees").insert({
          event_id: eventId,
          user_id: user.id,
          status: "attending",
        })

        if (error) throw error
        setAttending(true)
      }

      router.refresh()
    } catch (error) {
      console.error("Error updating attendance:", error)
    } finally {
      setLoading(false)
    }
  }

  if (attending) {
    return (
      <Button
        onClick={handleAttendance}
        disabled={loading}
        variant="outline"
        className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
      >
        <UserMinus className="w-4 h-4 mr-2" />
        {loading ? "Updating..." : "Leave Event"}
      </Button>
    )
  }

  return (
    <Button onClick={handleAttendance} disabled={loading || isFull} className="bg-green-600 hover:bg-green-700">
      <UserPlus className="w-4 h-4 mr-2" />
      {loading ? "Joining..." : isFull ? "Event Full" : "Join Event"}
    </Button>
  )
}
