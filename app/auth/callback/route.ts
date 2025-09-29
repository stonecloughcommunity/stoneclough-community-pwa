import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? "/"
  const type = searchParams.get("type") // email verification type

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      const user = data.user

      // Check if this is an email verification
      if (type === 'email' || user.email_confirmed_at) {
        // Email verification successful - redirect to verification success
        if (user.email_confirmed_at && !user.user_metadata?.profile_created) {
          // Create profile if it doesn't exist
          const { data: existingProfile } = await supabase.from("profiles").select("id").eq("id", user.id).single()

          if (!existingProfile) {
            const { error: profileError } = await supabase.from("profiles").insert({
              id: user.id,
              email: user.email,
              display_name: user.user_metadata?.display_name || user.email?.split("@")[0] || "Community Member",
              village: user.user_metadata?.village || null,
              is_volunteer: user.user_metadata?.is_volunteer || false,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })

            if (!profileError) {
              // Mark profile as created
              await supabase.auth.updateUser({
                data: { ...user.user_metadata, profile_created: true }
              })
            } else {
              console.error("Error creating profile:", profileError)
            }
          }
        }

        // Redirect to verification success page
        return NextResponse.redirect(`${origin}/auth/verification-success`)
      }

      // Regular login - check if profile exists
      const { data: existingProfile } = await supabase.from("profiles").select("id").eq("id", user.id).single()

      if (!existingProfile) {
        // Create profile from user metadata
        const { error: profileError } = await supabase.from("profiles").insert({
          id: user.id,
          email: user.email,
          display_name: user.user_metadata?.display_name || user.email?.split("@")[0] || "Community Member",
          village: user.user_metadata?.village || null,
          is_volunteer: user.user_metadata?.is_volunteer || false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })

        if (profileError) {
          console.error("Error creating profile:", profileError)
        }
      }

      return NextResponse.redirect(`${origin}${next}`)
    } else if (error) {
      console.error("Auth callback error:", error)
      // Redirect to error page with error message
      return NextResponse.redirect(`${origin}/auth/error?message=${encodeURIComponent(error.message)}`)
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/error`)
}
