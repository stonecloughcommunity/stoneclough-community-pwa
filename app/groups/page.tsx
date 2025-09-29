import { createClient } from "@/lib/supabase/server"
import { Navigation } from "@/components/navigation"
import { OfflineIndicator } from "@/components/offline-indicator"
import { CommunityGroupsGrid } from "@/components/groups/community-groups-grid"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Users, 
  Globe, 
  Lock, 
  Plus,
  TrendingUp,
  Calendar,
  MapPin,
  Search,
  Filter
} from "lucide-react"
import Link from "next/link"

export default async function GroupsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Get user's group memberships if logged in
  let userMemberships: string[] = []
  if (user) {
    const { data: memberships } = await supabase
      .from("group_memberships")
      .select("group_id")
      .eq("user_id", user.id)
    
    userMemberships = memberships?.map(m => m.group_id) || []
  }

  // Mock groups data - in production this would come from the database
  const groups = [
    {
      id: '1',
      title: 'Village Gardeners',
      content: 'A group for sharing gardening tips, organizing community garden projects, and promoting sustainable growing practices in our villages.',
      department_id: '4',
      creator_id: 'user1',
      group_type: 'public' as const,
      current_members: 24,
      max_members: 50,
      is_faith_based: false,
      meeting_schedule: 'First Saturday of each month, 10am',
      location: 'Community Garden, Stoneclough',
      tags: ['gardening', 'sustainability', 'community', 'environment'],
      status: 'active' as const,
      created_at: '2024-01-10T10:00:00Z',
      updated_at: '2024-01-15T14:30:00Z',
      is_faith_content: false,
      author: {
        id: 'user1',
        display_name: 'Sarah Green'
      }
    },
    {
      id: '2',
      title: 'Faith & Fellowship',
      content: 'An inclusive interfaith group welcoming all denominations and faith backgrounds. We meet for prayer, discussion, and community service projects.',
      department_id: '1',
      creator_id: 'user2',
      group_type: 'public' as const,
      current_members: 18,
      is_faith_based: true,
      meeting_schedule: 'Every Wednesday, 7pm',
      location: 'St. Saviour\'s Church Hall',
      tags: ['faith', 'prayer', 'interfaith', 'community service'],
      status: 'active' as const,
      created_at: '2024-01-08T16:00:00Z',
      updated_at: '2024-01-14T11:20:00Z',
      is_faith_content: true,
      author: {
        id: 'user2',
        display_name: 'Rev. Michael Thompson'
      }
    },
    {
      id: '3',
      title: 'Local Business Network',
      content: 'Connecting local entrepreneurs, freelancers, and small business owners. Share opportunities, collaborate, and support each other\'s ventures.',
      department_id: '3',
      creator_id: 'user3',
      group_type: 'private' as const,
      current_members: 15,
      max_members: 30,
      is_faith_based: false,
      meeting_schedule: 'Monthly networking breakfast',
      location: 'Various local venues',
      tags: ['business', 'networking', 'entrepreneurship', 'collaboration'],
      status: 'active' as const,
      created_at: '2024-01-05T09:30:00Z',
      updated_at: '2024-01-12T15:45:00Z',
      is_faith_content: false,
      author: {
        id: 'user3',
        display_name: 'Emma Wilson'
      }
    }
  ]

  const groupStats = {
    totalGroups: 12,
    activeMembers: 156,
    weeklyMeetings: 8,
    newThisMonth: 3
  }

  const groupTypes = [
    { type: 'public', icon: Globe, count: 8, description: 'Open to all community members' },
    { type: 'private', icon: Users, count: 3, description: 'Membership by invitation or approval' },
    { type: 'invite-only', icon: Lock, count: 1, description: 'Exclusive invitation-only groups' }
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
                Community Groups
              </h1>
              <p className="text-green-600 max-w-2xl">
                Join groups based on your interests, connect with like-minded neighbors, 
                and participate in activities that strengthen our community.
              </p>
            </div>
            {user && (
              <Button asChild className="mt-4 sm:mt-0">
                <Link href="/groups/create">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Group
                </Link>
              </Button>
            )}
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4 text-center">
              <Users className="h-8 w-8 text-blue-500 mx-auto mb-2" />
              <p className="text-2xl font-bold">{groupStats.totalGroups}</p>
              <p className="text-sm text-gray-600">Active Groups</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <TrendingUp className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <p className="text-2xl font-bold">{groupStats.activeMembers}</p>
              <p className="text-sm text-gray-600">Active Members</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <Calendar className="h-8 w-8 text-purple-500 mx-auto mb-2" />
              <p className="text-2xl font-bold">{groupStats.weeklyMeetings}</p>
              <p className="text-sm text-gray-600">Weekly Meetings</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <Plus className="h-8 w-8 text-orange-500 mx-auto mb-2" />
              <p className="text-2xl font-bold">{groupStats.newThisMonth}</p>
              <p className="text-sm text-gray-600">New This Month</p>
            </CardContent>
          </Card>
        </div>

        {/* Group Types */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Group Types</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {groupTypes.map((type) => {
                const IconComponent = type.icon
                return (
                  <Link 
                    key={type.type} 
                    href={`/groups?type=${type.type}`}
                    className="block"
                  >
                    <Card className="hover:shadow-md transition-shadow duration-200 cursor-pointer">
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-3 mb-2">
                          <IconComponent className="h-6 w-6 text-blue-600" />
                          <div>
                            <h3 className="font-semibold capitalize">{type.type.replace('-', ' ')}</h3>
                            <Badge variant="secondary">{type.count} groups</Badge>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600">{type.description}</p>
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
                  placeholder="Search groups..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter by Department
                </Button>
                <Button variant="outline" size="sm">
                  <MapPin className="h-4 w-4 mr-2" />
                  Near Me
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Groups Grid */}
        <CommunityGroupsGrid 
          groups={groups}
          userMemberships={userMemberships}
        />

        {/* Getting Started */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Getting Started with Groups</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <Users className="h-12 w-12 text-blue-500 mx-auto mb-3" />
                <h3 className="font-semibold mb-2">Find Your Interests</h3>
                <p className="text-sm text-gray-600">
                  Browse groups by department or search for specific interests and hobbies.
                </p>
              </div>
              
              <div className="text-center">
                <Calendar className="h-12 w-12 text-green-500 mx-auto mb-3" />
                <h3 className="font-semibold mb-2">Join & Participate</h3>
                <p className="text-sm text-gray-600">
                  Join groups that interest you and participate in meetings and activities.
                </p>
              </div>
              
              <div className="text-center">
                <Plus className="h-12 w-12 text-purple-500 mx-auto mb-3" />
                <h3 className="font-semibold mb-2">Start Your Own</h3>
                <p className="text-sm text-gray-600">
                  Don't see what you're looking for? Create your own group and invite others.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

export const metadata = {
  title: 'Community Groups | Stoneclough Community',
  description: 'Join community groups in Stoneclough, Prestolee & Ringley based on your interests and connect with neighbors.',
};
