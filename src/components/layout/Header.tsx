import { useBudgetStore } from '../../store/useBudgetStore';

interface HeaderProps {
    title: string;
}

export function Header({ title }: HeaderProps) {
    const currency = useBudgetStore((state) => state.currency);

    return (
        <div className="sticky top-0 z-10 px-5 py-4 flex items-center justify-between bg-background/95 backdrop-blur-md border-b border-surface">
            <div>
                <div className="text-xs text-textMuted">◈ BudgetJA</div>
                <div className="font-bold text-lg font-mono text-primary">{title}</div>
            </div>
            <div className="text-xs px-2 py-1 rounded-lg bg-surface text-textMuted border border-border">
                {currency}
            </div>
        </div>
    );
}
