import { cn } from "../../lib/utils";

interface ProgressBarProps {
    value: number;
    max: number;
    color?: string; // hex color or tailwind class
    label?: string;
    className?: string;
}

export function ProgressBar({ value, max, color = "#f97316", label, className }: ProgressBarProps) {
    const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;

    // Decide if the color is a hex code or a tailwind variable (simple check)
    const isHex = color.startsWith('#');

    return (
        <div className={cn("w-full", className)}>
            {label && (
                <div className="flex justify-between text-xs mb-1 text-textSecondary">
                    <span>{label}</span>
                    <span>{pct.toFixed(0)}%</span>
                </div>
            )}
            <div className="w-full rounded-full h-2 bg-border">
                <div
                    className={cn("h-2 rounded-full transition-all duration-700", !isHex && `bg-${color}`)}
                    style={isHex ? { width: `${pct}%`, backgroundColor: color } : { width: `${pct}%` }}
                />
            </div>
        </div>
    );
}
