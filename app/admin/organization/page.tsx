import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Navigation } from "@/components/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Users, Plus, ArrowLeft, Crown, Heart, Wrench, HandHeart, Edit, Trash2 } from "lucide-react"
import Link from "next/link"

export default async function OrganizationManagementPage() {
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

  // Get organizational roles with assignments
  const { data: roles } = await supabase
    .from("organization_roles")
    .select(`
      *,
      role_assignments (
        user_id,
        is_primary,
        profiles:user_id (display_name, village)
      )
    `)
    .order("level", { ascending: true })
    .order("display_order", { ascending: true })

  // Get committees with members
  const { data: committees } = await supabase
    .from("committees")
    .select(`
      *,
      committee_members (
        role_in_committee,
        profiles:user_id (display_name)
      )
    `)
    .order("name")

  // Get statistics
  const [{ count: totalRoles }, { count: filledRoles }, { count: totalCommittees }, { count: totalVolunteers }] =
    await Promise.all([
      supabase.from("organization_roles").select("*", { count: "exact", head: true }).eq("is_active", true),
      supabase.from("role_assignments").select("*", { count: "exact", head: true }),
      supabase.from("committees").select("*", { count: "exact", head: true }).eq("is_active", true),
      supabase.from("profiles").select("*", { count: "exact", head: true }).eq("is_volunteer", true),
    ])

  const getDepartmentIcon = (department: string) => {
    switch (department) {
      case "leadership":
        return <Crown className="w-4 h-4 text-purple-600" />
      case "ministry":
        return <Heart className="w-4 h-4 text-pink-600" />
      case "operations":
        return <Wrench className="w-4 h-4 text-blue-600" />
      case "volunteers":
        return <HandHeart className="w-4 h-4 text-green-600" />
      default:
        return <Users className="w-4 h-4 text-gray-600" />
    }
  }

  const getDepartmentColor = (department: string) => {
    switch (department) {
      case "leadership":
        return "bg-purple-100 text-purple-800"
      case "ministry":
        return "bg-pink-100 text-pink-800"
      case "operations":
        return "bg-blue-100 text-blue-800"
      case "volunteers":
        return "bg-green-100 text-green-800"
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
                <Users className="w-8 h-8 mr-3" />
                Organization Management
              </h1>
              <p className="text-blue-600 mt-2">Manage roles, assignments, and committee structure</p>
            </div>
            <div className="flex space-x-3">
              <Button asChild variant="outline" className="bg-transparent">
                <Link href="/admin/organization/roles/create">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Role
                </Link>
              </Button>
              <Button asChild className="bg-blue-600 hover:bg-blue-700">
                <Link href="/admin/organization/committees/create">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Committee
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Roles</p>
                  <p className="text-2xl font-bold text-gray-900">{totalRoles || 0}</p>
                </div>
                <Users className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Filled Positions</p>
                  <p className="text-2xl font-bold text-gray-900">{filledRoles || 0}</p>
                </div>
                <Crown className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Committees</p>
                  <p className="text-2xl font-bold text-gray-900">{totalCommittees || 0}</p>
                </div>
                <Heart className="w-8 h-8 text-pink-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Volunteers</p>
                  <p className="text-2xl font-bold text-gray-900">{totalVolunteers || 0}</p>
                </div>
                <HandHeart className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="roles" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="roles">Organizational Roles</TabsTrigger>
            <TabsTrigger value="committees">Committees</TabsTrigger>
          </TabsList>

          <TabsContent value="roles">
            <Card>
              <CardHeader>
                <CardTitle>Organizational Roles</CardTitle>
                <CardDescription>Manage positions and role assignments in your organization</CardDescription>
              </CardHeader>
              <CardContent>
                {roles && roles.length > 0 ? (
                  <div className="space-y-4">
                    {roles.map((role) => (
                      <div key={role.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            {getDepartmentIcon(role.department)}
                            <h3 className="font-medium text-gray-900">{role.title}</h3>
                            <Badge className={getDepartmentColor(role.department)}>{role.department}</Badge>
                            <Badge variant="outline">Level {role.level}</Badge>
                            {!role.is_active && (
                              <Badge variant="outline" className="text-red-600">
                                Inactive
                              </Badge>
                            )}
                          </div>
                          {role.description && (
                            <p className="text-sm text-gray-600 mb-2 text-pretty">{role.description}</p>
                          )}
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span>
                              {role.role_assignments && role.role_assignments.length > 0
                                ? `Assigned to: ${role.role_assignments
                                    .filter((a) => a.is_primary)
                                    .map((a) => a.profiles?.display_name)
                                    .join(", ")}`
                                : "Position available"}
                            </span>
                            {role.contact_email && <span>Contact: {role.contact_email}</span>}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 ml-4">
                          <Button size="sm" variant="outline" className="bg-transparent">
                            <Edit className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                          <Button size="sm" variant="outline" className="bg-transparent text-red-600">
                            <Trash2 className="w-4 h-4 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Users className="w-16 h-16 mx-auto mb-4 text-blue-300" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No roles defined</h3>
                    <p className="text-gray-500 mb-6">Create organizational roles to structure your community</p>
                    <Button asChild className="bg-blue-600 hover:bg-blue-700">
                      <Link href="/admin/organization/roles/create">
                        <Plus className="w-4 h-4 mr-2" />
                        Create First Role
                      </Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="committees">
            <Card>
              <CardHeader>
                <CardTitle>Committees</CardTitle>
                <CardDescription>Manage committees and their memberships</CardDescription>
              </CardHeader>
              <CardContent>
                {committees && committees.length > 0 ? (
                  <div className="space-y-4">
                    {committees.map((committee) => (
                      <div key={committee.id} className="flex items-start justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="font-medium text-gray-900">{committee.name}</h3>
                            {!committee.is_active && (
                              <Badge variant="outline" className="text-red-600">
                                Inactive
                              </Badge>
                            )}
                          </div>
                          {committee.description && (
                            <p className="text-sm text-gray-600 mb-2 text-pretty">{committee.description}</p>
                          )}
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span>
                              {committee.committee_members?.length || 0} member
                              {(committee.committee_members?.length || 0) !== 1 ? "s" : ""}
                            </span>
                            {committee.meeting_schedule && <span>Meets: {committee.meeting_schedule}</span>}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 ml-4">
                          <Button size="sm" variant="outline" className="bg-transparent">
                            <Edit className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                          <Button size="sm" variant="outline" className="bg-transparent text-red-600">
                            <Trash2 className="w-4 h-4 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Heart className="w-16 h-16 mx-auto mb-4 text-pink-300" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No committees created</h3>
                    <p className="text-gray-500 mb-6">Create committees to organize community activities</p>
                    <Button asChild className="bg-blue-600 hover:bg-blue-700">
                      <Link href="/admin/organization/committees/create">
                        <Plus className="w-4 h-4 mr-2" />
                        Create First Committee
                      </Link>
                    </Button>
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
