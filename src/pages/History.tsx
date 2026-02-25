import { useState, useMemo } from 'react';
import { useBudgetStore } from '../store/useBudgetStore';
import { formatCurrency, CATEGORIES } from '../lib/utils';
import { Search } from 'lucide-react';
import { Input } from '../components/ui/Input';
import { EmptyState } from '../components/ui/EmptyState';

export function History() {
    const { transactions, removeTransaction, currency } = useBudgetStore();
    const [filter, setFilter] = useState("all");
    const [search, setSearch] = useState("");

    const filtered = useMemo(() => {
        return transactions
            .filter(t => filter === "all" ? true : t.type === filter || t.category === filter)
            .filter(t => t.name.toLowerCase().includes(search.toLowerCase()))
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [transactions, filter, search]);

    return (
        <div className="space-y-4">
            <Input
                icon={<Search size={18} />}
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search transactions..."
            />

            <div className="flex gap-2 flex-nowrap overflow-x-auto pb-2 scrollbar-none no-scrollbar">
                {["all", "income", "expense", ...CATEGORIES].map(f => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`flex-none px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${filter === f ? 'bg-primary text-white' : 'bg-surface text-textMuted border border-border hover:bg-border'
                            }`}
                    >
                        {f}
                    </button>
                ))}
            </div>

            <div className="space-y-2">
                {filtered.map(t => (
                    <div key={t.id} className="flex items-center justify-between rounded-xl px-4 py-3 bg-surface border border-border">
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold ${t.type === "income" ? "bg-emerald-900/30 text-success" : "bg-red-900/30 text-danger"
                                }`}>
                                {t.type === "income" ? "↑" : "↓"}
                            </div>
                            <div>
                                <div className="text-sm font-semibold">{t.name}</div>
                                <div className="text-xs text-textMuted">{t.category || "Income"} · {t.date}</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className={`text-sm font-bold font-mono ${t.type === "income" ? "text-success" : "text-danger"
                                }`}>
                                {t.type === "income" ? "+" : "-"}{formatCurrency(t.amount, currency)}
                            </div>
                            <button
                                onClick={() => removeTransaction(t.id)}
                                className="text-xs text-textMuted hover:text-danger p-1 transition-colors"
                            >
                                ✕
                            </button>
                        </div>
                    </div>
                ))}
                {filtered.length === 0 && (
                    <EmptyState
                        title="No Transactions"
                        description="Try adjusting your filters or search terms, or add newly tracked items from the Dashboard."
                    />
                )}
            </div>
        </div>
    );
}
