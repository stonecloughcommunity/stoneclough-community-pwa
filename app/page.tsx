import { createClient } from "@/lib/supabase/server"
import { Navigation } from "@/components/navigation"
import { OfflineIndicator } from "@/components/offline-indicator"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, MapPin, Users, MessageSquare, Clock } from "lucide-react"
import Link from "next/link"

export default async function HomePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // The middleware will redirect unauthenticated users to login
  if (!user) {
    // Return a loading state instead of redirecting to prevent loops
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-green-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Get user profile
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  // Get upcoming events
  const { data: upcomingEvents } = await supabase
    .from("events")
    .select(
      `
      *,
      profiles:organizer_id (display_name),
      event_attendees (count)
    `,
    )
    .gte("start_date", new Date().toISOString())
    .order("start_date", { ascending: true })
    .limit(3)

  // Get recent community posts
  const { data: recentPosts } = await supabase
    .from("community_posts")
    .select(
      `
      *,
      profiles:author_id (display_name, village)
    `,
    )
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(3)

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <Navigation />
      <OfflineIndicator />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-green-800 mb-2">
            Welcome back, {profile?.display_name || "Community Member"}!
          </h1>
          <p className="text-green-600">Stay connected with your neighbors in {profile?.village || "the villages"}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Upcoming Events */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <Calendar className="w-5 h-5 text-green-600" />
                    <span>Upcoming Events</span>
                  </CardTitle>
                  <CardDescription>Don't miss what's happening in your community</CardDescription>
                </div>
                <Button asChild variant="outline" size="sm">
                  <Link href="/events">View All</Link>
                </Button>
              </CardHeader>
              <CardContent>
                {upcomingEvents && upcomingEvents.length > 0 ? (
                  <div className="space-y-4">
                    {upcomingEvents.map((event) => (
                      <div key={event.id} className="flex items-start space-x-4 p-4 bg-green-50 rounded-lg">
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 bg-green-100 rounded-lg flex flex-col items-center justify-center">
                            <span className="text-xs font-medium text-green-800">
                              {new Date(event.start_date).toLocaleDateString("en-GB", { day: "numeric" })}
                            </span>
                            <span className="text-xs text-green-600">
                              {new Date(event.start_date).toLocaleDateString("en-GB", { month: "short" })}
                            </span>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 truncate">{event.title}</h3>
                          <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
                            <span className="flex items-center">
                              <Clock className="w-4 h-4 mr-1" />
                              {new Date(event.start_date).toLocaleTimeString("en-GB", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                            {event.location && (
                              <span className="flex items-center">
                                <MapPin className="w-4 h-4 mr-1" />
                                {event.location}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">{event.description}</p>
                        </div>
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          {event.category}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No upcoming events yet.</p>
                    <Button asChild className="mt-4" size="sm">
                      <Link href="/events/create">Create an Event</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Community Posts */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <MessageSquare className="w-5 h-5 text-green-600" />
                    <span>Community Board</span>
                  </CardTitle>
                  <CardDescription>Recent needs, offers, and announcements</CardDescription>
                </div>
                <Button asChild variant="outline" size="sm">
                  <Link href="/community">View All</Link>
                </Button>
              </CardHeader>
              <CardContent>
                {recentPosts && recentPosts.length > 0 ? (
                  <div className="space-y-4">
                    {recentPosts.map((post) => (
                      <div key={post.id} className="border-l-4 border-green-200 pl-4 py-2">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
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
                              {post.category && (
                                <Badge variant="outline" className="text-xs">
                                  {post.category}
                                </Badge>
                              )}
                            </div>
                            <h3 className="font-medium text-gray-900">{post.title}</h3>
                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">{post.content}</p>
                            <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                              <span>by {post.profiles?.display_name}</span>
                              <span>from {post.profiles?.village}</span>
                              <span>{new Date(post.created_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No recent posts yet.</p>
                    <Button asChild className="mt-4" size="sm">
                      <Link href="/community/create">Create a Post</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Get involved in your community</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button asChild className="w-full justify-start bg-transparent" variant="outline">
                  <Link href="/events/create">
                    <Calendar className="w-4 h-4 mr-2" />
                    Create Event
                  </Link>
                </Button>
                <Button asChild className="w-full justify-start bg-transparent" variant="outline">
                  <Link href="/community/create">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Post to Community
                  </Link>
                </Button>
                <Button asChild className="w-full justify-start bg-transparent" variant="outline">
                  <Link href="/volunteers">
                    <Users className="w-4 h-4 mr-2" />
                    Find Volunteers
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Community Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Community Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Your Village</span>
                  <Badge variant="outline">{profile?.village || "Not set"}</Badge>
                </div>
                {profile?.is_volunteer && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Volunteer Status</span>
                    <Badge className="bg-green-100 text-green-800">Active Volunteer</Badge>
                  </div>
                )}
                <div className="pt-4 border-t">
                  <p className="text-xs text-gray-500 text-center">
                    Connecting Stoneclough, Prestolee & Ringley since 2024
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
