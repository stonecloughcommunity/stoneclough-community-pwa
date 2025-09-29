import { redirect, notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Navigation } from "@/components/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, MapPin, Users, Clock, ArrowLeft, UserPlus } from "lucide-react"
import Link from "next/link"
import { AttendEventButton } from "@/components/attend-event-button"

interface EventPageProps {
  params: Promise<{ id: string }>
}

export default async function EventPage({ params }: EventPageProps) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get event details
  const { data: event } = await supabase
    .from("events")
    .select(
      `
      *,
      profiles:organizer_id (display_name, village),
      event_attendees (
        id,
        user_id,
        status,
        profiles:user_id (display_name)
      )
    `,
    )
    .eq("id", id)
    .single()

  if (!event) {
    notFound()
  }

  // Check if current user is attending
  const userAttendance = event.event_attendees?.find((attendee) => attendee.user_id === user.id)
  const attendeeCount = event.event_attendees?.filter((attendee) => attendee.status === "attending").length || 0
  const isOrganizer = event.organizer_id === user.id

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <Navigation />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Button asChild variant="ghost" className="mb-4">
            <Link href="/events">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Events
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-2xl mb-2">{event.title}</CardTitle>
                    <CardDescription className="text-base">
                      Organized by {event.profiles?.display_name} from {event.profiles?.village}
                    </CardDescription>
                  </div>
                  <Badge variant="secondary" className="ml-4 bg-green-100 text-green-800">
                    {event.category}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Event Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center text-gray-600">
                    <Calendar className="w-5 h-5 mr-3 text-green-600" />
                    <div>
                      <div className="font-medium">
                        {new Date(event.start_date).toLocaleDateString("en-GB", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </div>
                      {event.end_date &&
                        new Date(event.end_date).toDateString() !== new Date(event.start_date).toDateString() && (
                          <div className="text-sm text-gray-500">
                            to{" "}
                            {new Date(event.end_date).toLocaleDateString("en-GB", {
                              weekday: "long",
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </div>
                        )}
                    </div>
                  </div>

                  <div className="flex items-center text-gray-600">
                    <Clock className="w-5 h-5 mr-3 text-green-600" />
                    <div>
                      <div className="font-medium">
                        {new Date(event.start_date).toLocaleTimeString("en-GB", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                        {event.end_date &&
                          ` - ${new Date(event.end_date).toLocaleTimeString("en-GB", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}`}
                      </div>
                    </div>
                  </div>

                  {event.location && (
                    <div className="flex items-center text-gray-600">
                      <MapPin className="w-5 h-5 mr-3 text-green-600" />
                      <div className="font-medium">{event.location}</div>
                    </div>
                  )}

                  <div className="flex items-center text-gray-600">
                    <Users className="w-5 h-5 mr-3 text-green-600" />
                    <div className="font-medium">
                      {attendeeCount} {event.max_attendees ? `/ ${event.max_attendees}` : ""} attendees
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">About this event</h3>
                  <p className="text-gray-700 whitespace-pre-wrap">{event.description}</p>
                </div>

                {/* Attendance Action */}
                {!isOrganizer && (
                  <div className="pt-4 border-t">
                    <AttendEventButton
                      eventId={event.id}
                      isAttending={userAttendance?.status === "attending"}
                      isFull={event.max_attendees ? attendeeCount >= event.max_attendees : false}
                    />
                  </div>
                )}

                {isOrganizer && (
                  <div className="pt-4 border-t">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <p className="text-blue-800 font-medium">You are the organizer of this event</p>
                      <p className="text-blue-600 text-sm mt-1">
                        Manage your event and communicate with attendees through the community board.
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Attendees */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <UserPlus className="w-5 h-5 mr-2 text-green-600" />
                  Attendees ({attendeeCount})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {event.event_attendees && event.event_attendees.length > 0 ? (
                  <div className="space-y-2">
                    {event.event_attendees
                      .filter((attendee) => attendee.status === "attending")
                      .map((attendee) => (
                        <div key={attendee.id} className="flex items-center space-x-2">
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                            <span className="text-green-600 font-medium text-sm">
                              {attendee.profiles?.display_name?.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <span className="text-sm font-medium">{attendee.profiles?.display_name}</span>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No attendees yet. Be the first to join!</p>
                )}
              </CardContent>
            </Card>

            {/* Event Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Share Event</CardTitle>
              </CardHeader>
              <CardContent>
                <Button
                  variant="outline"
                  className="w-full bg-transparent"
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({
                        title: event.title,
                        text: event.description,
                        url: window.location.href,
                      })
                    } else {
                      navigator.clipboard.writeText(window.location.href)
                    }
                  }}
                >
                  Share Event
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
