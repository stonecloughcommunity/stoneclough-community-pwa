import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Navigation } from "@/components/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Users, Clock, MapPin, Plus, Calendar } from "lucide-react"
import Link from "next/link"

export default async function VolunteersPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get all volunteer opportunities
  const { data: opportunities } = await supabase
    .from("volunteer_opportunities")
    .select(
      `
      *,
      profiles:organizer_id (display_name, village),
      volunteer_applications (count)
    `,
    )
    .eq("status", "active")
    .order("created_at", { ascending: false })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "filled":
        return "bg-yellow-100 text-yellow-800"
      case "completed":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-green-800">Volunteer Opportunities</h1>
            <p className="text-green-600 mt-2">Make a difference in your community</p>
          </div>
          <Button asChild className="bg-green-600 hover:bg-green-700">
            <Link href="/volunteers/create">
              <Plus className="w-4 h-4 mr-2" />
              Post Opportunity
            </Link>
          </Button>
        </div>

        {opportunities && opportunities.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {opportunities.map((opportunity) => (
              <Card key={opportunity.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg line-clamp-2">{opportunity.title}</CardTitle>
                      <CardDescription className="mt-1">
                        by {opportunity.profiles?.display_name} from {opportunity.profiles?.village}
                      </CardDescription>
                    </div>
                    <Badge className={getStatusColor(opportunity.status)} variant="secondary">
                      {opportunity.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <p className="text-sm text-gray-700 line-clamp-3">{opportunity.description}</p>

                    {opportunity.location && (
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <MapPin className="w-4 h-4 text-green-600" />
                        <span>{opportunity.location}</span>
                      </div>
                    )}

                    {opportunity.time_commitment && (
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Clock className="w-4 h-4 text-green-600" />
                        <span>{opportunity.time_commitment}</span>
                      </div>
                    )}

                    {opportunity.start_date && (
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Calendar className="w-4 h-4 text-green-600" />
                        <span>
                          Starts {new Date(opportunity.start_date).toLocaleDateString("en-GB")}
                          {opportunity.end_date && ` - ${new Date(opportunity.end_date).toLocaleDateString("en-GB")}`}
                        </span>
                      </div>
                    )}

                    {opportunity.max_volunteers && (
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Users className="w-4 h-4 text-green-600" />
                        <span>
                          {opportunity.volunteer_applications?.[0]?.count || 0} / {opportunity.max_volunteers}{" "}
                          volunteers
                        </span>
                      </div>
                    )}

                    {opportunity.skills_needed && opportunity.skills_needed.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-700">Skills needed:</p>
                        <div className="flex flex-wrap gap-1">
                          {opportunity.skills_needed.map((skill, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-4 border-t">
                    <Button asChild className="w-full" size="sm">
                      <Link href={`/volunteers/${opportunity.id}`}>View Details & Apply</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No volunteer opportunities</h3>
              <p className="text-gray-500 mb-6">Be the first to post a volunteer opportunity for your community!</p>
              <Button asChild className="bg-green-600 hover:bg-green-700">
                <Link href="/volunteers/create">
                  <Plus className="w-4 h-4 mr-2" />
                  Post First Opportunity
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
