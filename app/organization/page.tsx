import { createClient } from "@/lib/supabase/server"
import { Navigation } from "@/components/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Users, Crown, Heart, Wrench, HandHeart, Mail, Phone, Calendar, MapPin, ChevronRight } from "lucide-react"

export default async function OrganizationPage() {
  const supabase = await createClient()

  // Get organizational roles with assigned users
  const { data: roles } = await supabase
    .from("organization_roles")
    .select(`
      *,
      role_assignments (
        user_id,
        is_primary,
        profiles:user_id (
          display_name,
          avatar_url,
          village,
          phone
        )
      )
    `)
    .eq("is_active", true)
    .order("level", { ascending: true })
    .order("display_order", { ascending: true })

  // Get committees with members
  const { data: committees } = await supabase
    .from("committees")
    .select(`
      *,
      committee_members (
        role_in_committee,
        profiles:user_id (
          display_name,
          avatar_url,
          village
        )
      )
    `)
    .eq("is_active", true)
    .order("name")

  const getDepartmentIcon = (department: string) => {
    switch (department) {
      case "leadership":
        return <Crown className="w-5 h-5 text-purple-600" />
      case "ministry":
        return <Heart className="w-5 h-5 text-pink-600" />
      case "operations":
        return <Wrench className="w-5 h-5 text-blue-600" />
      case "volunteers":
        return <HandHeart className="w-5 h-5 text-green-600" />
      default:
        return <Users className="w-5 h-5 text-gray-600" />
    }
  }

  const getDepartmentColor = (department: string) => {
    switch (department) {
      case "leadership":
        return "bg-purple-100 text-purple-800 border-purple-200"
      case "ministry":
        return "bg-pink-100 text-pink-800 border-pink-200"
      case "operations":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "volunteers":
        return "bg-green-100 text-green-800 border-green-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getLevelTitle = (level: number) => {
    switch (level) {
      case 1:
        return "Leadership Team"
      case 2:
        return "Department Heads"
      case 3:
        return "Team Leaders"
      default:
        return "Team Members"
    }
  }

  // Group roles by level
  const rolesByLevel = roles?.reduce(
    (acc, role) => {
      const level = role.level || 1
      if (!acc[level]) acc[level] = []
      acc[level].push(role)
      return acc
    },
    {} as Record<number, typeof roles>,
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-blue-800 flex items-center">
            <Users className="w-8 h-8 mr-3" />
            Community Organization
          </h1>
          <p className="text-blue-600 mt-2">Meet our leadership team, volunteers, and committee members</p>
        </div>

        <Tabs defaultValue="structure" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="structure">Organizational Structure</TabsTrigger>
            <TabsTrigger value="committees">Committees</TabsTrigger>
          </TabsList>

          <TabsContent value="structure" className="space-y-8">
            {rolesByLevel &&
              Object.keys(rolesByLevel)
                .sort((a, b) => Number(a) - Number(b))
                .map((level) => (
                  <div key={level} className="space-y-4">
                    <h2 className="text-2xl font-semibold text-gray-800 flex items-center">
                      {getLevelTitle(Number(level))}
                      <Badge variant="outline" className="ml-3">
                        Level {level}
                      </Badge>
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {rolesByLevel[Number(level)].map((role) => (
                        <Card key={role.id} className="hover:shadow-lg transition-shadow">
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <CardTitle className="text-lg flex items-center space-x-2">
                                  {getDepartmentIcon(role.department)}
                                  <span className="text-balance">{role.title}</span>
                                </CardTitle>
                                <Badge className={`mt-2 ${getDepartmentColor(role.department)}`}>
                                  {role.department}
                                </Badge>
                              </div>
                            </div>
                            {role.description && (
                              <CardDescription className="text-sm text-pretty">{role.description}</CardDescription>
                            )}
                          </CardHeader>

                          <CardContent className="space-y-4">
                            {/* Assigned Person */}
                            {role.role_assignments && role.role_assignments.length > 0 ? (
                              <div className="space-y-3">
                                {role.role_assignments
                                  .filter((assignment) => assignment.is_primary)
                                  .map((assignment) => (
                                    <div key={assignment.user_id} className="flex items-center space-x-3">
                                      <Avatar className="w-10 h-10">
                                        <AvatarImage src={assignment.profiles?.avatar_url || "/placeholder.svg"} />
                                        <AvatarFallback className="bg-blue-100 text-blue-700">
                                          {assignment.profiles?.display_name?.charAt(0) || "?"}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div className="flex-1 min-w-0">
                                        <p className="font-medium text-gray-900 truncate">
                                          {assignment.profiles?.display_name || "Name not available"}
                                        </p>
                                        {assignment.profiles?.village && (
                                          <p className="text-sm text-gray-500">{assignment.profiles.village}</p>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                              </div>
                            ) : (
                              <div className="text-center py-4 text-gray-500">
                                <Users className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                                <p className="text-sm">Position available</p>
                              </div>
                            )}

                            {/* Contact Information */}
                            {(role.contact_email || role.contact_phone) && (
                              <div className="pt-3 border-t space-y-2">
                                {role.contact_email && (
                                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                                    <Mail className="w-4 h-4" />
                                    <a
                                      href={`mailto:${role.contact_email}`}
                                      className="hover:text-blue-600 transition-colors"
                                    >
                                      {role.contact_email}
                                    </a>
                                  </div>
                                )}
                                {role.contact_phone && (
                                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                                    <Phone className="w-4 h-4" />
                                    <a
                                      href={`tel:${role.contact_phone}`}
                                      className="hover:text-blue-600 transition-colors"
                                    >
                                      {role.contact_phone}
                                    </a>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Responsibilities */}
                            {role.responsibilities && role.responsibilities.length > 0 && (
                              <div className="pt-3 border-t">
                                <h4 className="text-sm font-medium text-gray-900 mb-2">Key Responsibilities</h4>
                                <ul className="text-sm text-gray-600 space-y-1">
                                  {role.responsibilities.slice(0, 3).map((responsibility, index) => (
                                    <li key={index} className="flex items-start space-x-2">
                                      <ChevronRight className="w-3 h-3 mt-0.5 text-gray-400 flex-shrink-0" />
                                      <span>{responsibility}</span>
                                    </li>
                                  ))}
                                  {role.responsibilities.length > 3 && (
                                    <li className="text-xs text-gray-500 italic">
                                      +{role.responsibilities.length - 3} more responsibilities
                                    </li>
                                  )}
                                </ul>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                ))}
          </TabsContent>

          <TabsContent value="committees" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {committees?.map((committee) => (
                <Card key={committee.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-xl text-blue-800">{committee.name}</CardTitle>
                    {committee.description && (
                      <CardDescription className="text-pretty">{committee.description}</CardDescription>
                    )}
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Purpose */}
                    {committee.purpose && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-1">Purpose</h4>
                        <p className="text-sm text-gray-600 text-pretty">{committee.purpose}</p>
                      </div>
                    )}

                    {/* Meeting Info */}
                    <div className="grid grid-cols-1 gap-3">
                      {committee.meeting_schedule && (
                        <div className="flex items-start space-x-2 text-sm text-gray-600">
                          <Calendar className="w-4 h-4 mt-0.5 text-blue-600" />
                          <div>
                            <p className="font-medium text-gray-900">Meeting Schedule</p>
                            <p>{committee.meeting_schedule}</p>
                          </div>
                        </div>
                      )}
                      {committee.meeting_location && (
                        <div className="flex items-start space-x-2 text-sm text-gray-600">
                          <MapPin className="w-4 h-4 mt-0.5 text-blue-600" />
                          <div>
                            <p className="font-medium text-gray-900">Location</p>
                            <p>{committee.meeting_location}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Members */}
                    {committee.committee_members && committee.committee_members.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-3">Committee Members</h4>
                        <div className="space-y-2">
                          {committee.committee_members.map((member, index) => (
                            <div key={index} className="flex items-center space-x-3">
                              <Avatar className="w-8 h-8">
                                <AvatarImage src={member.profiles?.avatar_url || "/placeholder.svg"} />
                                <AvatarFallback className="bg-blue-100 text-blue-700 text-xs">
                                  {member.profiles?.display_name?.charAt(0) || "?"}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2">
                                  <p className="text-sm font-medium text-gray-900 truncate">
                                    {member.profiles?.display_name || "Name not available"}
                                  </p>
                                  {member.role_in_committee !== "member" && (
                                    <Badge variant="outline" className="text-xs">
                                      {member.role_in_committee}
                                    </Badge>
                                  )}
                                </div>
                                {member.profiles?.village && (
                                  <p className="text-xs text-gray-500">{member.profiles.village}</p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Join Committee CTA */}
                    <div className="pt-4 border-t">
                      <Button variant="outline" className="w-full bg-transparent">
                        <HandHeart className="w-4 h-4 mr-2" />
                        Interested in Joining?
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {(!committees || committees.length === 0) && (
              <div className="text-center py-12">
                <Users className="w-16 h-16 mx-auto mb-4 text-blue-300" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No committees found</h3>
                <p className="text-gray-500">Committee information will be displayed here once available</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
