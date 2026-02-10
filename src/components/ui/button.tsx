import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium tracking-wide transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-on-primary rounded-full hover:bg-primary/90 hover:shadow-elevation-2 active:scale-[0.97]",
        filled:
          "bg-primary text-on-primary rounded-full hover:bg-primary/90 hover:shadow-elevation-2 active:scale-[0.97]",
        "filled-tonal":
          "bg-secondary-container text-on-secondary-container rounded-full hover:bg-secondary-container/80 hover:shadow-elevation-1 active:scale-[0.97]",
        outline:
          "border border-outline-variant bg-transparent text-on-surface rounded-full hover:bg-primary/[0.06] hover:border-primary/30 active:scale-[0.97]",
        outlined:
          "border border-outline-variant bg-transparent text-on-surface rounded-full hover:bg-primary/[0.06] hover:border-primary/30 active:scale-[0.97]",
        ghost:
          "text-on-surface-variant rounded-lg hover:bg-on-surface/[0.05] hover:text-on-surface active:scale-[0.97]",
        text:
          "text-primary rounded-lg hover:bg-primary/[0.06] active:scale-[0.97]",
        elevated:
          "bg-surface-container-lowest text-on-surface shadow-elevation-1 rounded-xl hover:shadow-elevation-2 active:scale-[0.97]",
        destructive:
          "bg-error text-on-error rounded-full hover:bg-error/90 hover:shadow-elevation-1 active:scale-[0.97]",
        link: "text-primary underline-offset-4 hover:underline p-0 h-auto",
      },
      size: {
        default: "h-11 px-6 py-2.5",
        sm: "h-9 px-4 text-xs",
        lg: "h-12 px-8 text-[15px]",
        icon: "h-10 w-10 rounded-lg",
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
