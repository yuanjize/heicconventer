import * as React from "react";

import { cn } from "../../lib/utils";

export const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-3xl border border-white/60 bg-white/80 shadow-[0_20px_40px_-30px_rgba(15,23,42,0.4)] backdrop-blur",
      className
    )}
    {...props}
  />
));
Card.displayName = "Card";
