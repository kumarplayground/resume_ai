import * as React from "react"
import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-xl border border-gray-200 dark:border-[#1c2621] bg-gray-50/70 dark:bg-[#0b0f0d] px-3 py-2 text-xs sm:text-sm text-gray-900 dark:text-gray-100 shadow-2xs transition-colors placeholder:text-gray-400 dark:placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/70 dark:focus-visible:ring-[#34d399]/70 focus-visible:border-emerald-500 dark:focus-visible:border-[#34d399] disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
