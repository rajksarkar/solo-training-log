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
        "fixed bottom-[calc(6rem+env(safe-area-inset-bottom))] right-5 z-30 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-on-primary shadow-elevation-3 transition-all duration-200 hover:shadow-elevation-4 hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 sm:hidden [&_svg]:size-5",
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
