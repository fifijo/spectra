import * as React from "react"
import { Menu as MenuIcon } from "lucide-react"
import { cn } from "@/lib/utils"

const DropdownMenuContext = React.createContext<{
  open: boolean
  setOpen: (open: boolean) => void
} | null>(null)

interface DropdownMenuProps {
  children: React.ReactNode
}

function DropdownMenu({ children }: DropdownMenuProps) {
  const [open, setOpen] = React.useState(false)
  const value = React.useMemo(() => ({ open, setOpen }), [open])

  return (
    <DropdownMenuContext.Provider value={value}>
      <div className="relative inline-block">{children}</div>
    </DropdownMenuContext.Provider>
  )
}

interface DropdownMenuTriggerProps {
  asChild?: boolean
  children: React.ReactNode
}

const DropdownMenuTrigger = React.forwardRef<HTMLButtonElement, DropdownMenuTriggerProps>(
  ({ asChild, children }, ref) => {
    const ctx = React.useContext(DropdownMenuContext)
    if (!ctx) throw new Error("DropdownMenuTrigger must be used within DropdownMenu")

    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children as React.ReactElement<{ onClick?: () => void }>, {
        onClick: () => ctx.setOpen(!ctx.open),
      })
    }

    return (
      <button
        ref={ref}
        onClick={() => ctx.setOpen(!ctx.open)}
        className="inline-flex items-center justify-center"
      >
        {children}
      </button>
    )
  }
)
DropdownMenuTrigger.displayName = "DropdownMenuTrigger"

interface DropdownMenuContentProps {
  align?: "start" | "center" | "end"
  children: React.ReactNode
  className?: string
}

const DropdownMenuContent = React.forwardRef<HTMLDivElement, DropdownMenuContentProps>(
  ({ align = "end", children, className }, ref) => {
    const ctx = React.useContext(DropdownMenuContext)

    React.useEffect(() => {
      if (!ctx?.open) return
      const handleClickOutside = () => {
        ctx.setOpen(false)
      }
      const id = window.setTimeout(() => {
        document.addEventListener("click", handleClickOutside)
      }, 0)
      return () => {
        window.clearTimeout(id)
        document.removeEventListener("click", handleClickOutside)
      }
    }, [ctx?.open, ctx?.setOpen])

    if (!ctx) return null

    return ctx.open ? (
      <div
        ref={ref}
        className={cn(
          "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md",
          align === "end" && "ml-auto",
          align === "start" && "mr-auto",
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    ) : null
  }
)
DropdownMenuContent.displayName = "DropdownMenuContent"

interface DropdownMenuItemProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string
  children: React.ReactNode
  onClick?: () => void
}

const DropdownMenuItem = React.forwardRef<HTMLDivElement, DropdownMenuItemProps>(
  ({ className, children, onClick, ...rest }, ref) => {
    const ctx = React.useContext(DropdownMenuContext)
    return (
      <div
        ref={ref}
        className={cn(
          "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
          className
        )}
        onClick={() => {
          onClick?.()
          ctx?.setOpen(false)
        }}
        {...rest}
      >
        {children}
      </div>
    )
  }
)
DropdownMenuItem.displayName = "DropdownMenuItem"

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
}