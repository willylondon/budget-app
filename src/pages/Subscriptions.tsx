import { useState } from 'react';
import { useBudgetStore } from '../store/useBudgetStore';
import { formatCurrency, CATEGORIES, CAT_COLORS } from '../lib/utils';
import type { SubFrequency } from '../types';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { Repeat } from 'lucide-react';

export function Subscriptions() {
    const { subscriptions, addSubscription, removeSubscription, toggleSubscription, currency } = useBudgetStore();

    const [show, setShow] = useState(false);
    const [name, setName] = useState('');
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState('Utilities');
    const [frequency, setFrequency] = useState<SubFrequency>('monthly');
    const [nextDate, setNextDate] = useState(new Date().toISOString().slice(0, 10));

    const handleAdd = () => {
        if (!name || !amount || isNaN(+amount) || +amount <= 0) return;
        addSubscription({
            name,
            amount: +amount,
            category,
            frequency,
            nextDate,
        });
        setName(''); setAmount(''); setNextDate(new Date().toISOString().slice(0, 10));
        setShow(false);
    };

    const activeMonthlyCost = subscriptions
        .filter(s => s.isActive)
        .reduce((sum, s) => {
            if (s.frequency === 'monthly') return sum + s.amount;
            if (s.frequency === 'weekly') return sum + s.amount * 4.33;
            if (s.frequency === 'yearly') return sum + s.amount / 12;
            return sum;
        }, 0);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <div className="text-xs text-textMuted">Avg. Monthly Cost</div>
                    <div className="text-2xl font-bold font-mono text-danger">{formatCurrency(activeMonthlyCost, currency)}</div>
                </div>
                <Button variant="primary" onClick={() => setShow(!show)}>
                    {show ? 'Cancel' : '+ New Sub'}
                </Button>
            </div>

            {show && (
                <Card className="space-y-4">
                    <input
                        value={name} onChange={e => setName(e.target.value)}
                        placeholder="Service name (e.g. Netflix)"
                        className="w-full rounded-xl px-4 py-3 text-sm bg-border/50 border border-border outline-none focus:border-primary"
                    />

                    <div className="flex gap-2">
                        <div className="flex-1 relative flex items-center bg-border/50 border border-border rounded-xl px-4 focus-within:border-primary transition-colors">
                            <span className="text-sm mr-1 text-textMuted">{currency === "USD" ? "$" : "J$"}</span>
                            <input
                                value={amount} onChange={e => setAmount(e.target.value)}
                                placeholder="0.00" type="text" inputMode="decimal" min="0" step="0.01"
                                className="flex-1 py-3 text-sm outline-none bg-transparent text-textPrimary"
                            />
                        </div>
                        <input value={nextDate} onChange={e => setNextDate(e.target.value)} type="date" className="flex-1 max-w-[150px] rounded-xl px-3 py-2 text-sm bg-border/50 border border-border outline-none focus:border-primary" />
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                        {(['weekly', 'monthly', 'yearly'] as SubFrequency[]).map(f => (
                            <Button key={f} variant={frequency === f ? 'primary' : 'outline'} className="py-2 text-xs capitalize" onClick={() => setFrequency(f)}>
                                {f}
                            </Button>
                        ))}
                    </div>

                    <div className="pt-2">
                        <div className="text-xs text-textMuted mb-2">Category</div>
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                            {CATEGORIES.map(c => (
                                <button
                                    key={c} onClick={() => setCategory(c)}
                                    className="py-2 px-1 rounded-xl text-xs font-semibold transition-all border border-border"
                                    style={category === c ? { backgroundColor: CAT_COLORS[c], color: "#fff", borderColor: CAT_COLORS[c] } : {}}
                                >
                                    {c}
                                </button>
                            ))}
                        </div>
                    </div>

                    <Button fullWidth onClick={handleAdd} className="mt-2">Save Subscription</Button>
                </Card>
            )}

            <div className="space-y-3 mt-4">
                {subscriptions.map(s => (
                    <Card key={s.id}>
                        <div className="flex justify-between items-start">
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-xl bg-surface flex justify-center items-center text-primary border border-border">
                                    <Repeat size={18} />
                                </div>
                                <div className={!s.isActive ? 'opacity-50 grayscale' : ''}>
                                    <div className="font-bold text-sm flex items-center gap-2">
                                        {s.name}
                                        {!s.isActive && <span className="text-[10px] px-2 py-0.5 rounded-full bg-border text-textMuted">Paused</span>}
                                    </div>
                                    <div className="text-xs text-textMuted capitalize">
                                        {s.frequency} • Next: {s.nextDate}
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className={`font-mono font-bold text-danger ${!s.isActive ? 'opacity-50' : ''}`}>
                                    {formatCurrency(s.amount, currency)}
                                </div>
                                <div className="flex gap-2 justify-end mt-2">
                                    <button onClick={() => toggleSubscription(s.id)} className="text-xs text-primary hover:text-white transition-colors">
                                        {s.isActive ? 'Pause' : 'Resume'}
                                    </button>
                                    <span className="text-textMuted border-l border-border pl-2 border-r pr-2">-</span>
                                    <button onClick={() => removeSubscription(s.id)} className="text-xs text-danger hover:text-red-400 transition-colors">
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    </Card>
                ))}

                {subscriptions.length === 0 && (
                    <EmptyState
                        title="No Subscriptions"
                        description="Track recurring expenses like Netflix, gym memberships, and rent."
                        icon={<Repeat size={32} strokeWidth={1.5} />}
                    />
                )}
            </div>
        </div>
    );
}
