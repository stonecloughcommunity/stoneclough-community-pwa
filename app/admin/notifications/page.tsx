import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Navigation } from "@/components/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Bell, Plus, ArrowLeft, Send, Clock, CheckCircle, AlertTriangle } from "lucide-react"
import Link from "next/link"

export default async function NotificationsManagementPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Check if user is admin
  const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single()

  if (!profile?.is_admin) {
    redirect("/admin")
  }

  // Get notification statistics
  const [
    { count: totalNotifications },
    { count: sentNotifications },
    { count: scheduledNotifications },
    { count: totalSubscriptions },
  ] = await Promise.all([
    supabase.from("notifications").select("*", { count: "exact", head: true }),
    supabase.from("notifications").select("*", { count: "exact", head: true }).eq("status", "sent"),
    supabase.from("notifications").select("*", { count: "exact", head: true }).eq("status", "scheduled"),
    supabase.from("push_subscriptions").select("*", { count: "exact", head: true }),
  ])

  // Get recent notifications
  const { data: recentNotifications } = await supabase
    .from("notifications")
    .select(`
      *,
      profiles:created_by (display_name)
    `)
    .order("created_at", { ascending: false })
    .limit(10)

  // Get scheduled notifications
  const { data: scheduledNotifs } = await supabase
    .from("notifications")
    .select(`
      *,
      profiles:created_by (display_name)
    `)
    .eq("status", "scheduled")
    .order("scheduled_for", { ascending: true })

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "sent":
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case "scheduled":
        return <Clock className="w-4 h-4 text-blue-600" />
      case "failed":
        return <AlertTriangle className="w-4 h-4 text-red-600" />
      default:
        return <Clock className="w-4 h-4 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "sent":
        return "bg-green-100 text-green-800"
      case "scheduled":
        return "bg-blue-100 text-blue-800"
      case "failed":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "emergency":
        return "bg-red-100 text-red-800"
      case "event":
        return "bg-purple-100 text-purple-800"
      case "prayer":
        return "bg-pink-100 text-pink-800"
      case "community":
        return "bg-green-100 text-green-800"
      case "volunteer":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Button asChild variant="ghost" className="mb-4">
            <Link href="/admin">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-blue-800 flex items-center">
                <Bell className="w-8 h-8 mr-3" />
                Notification Management
              </h1>
              <p className="text-blue-600 mt-2">Send and manage push notifications to your community</p>
            </div>
            <Button asChild className="bg-blue-600 hover:bg-blue-700">
              <Link href="/admin/notifications/create">
                <Plus className="w-4 h-4 mr-2" />
                Create Notification
              </Link>
            </Button>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Sent</p>
                  <p className="text-2xl font-bold text-gray-900">{sentNotifications || 0}</p>
                </div>
                <Send className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Scheduled</p>
                  <p className="text-2xl font-bold text-gray-900">{scheduledNotifications || 0}</p>
                </div>
                <Clock className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Subscribers</p>
                  <p className="text-2xl font-bold text-gray-900">{totalSubscriptions || 0}</p>
                </div>
                <Bell className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Notifications</p>
                  <p className="text-2xl font-bold text-gray-900">{totalNotifications || 0}</p>
                </div>
                <Bell className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="recent" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="recent">Recent Notifications</TabsTrigger>
            <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
          </TabsList>

          <TabsContent value="recent">
            <Card>
              <CardHeader>
                <CardTitle>Recent Notifications</CardTitle>
                <CardDescription>All notifications sent to the community</CardDescription>
              </CardHeader>
              <CardContent>
                {recentNotifications && recentNotifications.length > 0 ? (
                  <div className="space-y-4">
                    {recentNotifications.map((notification) => (
                      <div key={notification.id} className="flex items-start justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <Badge className={getTypeColor(notification.type)}>{notification.type}</Badge>
                            <Badge className={getStatusColor(notification.status)}>
                              {getStatusIcon(notification.status)}
                              <span className="ml-1">{notification.status}</span>
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {notification.target_audience}
                            </Badge>
                          </div>
                          <h3 className="font-medium text-gray-900">{notification.title}</h3>
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">{notification.body}</p>
                          <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                            <span>by {notification.profiles?.display_name}</span>
                            <span>
                              {notification.sent_at
                                ? `Sent ${new Date(notification.sent_at).toLocaleString()}`
                                : `Created ${new Date(notification.created_at).toLocaleString()}`}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Bell className="w-16 h-16 mx-auto mb-4 text-blue-300" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications yet</h3>
                    <p className="text-gray-500 mb-6">Create your first notification to engage with the community</p>
                    <Button asChild className="bg-blue-600 hover:bg-blue-700">
                      <Link href="/admin/notifications/create">
                        <Plus className="w-4 h-4 mr-2" />
                        Create First Notification
                      </Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="scheduled">
            <Card>
              <CardHeader>
                <CardTitle>Scheduled Notifications</CardTitle>
                <CardDescription>Notifications scheduled to be sent in the future</CardDescription>
              </CardHeader>
              <CardContent>
                {scheduledNotifs && scheduledNotifs.length > 0 ? (
                  <div className="space-y-4">
                    {scheduledNotifs.map((notification) => (
                      <div
                        key={notification.id}
                        className="flex items-start justify-between p-4 border rounded-lg bg-blue-50"
                      >
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <Badge className={getTypeColor(notification.type)}>{notification.type}</Badge>
                            <Badge className="bg-blue-100 text-blue-800">
                              <Clock className="w-3 h-3 mr-1" />
                              Scheduled
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {notification.target_audience}
                            </Badge>
                          </div>
                          <h3 className="font-medium text-gray-900">{notification.title}</h3>
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">{notification.body}</p>
                          <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                            <span>by {notification.profiles?.display_name}</span>
                            <span>Scheduled for {new Date(notification.scheduled_for).toLocaleString()}</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 ml-4">
                          <Button size="sm" variant="outline" className="bg-transparent">
                            Edit
                          </Button>
                          <Button size="sm" variant="outline" className="bg-transparent text-red-600">
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Clock className="w-16 h-16 mx-auto mb-4 text-blue-300" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No scheduled notifications</h3>
                    <p className="text-gray-500">Schedule notifications to be sent at specific times</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
