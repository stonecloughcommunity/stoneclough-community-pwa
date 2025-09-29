"use client"

import type React from "react"
import { createClient } from "@/lib/supabase/client"
import { Navigation } from "@/components/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, ArrowLeft, Shield, Eye, EyeOff } from "lucide-react"
import { format } from "date-fns"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import type { User } from "@supabase/supabase-js"

export default function CreatePrayerPage() {
  const [user, setUser] = useState<User | null>(null)
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [category, setCategory] = useState("general")
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [expiresAt, setExpiresAt] = useState<Date>()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
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

    // Set default expiry to 90 days from now
    const defaultExpiry = new Date()
    defaultExpiry.setDate(defaultExpiry.getDate() + 90)
    setExpiresAt(defaultExpiry)
  }, [supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.from("prayer_requests").insert({
        title,
        content,
        category,
        is_anonymous: isAnonymous,
        expires_at: expiresAt?.toISOString() || null,
        author_id: user.id,
        status: "pending", // All prayers start as pending for moderation
      })

      if (error) throw error

      router.push("/prayer?created=true")
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const categories = [
    { value: "general", label: "General Prayer" },
    { value: "healing", label: "Healing & Health" },
    { value: "guidance", label: "Guidance & Wisdom" },
    { value: "thanksgiving", label: "Thanksgiving & Praise" },
    { value: "family", label: "Family & Relationships" },
    { value: "community", label: "Community & World" },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <Navigation />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Button asChild variant="ghost" className="mb-4">
            <Link href="/prayer">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Prayer Wall
            </Link>
          </Button>
          <h1 className="text-3xl font-bold text-blue-800">Share a Prayer Request</h1>
          <p className="text-blue-600 mt-2">Ask your community to join you in prayer</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>New Prayer Request</CardTitle>
            <CardDescription>
              Your request will be reviewed by community moderators before being published
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={category} onValueChange={setCategory} required>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Prayer Title *</Label>
                <Input
                  id="title"
                  placeholder="Brief title for your prayer request"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Prayer Request *</Label>
                <Textarea
                  id="content"
                  placeholder="Share what you'd like the community to pray for..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={5}
                  required
                />
              </div>

              <div className="flex items-center space-x-3 p-4 bg-blue-50 rounded-lg">
                <Switch id="anonymous" checked={isAnonymous} onCheckedChange={setIsAnonymous} />
                <div className="flex-1">
                  <Label htmlFor="anonymous" className="flex items-center space-x-2 cursor-pointer">
                    {isAnonymous ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    <span>Post anonymously</span>
                  </Label>
                  <p className="text-sm text-blue-600 mt-1">
                    {isAnonymous
                      ? "Your name will not be shown to other community members"
                      : "Your name will be visible to the community"}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Auto-expire after</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal bg-transparent">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {expiresAt ? format(expiresAt, "PPP") : "Select expiry date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={expiresAt}
                      onSelect={setExpiresAt}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <p className="text-sm text-gray-500">
                  Prayer requests automatically expire after 90 days for privacy. You can change this date.
                </p>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <Shield className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-yellow-800">Moderation Notice</h4>
                    <p className="text-sm text-yellow-700 mt-1">
                      All prayer requests are reviewed by community moderators to ensure they're appropriate and
                      respectful. This usually takes a few hours during the day.
                    </p>
                  </div>
                </div>
              </div>

              {error && (
                <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-200">{error}</div>
              )}

              <div className="flex space-x-4">
                <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700" disabled={isLoading}>
                  {isLoading ? "Submitting..." : "Submit Prayer Request"}
                </Button>
                <Button asChild type="button" variant="outline" className="flex-1 bg-transparent">
                  <Link href="/prayer">Cancel</Link>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
