import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Navigation } from "@/components/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Phone,
  Mail,
  Globe,
  MapPin,
  Clock,
  Plus,
  Store,
  Utensils,
  Wrench,
  Heart,
  GraduationCap,
  Church,
} from "lucide-react"
import Link from "next/link"

export default async function DirectoryPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get all directory entries
  const { data: entries } = await supabase
    .from("directory_entries")
    .select(
      `
      *,
      profiles:owner_id (display_name, village)
    `,
    )
    .order("name", { ascending: true })

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "restaurant":
        return <Utensils className="w-4 h-4" />
      case "shop":
        return <Store className="w-4 h-4" />
      case "service":
        return <Wrench className="w-4 h-4" />
      case "healthcare":
        return <Heart className="w-4 h-4" />
      case "education":
        return <GraduationCap className="w-4 h-4" />
      case "religious":
        return <Church className="w-4 h-4" />
      default:
        return <Store className="w-4 h-4" />
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "restaurant":
        return "bg-orange-100 text-orange-800"
      case "shop":
        return "bg-blue-100 text-blue-800"
      case "service":
        return "bg-purple-100 text-purple-800"
      case "healthcare":
        return "bg-red-100 text-red-800"
      case "education":
        return "bg-green-100 text-green-800"
      case "religious":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const filterEntries = (category?: string) => {
    if (!category) return entries || []
    return entries?.filter((entry) => entry.category === category) || []
  }

  const formatOpeningHours = (hours: any) => {
    if (!hours || typeof hours !== "object") return null
    const today = new Date().toLocaleDateString("en-US", { weekday: "lowercase" })
    return hours[today] || null
  }

  const DirectoryCard = ({ entry }: { entry: any }) => (
    <Card key={entry.id} className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <Badge className={getCategoryColor(entry.category)}>
                {getCategoryIcon(entry.category)}
                <span className="ml-1 capitalize">{entry.category}</span>
              </Badge>
              {entry.is_verified && <Badge className="bg-green-100 text-green-800">Verified</Badge>}
            </div>
            <CardTitle className="text-lg">{entry.name}</CardTitle>
            {entry.description && <CardDescription className="mt-1">{entry.description}</CardDescription>}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {entry.address && (
            <div className="flex items-start space-x-2 text-sm text-gray-600">
              <MapPin className="w-4 h-4 mt-0.5 text-green-600 flex-shrink-0" />
              <span>{entry.address}</span>
            </div>
          )}

          {entry.phone && (
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Phone className="w-4 h-4 text-green-600" />
              <a href={`tel:${entry.phone}`} className="hover:text-green-600 transition-colors">
                {entry.phone}
              </a>
            </div>
          )}

          {entry.email && (
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Mail className="w-4 h-4 text-green-600" />
              <a href={`mailto:${entry.email}`} className="hover:text-green-600 transition-colors">
                {entry.email}
              </a>
            </div>
          )}

          {entry.website && (
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Globe className="w-4 h-4 text-green-600" />
              <a
                href={entry.website.startsWith("http") ? entry.website : `https://${entry.website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-green-600 transition-colors"
              >
                Visit Website
              </a>
            </div>
          )}

          {entry.opening_hours && formatOpeningHours(entry.opening_hours) && (
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Clock className="w-4 h-4 text-green-600" />
              <span>Today: {formatOpeningHours(entry.opening_hours)}</span>
            </div>
          )}

          {entry.profiles && (
            <div className="pt-3 border-t text-xs text-gray-500">
              Listed by {entry.profiles.display_name} from {entry.profiles.village}
            </div>
          )}
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
            <h1 className="text-3xl font-bold text-green-800">Local Directory</h1>
            <p className="text-green-600 mt-2">Discover local businesses and services in your villages</p>
          </div>
          <Button asChild className="bg-green-600 hover:bg-green-700">
            <Link href="/directory/create">
              <Plus className="w-4 h-4 mr-2" />
              Add Business
            </Link>
          </Button>
        </div>

        <Tabs defaultValue="all" className="space-y-6">
          <TabsList className="grid w-full grid-cols-7 lg:w-auto lg:grid-cols-7">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="restaurant">Food</TabsTrigger>
            <TabsTrigger value="shop">Shops</TabsTrigger>
            <TabsTrigger value="service">Services</TabsTrigger>
            <TabsTrigger value="healthcare">Health</TabsTrigger>
            <TabsTrigger value="education">Education</TabsTrigger>
            <TabsTrigger value="religious">Religious</TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            {entries && entries.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {entries.map((entry) => (
                  <DirectoryCard key={entry.id} entry={entry} />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <Store className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No businesses listed yet</h3>
                  <p className="text-gray-500 mb-6">Be the first to add a local business to the directory!</p>
                  <Button asChild className="bg-green-600 hover:bg-green-700">
                    <Link href="/directory/create">
                      <Plus className="w-4 h-4 mr-2" />
                      Add First Business
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {["restaurant", "shop", "service", "healthcare", "education", "religious"].map((category) => (
            <TabsContent key={category} value={category}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filterEntries(category).map((entry) => (
                  <DirectoryCard key={entry.id} entry={entry} />
                ))}
              </div>
              {filterEntries(category).length === 0 && (
                <Card>
                  <CardContent className="text-center py-12">
                    {getCategoryIcon(category)}
                    <h3 className="text-lg font-medium text-gray-900 mb-2 mt-4">
                      No {category === "restaurant" ? "restaurants" : `${category}s`} listed
                    </h3>
                    <p className="text-gray-500">No businesses in this category yet.</p>
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
