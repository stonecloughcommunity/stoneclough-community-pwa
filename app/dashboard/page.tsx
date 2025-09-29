import { createClient } from "@/lib/supabase/server"
import { Navigation } from "@/components/navigation"
import { OfflineIndicator } from "@/components/offline-indicator"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Calendar, 
  MapPin, 
  Users, 
  MessageSquare, 
  Clock, 
  TrendingUp,
  Package,
  BookOpen,
  Heart,
  Briefcase,
  Leaf,
  Church,
  Monitor,
  UserCheck,
  Plus,
  ArrowRight
} from "lucide-react"
import Link from "next/link"
import { DepartmentNavigation } from "@/components/departments/department-navigation"

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // The middleware will redirect unauthenticated users to login
  if (!user) {
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

  // Mock data for enhanced dashboard - in production this would come from the database
  const communityStats = {
    totalMembers: 1247,
    activeToday: 89,
    postsThisWeek: 156,
    eventsThisMonth: 23,
    marketplaceItems: 127,
    learningResources: 89
  };

  const departments = [
    {
      name: 'Faith & Culture',
      slug: 'faith-culture',
      icon: Church,
      color: '#8B5CF6',
      memberCount: 156,
      recentActivity: 12,
      description: 'Spiritual life and cultural heritage'
    },
    {
      name: 'Community & Wellbeing',
      slug: 'community-wellbeing',
      icon: Heart,
      color: '#EF4444',
      memberCount: 203,
      recentActivity: 18,
      description: 'Health and social connections'
    },
    {
      name: 'Economy & Enterprise',
      slug: 'economy-enterprise',
      icon: Briefcase,
      color: '#F59E0B',
      memberCount: 178,
      recentActivity: 15,
      description: 'Local business and jobs'
    },
    {
      name: 'Land, Food & Sustainability',
      slug: 'land-food-sustainability',
      icon: Leaf,
      color: '#10B981',
      memberCount: 134,
      recentActivity: 9,
      description: 'Environmental stewardship'
    },
    {
      name: 'Technology & Platform',
      slug: 'technology-platform',
      icon: Monitor,
      color: '#3B82F6',
      memberCount: 89,
      recentActivity: 6,
      description: 'Digital literacy and support'
    },
    {
      name: 'Governance & Growth',
      slug: 'governance-growth',
      icon: Users,
      color: '#6366F1',
      memberCount: 112,
      recentActivity: 8,
      description: 'Leadership and partnerships'
    }
  ];

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
          <p className="text-green-600">
            Stay connected with your neighbors in {profile?.village || "the villages"}. 
            Explore our six departments and discover what's happening in your community.
          </p>
        </div>

        {/* Department Navigation */}
        <DepartmentNavigation showSearch={false} showFilters={false} />

        {/* Community Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <Card>
            <CardContent className="p-4 text-center">
              <Users className="h-8 w-8 text-blue-500 mx-auto mb-2" />
              <p className="text-2xl font-bold">{communityStats.totalMembers}</p>
              <p className="text-sm text-gray-600">Total Members</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <TrendingUp className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <p className="text-2xl font-bold">{communityStats.activeToday}</p>
              <p className="text-sm text-gray-600">Active Today</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <MessageSquare className="h-8 w-8 text-purple-500 mx-auto mb-2" />
              <p className="text-2xl font-bold">{communityStats.postsThisWeek}</p>
              <p className="text-sm text-gray-600">Posts This Week</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <Calendar className="h-8 w-8 text-orange-500 mx-auto mb-2" />
              <p className="text-2xl font-bold">{communityStats.eventsThisMonth}</p>
              <p className="text-sm text-gray-600">Events This Month</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <Package className="h-8 w-8 text-red-500 mx-auto mb-2" />
              <p className="text-2xl font-bold">{communityStats.marketplaceItems}</p>
              <p className="text-sm text-gray-600">Marketplace Items</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <BookOpen className="h-8 w-8 text-indigo-500 mx-auto mb-2" />
              <p className="text-2xl font-bold">{communityStats.learningResources}</p>
              <p className="text-sm text-gray-600">Learning Resources</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Department Overview */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="w-5 h-5 text-green-600" />
                    <span>Community Departments</span>
                  </CardTitle>
                  <CardDescription>Explore different areas of community life</CardDescription>
                </div>
                <Button asChild variant="outline" size="sm">
                  <Link href="/departments">View All</Link>
                </Button>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {departments.slice(0, 4).map((department) => {
                    const IconComponent = department.icon;
                    
                    return (
                      <Link key={department.slug} href={`/departments/${department.slug}`}>
                        <Card className="hover:shadow-md transition-shadow duration-200 cursor-pointer">
                          <CardContent className="p-4">
                            <div className="flex items-center space-x-3 mb-2">
                              <div 
                                className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
                                style={{ backgroundColor: department.color }}
                              >
                                <IconComponent className="h-5 w-5" />
                              </div>
                              <div className="flex-1">
                                <h3 className="font-semibold text-sm">{department.name}</h3>
                                <p className="text-xs text-gray-600">{department.description}</p>
                              </div>
                            </div>
                            <div className="flex items-center justify-between text-xs text-gray-500">
                              <span>{department.memberCount} members</span>
                              <Badge variant="secondary" className="text-xs">
                                {department.recentActivity} recent
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    );
                  })}
                </div>
                <div className="mt-4 text-center">
                  <Button asChild variant="outline">
                    <Link href="/departments">
                      View All Departments
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Quick Access Features */}
            <Card>
              <CardHeader>
                <CardTitle>Platform Features</CardTitle>
                <CardDescription>Discover what you can do in our community</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Link href="/marketplace">
                    <Card className="hover:shadow-md transition-shadow duration-200 cursor-pointer">
                      <CardContent className="p-4 text-center">
                        <Package className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                        <h3 className="font-semibold">Marketplace</h3>
                        <p className="text-sm text-gray-600">Buy, sell, and trade with neighbors</p>
                        <Badge variant="secondary" className="mt-2">
                          {communityStats.marketplaceItems} items
                        </Badge>
                      </CardContent>
                    </Card>
                  </Link>

                  <Link href="/learning">
                    <Card className="hover:shadow-md transition-shadow duration-200 cursor-pointer">
                      <CardContent className="p-4 text-center">
                        <BookOpen className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                        <h3 className="font-semibold">Learning Hub</h3>
                        <p className="text-sm text-gray-600">Educational resources and courses</p>
                        <Badge variant="secondary" className="mt-2">
                          {communityStats.learningResources} resources
                        </Badge>
                      </CardContent>
                    </Card>
                  </Link>

                  <Link href="/groups">
                    <Card className="hover:shadow-md transition-shadow duration-200 cursor-pointer">
                      <CardContent className="p-4 text-center">
                        <Users className="h-8 w-8 text-green-500 mx-auto mb-2" />
                        <h3 className="font-semibold">Community Groups</h3>
                        <p className="text-sm text-gray-600">Join interest-based groups</p>
                        <Badge variant="secondary" className="mt-2">
                          24 active groups
                        </Badge>
                      </CardContent>
                    </Card>
                  </Link>

                  <Link href="/mentorship">
                    <Card className="hover:shadow-md transition-shadow duration-200 cursor-pointer">
                      <CardContent className="p-4 text-center">
                        <UserCheck className="h-8 w-8 text-orange-500 mx-auto mb-2" />
                        <h3 className="font-semibold">Mentorship</h3>
                        <p className="text-sm text-gray-600">Learn from and teach others</p>
                        <Badge variant="secondary" className="mt-2">
                          12 mentors available
                        </Badge>
                      </CardContent>
                    </Card>
                  </Link>
                </div>
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
                <Button asChild className="w-full justify-start">
                  <Link href="/community/create">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Post
                  </Link>
                </Button>
                <Button asChild className="w-full justify-start" variant="outline">
                  <Link href="/events/create">
                    <Calendar className="w-4 h-4 mr-2" />
                    Create Event
                  </Link>
                </Button>
                <Button asChild className="w-full justify-start" variant="outline">
                  <Link href="/marketplace/create">
                    <Package className="w-4 h-4 mr-2" />
                    List Item
                  </Link>
                </Button>
                <Button asChild className="w-full justify-start" variant="outline">
                  <Link href="/volunteers">
                    <Users className="w-4 h-4 mr-2" />
                    Find Volunteers
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Profile Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Your Profile</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Village</span>
                  <Badge variant="outline">{profile?.village || "Not set"}</Badge>
                </div>
                {profile?.is_volunteer && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Volunteer Status</span>
                    <Badge className="bg-green-100 text-green-800">Active</Badge>
                  </div>
                )}
                <div className="pt-4 border-t">
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/settings">
                      Update Profile
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Community Info */}
            <Card>
              <CardHeader>
                <CardTitle>Community Info</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-4">
                    Connecting Stoneclough, Prestolee & Ringley since 2024
                  </p>
                  <div className="space-y-2">
                    <Button asChild variant="outline" size="sm" className="w-full">
                      <Link href="/about">About Us</Link>
                    </Button>
                    <Button asChild variant="outline" size="sm" className="w-full">
                      <Link href="/help">Get Help</Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}

export const metadata = {
  title: 'Dashboard | Stoneclough Community',
  description: 'Your personalized community dashboard with access to all departments and features.',
};
