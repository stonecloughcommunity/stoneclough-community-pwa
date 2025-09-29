import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Navigation } from "@/components/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Heart, Plus, Shield } from "lucide-react"
import Link from "next/link"
import { PrayerCard } from "@/components/prayer-card"

export default async function PrayerWallPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get user profile to check admin status
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  // Get approved prayer requests
  const { data: prayers } = await supabase
    .from("prayer_requests")
    .select(`
      *,
      profiles:author_id (display_name, village),
      prayer_responses (count)
    `)
    .eq("status", "approved")
    .order("created_at", { ascending: false })

  // Get pending prayers if user is admin
  const { data: pendingPrayers } = profile?.is_admin
    ? await supabase
        .from("prayer_requests")
        .select(`
          *,
          profiles:author_id (display_name, village)
        `)
        .eq("status", "pending")
        .order("created_at", { ascending: false })
    : { data: null }

  const filterPrayers = (category?: string) => {
    if (!category) return prayers || []
    return prayers?.filter((prayer) => prayer.category === category) || []
  }

  const categories = [
    { value: "general", label: "General", color: "bg-blue-100 text-blue-800" },
    { value: "healing", label: "Healing", color: "bg-green-100 text-green-800" },
    { value: "guidance", label: "Guidance", color: "bg-purple-100 text-purple-800" },
    { value: "thanksgiving", label: "Thanksgiving", color: "bg-yellow-100 text-yellow-800" },
    { value: "family", label: "Family", color: "bg-pink-100 text-pink-800" },
    { value: "community", label: "Community", color: "bg-indigo-100 text-indigo-800" },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-blue-800">Prayer Wall</h1>
            <p className="text-blue-600 mt-2">Share prayer requests and support one another in faith</p>
          </div>
          <div className="flex space-x-3">
            <Button asChild className="bg-blue-600 hover:bg-blue-700">
              <Link href="/prayer/create">
                <Plus className="w-4 h-4 mr-2" />
                Add Prayer Request
              </Link>
            </Button>
            {profile?.is_admin && pendingPrayers && pendingPrayers.length > 0 && (
              <Button asChild variant="outline" className="border-orange-200 text-orange-700 bg-transparent">
                <Link href="/prayer/moderate">
                  <Shield className="w-4 h-4 mr-2" />
                  Moderate ({pendingPrayers.length})
                </Link>
              </Button>
            )}
          </div>
        </div>

        {/* Privacy Notice */}
        <Card className="mb-6 border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-start space-x-3">
              <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-blue-800">Privacy & Moderation</h3>
                <p className="text-sm text-blue-700 mt-1">
                  All prayer requests are reviewed by community moderators before being published. You can choose to
                  post anonymously, and requests automatically expire after 90 days unless renewed.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="all" className="space-y-6">
          <TabsList className="grid w-full grid-cols-7 lg:w-auto">
            <TabsTrigger value="all">All Prayers</TabsTrigger>
            {categories.map((category) => (
              <TabsTrigger key={category.value} value={category.value}>
                {category.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="all">
            {prayers && prayers.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {prayers.map((prayer) => (
                  <PrayerCard key={prayer.id} prayer={prayer} />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <Heart className="w-16 h-16 mx-auto mb-4 text-blue-300" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No prayer requests yet</h3>
                  <p className="text-gray-500 mb-6">Be the first to share a prayer request with your community</p>
                  <Button asChild className="bg-blue-600 hover:bg-blue-700">
                    <Link href="/prayer/create">
                      <Plus className="w-4 h-4 mr-2" />
                      Add First Prayer Request
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {categories.map((category) => (
            <TabsContent key={category.value} value={category.value}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filterPrayers(category.value).map((prayer) => (
                  <PrayerCard key={prayer.id} prayer={prayer} />
                ))}
              </div>
              {filterPrayers(category.value).length === 0 && (
                <Card>
                  <CardContent className="text-center py-12">
                    <Heart className="w-16 h-16 mx-auto mb-4 text-blue-300" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No {category.label.toLowerCase()} prayers
                    </h3>
                    <p className="text-gray-500">No prayer requests in this category yet.</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </main>
    </div>
  )
}
