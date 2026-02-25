import { useBudgetStore } from '../../store/useBudgetStore';
import { Logo } from '../ui/Logo';

interface HeaderProps {
    title: string;
}

export function Header({ title }: HeaderProps) {
    const currency = useBudgetStore((state) => state.currency);

    return (
        <div className="sticky top-0 z-10 px-5 py-4 flex items-center justify-between bg-background/95 backdrop-blur-md border-b border-surface">
            <div className="flex items-center gap-3">
                <Logo className="w-10 h-10 drop-shadow-xl" />
                <div className="flex flex-col md:hidden">
                    <div className="flex items-center text-[10px] font-bold tracking-widest uppercase opacity-90 leading-none mb-0.5">
                        <span className="text-textPrimary">London's</span>
                        <span className="text-[#F89B5F] ml-1">Ledger</span>
                    </div>
                    <div className="font-bold text-lg font-mono text-primary leading-none">{title}</div>
                </div>
                <div className="hidden md:block font-bold text-xl font-mono text-primary leading-none ml-2">
                    {title}
                </div>
            </div>
            <div className="text-xs px-2 py-1 rounded-lg bg-surface text-textMuted border border-border">
                {currency}
            </div>
        </div>
    );
}
