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
import { CalendarIcon, ArrowLeft, Send, Clock } from "lucide-react"
import { format } from "date-fns"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import type { User } from "@supabase/supabase-js"

export default function CreateNotificationPage() {
  const [user, setUser] = useState<User | null>(null)
  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")
  const [type, setType] = useState("general")
  const [targetAudience, setTargetAudience] = useState("all")
  const [villageFilter, setVillageFilter] = useState("")
  const [isScheduled, setIsScheduled] = useState(false)
  const [scheduledFor, setScheduledFor] = useState<Date>()
  const [scheduledTime, setScheduledTime] = useState("12:00")
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
  }, [supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setIsLoading(true)
    setError(null)

    try {
      let scheduledDateTime = null
      if (isScheduled && scheduledFor) {
        const [hours, minutes] = scheduledTime.split(":")
        scheduledDateTime = new Date(scheduledFor)
        scheduledDateTime.setHours(Number.parseInt(hours), Number.parseInt(minutes))
      }

      const notificationData = {
        title,
        body,
        type,
        target_audience: targetAudience,
        village_filter: targetAudience === "village" ? villageFilter : null,
        scheduled_for: scheduledDateTime?.toISOString() || null,
        created_by: user.id,
        status: isScheduled ? "scheduled" : "draft",
      }

      const { error } = await supabase.from("notifications").insert(notificationData)

      if (error) throw error

      // If not scheduled, send immediately
      if (!isScheduled) {
        // Here you would typically call your push notification service
        // For now, we'll just update the status to sent
        // In a real implementation, you'd have a server endpoint that handles the actual push
      }

      router.push("/admin/notifications")
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const notificationTypes = [
    { value: "general", label: "General", description: "General community updates" },
    { value: "emergency", label: "Emergency", description: "Urgent alerts and emergencies" },
    { value: "event", label: "Event", description: "Event reminders and updates" },
    { value: "prayer", label: "Prayer", description: "Prayer request updates" },
    { value: "community", label: "Community", description: "Community board updates" },
    { value: "volunteer", label: "Volunteer", description: "Volunteer opportunities" },
  ]

  const targetAudiences = [
    { value: "all", label: "Everyone", description: "All community members" },
    { value: "village", label: "Village Specific", description: "Members from a specific village" },
    { value: "volunteers", label: "Volunteers", description: "Only community volunteers" },
    { value: "admins", label: "Administrators", description: "Only platform administrators" },
  ]

  const villages = ["Stoneclough", "Prestolee", "Ringley"]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <Navigation />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Button asChild variant="ghost" className="mb-4">
            <Link href="/admin/notifications">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Notifications
            </Link>
          </Button>
          <h1 className="text-3xl font-bold text-blue-800">Create Notification</h1>
          <p className="text-blue-600 mt-2">Send a push notification to your community members</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>New Push Notification</CardTitle>
            <CardDescription>Compose and schedule your community notification</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="type">Notification Type *</Label>
                <Select value={type} onValueChange={setType} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select notification type" />
                  </SelectTrigger>
                  <SelectContent>
                    {notificationTypes.map((notifType) => (
                      <SelectItem key={notifType.value} value={notifType.value}>
                        <div>
                          <div className="font-medium">{notifType.label}</div>
                          <div className="text-sm text-gray-500">{notifType.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  placeholder="Notification title (keep it short and clear)"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={50}
                  required
                />
                <p className="text-xs text-gray-500">{title.length}/50 characters</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="body">Message *</Label>
                <Textarea
                  id="body"
                  placeholder="Your notification message..."
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={4}
                  maxLength={200}
                  required
                />
                <p className="text-xs text-gray-500">{body.length}/200 characters</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="audience">Target Audience *</Label>
                <Select value={targetAudience} onValueChange={setTargetAudience} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Who should receive this notification?" />
                  </SelectTrigger>
                  <SelectContent>
                    {targetAudiences.map((audience) => (
                      <SelectItem key={audience.value} value={audience.value}>
                        <div>
                          <div className="font-medium">{audience.label}</div>
                          <div className="text-sm text-gray-500">{audience.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {targetAudience === "village" && (
                <div className="space-y-2">
                  <Label htmlFor="village">Village</Label>
                  <Select value={villageFilter} onValueChange={setVillageFilter} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select village" />
                    </SelectTrigger>
                    <SelectContent>
                      {villages.map((village) => (
                        <SelectItem key={village} value={village}>
                          {village}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex items-center space-x-3 p-4 bg-blue-50 rounded-lg">
                <Switch id="scheduled" checked={isScheduled} onCheckedChange={setIsScheduled} />
                <div className="flex-1">
                  <Label htmlFor="scheduled" className="flex items-center space-x-2 cursor-pointer">
                    <Clock className="w-4 h-4" />
                    <span>Schedule for later</span>
                  </Label>
                  <p className="text-sm text-blue-600 mt-1">
                    {isScheduled ? "This notification will be sent at the scheduled time" : "Send immediately"}
                  </p>
                </div>
              </div>

              {isScheduled && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left font-normal bg-transparent">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {scheduledFor ? format(scheduledFor, "PPP") : "Select date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={scheduledFor}
                          onSelect={setScheduledFor}
                          disabled={(date) => date < new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="time">Time</Label>
                    <Input
                      id="time"
                      type="time"
                      value={scheduledTime}
                      onChange={(e) => setScheduledTime(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {error && (
                <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-200">{error}</div>
              )}

              <div className="flex space-x-4">
                <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700" disabled={isLoading}>
                  {isLoading ? (
                    "Creating..."
                  ) : isScheduled ? (
                    <>
                      <Clock className="w-4 h-4 mr-2" />
                      Schedule Notification
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Send Now
                    </>
                  )}
                </Button>
                <Button asChild type="button" variant="outline" className="flex-1 bg-transparent">
                  <Link href="/admin/notifications">Cancel</Link>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
