import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner";
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"

const Toaster = ({ ...props }) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme}
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-5" />,
        info: <InfoIcon className="size-5" />,
        warning: <TriangleAlertIcon className="size-5" />,
        error: <OctagonXIcon className="size-5" />,
        loading: <Loader2Icon className="size-5 animate-spin" />,
      }}
      style={{
        "--normal-bg": "var(--popover)",
        "--normal-text": "var(--popover-foreground)",
        "--normal-border": "var(--border)",
        "--border-radius": "18px",
      }}
      toastOptions={{
        classNames: {
          toast:
            "backdrop-blur-md bg-background/80 border shadow-xl px-5 py-4 rounded-2xl transition-all duration-300 hover:scale-[1.02]",
          title: "font-semibold text-sm tracking-tight",
          description: "text-sm text-muted-foreground mt-1",
          icon: "mr-3",
          actionButton: "rounded-lg px-3 py-1 text-sm",
          cancelButton: "rounded-lg px-3 py-1 text-sm",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
