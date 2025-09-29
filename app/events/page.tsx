import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Navigation } from "@/components/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, MapPin, Users, Clock, Plus } from "lucide-react"
import Link from "next/link"

export default async function EventsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get all upcoming events
  const { data: events } = await supabase
    .from("events")
    .select(
      `
      *,
      profiles:organizer_id (display_name, village),
      event_attendees (count)
    `,
    )
    .gte("start_date", new Date().toISOString())
    .order("start_date", { ascending: true })

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-green-800">Community Events</h1>
            <p className="text-green-600 mt-2">Discover what's happening in your villages</p>
          </div>
          <Button asChild className="bg-green-600 hover:bg-green-700">
            <Link href="/events/create">
              <Plus className="w-4 h-4 mr-2" />
              Create Event
            </Link>
          </Button>
        </div>

        {events && events.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <Card key={event.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-lg line-clamp-2">{event.title}</CardTitle>
                      <CardDescription className="mt-1">
                        Organized by {event.profiles?.display_name} from {event.profiles?.village}
                      </CardDescription>
                    </div>
                    <Badge variant="secondary" className="ml-2 bg-green-100 text-green-800">
                      {event.category}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="w-4 h-4 mr-2 text-green-600" />
                      <span>
                        {new Date(event.start_date).toLocaleDateString("en-GB", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Clock className="w-4 h-4 mr-2 text-green-600" />
                      <span>
                        {new Date(event.start_date).toLocaleTimeString("en-GB", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                        {event.end_date &&
                          ` - ${new Date(event.end_date).toLocaleTimeString("en-GB", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}`}
                      </span>
                    </div>
                    {event.location && (
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="w-4 h-4 mr-2 text-green-600" />
                        <span className="line-clamp-1">{event.location}</span>
                      </div>
                    )}
                    {event.max_attendees && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Users className="w-4 h-4 mr-2 text-green-600" />
                        <span>
                          {event.event_attendees?.[0]?.count || 0} / {event.max_attendees} attendees
                        </span>
                      </div>
                    )}
                    {event.description && (
                      <p className="text-sm text-gray-700 line-clamp-3 mt-3">{event.description}</p>
                    )}
                  </div>
                  <div className="mt-4 pt-4 border-t">
                    <Button asChild className="w-full" size="sm">
                      <Link href={`/events/${event.id}`}>View Details</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No events scheduled</h3>
              <p className="text-gray-500 mb-6">Be the first to organize something for your community!</p>
              <Button asChild className="bg-green-600 hover:bg-green-700">
                <Link href="/events/create">
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Event
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
