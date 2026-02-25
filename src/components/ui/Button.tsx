import type { ButtonHTMLAttributes } from "react";
import { cn } from "../../lib/utils";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'success' | 'danger' | 'ghost' | 'outline';
    fullWidth?: boolean;
}

export function Button({
    className,
    variant = 'primary',
    fullWidth,
    ...props
}: ButtonProps) {
    return (
        <button
            className={cn(
                "rounded-xl text-sm font-semibold transition-all inline-flex items-center justify-center gap-2",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                {
                    "py-3 px-4": !className?.includes("py-"),
                    "w-full": fullWidth,
                    "bg-primary text-white hover:opacity-90": variant === 'primary',
                    "bg-success text-white hover:opacity-90": variant === 'success',
                    "bg-danger text-white hover:opacity-90": variant === 'danger',
                    "bg-transparent text-textMuted hover:text-textPrimary": variant === 'ghost',
                    "bg-transparent border border-border text-textPrimary hover:bg-border/50": variant === 'outline',
                },
                className
            )}
            {...props}
        />
    );
}
