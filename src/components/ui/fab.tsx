"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface FABProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

const FAB = React.forwardRef<HTMLButtonElement, FABProps>(
  ({ className, children, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "fixed bottom-20 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-lg bg-primary-container text-on-primary-container shadow-elevation-3 transition-all duration-200 hover:shadow-elevation-4 active:shadow-elevation-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:hidden [&_svg]:size-6",
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
);
FAB.displayName = "FAB";

export { FAB };
