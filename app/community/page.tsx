import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Navigation } from "@/components/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MessageSquare, Plus, Heart, HelpCircle, Megaphone, Clock } from "lucide-react"
import Link from "next/link"

export default async function CommunityPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get all community posts
  const { data: posts } = await supabase
    .from("community_posts")
    .select(
      `
      *,
      profiles:author_id (display_name, village),
      post_responses (count)
    `,
    )
    .eq("status", "active")
    .order("created_at", { ascending: false })

  const getPostIcon = (type: string) => {
    switch (type) {
      case "need":
        return <HelpCircle className="w-4 h-4" />
      case "offer":
        return <Heart className="w-4 h-4" />
      case "announcement":
        return <Megaphone className="w-4 h-4" />
      case "question":
        return <MessageSquare className="w-4 h-4" />
      default:
        return <MessageSquare className="w-4 h-4" />
    }
  }

  const getPostColor = (type: string) => {
    switch (type) {
      case "need":
        return "bg-red-100 text-red-800 border-red-200"
      case "offer":
        return "bg-green-100 text-green-800 border-green-200"
      case "announcement":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "question":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const filterPosts = (type?: string) => {
    if (!type) return posts || []
    return posts?.filter((post) => post.post_type === type) || []
  }

  const PostCard = ({ post }: { post: any }) => (
    <Card key={post.id} className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2">
            <Badge className={getPostColor(post.post_type)}>
              {getPostIcon(post.post_type)}
              <span className="ml-1 capitalize">{post.post_type}</span>
            </Badge>
            {post.category && (
              <Badge variant="outline" className="text-xs">
                {post.category.replace("_", " ")}
              </Badge>
            )}
          </div>
          <div className="text-xs text-gray-500">{new Date(post.created_at).toLocaleDateString("en-GB")}</div>
        </div>
        <CardTitle className="text-lg">{post.title}</CardTitle>
        <CardDescription>
          by {post.profiles?.display_name} from {post.profiles?.village}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-gray-700 mb-4 line-clamp-3">{post.content}</p>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            {post.expires_at && (
              <span className="flex items-center">
                <Clock className="w-4 h-4 mr-1" />
                Expires {new Date(post.expires_at).toLocaleDateString("en-GB")}
              </span>
            )}
            <span className="flex items-center">
              <MessageSquare className="w-4 h-4 mr-1" />
              {post.post_responses?.[0]?.count || 0} responses
            </span>
          </div>
          <Button asChild size="sm" variant="outline">
            <Link href={`/community/${post.id}`}>View Details</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-green-800">Community Board</h1>
            <p className="text-green-600 mt-2">Share needs, offers, announcements, and questions with your neighbors</p>
          </div>
          <Button asChild className="bg-green-600 hover:bg-green-700">
            <Link href="/community/create">
              <Plus className="w-4 h-4 mr-2" />
              Create Post
            </Link>
          </Button>
        </div>

        <Tabs defaultValue="all" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:grid-cols-5">
            <TabsTrigger value="all">All Posts</TabsTrigger>
            <TabsTrigger value="need" className="text-red-700">
              Needs
            </TabsTrigger>
            <TabsTrigger value="offer" className="text-green-700">
              Offers
            </TabsTrigger>
            <TabsTrigger value="announcement" className="text-blue-700">
              News
            </TabsTrigger>
            <TabsTrigger value="question" className="text-yellow-700">
              Questions
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            {posts && posts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {posts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No posts yet</h3>
                  <p className="text-gray-500 mb-6">Be the first to share something with your community!</p>
                  <Button asChild className="bg-green-600 hover:bg-green-700">
                    <Link href="/community/create">
                      <Plus className="w-4 h-4 mr-2" />
                      Create First Post
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="need">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filterPosts("need").map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
            {filterPosts("need").length === 0 && (
              <Card>
                <CardContent className="text-center py-12">
                  <HelpCircle className="w-16 h-16 mx-auto mb-4 text-red-300" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No help requests</h3>
                  <p className="text-gray-500">No one needs help right now - that's great!</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="offer">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filterPosts("offer").map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
            {filterPosts("offer").length === 0 && (
              <Card>
                <CardContent className="text-center py-12">
                  <Heart className="w-16 h-16 mx-auto mb-4 text-green-300" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No offers available</h3>
                  <p className="text-gray-500">Be the first to offer help to your neighbors!</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="announcement">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filterPosts("announcement").map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
            {filterPosts("announcement").length === 0 && (
              <Card>
                <CardContent className="text-center py-12">
                  <Megaphone className="w-16 h-16 mx-auto mb-4 text-blue-300" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No announcements</h3>
                  <p className="text-gray-500">No community news to share right now.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="question">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filterPosts("question").map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
            {filterPosts("question").length === 0 && (
              <Card>
                <CardContent className="text-center py-12">
                  <MessageSquare className="w-16 h-16 mx-auto mb-4 text-yellow-300" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No questions</h3>
                  <p className="text-gray-500">No one has questions right now.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
