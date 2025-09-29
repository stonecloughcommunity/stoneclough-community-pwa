import { createClient } from "@/lib/supabase/server"
import { Navigation } from "@/components/navigation"
import { OfflineIndicator } from "@/components/offline-indicator"
import { EnhancedProfileForm } from "@/components/profile/enhanced-profile-form"
import { redirect } from "next/navigation"

export default async function ProfilePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get user profile with all enhanced fields
  const { data: profile } = await supabase
    .from("profiles")
    .select(`
      *,
      department_interests,
      accessibility_needs,
      notification_preferences,
      privacy_settings,
      emergency_contact
    `)
    .eq("id", user.id)
    .single()

  const handleProfileUpdate = async (data: any) => {
    "use server"
    
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) throw new Error("Not authenticated")

    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: data.display_name,
        bio: data.bio,
        phone: data.phone,
        address: data.address,
        village: data.village,
        age_group: data.age_group,
        faith_preference: data.faith_preference,
        department_interests: data.department_interests,
        accessibility_needs: data.accessibility_needs,
        senior_mode_enabled: data.senior_mode_enabled,
        skills: data.skills,
        interests: data.interests,
        availability: data.availability,
        notification_preferences: data.notification_preferences,
        privacy_settings: data.privacy_settings,
        emergency_contact: data.emergency_contact,
        updated_at: new Date().toISOString()
      })
      .eq("id", user.id)

    if (error) throw error
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <Navigation />
      <OfflineIndicator />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-green-800 mb-2">
            Your Profile
          </h1>
          <p className="text-green-600">
            Update your information to get personalized content and connect with your community.
          </p>
        </div>

        <EnhancedProfileForm 
          profile={profile} 
          onSave={handleProfileUpdate}
        />
      </main>
    </div>
  )
}

export const metadata = {
  title: 'Your Profile | Stoneclough Community',
  description: 'Update your profile information and preferences for the Stoneclough community platform.',
};
