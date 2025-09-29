import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Navigation } from "@/components/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Users, ArrowLeft, Search, UserCheck, Crown } from "lucide-react"
import Link from "next/link"
import { UserManagementActions } from "@/components/user-management-actions"

export default async function UserManagementPage() {
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

  // Get all users with their activity stats
  const { data: allUsers } = await supabase
    .from("profiles")
    .select(`
      *,
      community_posts (count),
      events (count),
      volunteer_applications (count)
    `)
    .order("created_at", { ascending: false })

  const { data: volunteers } = await supabase
    .from("profiles")
    .select(`
      *,
      volunteer_opportunities (count)
    `)
    .eq("is_volunteer", true)
    .order("created_at", { ascending: false })

  const { data: admins } = await supabase
    .from("profiles")
    .select("*")
    .eq("is_admin", true)
    .order("created_at", { ascending: false })

  const UserCard = ({ user: userData, showActions = true }: { user: any; showActions?: boolean }) => (
    <Card key={userData.id} className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-green-800 font-medium text-lg">
                {userData.display_name?.charAt(0)?.toUpperCase() || "U"}
              </span>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">{userData.display_name || "Anonymous User"}</h3>
              <div className="flex items-center space-x-2 mt-1">
                <span className="text-sm text-gray-500">{userData.village || "Village not set"}</span>
                {userData.is_admin && <Badge className="bg-red-100 text-red-800">Admin</Badge>}
                {userData.is_volunteer && <Badge className="bg-green-100 text-green-800">Volunteer</Badge>}
              </div>
              <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                <span>Posts: {userData.community_posts?.[0]?.count || 0}</span>
                <span>Events: {userData.events?.[0]?.count || 0}</span>
                <span>Joined: {new Date(userData.created_at).toLocaleDateString()}</span>
              </div>
              {userData.bio && <p className="text-sm text-gray-600 mt-2 line-clamp-2">{userData.bio}</p>}
            </div>
          </div>
          {showActions && <UserManagementActions userId={userData.id} currentUser={userData} />}
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
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
              <h1 className="text-3xl font-bold text-green-800 flex items-center">
                <Users className="w-8 h-8 mr-3" />
                User Management
              </h1>
              <p className="text-green-600 mt-2">Manage community members, volunteers, and administrators</p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input placeholder="Search users..." className="pl-10 w-64" />
              </div>
            </div>
          </div>
        </div>

        {/* User Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Users</p>
                  <p className="text-2xl font-bold text-gray-900">{allUsers?.length || 0}</p>
                </div>
                <Users className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Volunteers</p>
                  <p className="text-2xl font-bold text-gray-900">{volunteers?.length || 0}</p>
                </div>
                <UserCheck className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Administrators</p>
                  <p className="text-2xl font-bold text-gray-900">{admins?.length || 0}</p>
                </div>
                <Crown className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active This Month</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {allUsers?.filter((u) => u.community_posts?.[0]?.count > 0 || u.events?.[0]?.count > 0).length || 0}
                  </p>
                </div>
                <UserCheck className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="all" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">All Users</TabsTrigger>
            <TabsTrigger value="volunteers">Volunteers</TabsTrigger>
            <TabsTrigger value="admins">Administrators</TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <Card>
              <CardHeader>
                <CardTitle>All Community Members</CardTitle>
                <CardDescription>Manage all registered users in your community</CardDescription>
              </CardHeader>
              <CardContent>
                {allUsers && allUsers.length > 0 ? (
                  <div className="space-y-4">
                    {allUsers.map((userData) => (
                      <UserCard key={userData.id} user={userData} />
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-8">No users found</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="volunteers">
            <Card>
              <CardHeader>
                <CardTitle>Community Volunteers</CardTitle>
                <CardDescription>Manage users who have volunteered to help the community</CardDescription>
              </CardHeader>
              <CardContent>
                {volunteers && volunteers.length > 0 ? (
                  <div className="space-y-4">
                    {volunteers.map((volunteer) => (
                      <UserCard key={volunteer.id} user={volunteer} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <UserCheck className="w-16 h-16 mx-auto mb-4 text-green-300" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No volunteers yet</h3>
                    <p className="text-gray-500">Encourage community members to become volunteers</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="admins">
            <Card>
              <CardHeader>
                <CardTitle>Platform Administrators</CardTitle>
                <CardDescription>Manage users with administrative privileges</CardDescription>
              </CardHeader>
              <CardContent>
                {admins && admins.length > 0 ? (
                  <div className="space-y-4">
                    {admins.map((admin) => (
                      <UserCard key={admin.id} user={admin} showActions={admin.id !== user.id} />
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-8">No administrators found</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
