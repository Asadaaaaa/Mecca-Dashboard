import { LoginForm } from "@/components/login-form"
import { GalleryVerticalEndIcon, SunIcon, MoonIcon } from "lucide-react"
import { Link } from "react-router-dom"
import { useTheme } from "@/components/theme-provider"
import { Button } from "@/components/ui/button"

export default function LoginPage() {
  const { theme, setTheme } = useTheme()

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center bg-muted/40 p-6 md:p-10">
      {/* Theme Toggle Top Right */}
      <div className="absolute right-4 top-4">
        <Button
          variant="outline"
          size="icon"
          onClick={toggleTheme}
          title="Toggle theme (or press 'd')"
          className="size-9 rounded-md"
        >
          {theme === "dark" ? (
            <SunIcon className="size-4" />
          ) : (
            <MoonIcon className="size-4" />
          )}
          <span className="sr-only">Toggle theme</span>
        </Button>
      </div>

      <div className="flex w-full max-w-sm flex-col gap-6">
        <Link
          to="/"
          className="flex items-center gap-2 self-center font-medium transition-opacity hover:opacity-80"
        >
          <div className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <GalleryVerticalEndIcon className="size-4" />
          </div>
          <span className="text-base font-semibold tracking-tight">Mecca Dashboard</span>
        </Link>
        <LoginForm />
      </div>
    </div>
  )
}
