import { createClient } from "@/lib/supabase/server"
import { Navigation } from "@/components/navigation"
import { OfflineIndicator } from "@/components/offline-indicator"
import { FaithContentGrid } from "@/components/faith/faith-content-card"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Church, 
  Heart, 
  BookOpen, 
  MessageCircle, 
  Star,
  Plus,
  Filter,
  Search
} from "lucide-react"
import Link from "next/link"

export default async function FaithPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Get user's faith preference if logged in
  let userFaithPreference = null
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("faith_preference")
      .eq("id", user.id)
      .single()
    userFaithPreference = profile?.faith_preference
  }

  // Mock faith content data - in production this would come from the database
  const faithContent = [
    {
      id: '1',
      title: 'Daily Reflection: Finding Peace in Community',
      content: 'In our busy lives, we often forget the simple joy of connecting with our neighbors. Today, let us reflect on how we can be instruments of peace and love in our community. Whether through a kind word, a helping hand, or simply being present for one another, we can make a difference.',
      content_type: 'reflection' as const,
      author_id: 'user1',
      scripture_reference: 'Matthew 5:9',
      tags: ['peace', 'community', 'love', 'reflection'],
      is_featured: true,
      view_count: 124,
      like_count: 18,
      status: 'published' as const,
      published_at: '2024-01-16T08:00:00Z',
      created_at: '2024-01-15T10:00:00Z',
      updated_at: '2024-01-15T10:00:00Z'
    },
    {
      id: '2',
      title: 'Prayer for Our Villages',
      content: 'Loving God, we thank you for the gift of our community in Stoneclough, Prestolee, and Ringley. Bless our neighbors, strengthen our bonds, and help us to be your hands and feet in this place. Guide our leaders, protect our vulnerable, and fill our hearts with compassion for all. Amen.',
      content_type: 'prayer' as const,
      author_id: 'user2',
      tags: ['prayer', 'community', 'blessing', 'villages'],
      is_featured: false,
      view_count: 89,
      like_count: 23,
      status: 'published' as const,
      published_at: '2024-01-15T18:00:00Z',
      created_at: '2024-01-15T16:00:00Z',
      updated_at: '2024-01-15T16:00:00Z'
    },
    {
      id: '3',
      title: 'Scripture Study: The Good Samaritan in Modern Times',
      content: 'The parable of the Good Samaritan speaks powerfully to our modern community life. How can we be good neighbors today? Perhaps it\'s helping with shopping for an elderly neighbor, offering a lift to church, or simply checking in on someone who lives alone. Let us explore how this ancient wisdom applies to our daily lives.',
      content_type: 'study' as const,
      author_id: 'user3',
      scripture_reference: 'Luke 10:25-37',
      tags: ['scripture', 'study', 'neighbor', 'service'],
      is_featured: false,
      view_count: 67,
      like_count: 12,
      status: 'published' as const,
      published_at: '2024-01-14T10:00:00Z',
      created_at: '2024-01-14T09:00:00Z',
      updated_at: '2024-01-14T09:00:00Z'
    }
  ]

  const contentTypes = [
    { type: 'devotional', icon: Heart, count: 12, color: 'bg-purple-100 text-purple-800' },
    { type: 'prayer', icon: Church, count: 8, color: 'bg-blue-100 text-blue-800' },
    { type: 'scripture', icon: BookOpen, count: 15, color: 'bg-green-100 text-green-800' },
    { type: 'reflection', icon: MessageCircle, count: 6, color: 'bg-orange-100 text-orange-800' },
    { type: 'study', icon: Star, count: 9, color: 'bg-indigo-100 text-indigo-800' }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <Navigation />
      <OfflineIndicator />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <div>
              <h1 className="text-3xl font-bold text-green-800 mb-2">
                Faith & Inspiration
              </h1>
              <p className="text-green-600 max-w-2xl">
                Spiritual resources, prayers, and reflections to nurture your faith journey 
                and strengthen our community bonds.
              </p>
            </div>
            {user && (
              <Button asChild className="mt-4 sm:mt-0">
                <Link href="/faith/create">
                  <Plus className="h-4 w-4 mr-2" />
                  Share Faith Content
                </Link>
              </Button>
            )}
          </div>
        </div>

        {/* Faith Preference Notice */}
        {userFaithPreference === 'no-preference' && (
          <Card className="mb-6 border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <Church className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h3 className="font-medium text-blue-900">Faith Content Available</h3>
                  <p className="text-sm text-blue-700 mt-1">
                    You've indicated no faith preference, but you're welcome to explore spiritual 
                    content if you're interested. You can always adjust your preferences in your profile.
                  </p>
                  <Button asChild variant="outline" size="sm" className="mt-2">
                    <Link href="/profile">Update Preferences</Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Content Type Categories */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Browse by Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {contentTypes.map((type) => {
                const IconComponent = type.icon
                return (
                  <Link 
                    key={type.type} 
                    href={`/faith?type=${type.type}`}
                    className="block"
                  >
                    <Card className="hover:shadow-md transition-shadow duration-200 cursor-pointer">
                      <CardContent className="p-4 text-center">
                        <div className={`inline-flex p-2 rounded-lg ${type.color} mb-2`}>
                          <IconComponent className="h-5 w-5" />
                        </div>
                        <h3 className="font-medium capitalize text-sm">{type.type}</h3>
                        <Badge variant="secondary" className="mt-1">
                          {type.count}
                        </Badge>
                      </CardContent>
                    </Card>
                  </Link>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search faith content..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
                <Button variant="outline" size="sm">
                  <Star className="h-4 w-4 mr-2" />
                  Featured Only
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Faith Content Grid */}
        <FaithContentGrid contents={faithContent} />

        {/* Community Guidelines */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Faith Content Guidelines</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none">
              <p className="text-gray-600 mb-4">
                Our faith content is designed to be inclusive and welcoming to all. We encourage:
              </p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Respectful sharing of spiritual insights and reflections</li>
                <li>• Prayers that include our whole community</li>
                <li>• Content that builds bridges rather than walls</li>
                <li>• Personal testimonies that inspire and encourage</li>
                <li>• Scripture studies that apply to daily community life</li>
              </ul>
              <p className="text-sm text-gray-600 mt-4">
                All content is moderated to ensure it aligns with our community values of love, 
                respect, and inclusion.
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

export const metadata = {
  title: 'Faith & Inspiration | Stoneclough Community',
  description: 'Spiritual resources, prayers, and reflections for the Stoneclough, Prestolee & Ringley community.',
};
