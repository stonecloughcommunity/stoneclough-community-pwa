import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Navigation } from "@/components/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Users,
  MessageSquare,
  Calendar,
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  Heart,
  Bell,
  Settings,
  BarChart3,
  UserCheck,
  Flag,
} from "lucide-react"
import Link from "next/link"

export default async function AdminDashboardPage() {
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
    redirect("/")
  }

  const [
    { count: totalUsers },
    { count: totalPosts },
    { count: totalEvents },
    { count: totalDirectoryEntries },
    { count: pendingPosts },
    { count: unverifiedBusinesses },
    { count: totalPrayers },
    { count: pendingPrayers },
    { count: totalVolunteers },
    { count: activeEvents },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("community_posts").select("*", { count: "exact", head: true }),
    supabase.from("events").select("*", { count: "exact", head: true }),
    supabase.from("directory_entries").select("*", { count: "exact", head: true }),
    supabase.from("community_posts").select("*", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("directory_entries").select("*", { count: "exact", head: true }).eq("is_verified", false),
    supabase.from("prayer_requests").select("*", { count: "exact", head: true }),
    supabase.from("prayer_requests").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("is_volunteer", true),
    supabase.from("events").select("*", { count: "exact", head: true }).gte("start_date", new Date().toISOString()),
  ])

  // Get recent activity
  const { data: recentPosts } = await supabase
    .from("community_posts")
    .select(`
      *,
      profiles:author_id (display_name, village)
    `)
    .order("created_at", { ascending: false })
    .limit(5)

  const { data: recentEvents } = await supabase
    .from("events")
    .select(`
      *,
      profiles:organizer_id (display_name, village)
    `)
    .order("created_at", { ascending: false })
    .limit(5)

  const { data: unverifiedEntries } = await supabase
    .from("directory_entries")
    .select(`
      *,
      profiles:owner_id (display_name, village)
    `)
    .eq("is_verified", false)
    .order("created_at", { ascending: false })

  const { data: allUsers } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(10)

  const { data: recentPrayerRequests } = await supabase
    .from("prayer_requests")
    .select(`
      *,
      profiles:author_id (display_name, village)
    `)
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(5)

  const { data: weeklyStats } = await supabase
    .from("community_posts")
    .select("created_at")
    .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())

  const { data: monthlyUsers } = await supabase
    .from("profiles")
    .select("created_at")
    .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())

  const stats = [
    {
      title: "Total Users",
      value: totalUsers || 0,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
      change: `+${monthlyUsers?.length || 0} this month`,
    },
    {
      title: "Community Posts",
      value: totalPosts || 0,
      icon: MessageSquare,
      color: "text-green-600",
      bgColor: "bg-green-100",
      change: `+${weeklyStats?.length || 0} this week`,
    },
    {
      title: "Active Events",
      value: activeEvents || 0,
      icon: Calendar,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
      change: `${totalEvents || 0} total`,
    },
    {
      title: "Prayer Requests",
      value: totalPrayers || 0,
      icon: Heart,
      color: "text-pink-600",
      bgColor: "bg-pink-100",
      change: `${pendingPrayers || 0} pending`,
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <Shield className="w-6 h-6 text-green-600" />
                <h1 className="text-3xl font-bold text-green-800">Admin Dashboard</h1>
              </div>
              <p className="text-green-600">Manage and moderate your community platform</p>
            </div>
            <div className="flex space-x-3">
              <Button asChild variant="outline" size="sm" className="bg-transparent">
                <Link href="/admin/analytics">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Analytics
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="bg-transparent">
                <Link href="/admin/settings">
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Enhanced Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat) => (
            <Card key={stat.title}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    <p className="text-xs text-gray-500 mt-1">{stat.change}</p>
                  </div>
                  <div className={`p-3 rounded-full ${stat.bgColor}`}>
                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
                <span>Moderation Queue</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {pendingPrayers > 0 && (
                <div className="flex items-center justify-between p-3 bg-pink-50 rounded-lg">
                  <div>
                    <p className="font-medium text-pink-800">Prayer Requests</p>
                    <p className="text-sm text-pink-600">Awaiting moderation</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className="bg-pink-100 text-pink-800">{pendingPrayers}</Badge>
                    <Button asChild size="sm" variant="outline" className="bg-transparent">
                      <Link href="/prayer/moderate">Review</Link>
                    </Button>
                  </div>
                </div>
              )}
              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                <div>
                  <p className="font-medium text-yellow-800">Unverified Businesses</p>
                  <p className="text-sm text-yellow-600">Require verification</p>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className="bg-yellow-100 text-yellow-800">{unverifiedBusinesses || 0}</Badge>
                  <Button asChild size="sm" variant="outline" className="bg-transparent">
                    <Link href="/admin/businesses">Verify</Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <span>Community Health</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">User Engagement</span>
                <Badge className="bg-green-100 text-green-800">
                  {weeklyStats && weeklyStats.length > 10
                    ? "High"
                    : weeklyStats && weeklyStats.length > 5
                      ? "Medium"
                      : "Low"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Active Volunteers</span>
                <Badge className="bg-blue-100 text-blue-800">{totalVolunteers || 0}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Community Growth</span>
                <Badge className="bg-purple-100 text-purple-800">
                  {monthlyUsers && monthlyUsers.length > 5 ? "Growing" : "Stable"}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Bell className="w-5 h-5 text-blue-600" />
                <span>Quick Actions</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button asChild className="w-full justify-start bg-transparent" variant="outline">
                <Link href="/admin/users">
                  <UserCheck className="w-4 h-4 mr-2" />
                  Manage Users
                </Link>
              </Button>
              <Button asChild className="w-full justify-start bg-transparent" variant="outline">
                <Link href="/admin/reports">
                  <Flag className="w-4 h-4 mr-2" />
                  View Reports
                </Link>
              </Button>
              <Button asChild className="w-full justify-start bg-transparent" variant="outline">
                <Link href="/admin/alerts">
                  <Bell className="w-4 h-4 mr-2" />
                  Send Alert
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Management Tabs */}
        <Tabs defaultValue="posts" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="posts">Recent Posts</TabsTrigger>
            <TabsTrigger value="prayers">Prayer Requests</TabsTrigger>
            <TabsTrigger value="events">Recent Events</TabsTrigger>
            <TabsTrigger value="businesses">Businesses</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
          </TabsList>

          <TabsContent value="posts">
            <Card>
              <CardHeader>
                <CardTitle>Recent Community Posts</CardTitle>
                <CardDescription>Latest posts from community members</CardDescription>
              </CardHeader>
              <CardContent>
                {recentPosts && recentPosts.length > 0 ? (
                  <div className="space-y-4">
                    {recentPosts.map((post) => (
                      <div key={post.id} className="flex items-start justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <Badge
                              variant={post.post_type === "need" ? "destructive" : "default"}
                              className={
                                post.post_type === "offer"
                                  ? "bg-green-100 text-green-800"
                                  : post.post_type === "announcement"
                                    ? "bg-blue-100 text-blue-800"
                                    : ""
                              }
                            >
                              {post.post_type}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {post.status}
                            </Badge>
                          </div>
                          <h3 className="font-medium text-gray-900">{post.title}</h3>
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">{post.content}</p>
                          <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                            <span>by {post.profiles?.display_name}</span>
                            <span>from {post.profiles?.village}</span>
                            <span>{new Date(post.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 ml-4">
                          <Badge className="bg-green-100 text-green-800">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Active
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-8">No recent posts</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="prayers">
            <Card>
              <CardHeader>
                <CardTitle>Prayer Requests Awaiting Moderation</CardTitle>
                <CardDescription>Review and moderate community prayer requests</CardDescription>
              </CardHeader>
              <CardContent>
                {recentPrayerRequests && recentPrayerRequests.length > 0 ? (
                  <div className="space-y-4">
                    {recentPrayerRequests.map((prayer) => (
                      <div
                        key={prayer.id}
                        className="flex items-start justify-between p-4 border rounded-lg bg-pink-50"
                      >
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <Badge className="bg-pink-100 text-pink-800 capitalize">{prayer.category}</Badge>
                            <Badge variant="outline" className="text-orange-600 border-orange-200">
                              <Clock className="w-3 h-3 mr-1" />
                              Pending
                            </Badge>
                            {prayer.is_anonymous && (
                              <Badge variant="secondary" className="text-xs">
                                Anonymous
                              </Badge>
                            )}
                          </div>
                          <h3 className="font-medium text-gray-900">{prayer.title}</h3>
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">{prayer.content}</p>
                          <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                            {!prayer.is_anonymous && (
                              <>
                                <span>by {prayer.profiles?.display_name}</span>
                                <span>from {prayer.profiles?.village}</span>
                              </>
                            )}
                            <span>{new Date(prayer.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 ml-4">
                          <Button asChild size="sm" className="bg-pink-600 hover:bg-pink-700">
                            <Link href={`/prayer/moderate`}>Review</Link>
                          </Button>
                        </div>
                      </div>
                    ))}
                    {recentPrayerRequests.length === 5 && (
                      <div className="text-center pt-4">
                        <Button asChild variant="outline" className="bg-transparent">
                          <Link href="/prayer/moderate">View All Pending Prayers</Link>
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Heart className="w-16 h-16 mx-auto mb-4 text-pink-300" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No prayers awaiting moderation</h3>
                    <p className="text-gray-500">All prayer requests have been reviewed</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="events">
            <Card>
              <CardHeader>
                <CardTitle>Recent Events</CardTitle>
                <CardDescription>Latest events created by community members</CardDescription>
              </CardHeader>
              <CardContent>
                {recentEvents && recentEvents.length > 0 ? (
                  <div className="space-y-4">
                    {recentEvents.map((event) => (
                      <div key={event.id} className="flex items-start justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{event.title}</h3>
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">{event.description}</p>
                          <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                            <span>by {event.profiles?.display_name}</span>
                            <span>from {event.profiles?.village}</span>
                            <span className="flex items-center">
                              <Calendar className="w-3 h-3 mr-1" />
                              {new Date(event.start_date).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <Badge className="bg-blue-100 text-blue-800">{event.category}</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-8">No recent events</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="businesses">
            <Card>
              <CardHeader>
                <CardTitle>Business Directory</CardTitle>
                <CardDescription>Manage business listings and verifications</CardDescription>
              </CardHeader>
              <CardContent>
                {unverifiedEntries && unverifiedEntries.length > 0 ? (
                  <div className="space-y-4">
                    <div className="mb-4">
                      <h4 className="font-medium text-gray-900 mb-2">Pending Verification</h4>
                    </div>
                    {unverifiedEntries.map((entry) => (
                      <div
                        key={entry.id}
                        className="flex items-start justify-between p-4 border rounded-lg bg-yellow-50"
                      >
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{entry.name}</h3>
                          <p className="text-sm text-gray-600 mt-1">{entry.description}</p>
                          <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                            <span>by {entry.profiles?.display_name}</span>
                            <span>from {entry.profiles?.village}</span>
                            <Badge variant="outline" className="capitalize">
                              {entry.category}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 ml-4">
                          <Badge className="bg-yellow-100 text-yellow-800">
                            <Clock className="w-3 h-3 mr-1" />
                            Pending
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-8">All businesses are verified</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>Community Members</CardTitle>
                <CardDescription>Recent user registrations and community members</CardDescription>
              </CardHeader>
              <CardContent>
                {allUsers && allUsers.length > 0 ? (
                  <div className="space-y-4">
                    {allUsers.map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                            <span className="text-green-800 font-medium">
                              {user.display_name?.charAt(0)?.toUpperCase() || "U"}
                            </span>
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900">{user.display_name || "Anonymous"}</h3>
                            <div className="flex items-center space-x-2 text-sm text-gray-500">
                              <span>{user.village || "Village not set"}</span>
                              {user.is_volunteer && <Badge className="bg-green-100 text-green-800">Volunteer</Badge>}
                              {user.is_admin && <Badge className="bg-red-100 text-red-800">Admin</Badge>}
                            </div>
                          </div>
                        </div>
                        <div className="text-xs text-gray-500">
                          Joined {new Date(user.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-8">No users found</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
