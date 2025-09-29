import { redirect, notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Navigation } from "@/components/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, MessageSquare, Clock, User } from "lucide-react"
import Link from "next/link"
import { PostResponseForm } from "@/components/post-response-form"

export default async function PostDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get the post details
  const { data: post } = await supabase
    .from("community_posts")
    .select(
      `
      *,
      profiles:author_id (display_name, village)
    `,
    )
    .eq("id", id)
    .single()

  if (!post) {
    notFound()
  }

  // Get post responses
  const { data: responses } = await supabase
    .from("post_responses")
    .select(
      `
      *,
      profiles:responder_id (display_name, village)
    `,
    )
    .eq("post_id", id)
    .order("created_at", { ascending: true })

  const getPostIcon = (type: string) => {
    switch (type) {
      case "need":
        return "🆘"
      case "offer":
        return "💚"
      case "announcement":
        return "📢"
      case "question":
        return "❓"
      default:
        return "💬"
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <Navigation />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Button asChild variant="ghost" className="mb-4">
            <Link href="/community">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Community
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Post */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <Badge className={getPostColor(post.post_type)}>
                      <span className="mr-1">{getPostIcon(post.post_type)}</span>
                      <span className="capitalize">{post.post_type}</span>
                    </Badge>
                    {post.category && (
                      <Badge variant="outline" className="text-xs">
                        {post.category.replace("_", " ")}
                      </Badge>
                    )}
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(post.created_at).toLocaleDateString("en-GB", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </div>
                </div>
                <CardTitle className="text-2xl">{post.title}</CardTitle>
                <CardDescription className="flex items-center space-x-4">
                  <span>by {post.profiles?.display_name}</span>
                  <span>from {post.profiles?.village}</span>
                  {post.expires_at && (
                    <span className="flex items-center text-orange-600">
                      <Clock className="w-4 h-4 mr-1" />
                      Expires {new Date(post.expires_at).toLocaleDateString("en-GB")}
                    </span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none">
                  <p className="text-gray-700 whitespace-pre-wrap">{post.content}</p>
                </div>
              </CardContent>
            </Card>

            {/* Responses Section */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MessageSquare className="w-5 h-5" />
                  <span>Responses ({responses?.length || 0})</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {responses && responses.length > 0 ? (
                  <div className="space-y-4">
                    {responses.map((response) => (
                      <div key={response.id} className="border-l-4 border-green-200 pl-4 py-3 bg-green-50 rounded-r-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2 text-sm">
                            <User className="w-4 h-4 text-green-600" />
                            <span className="font-medium">{response.profiles?.display_name}</span>
                            <span className="text-gray-500">from {response.profiles?.village}</span>
                          </div>
                          <span className="text-xs text-gray-500">
                            {new Date(response.created_at).toLocaleDateString("en-GB")}
                          </span>
                        </div>
                        <p className="text-gray-700 whitespace-pre-wrap">{response.message}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No responses yet. Be the first to respond!</p>
                  </div>
                )}

                {/* Response Form */}
                <div className="mt-6 pt-6 border-t">
                  <PostResponseForm postId={id} />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Post Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Status</span>
                  <Badge variant="outline" className="capitalize">
                    {post.status}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Type</span>
                  <Badge className={getPostColor(post.post_type)} variant="secondary">
                    {post.post_type}
                  </Badge>
                </div>
                {post.category && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Category</span>
                    <span className="text-sm font-medium capitalize">{post.category.replace("_", " ")}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Posted</span>
                  <span className="text-sm">{new Date(post.created_at).toLocaleDateString("en-GB")}</span>
                </div>
                {post.expires_at && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Expires</span>
                    <span className="text-sm text-orange-600">
                      {new Date(post.expires_at).toLocaleDateString("en-GB")}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {post.author_id === user.id && (
              <Card>
                <CardHeader>
                  <CardTitle>Manage Post</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="outline" className="w-full bg-transparent" size="sm">
                    Edit Post
                  </Button>
                  <Button variant="outline" className="w-full bg-transparent" size="sm">
                    Mark as Fulfilled
                  </Button>
                  <Button variant="destructive" className="w-full" size="sm">
                    Delete Post
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
