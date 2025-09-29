"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { MoreHorizontal, UserCheck, UserX, Crown, Shield, Ban } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface UserManagementActionsProps {
  userId: string
  currentUser: {
    is_admin: boolean
    is_volunteer: boolean
    display_name: string
  }
}

export function UserManagementActions({ userId, currentUser }: UserManagementActionsProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [actionType, setActionType] = useState<string>("")
  const router = useRouter()
  const supabase = createClient()

  const handleUserAction = async (action: string) => {
    setIsLoading(true)
    try {
      let updateData: any = {}

      switch (action) {
        case "make_volunteer":
          updateData = { is_volunteer: true }
          break
        case "remove_volunteer":
          updateData = { is_volunteer: false }
          break
        case "make_admin":
          updateData = { is_admin: true }
          break
        case "remove_admin":
          updateData = { is_admin: false }
          break
        default:
          return
      }

      const { error } = await supabase.from("profiles").update(updateData).eq("id", userId)

      if (error) throw error

      router.refresh()
    } catch (error) {
      console.error("User action error:", error)
    } finally {
      setIsLoading(false)
      setShowConfirmDialog(false)
    }
  }

  const confirmAction = (action: string) => {
    setActionType(action)
    setShowConfirmDialog(true)
  }

  const getActionLabel = (action: string) => {
    switch (action) {
      case "make_volunteer":
        return "promote to volunteer"
      case "remove_volunteer":
        return "remove volunteer status"
      case "make_admin":
        return "promote to administrator"
      case "remove_admin":
        return "remove administrator status"
      default:
        return "perform this action"
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" disabled={isLoading}>
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {!currentUser.is_volunteer && (
            <DropdownMenuItem onClick={() => confirmAction("make_volunteer")}>
              <UserCheck className="w-4 h-4 mr-2" />
              Make Volunteer
            </DropdownMenuItem>
          )}
          {currentUser.is_volunteer && (
            <DropdownMenuItem onClick={() => confirmAction("remove_volunteer")}>
              <UserX className="w-4 h-4 mr-2" />
              Remove Volunteer
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          {!currentUser.is_admin && (
            <DropdownMenuItem onClick={() => confirmAction("make_admin")}>
              <Crown className="w-4 h-4 mr-2" />
              Make Admin
            </DropdownMenuItem>
          )}
          {currentUser.is_admin && (
            <DropdownMenuItem onClick={() => confirmAction("remove_admin")}>
              <Shield className="w-4 h-4 mr-2" />
              Remove Admin
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-red-600">
            <Ban className="w-4 h-4 mr-2" />
            Suspend User
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Action</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to {getActionLabel(actionType)} for {currentUser.display_name}? This action will
              take effect immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleUserAction(actionType)}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
