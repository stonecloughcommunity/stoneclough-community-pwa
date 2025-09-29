"use client"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Home,
  Calendar,
  MessageSquare,
  Book,
  Users,
  LogOut,
  User,
  Shield,
  Info,
  Church,
  Heart,
  Briefcase,
  Leaf,
  Monitor,
  UserCheck,
  Package,
  BookOpen,
  Handshake,
  ChevronDown
} from "lucide-react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import type { User as SupabaseUser } from "@supabase/supabase-js"

export function Navigation() {
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [profile, setProfile] = useState<any>(null)
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUser(user)

      if (user) {
        const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()
        setProfile(profile)
      }
    }

    getUser()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/auth/login")
  }

  const navItems = [
    { href: "/", icon: Home, label: "Home" },
    { href: "/departments", icon: Users, label: "Departments" },
    { href: "/events", icon: Calendar, label: "Events" },
    { href: "/community", icon: MessageSquare, label: "Community" },
    { href: "/marketplace", icon: Package, label: "Marketplace" },
    { href: "/directory", icon: Book, label: "Directory" },
    { href: "/volunteers", icon: UserCheck, label: "Volunteers" },
  ]

  const departments = [
    { href: "/departments/faith-culture", icon: Church, label: "Faith & Culture", color: "#8B5CF6" },
    { href: "/departments/community-wellbeing", icon: Heart, label: "Community & Wellbeing", color: "#EF4444" },
    { href: "/departments/economy-enterprise", icon: Briefcase, label: "Economy & Enterprise", color: "#F59E0B" },
    { href: "/departments/land-food-sustainability", icon: Leaf, label: "Land, Food & Sustainability", color: "#10B981" },
    { href: "/departments/technology-platform", icon: Monitor, label: "Technology & Platform", color: "#3B82F6" },
    { href: "/departments/governance-growth", icon: Handshake, label: "Governance & Growth", color: "#6366F1" },
  ]

  return (
    <nav className="bg-white border-b border-green-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">SPC</span>
              </div>
              <span className="font-bold text-green-800 hidden sm:block">Village Community</span>
            </Link>

            <div className="hidden md:flex space-x-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href || (item.href === "/departments" && pathname.startsWith("/departments"))

                if (item.href === "/departments") {
                  return (
                    <DropdownMenu key={item.href}>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                            isActive ? "bg-green-100 text-green-800" : "text-gray-600 hover:text-green-800 hover:bg-green-50"
                          }`}
                        >
                          <item.icon className="w-4 h-4" />
                          <span>{item.label}</span>
                          <ChevronDown className="w-3 h-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-64" align="start">
                        <DropdownMenuItem asChild>
                          <Link href="/departments" className="flex items-center">
                            <Users className="mr-2 h-4 w-4" />
                            <span>All Departments</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {departments.map((dept) => (
                          <DropdownMenuItem key={dept.href} asChild>
                            <Link href={dept.href} className="flex items-center">
                              <dept.icon className="mr-2 h-4 w-4" style={{ color: dept.color }} />
                              <span className="text-sm">{dept.label}</span>
                            </Link>
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )
                }

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive ? "bg-green-100 text-green-800" : "text-gray-600 hover:text-green-800 hover:bg-green-50"
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-green-100 text-green-800">
                        {profile?.display_name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <div className="flex flex-col space-y-1 p-2">
                    <p className="text-sm font-medium leading-none">{profile?.display_name || "User"}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                    {profile?.village && <p className="text-xs leading-none text-green-600">{profile.village}</p>}
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="flex items-center">
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  {profile?.is_admin && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin" className="flex items-center">
                        <Shield className="mr-2 h-4 w-4" />
                        <span>Admin Dashboard</span>
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sign out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center space-x-2">
                <Button asChild variant="ghost" size="sm">
                  <Link href="/auth/login">Sign In</Link>
                </Button>
                <Button asChild size="sm" className="bg-green-600 hover:bg-green-700">
                  <Link href="/auth/signup">Join Community</Link>
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile navigation */}
        <div className="md:hidden border-t border-green-200">
          <div className="flex justify-around py-2">
            {navItems.slice(0, 5).map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex flex-col items-center space-y-1 px-2 py-2 rounded-md text-xs font-medium transition-colors ${
                    isActive ? "text-green-800" : "text-gray-600 hover:text-green-800"
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </nav>
  )
}
