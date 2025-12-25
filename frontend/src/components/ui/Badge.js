import * as React from "react";
import { cn } from "../../lib/utils";

const Badge = React.forwardRef(({ className, variant = "default", ...props }, ref) => {
  const variants = {
    default: "bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300",
    secondary: "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300",
    destructive: "bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300",
    success: "bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300",
    warning: "bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300",
    outline: "border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300",
  };

  return (
    <span
      ref={ref}
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold transition-colors",
        variants[variant],
        className
      )}
      {...props}
    />
  );
});
Badge.displayName = "Badge";

export { Badge };
