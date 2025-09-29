"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { CheckCircle, XCircle, MessageSquare } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface ModerationActionsProps {
  prayerId: string
}

export function ModerationActions({ prayerId }: ModerationActionsProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [notes, setNotes] = useState("")
  const [showNotes, setShowNotes] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleModeration = async (action: "approved" | "rejected") => {
    setIsLoading(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      const { error } = await supabase
        .from("prayer_requests")
        .update({
          status: action,
          moderated_by: user.id,
          moderated_at: new Date().toISOString(),
          moderation_notes: notes || null,
        })
        .eq("id", prayerId)

      if (error) throw error

      router.refresh()
    } catch (error) {
      console.error("Moderation error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Button variant="outline" size="sm" onClick={() => setShowNotes(!showNotes)} className="bg-transparent">
          <MessageSquare className="w-4 h-4 mr-2" />
          {showNotes ? "Hide" : "Add"} Notes
        </Button>
      </div>

      {showNotes && (
        <div className="space-y-2">
          <Label htmlFor={`notes-${prayerId}`}>Moderation Notes (Optional)</Label>
          <Textarea
            id={`notes-${prayerId}`}
            placeholder="Add any notes about this moderation decision..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
          />
        </div>
      )}

      <div className="flex space-x-3">
        <Button
          onClick={() => handleModeration("approved")}
          disabled={isLoading}
          className="bg-green-600 hover:bg-green-700"
        >
          <CheckCircle className="w-4 h-4 mr-2" />
          Approve
        </Button>
        <Button onClick={() => handleModeration("rejected")} disabled={isLoading} variant="destructive">
          <XCircle className="w-4 h-4 mr-2" />
          Reject
        </Button>
      </div>
    </div>
  )
}
