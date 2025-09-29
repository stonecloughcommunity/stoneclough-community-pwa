import { createClient } from "@/lib/supabase/server"
import { Navigation } from "@/components/navigation"
import { OfflineIndicator } from "@/components/offline-indicator"
import { LearningResourcesGrid } from "@/components/learning/learning-resources-grid"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  BookOpen, 
  Video, 
  FileText, 
  ExternalLink, 
  GraduationCap,
  Plus,
  TrendingUp,
  Clock,
  Star,
  Users,
  Search,
  Filter,
  Grid3X3,
  List
} from "lucide-react"
import Link from "next/link"

export default async function LearningPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Mock learning resources data - in production this would come from the database
  const resources = [
    {
      id: '1',
      title: 'Digital Skills for Seniors',
      content: 'A comprehensive guide to using smartphones, tablets, and computers. Learn at your own pace with step-by-step instructions and helpful tips.',
      department_id: '5',
      resource_type: 'course' as const,
      difficulty_level: 'beginner' as const,
      estimated_duration: 120,
      tags: ['technology', 'seniors', 'digital-skills', 'smartphones'],
      is_featured: true,
      view_count: 245,
      like_count: 32,
      status: 'published' as const,
      created_at: '2024-01-10T10:00:00Z',
      updated_at: '2024-01-15T14:30:00Z',
      is_faith_content: false,
      author: {
        id: 'user1',
        display_name: 'Tech Support Team'
      }
    },
    {
      id: '2',
      title: 'Community Gardening Basics',
      content: 'Learn the fundamentals of sustainable gardening, from soil preparation to harvest. Perfect for beginners wanting to start their own garden.',
      department_id: '4',
      resource_type: 'video' as const,
      difficulty_level: 'beginner' as const,
      estimated_duration: 45,
      tags: ['gardening', 'sustainability', 'environment', 'beginners'],
      is_featured: false,
      view_count: 189,
      like_count: 28,
      status: 'published' as const,
      created_at: '2024-01-08T16:00:00Z',
      updated_at: '2024-01-14T11:20:00Z',
      is_faith_content: false,
      author: {
        id: 'user2',
        display_name: 'Sarah Green'
      }
    },
    {
      id: '3',
      title: 'Starting a Local Business',
      content: 'A practical guide to launching your own business in the local community. Covers legal requirements, funding options, and marketing strategies.',
      department_id: '3',
      resource_type: 'article' as const,
      difficulty_level: 'intermediate' as const,
      estimated_duration: 30,
      tags: ['business', 'entrepreneurship', 'local-economy', 'startup'],
      is_featured: false,
      view_count: 156,
      like_count: 19,
      status: 'published' as const,
      created_at: '2024-01-05T09:30:00Z',
      updated_at: '2024-01-12T15:45:00Z',
      is_faith_content: false,
      author: {
        id: 'user3',
        display_name: 'Emma Wilson'
      }
    }
  ]

  const stats = {
    totalResources: 89,
    activeUsers: 234,
    hoursLearned: 1456,
    completedCourses: 67
  }

  const resourceTypes = [
    { type: 'course', icon: GraduationCap, count: 12, color: 'bg-orange-100 text-orange-800' },
    { type: 'video', icon: Video, count: 28, color: 'bg-red-100 text-red-800' },
    { type: 'article', icon: FileText, count: 34, color: 'bg-blue-100 text-blue-800' },
    { type: 'document', icon: BookOpen, count: 11, color: 'bg-green-100 text-green-800' },
    { type: 'link', icon: ExternalLink, count: 4, color: 'bg-purple-100 text-purple-800' }
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
                Learning Hub
              </h1>
              <p className="text-green-600 max-w-2xl">
                Discover educational resources, develop new skills, and learn from your community. 
                From digital literacy to sustainable living, find resources for every interest.
              </p>
            </div>
            {user && (
              <Button asChild className="mt-4 sm:mt-0">
                <Link href="/learning/create">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Resource
                </Link>
              </Button>
            )}
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4 text-center">
              <BookOpen className="h-8 w-8 text-blue-500 mx-auto mb-2" />
              <p className="text-2xl font-bold">{stats.totalResources}</p>
              <p className="text-sm text-gray-600">Total Resources</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <Users className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <p className="text-2xl font-bold">{stats.activeUsers}</p>
              <p className="text-sm text-gray-600">Active Learners</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <Clock className="h-8 w-8 text-purple-500 mx-auto mb-2" />
              <p className="text-2xl font-bold">{stats.hoursLearned}</p>
              <p className="text-sm text-gray-600">Hours Learned</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <GraduationCap className="h-8 w-8 text-orange-500 mx-auto mb-2" />
              <p className="text-2xl font-bold">{stats.completedCourses}</p>
              <p className="text-sm text-gray-600">Courses Completed</p>
            </CardContent>
          </Card>
        </div>

        {/* Resource Types */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Browse by Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {resourceTypes.map((type) => {
                const IconComponent = type.icon
                return (
                  <Link 
                    key={type.type} 
                    href={`/learning?type=${type.type}`}
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

        {/* Featured Resources */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              Featured Resources
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {resources.filter(r => r.is_featured).map((resource) => (
                <Card key={resource.id} className="hover:shadow-md transition-shadow duration-200">
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <div className="bg-orange-100 text-orange-800 p-2 rounded-lg">
                        <GraduationCap className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold mb-1">{resource.title}</h3>
                        <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                          {resource.content}
                        </p>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>{resource.estimated_duration} minutes</span>
                          <span>{resource.view_count} views</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search learning resources..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
                <Button variant="outline" size="sm">
                  Difficulty
                </Button>
                <Button variant="outline" size="sm">
                  Duration
                </Button>
                <div className="flex border rounded-md">
                  <Button variant="default" size="sm" className="rounded-r-none">
                    <Grid3X3 className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="rounded-l-none">
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Learning Resources Grid */}
        <LearningResourcesGrid resources={resources} />

        {/* Learning Paths */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Suggested Learning Paths</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 border rounded-lg">
                <GraduationCap className="h-12 w-12 text-blue-500 mx-auto mb-3" />
                <h3 className="font-semibold mb-2">Digital Literacy</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Master essential digital skills for modern life
                </p>
                <Badge variant="secondary">4 courses</Badge>
              </div>
              
              <div className="text-center p-4 border rounded-lg">
                <BookOpen className="h-12 w-12 text-green-500 mx-auto mb-3" />
                <h3 className="font-semibold mb-2">Sustainable Living</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Learn eco-friendly practices for home and community
                </p>
                <Badge variant="secondary">6 resources</Badge>
              </div>
              
              <div className="text-center p-4 border rounded-lg">
                <Users className="h-12 w-12 text-purple-500 mx-auto mb-3" />
                <h3 className="font-semibold mb-2">Community Leadership</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Develop skills to lead and organize in your community
                </p>
                <Badge variant="secondary">5 resources</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

export const metadata = {
  title: 'Learning Hub | Stoneclough Community',
  description: 'Educational resources and skill development for the Stoneclough, Prestolee & Ringley community.',
};
