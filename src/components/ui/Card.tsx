import type { HTMLAttributes } from "react";
import { cn } from "../../lib/utils";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn(
                "bg-surface border border-border rounded-2xl p-4 sm:p-5",
                className
            )}
            {...props}
        />
    );
}
