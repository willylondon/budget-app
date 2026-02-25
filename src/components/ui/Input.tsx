import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "../../lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    icon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ className, icon, ...props }, ref) => {
        return (
            <div className="relative flex-1 flex">
                {icon && (
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-textMuted flex items-center justify-center">
                        {icon}
                    </div>
                )}
                <input
                    ref={ref}
                    className={cn(
                        "w-full rounded-xl bg-border/50 border border-border text-textPrimary text-sm outline-none transition-colors",
                        "focus:border-primary focus:bg-border/80",
                        icon ? "pl-10 pr-4 py-3" : "px-4 py-3",
                        className
                    )}
                    {...props}
                />
            </div>
        );
    }
);
Input.displayName = "Input";
