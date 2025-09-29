import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Navigation } from "@/components/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Shield, Clock, EyeOff } from "lucide-react"
import { ModerationActions } from "@/components/moderation-actions"

export default async function ModeratePrayersPage() {
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
    redirect("/prayer")
  }

  // Get pending prayer requests
  const { data: pendingPrayers } = await supabase
    .from("prayer_requests")
    .select(`
      *,
      profiles:author_id (display_name, village, phone)
    `)
    .eq("status", "pending")
    .order("created_at", { ascending: true })

  const getCategoryColor = (category: string) => {
    const colors = {
      general: "bg-blue-100 text-blue-800",
      healing: "bg-green-100 text-green-800",
      guidance: "bg-purple-100 text-purple-800",
      thanksgiving: "bg-yellow-100 text-yellow-800",
      family: "bg-pink-100 text-pink-800",
      community: "bg-indigo-100 text-indigo-800",
    }
    return colors[category as keyof typeof colors] || colors.general
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-orange-800 flex items-center">
            <Shield className="w-8 h-8 mr-3" />
            Prayer Moderation
          </h1>
          <p className="text-orange-600 mt-2">
            Review and approve prayer requests before they're published to the community
          </p>
        </div>

        {pendingPrayers && pendingPrayers.length > 0 ? (
          <div className="space-y-6">
            {pendingPrayers.map((prayer) => (
              <Card key={prayer.id} className="border-orange-200">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2">
                      <Badge className={getCategoryColor(prayer.category)}>
                        {prayer.category.charAt(0).toUpperCase() + prayer.category.slice(1)}
                      </Badge>
                      <Badge variant="outline" className="text-orange-600 border-orange-200">
                        <Clock className="w-3 h-3 mr-1" />
                        Pending Review
                      </Badge>
                      {prayer.is_anonymous && (
                        <Badge variant="secondary">
                          <EyeOff className="w-3 h-3 mr-1" />
                          Anonymous
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-gray-500">
                      Submitted {new Date(prayer.created_at).toLocaleString("en-GB")}
                    </div>
                  </div>
                  <CardTitle className="text-xl">{prayer.title}</CardTitle>
                  <CardDescription>
                    {prayer.is_anonymous ? (
                      "Anonymous request"
                    ) : (
                      <div className="space-y-1">
                        <div>
                          by {prayer.profiles?.display_name} from {prayer.profiles?.village}
                        </div>
                        {prayer.profiles?.phone && <div className="text-xs">Contact: {prayer.profiles.phone}</div>}
                      </div>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-6">
                    <h4 className="font-medium text-gray-900 mb-2">Prayer Request:</h4>
                    <p className="text-gray-700 whitespace-pre-wrap">{prayer.content}</p>
                  </div>

                  {prayer.expires_at && (
                    <div className="mb-4 text-sm text-gray-600">
                      <strong>Expires:</strong> {new Date(prayer.expires_at).toLocaleDateString("en-GB")}
                    </div>
                  )}

                  <ModerationActions prayerId={prayer.id} />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <Shield className="w-16 h-16 mx-auto mb-4 text-orange-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No prayers to moderate</h3>
              <p className="text-gray-500">All prayer requests have been reviewed. Great work!</p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
