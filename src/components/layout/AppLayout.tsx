import type { ReactNode } from "react";
import { Header } from "./Header";
import { BottomNav } from "./BottomNav";
import type { PageType } from "./BottomNav";
interface AppLayoutProps {
    children: ReactNode;
    currentPage: PageType;
    onPageChange: (page: PageType) => void;
}

export function AppLayout({ children, currentPage, onPageChange }: AppLayoutProps) {
    return (
        <div className="w-full max-w-[480px] mx-auto min-h-screen relative shadow-2xl bg-background outline outline-1 outline-surface shadow-black/50">
            <Header title={currentPage} />

            {/* Content Area with padding for header and bottom nav */}
            <div className="px-4 pt-4 pb-28">
                {children}
            </div>

            <BottomNav currentPage={currentPage} onPageChange={onPageChange} />
        </div>
    );
}
