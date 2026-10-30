import { useState } from "react"
import {
  LogInIcon,
  ShieldCheckIcon,
  UserPlusIcon,
} from "lucide-react"
import { authClient } from "@/lib/neonAuth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card"

export function LoginPage({ onNavigateRegister, onLoginSuccess }) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    setErrorMsg(null)

    try {
      const { data, error } = await authClient.signIn.email({
        email: email.trim(),
        password,
      })
      if (error) {
        throw new Error(error.message || "Invalid email or password")
      }
      if (onLoginSuccess) {
        await onLoginSuccess(data?.user)
      }
    } catch (err) {
      setErrorMsg(err.message || "Sign in failed")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="mx-auto flex max-w-md flex-col justify-center px-4 py-12 sm:px-6">
      <Card className="border-border/80 shadow-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center gap-2 text-primary">
            <ShieldCheckIcon className="size-5" />
            <span className="text-xs font-semibold uppercase tracking-wider">
              CoC Leagues Account
            </span>
          </div>
          <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
          <CardDescription>
            Sign in to access your linked Clash of Clans in-game players and
            switch between your clans.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="login-email">Email Address</Label>
              <Input
                id="login-email"
                type="email"
                required
                placeholder="leader@clan.gg"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="login-password">Password</Label>
              <Input
                id="login-password"
                type="password"
                required
                minLength={8}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {errorMsg && (
              <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
                {errorMsg}
              </div>
            )}

            <Button
              type="submit"
              className="w-full gap-2"
              disabled={submitting}
            >
              <LogInIcon className="size-4" />
              {submitting ? "Signing in..." : "Sign In"}
            </Button>
          </CardContent>
        </form>

        <CardFooter className="flex flex-col gap-3 border-t border-border/60 bg-muted/20 pt-4 text-center text-xs text-muted-foreground">
          <p>Don&apos;t have an online account yet?</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onNavigateRegister}
            className="w-full gap-1.5"
          >
            <UserPlusIcon className="size-4" />
            Create Account &amp; Link In-Game Players
          </Button>
        </CardFooter>
      </Card>
    </section>
  )
}

