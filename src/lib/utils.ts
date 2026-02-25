import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merges Tailwind classes without conflicts
 */
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/**
 * Formats a number to the specified currency
 */
export function formatCurrency(amount: number, currency: 'JMD' | 'USD') {
    if (currency === "USD") {
        return `$${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return `J$${amount.toLocaleString("en-JM", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Categories for transactions
 */
export const CATEGORIES = ["Food", "Transport", "Bills", "Shopping", "Entertainment", "Health", "Other"];

/**
 * Color mapping for categories used in charts
 */
export const CAT_COLORS: Record<string, string> = {
    Food: "#f97316",
    Transport: "#3b82f6",
    Bills: "#ef4444",
    Shopping: "#a855f7",
    Entertainment: "#ec4899",
    Health: "#10b981",
    Other: "#6b7280"
};
