import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, Mail } from "lucide-react"
import Link from "next/link"

export default function SignupSuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-green-800">Welcome to the Community!</CardTitle>
            <CardDescription className="text-green-600">
              Please check your email to confirm your account
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="flex items-center justify-center space-x-2 text-green-700 bg-green-50 p-3 rounded-lg">
              <Mail className="w-5 h-5" />
              <span className="text-sm font-medium">Confirmation email sent!</span>
            </div>
            <p className="text-sm text-muted-foreground">
              We've sent a confirmation email to your inbox. Click the link in the email to activate your account and
              start connecting with your neighbors in Stoneclough, Prestolee & Ringley.
            </p>
            <div className="pt-4 space-y-3">
              <p className="text-xs text-muted-foreground">
                After confirming your email, you can sign in to access the community platform.
              </p>
              <Button asChild variant="outline" className="w-full bg-transparent">
                <Link href="/auth/login">Go to Sign In</Link>
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Don't see the email? Check your spam folder or contact us for help.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
