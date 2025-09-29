"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Send } from "lucide-react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import type { User } from "@supabase/supabase-js"

interface PostResponseFormProps {
  postId: string
}

export function PostResponseForm({ postId }: PostResponseFormProps) {
  const [user, setUser] = useState<User | null>(null)
  const [message, setMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()
  }, [supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !message.trim()) return

    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.from("post_responses").insert({
        post_id: postId,
        responder_id: user.id,
        message: message.trim(),
      })

      if (error) throw error

      setMessage("")
      router.refresh()
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="text-center py-4">
        <p className="text-gray-500 mb-4">Please sign in to respond to this post.</p>
        <Button asChild size="sm">
          <a href="/auth/login">Sign In</a>
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="response">Your Response</Label>
        <Textarea
          id="response"
          placeholder="Write your response here..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
          required
        />
      </div>
      {error && <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{error}</div>}
      <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={isLoading || !message.trim()}>
        <Send className="w-4 h-4 mr-2" />
        {isLoading ? "Sending..." : "Send Response"}
      </Button>
    </form>
  )
}
