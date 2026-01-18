import * as React from "react";

import { cn } from "@/lib/utils";
import { Button } from "./button";
import { Eye, EyeOff } from "lucide-react";

const DefaultInput = React.forwardRef<
  HTMLInputElement,
  React.ComponentProps<"input">
>(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        "flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "h-12 rounded-xl",
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});

DefaultInput.displayName = "DefaultInput";

const PasswordInput = React.forwardRef<
  HTMLInputElement,
  React.ComponentProps<"input">
>(({ className, ...props }, ref) => {
  const [showPassword, setShowPassword] = React.useState(false);

  return (
    <div className="relative">
      <DefaultInput
        ref={ref}
        {...props}
        type={showPassword ? "text" : "password"}
        className={cn("pr-12", className)}
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="!absolute right-0 top-0 h-full px-4 rounded-r-xl"
        onClick={() => setShowPassword(!showPassword)}
        data-testid="button-toggle-password"
      >
        {showPassword ? (
          <EyeOff className="size-4 text-gray-500" />
        ) : (
          <Eye className="size-4 text-gray-500" />
        )}
      </Button>
    </div>
  );
});

PasswordInput.displayName = "PasswordInput";

const Input = React.forwardRef<
  HTMLInputElement,
  React.ComponentProps<typeof DefaultInput>
>((props, ref) => {
  if (props.type === "password") {
    return (
      <PasswordInput
        ref={ref}
        {...(props as React.ComponentProps<typeof PasswordInput>)}
      />
    );
  }

  return <DefaultInput ref={ref} {...props} />;
});

Input.displayName = "Input";

export { Input, DefaultInput };
