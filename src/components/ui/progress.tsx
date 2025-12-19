import * as React from "react";

import { cn } from "../../lib/utils";

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
}

export const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ value, className, ...props }, ref) => {
    const normalizedValue = value === undefined
      ? undefined
      : Math.max(0, Math.min(100, value));

    return (
      <div
        ref={ref}
        className={cn(
          "relative h-2 w-full overflow-hidden rounded-full bg-slate-200",
          className
        )}
        {...props}
      >
        <div
          className={cn(
            "h-full rounded-full bg-slate-900 transition-all",
            normalizedValue === undefined && "w-1/2 animate-pulse"
          )}
          style={
            normalizedValue === undefined
              ? undefined
              : { width: `${normalizedValue}%` }
          }
        />
      </div>
    );
  }
);
Progress.displayName = "Progress";
