import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-xs sm:text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:pointer-events-none disabled:opacity-50 cursor-pointer shadow-2xs select-none",
  {
    variants: {
      variant: {
        default:
          "bg-emerald-700 hover:bg-emerald-800 text-white dark:bg-[#34d399] dark:hover:bg-[#2dd4bf] dark:text-[#052015] font-bold shadow-xs",
        destructive:
          "bg-rose-500 text-white hover:bg-rose-600 dark:bg-rose-900 dark:text-rose-100",
        outline:
          "border border-gray-200 dark:border-[#1c2621] bg-white dark:bg-[#111614] hover:bg-gray-50 dark:hover:bg-[#1a231e] text-gray-800 dark:text-gray-200 hover:border-gray-300 dark:hover:border-[#2d3a33]",
        secondary:
          "bg-gray-100 dark:bg-[#1a231e] text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-[#24322a]",
        ghost:
          "hover:bg-gray-100 dark:hover:bg-[#1a231e] text-gray-700 dark:text-gray-300",
        link: "text-emerald-600 dark:text-[#34d399] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-lg px-3 text-xs",
        lg: "h-11 rounded-xl px-6 text-sm",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
