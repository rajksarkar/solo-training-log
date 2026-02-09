import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-[0.38] [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-on-primary hover:shadow-elevation-1 active:shadow-none",
        filled:
          "bg-primary text-on-primary hover:shadow-elevation-1 active:shadow-none",
        "filled-tonal":
          "bg-secondary-container text-on-secondary-container hover:shadow-elevation-1 active:shadow-none",
        outline:
          "border border-outline bg-transparent text-primary hover:bg-primary/[0.08] active:bg-primary/[0.12]",
        outlined:
          "border border-outline bg-transparent text-primary hover:bg-primary/[0.08] active:bg-primary/[0.12]",
        ghost:
          "text-primary hover:bg-primary/[0.08] active:bg-primary/[0.12]",
        text:
          "text-primary hover:bg-primary/[0.08] active:bg-primary/[0.12]",
        elevated:
          "bg-surface-container-low text-primary shadow-elevation-1 hover:shadow-elevation-2",
        destructive:
          "bg-error text-on-error hover:shadow-elevation-1 active:shadow-none",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-6 py-2",
        sm: "h-8 px-4 text-xs",
        lg: "h-12 px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
