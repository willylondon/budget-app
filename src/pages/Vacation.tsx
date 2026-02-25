import { useState } from 'react';
import { useBudgetStore } from '../store/useBudgetStore';
import { formatCurrency } from '../lib/utils';
import type { Vacation } from '../types';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ProgressBar } from '../components/ui/ProgressBar';

export function VacationPage() {
    const { vacations, addVacation, removeVacation, addVacationSavings, currency } = useBudgetStore();

    const [show, setShow] = useState(false);
    const [form, setForm] = useState({ name: "", goal: "", saved: "", targetDate: "", notes: "" });

    const handle = (k: keyof typeof form, v: string) => setForm(f => ({ ...f, [k]: v }));

    const addVac = () => {
        if (!form.name || !form.goal || isNaN(+form.goal)) return;
        addVacation({
            name: form.name,
            goal: +form.goal,
            targetDate: form.targetDate || undefined,
            notes: form.notes || undefined
        });
        setForm({ name: "", goal: "", saved: "", targetDate: "", notes: "" });
        setShow(false);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
                <div className="text-lg font-bold font-mono text-textPrimary">✦ Vacation Funds</div>
                <Button onClick={() => setShow(!show)}>{show ? 'Cancel' : '+ New Goal'}</Button>
            </div>

            {show && (
                <Card className="space-y-4">
                    <input value={form.name} onChange={e => handle("name", e.target.value)} placeholder="Destination / Goal name" className="w-full rounded-xl px-4 py-3 text-sm bg-border/50 border border-border outline-none focus:border-primary" />
                    <div className="grid grid-cols-2 gap-2">
                        <input value={form.goal} onChange={e => handle("goal", e.target.value)} placeholder="Goal amount" type="number" className="w-full rounded-xl px-4 py-3 text-sm bg-border/50 border border-border outline-none focus:border-primary" />
                        <input value={form.saved} onChange={e => handle("saved", e.target.value)} placeholder="Already saved" type="number" className="w-full rounded-xl px-4 py-3 text-sm bg-border/50 border border-border outline-none focus:border-primary" />
                    </div>
                    <input value={form.targetDate} onChange={e => handle("targetDate", e.target.value)} type="date" placeholder="Target date" className="w-full rounded-xl px-4 py-3 text-sm bg-border/50 border border-border outline-none focus:border-primary" />
                    <textarea value={form.notes} onChange={e => handle("notes", e.target.value)} placeholder="Dream notes..." rows={2} className="w-full rounded-xl px-4 py-3 text-sm resize-none bg-border/50 border border-border outline-none focus:border-primary" />
                    <Button fullWidth onClick={addVac}>Save Goal</Button>
                </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {vacations.map(v => {
                    const pct = v.goal > 0 ? (v.saved / v.goal) * 100 : 0;
                    const remaining = v.goal - v.saved;
                    let weeklyTarget = null;
                    if (v.targetDate && remaining > 0) {
                        const weeks = Math.max(1, Math.ceil((new Date(v.targetDate).getTime() - new Date().getTime()) / (7 * 24 * 60 * 60 * 1000)));
                        weeklyTarget = remaining / weeks;
                    }
                    return (
                        <VacCard key={v.id} vac={v} pct={pct} remaining={remaining} weeklyTarget={weeklyTarget} currency={currency} onRemove={removeVacation} onSave={addVacationSavings} />
                    );
                })}
            </div>
            {vacations.length === 0 && <div className="text-center py-8 text-sm text-textMuted w-full">No vacation goals yet. Start dreaming! 🌴</div>}
        </div>
    );
}

function VacCard({ vac, pct, remaining, weeklyTarget, currency, onRemove, onSave }: { vac: Vacation, pct: number, remaining: number, weeklyTarget: number | null, currency: 'JMD' | 'USD', onRemove: (id: string | number) => void, onSave: (id: string | number, amt: number) => void }) {
    const [amount, setAmount] = useState("");
    const [expand, setExpand] = useState(false);
    return (
        <Card>
            <div className="flex justify-between mb-3">
                <div>
                    <div className="font-semibold">{vac.name}</div>
                    {vac.targetDate && <div className="text-xs mt-0.5 text-textMuted">Target: {vac.targetDate}</div>}
                </div>
                <button onClick={() => onRemove(vac.id)} className="text-xs px-2 py-1 rounded-lg self-start bg-surface text-textMuted hover:bg-border transition-colors">✕</button>
            </div>

            <div className="flex justify-between text-sm mb-2">
                <span className="font-mono text-success font-bold">{formatCurrency(vac.saved, currency)}</span>
                <span className="text-textMuted">of {formatCurrency(vac.goal, currency)}</span>
            </div>

            <ProgressBar value={vac.saved} max={vac.goal} color={pct >= 100 ? "#10b981" : "#f97316"} />

            {pct < 100 && (
                <div className="mt-3 text-xs text-textMuted bg-border/30 p-2 rounded-lg">
                    Remaining: <span className="text-textPrimary font-medium">{formatCurrency(remaining, currency)}</span>
                    {weeklyTarget && <span className="ml-2 block mt-1 sm:inline sm:mt-0">· Save <span className="text-primary font-medium">{formatCurrency(weeklyTarget, currency)}/wk</span></span>}
                </div>
            )}

            {pct >= 100 && <div className="mt-3 text-xs font-bold text-success bg-success/10 p-2 rounded-lg">🎉 Goal reached! Time to book!</div>}

            {vac.notes && <div className="mt-3 text-xs italic text-textMuted">{vac.notes}</div>}

            <button onClick={() => setExpand(!expand)} className="w-full mt-3 py-1.5 rounded-lg text-xs bg-border/50 text-textMuted hover:bg-border transition-colors">
                {expand ? "▲ Hide" : "▼ Add Savings"}
            </button>

            {expand && (
                <div className="flex gap-2 mt-2">
                    <input value={amount} onChange={e => setAmount(e.target.value)} placeholder="Amount" type="number" className="flex-1 rounded-lg px-3 py-2 text-sm bg-border/50 border border-border outline-none focus:border-success" />
                    <Button variant="success" onClick={() => { if (+amount > 0) { onSave(vac.id, +amount); setAmount(""); setExpand(false); } }}>Save</Button>
                </div>
            )}
        </Card>
    );
}
