import { LayoutGrid, PlusCircle, Receipt, Plane, Clock, Settings, Repeat } from 'lucide-react';

export const NAV_ITEMS = [
    { name: 'Dashboard', icon: <LayoutGrid size={24} /> },
    { name: 'Add Transaction', icon: <PlusCircle size={24} />, shortName: 'Add' },
    { name: 'Debt', icon: <Receipt size={24} /> },
    { name: 'Subscriptions', icon: <Repeat size={24} />, shortName: 'Subs' },
    { name: 'Vacation', icon: <Plane size={24} /> },
    { name: 'History', icon: <Clock size={24} /> },
    { name: 'Settings', icon: <Settings size={24} /> },
] as const;

export type PageType = typeof NAV_ITEMS[number]['name'];

interface BottomNavProps {
    currentPage: PageType;
    onPageChange: (page: PageType) => void;
}

export function BottomNav({ currentPage, onPageChange }: BottomNavProps) {
    return (
        <div className="fixed bottom-0 left-0 right-0 z-20 max-w-[480px] mx-auto bg-background/95 backdrop-blur-xl border-t border-surface">
            <div className="flex px-2">
                {NAV_ITEMS.map((item) => (
                    <button
                        key={item.name}
                        onClick={() => onPageChange(item.name)}
                        className={`flex-1 py-3 flex flex-col items-center gap-1 transition-all ${currentPage === item.name ? 'text-primary' : 'text-textMuted hover:text-textSecondary'
                            }`}
                    >
                        {item.icon}
                        <span className="text-[9px] font-medium leading-none">
                            {(item as any).shortName || item.name}
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );
}
