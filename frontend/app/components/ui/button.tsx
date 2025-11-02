import * as React from "react";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "ghost" | "outline" | "destructive" | "secondary";
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "default", ...props }, ref) => {
    const base =
      "inline-flex items-center justify-center gap-2 rounded-lg transition px-3 py-2 font-medium";
    const variants: Record<NonNullable<ButtonProps["variant"]>, string> = {
      default: "bg-blue-600 text-white hover:bg-blue-700",
      ghost: "text-red-600 hover:bg-red-50",
      outline: "border border-gray-300 text-gray-700 hover:bg-gray-50",
      destructive: "bg-red-600 text-white hover:bg-red-700",
      secondary: "bg-gray-200 text-gray-800 hover:bg-gray-300",
    };

    const classes = `${base} ${variants[variant]} ${className}`;

    return <button ref={ref} className={classes} {...props} />;
  }
);

Button.displayName = "Button";