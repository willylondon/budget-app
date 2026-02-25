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
        <div className="fixed bottom-0 left-0 right-0 md:top-0 md:bottom-0 md:w-64 md:border-t-0 md:border-r z-20 bg-background/95 backdrop-blur-xl border-t border-surface transition-all">

            {/* Desktop Brand Header */}
            <div className="hidden md:flex flex-col p-6 items-center border-b border-surface mb-4">
                <div className="flex items-center text-[10px] font-bold tracking-widest uppercase opacity-90 leading-none mb-0.5">
                    <span className="text-textPrimary">London's</span>
                    <span className="text-[#F89B5F] ml-1">Ledger</span>
                </div>
                <div className="font-mono text-primary text-[10px] bg-primary/10 tracking-widest px-2 py-0.5 rounded-full mt-2 border border-primary/20">PRO</div>
            </div>

            <div className="flex md:flex-col px-2 md:px-4 md:space-y-2">
                {NAV_ITEMS.map((item) => (
                    <button
                        key={item.name}
                        onClick={() => onPageChange(item.name)}
                        className={`flex-1 py-3 md:py-4 md:px-4 flex flex-col md:flex-row items-center gap-1 md:gap-4 md:rounded-xl transition-all ${currentPage === item.name ? 'text-primary md:bg-primary/10 md:border md:border-primary/20' : 'text-textMuted hover:text-textSecondary md:hover:bg-surface'
                            }`}
                    >
                        {item.icon}
                        <span className="text-[9px] md:text-sm font-medium leading-none">
                            <span className="md:hidden">{(item as any).shortName || item.name}</span>
                            <span className="hidden md:inline">{item.name}</span>
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );
}
