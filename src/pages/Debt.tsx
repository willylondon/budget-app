import { useState } from 'react';
import { useBudgetStore } from '../store/useBudgetStore';
import type { DebtType, Debt } from '../types';
import { formatCurrency } from '../lib/utils';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ProgressBar } from '../components/ui/ProgressBar';

export function DebtPage() {
    const { debts, addDebt, removeDebt, makeDebtPayment, currency } = useBudgetStore();

    const [show, setShow] = useState(false);
    const [method, setMethod] = useState<'avalanche' | 'snowball'>('avalanche');

    const [name, setName] = useState('');
    const [type, setType] = useState<DebtType>('loan');
    const [balance, setBalance] = useState('');
    const [rate, setRate] = useState('');
    const [minPayment, setMinPayment] = useState('');
    const [dueDate, setDueDate] = useState('');

    const totalDebt = debts.reduce((s, d) => s + d.balance, 0);

    const handleAddDebt = () => {
        if (!name || !balance || isNaN(+balance) || +balance <= 0) return;
        addDebt({
            name,
            type,
            balance: +balance,
            rate: +rate || 0,
            minPayment: +minPayment || 0,
            dueDate: dueDate || undefined
        });
        setName(''); setBalance(''); setRate(''); setMinPayment(''); setDueDate('');
        setShow(false);
    };

    const sorted = [...debts].sort((a, b) => method === "avalanche" ? b.rate - a.rate : a.balance - b.balance);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <div className="text-xs text-textMuted">Total Debt</div>
                    <div className="text-2xl font-bold font-mono text-danger">{formatCurrency(totalDebt, currency)}</div>
                </div>
                <Button variant="primary" onClick={() => setShow(!show)}>
                    {show ? 'Cancel' : '+ Add Debt'}
                </Button>
            </div>

            {show && (
                <Card className="space-y-4">
                    <input
                        value={name} onChange={e => setName(e.target.value)}
                        placeholder="Debt name"
                        className="w-full rounded-xl px-4 py-3 text-sm bg-border/50 border border-border outline-none focus:border-primary"
                    />
                    <div className="flex gap-2">
                        {(['loan', 'credit card'] as DebtType[]).map(t => (
                            <Button
                                key={t}
                                variant={type === t ? 'primary' : 'outline'}
                                className="flex-1 py-2 text-xs capitalize"
                                onClick={() => setType(t)}
                            >
                                {t}
                            </Button>
                        ))}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <input value={balance} onChange={e => setBalance(e.target.value)} placeholder="Balance" type="number" className="rounded-xl px-3 py-2 text-sm bg-border/50 border border-border outline-none focus:border-primary" />
                        <input value={rate} onChange={e => setRate(e.target.value)} placeholder="Interest %" type="number" className="rounded-xl px-3 py-2 text-sm bg-border/50 border border-border outline-none focus:border-primary" />
                        <input value={minPayment} onChange={e => setMinPayment(e.target.value)} placeholder="Min Payment" type="number" className="rounded-xl px-3 py-2 text-sm bg-border/50 border border-border outline-none focus:border-primary" />
                        <input value={dueDate} onChange={e => setDueDate(e.target.value)} type="date" className="rounded-xl px-3 py-2 text-sm bg-border/50 border border-border outline-none focus:border-primary" />
                    </div>
                    <Button fullWidth onClick={handleAddDebt}>Save Debt</Button>
                </Card>
            )}

            <div className="flex gap-2 items-center pt-2">
                <span className="text-xs text-textMuted">Strategy:</span>
                {['avalanche', 'snowball'].map(m => (
                    <button
                        key={m}
                        onClick={() => setMethod(m as any)}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-colors ${method === m ? 'bg-blue-500 text-white' : 'bg-surface text-textMuted hover:bg-border'}`}
                    >
                        {m}
                    </button>
                ))}
            </div>
            <div className="text-xs text-textMuted">
                {method === "avalanche"
                    ? "↑ Highest interest first — mathematically saves the most money"
                    : "↓ Smallest balance first — builds psychological momentum"}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sorted.map((d, i) => (
                    <DebtCard
                        key={d.id}
                        debt={d}
                        currency={currency}
                        rank={i + 1}
                        onRemove={removeDebt}
                        onPayment={makeDebtPayment}
                    />
                ))}
            </div>
            {debts.length === 0 && <div className="text-center py-8 text-sm text-textMuted w-full">No debts tracked. Stay debt-free! 🎉</div>}
        </div>
    );
}

function DebtCard({ debt, currency, rank, onRemove, onPayment }: { debt: Debt; currency: 'JMD' | 'USD'; rank: number; onRemove: (id: number) => void; onPayment: (id: number, amount: number) => void }) {
    const [payment, setPayment] = useState("");
    const [expand, setExpand] = useState(false);

    const principalPaid = debt.paid - (debt.totalInterestPaid || 0);
    const orig = principalPaid + debt.balance;

    const calculatePayoffMonths = (balance: number, rate: number, payment: number) => {
        if (balance <= 0) return 0;
        if (payment <= 0) return null;
        const monthlyRate = rate / 100 / 12;
        if (monthlyRate === 0) return Math.ceil(balance / payment);
        if (payment <= balance * monthlyRate) return null;
        const months = -Math.log(1 - (monthlyRate * balance) / payment) / Math.log(1 + monthlyRate);
        return Math.ceil(months);
    };

    const payoffMonths = calculatePayoffMonths(debt.balance, debt.rate, debt.minPayment);
    const payoffText = payoffMonths === null ? "Never (Payment too low to cover interest)" : payoffMonths === 0 ? "Paid Off!" : `${payoffMonths} months`;

    return (
        <Card>
            <div className="flex items-start justify-between mb-2">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-border text-primary">#{rank}</span>
                        <span className="font-semibold text-sm">{debt.name}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-border text-textSecondary capitalize">{debt.type}</span>
                    </div>
                    <div className="text-xl font-bold font-mono text-danger mt-1">{formatCurrency(debt.balance, currency)}</div>
                </div>
                <button onClick={() => onRemove(debt.id)} className="text-xs px-2 py-1 rounded-lg bg-surface text-textMuted hover:bg-border transition-colors">✕</button>
            </div>

            <div className="grid grid-cols-2 gap-y-1 gap-x-2 text-xs mb-3 text-textMuted bg-surface rounded-lg p-2 border border-border">
                <div>APR: <span className="text-textPrimary">{debt.rate}%</span></div>
                <div>Min Pay: <span className="text-textPrimary">{formatCurrency(debt.minPayment, currency)}</span></div>
                <div>Interest Paid: <span className="text-textPrimary">{formatCurrency(debt.totalInterestPaid || 0, currency)}</span></div>
                <div>Est. Payoff: <span className="text-textPrimary">{payoffText}</span></div>
            </div>

            <ProgressBar value={principalPaid} max={orig} color="#10b981" label={`Principal Paid: ${formatCurrency(principalPaid, currency)}`} />

            <button
                onClick={() => setExpand(!expand)}
                className="w-full mt-3 py-1.5 rounded-lg text-xs bg-border/50 text-textMuted hover:bg-border transition-colors"
            >
                {expand ? "▲ Hide" : "▼ Make Payment"}
            </button>

            {expand && (
                <div className="flex gap-2 mt-2">
                    <input
                        value={payment}
                        onChange={e => setPayment(e.target.value)}
                        placeholder="Amount"
                        type="number"
                        className="flex-1 rounded-lg px-3 py-2 text-sm bg-border/50 border border-border outline-none focus:border-success"
                    />
                    <Button variant="success" onClick={() => {
                        if (+payment > 0) {
                            onPayment(debt.id, +payment);
                            setPayment("");
                            setExpand(false);
                        }
                    }}>
                        Pay
                    </Button>
                </div>
            )}
        </Card>
    );
}
