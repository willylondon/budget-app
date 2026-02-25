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
        <div className="w-full min-h-screen relative bg-background flex">
            {/* The Sidebar / BottomNav Component */}
            <BottomNav currentPage={currentPage} onPageChange={onPageChange} />

            {/* Main Content Area: Shifts right on Desktop */}
            <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
                <Header title={currentPage} />

                {/* Content Area with padding for header and bottom nav */}
                <div className="px-4 md:px-8 lg:px-12 pt-4 pb-28 md:pb-8 flex-1 max-w-7xl w-full mx-auto">
                    {children}
                </div>
            </div>
        </div>
    );
}
