import { useState } from 'react';
import toast from 'react-hot-toast';
import { useBudgetStore } from '../store/useBudgetStore';
import { CATEGORIES, CAT_COLORS } from '../lib/utils';
import type { TransactionType } from '../types';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';

export function AddTransaction() {
    const { addTransaction, currency } = useBudgetStore();

    const [type, setType] = useState<TransactionType>('expense');
    const [name, setName] = useState('');
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState('Food');
    const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
    const [notes, setNotes] = useState('');

    const submit = () => {
        if (!name || !amount || isNaN(+amount) || +amount <= 0) {
            toast.error('Please enter a valid name and amount.');
            return;
        }

        addTransaction({
            type,
            name,
            amount: parseFloat(amount),
            category: type === 'expense' ? category : '',
            date,
            notes
        });

        // Reset form
        setName('');
        setAmount('');
        setCategory('Food');
        setDate(new Date().toISOString().slice(0, 10));
        setNotes('');

        toast.success('Transaction added successfully!');
    };

    return (
        <div className="space-y-4">
            <Card>
                <h2 className="text-lg font-bold mb-4 font-mono text-textPrimary">+ New Transaction</h2>

                {/* Type Toggle */}
                <div className="flex gap-2 mb-6">
                    <Button
                        variant={type === 'expense' ? 'danger' : 'outline'}
                        className="flex-1"
                        onClick={() => setType('expense')}
                    >
                        ↓ Expense
                    </Button>
                    <Button
                        variant={type === 'income' ? 'success' : 'outline'}
                        className="flex-1"
                        onClick={() => setType('income')}
                    >
                        ↑ Income
                    </Button>
                </div>

                <div className="space-y-4">
                    <Input
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="Description (e.g., Groceries)"
                    />

                    <div className="flex gap-2">
                        <div className="flex-1 relative flex items-center bg-border/50 border border-border rounded-xl px-4 focus-within:border-primary transition-colors">
                            <span className="text-sm mr-1 text-textMuted">{currency === "USD" ? "$" : "J$"}</span>
                            <input
                                value={amount}
                                onChange={e => setAmount(e.target.value)}
                                placeholder="0.00"
                                type="number"
                                min="0"
                                step="0.01"
                                className="flex-1 py-3 text-sm outline-none bg-transparent text-textPrimary"
                            />
                        </div>
                        <Input
                            type="date"
                            value={date}
                            onChange={e => setDate(e.target.value)}
                            className="flex-1 max-w-[150px]"
                        />
                    </div>

                    {type === "expense" && (
                        <div className="pt-2">
                            <div className="text-xs text-textMuted mb-2">Category</div>
                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                                {CATEGORIES.map(c => (
                                    <button
                                        key={c}
                                        onClick={() => setCategory(c)}
                                        className="py-2 px-1 rounded-xl text-xs font-semibold transition-all border border-border"
                                        style={category === c ? { backgroundColor: CAT_COLORS[c], color: "#fff", borderColor: CAT_COLORS[c] } : {}}
                                    >
                                        {c}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <textarea
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                        placeholder="Notes (optional)"
                        rows={2}
                        className="w-full rounded-xl bg-border/50 border border-border text-textPrimary text-sm outline-none px-4 py-3 resize-none focus:border-primary transition-colors mt-2"
                    />

                    <Button
                        fullWidth
                        onClick={submit}
                        className="mt-4"
                    >
                        Add Transaction
                    </Button>
                </div>
            </Card>
        </div>
    );
}
