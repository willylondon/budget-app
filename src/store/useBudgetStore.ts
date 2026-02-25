import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Transaction, Debt, Vacation, Subscription, Currency } from '../types';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface BudgetState {
    transactions: Transaction[];
    debts: Debt[];
    vacations: Vacation[];
    subscriptions: Subscription[];
    currency: Currency;
    isLoading: boolean;

    // Actions
    fetchCloudData: () => Promise<void>;
    addTransaction: (tx: Omit<Transaction, 'id'>) => Promise<void>;
    removeTransaction: (id: string | number) => Promise<void>;

    addDebt: (debt: Omit<Debt, 'id' | 'paid' | 'totalInterestPaid'>) => Promise<void>;
    removeDebt: (id: string | number) => Promise<void>;
    makeDebtPayment: (id: string | number, amount: number) => Promise<void>;

    addVacation: (vacation: Omit<Vacation, 'id' | 'saved'>) => Promise<void>;
    removeVacation: (id: string | number) => Promise<void>;
    addVacationSavings: (id: string | number, amount: number) => Promise<void>;

    addSubscription: (sub: Omit<Subscription, 'id' | 'isActive'>) => Promise<void>;
    removeSubscription: (id: string | number) => Promise<void>;
    toggleSubscription: (id: string | number) => Promise<void>;
    processSubscriptions: () => Promise<void>;

    setCurrency: (currency: Currency) => void;
}

const isCloud = Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);

export const useBudgetStore = create<BudgetState>()(
    persist(
        (set, get) => ({
            transactions: [],
            debts: [],
            vacations: [],
            subscriptions: [],
            currency: 'JMD',
            isLoading: false,

            fetchCloudData: async () => {
                if (!isCloud) return;
                set({ isLoading: true });
                try {
                    const [txs, dbts, vacs, subs] = await Promise.all([
                        supabase.from('transactions').select('*').order('date', { ascending: false }),
                        supabase.from('debts').select('*').order('created_at', { ascending: false }),
                        supabase.from('vacations').select('*').order('created_at', { ascending: false }),
                        supabase.from('subscriptions').select('*').order('created_at', { ascending: false }),
                    ]);

                    set({
                        transactions: (txs.data || []).map(t => ({ ...t, amount: Number(t.amount) })),
                        debts: (dbts.data || []).map(d => ({ ...d, balance: Number(d.balance), rate: Number(d.rate), minPayment: Number(d.min_payment), paid: Number(d.paid), totalInterestPaid: Number(d.total_interest_paid) })),
                        vacations: (vacs.data || []).map(v => ({ ...v, goal: Number(v.goal), saved: Number(v.saved), targetDate: v.target_date })),
                        subscriptions: (subs.data || []).map(s => ({ ...s, amount: Number(s.amount), nextDate: s.next_date, isActive: s.is_active })),
                        isLoading: false
                    });
                } catch (err: any) {
                    console.error("Cloud sync failed:", err);
                    toast.error("Failed to sync data with cloud");
                    set({ isLoading: false });
                }
            },

            addTransaction: async (tx) => {
                if (isCloud) {
                    const { data: { user } } = await supabase.auth.getUser();
                    if (!user) return;
                    const { data, error } = await supabase.from('transactions').insert({
                        user_id: user.id,
                        type: tx.type,
                        name: tx.name,
                        amount: tx.amount,
                        category: tx.category,
                        date: tx.date,
                        notes: tx.notes
                    }).select().single();

                    if (!error && data) {
                        set(state => ({ transactions: [{ ...data, amount: Number(data.amount) }, ...state.transactions] }));
                    } else {
                        toast.error("Failed to save transaction");
                    }
                } else {
                    set(state => ({ transactions: [{ ...tx, id: Date.now() }, ...state.transactions] }));
                }
            },

            removeTransaction: async (id) => {
                if (isCloud) {
                    const { error } = await supabase.from('transactions').delete().eq('id', id);
                    if (!error) set(state => ({ transactions: state.transactions.filter(t => t.id !== id) }));
                } else {
                    set(state => ({ transactions: state.transactions.filter(t => t.id !== id) }));
                }
            },

            addDebt: async (debt) => {
                if (isCloud) {
                    const { data: { user } } = await supabase.auth.getUser();
                    if (!user) return;
                    const { data, error } = await supabase.from('debts').insert({
                        user_id: user.id,
                        type: debt.type,
                        name: debt.name,
                        balance: debt.balance,
                        rate: debt.rate,
                        min_payment: debt.minPayment,
                        due_date: debt.dueDate
                    }).select().single();

                    if (!error && data) {
                        set(state => ({ debts: [{ ...data, balance: Number(data.balance), rate: Number(data.rate), minPayment: Number(data.min_payment), paid: Number(data.paid), totalInterestPaid: Number(data.total_interest_paid) }, ...state.debts] }));
                    }
                } else {
                    set(state => ({ debts: [...state.debts, { ...debt, id: Date.now(), paid: 0, totalInterestPaid: 0 }] }));
                }
            },

            removeDebt: async (id) => {
                if (isCloud) {
                    const { error } = await supabase.from('debts').delete().eq('id', id);
                    if (!error) set(state => ({ debts: state.debts.filter(d => d.id !== id) }));
                } else {
                    set(state => ({ debts: state.debts.filter(d => d.id !== id) }));
                }
            },

            makeDebtPayment: async (id, amount) => {
                const state = get();
                const d = state.debts.find(d => d.id === id);
                if (!d) return;

                const monthlyInterestRate = d.rate / 100 / 12;
                const interestForPeriod = d.balance * monthlyInterestRate;
                const principalPayment = amount - interestForPeriod;

                const newPaid = d.paid + amount;
                const newInterest = (d.totalInterestPaid || 0) + interestForPeriod;
                const newBalance = Math.max(0, d.balance - principalPayment);

                if (isCloud) {
                    const { error } = await supabase.from('debts').update({
                        paid: newPaid,
                        total_interest_paid: newInterest,
                        balance: newBalance
                    }).eq('id', id);

                    if (!error) {
                        set(state => ({ debts: state.debts.map(debt => debt.id === id ? { ...debt, paid: newPaid, totalInterestPaid: newInterest, balance: newBalance } : debt) }));
                    }
                } else {
                    set(state => ({ debts: state.debts.map(debt => debt.id === id ? { ...debt, paid: newPaid, totalInterestPaid: newInterest, balance: newBalance } : debt) }));
                }
            },

            addVacation: async (vacation) => {
                if (isCloud) {
                    const { data: { user } } = await supabase.auth.getUser();
                    if (!user) return;
                    const { data, error } = await supabase.from('vacations').insert({
                        user_id: user.id,
                        name: vacation.name,
                        goal: vacation.goal,
                        target_date: vacation.targetDate,
                        notes: vacation.notes
                    }).select().single();

                    if (!error && data) {
                        set(state => ({ vacations: [{ ...data, goal: Number(data.goal), saved: Number(data.saved), targetDate: data.target_date }, ...state.vacations] }));
                    }
                } else {
                    set(state => ({ vacations: [...state.vacations, { ...vacation, id: Date.now(), saved: 0 }] }));
                }
            },

            removeVacation: async (id) => {
                if (isCloud) {
                    const { error } = await supabase.from('vacations').delete().eq('id', id);
                    if (!error) set(state => ({ vacations: state.vacations.filter(v => v.id !== id) }));
                } else {
                    set(state => ({ vacations: state.vacations.filter(v => v.id !== id) }));
                }
            },

            addVacationSavings: async (id, amount) => {
                const state = get();
                const v = state.vacations.find(v => v.id === id);
                if (!v) return;

                const newSaved = Math.min(v.goal, v.saved + amount);

                if (isCloud) {
                    const { error } = await supabase.from('vacations').update({ saved: newSaved }).eq('id', id);
                    if (!error) set(state => ({ vacations: state.vacations.map(vac => vac.id === id ? { ...vac, saved: newSaved } : vac) }));
                } else {
                    set(state => ({ vacations: state.vacations.map(vac => vac.id === id ? { ...vac, saved: newSaved } : vac) }));
                }
            },

            addSubscription: async (sub) => {
                if (isCloud) {
                    const { data: { user } } = await supabase.auth.getUser();
                    if (!user) return;
                    const { data, error } = await supabase.from('subscriptions').insert({
                        user_id: user.id,
                        name: sub.name,
                        amount: sub.amount,
                        category: sub.category,
                        frequency: sub.frequency,
                        next_date: sub.nextDate,
                        is_active: true
                    }).select().single();

                    if (!error && data) {
                        set(state => ({ subscriptions: [{ ...data, amount: Number(data.amount), nextDate: data.next_date, isActive: data.is_active }, ...state.subscriptions] }));
                    }
                } else {
                    set(state => ({ subscriptions: [...state.subscriptions, { ...sub, id: Date.now(), isActive: true }] }));
                }
            },

            removeSubscription: async (id) => {
                if (isCloud) {
                    const { error } = await supabase.from('subscriptions').delete().eq('id', id);
                    if (!error) set(state => ({ subscriptions: state.subscriptions.filter(s => s.id !== id) }));
                } else {
                    set(state => ({ subscriptions: state.subscriptions.filter(s => s.id !== id) }));
                }
            },

            toggleSubscription: async (id) => {
                const state = get();
                const s = state.subscriptions.find(s => s.id === id);
                if (!s) return;

                if (isCloud) {
                    const { error } = await supabase.from('subscriptions').update({ is_active: !s.isActive }).eq('id', id);
                    if (!error) set(state => ({ subscriptions: state.subscriptions.map(sub => sub.id === id ? { ...sub, isActive: !sub.isActive } : sub) }));
                } else {
                    set(state => ({ subscriptions: state.subscriptions.map(sub => sub.id === id ? { ...sub, isActive: !sub.isActive } : sub) }));
                }
            },

            processSubscriptions: async () => {
                const state = get();
                const today = new Date().toISOString().slice(0, 10);

                for (const sub of state.subscriptions) {
                    if (sub.isActive && sub.nextDate <= today) {
                        let currentNext = new Date(sub.nextDate);
                        let updatedNext = currentNext;

                        // Process all missed occurrences
                        while (currentNext.toISOString().slice(0, 10) <= today) {
                            // Log the transaction
                            await state.addTransaction({
                                type: 'expense',
                                name: sub.name,
                                amount: sub.amount,
                                category: sub.category,
                                date: currentNext.toISOString().slice(0, 10),
                                notes: 'Automated Subscription'
                            });

                            // Advance the date
                            if (sub.frequency === 'monthly') currentNext.setMonth(currentNext.getMonth() + 1);
                            else if (sub.frequency === 'yearly') currentNext.setFullYear(currentNext.getFullYear() + 1);
                            else if (sub.frequency === 'weekly') currentNext.setDate(currentNext.getDate() + 7);

                            updatedNext = new Date(currentNext);
                        }

                        // Update subscription next date
                        const nextDateStr = updatedNext.toISOString().slice(0, 10);
                        if (isCloud) {
                            const { error } = await supabase.from('subscriptions').update({ next_date: nextDateStr }).eq('id', sub.id);
                            if (!error) set(s => ({ subscriptions: s.subscriptions.map(x => x.id === sub.id ? { ...x, nextDate: nextDateStr } : x) }));
                        } else {
                            set(s => ({ subscriptions: s.subscriptions.map(x => x.id === sub.id ? { ...x, nextDate: nextDateStr } : x) }));
                        }
                    }
                }
            },

            setCurrency: (currency) => set({ currency }),
        }),
        {
            name: 'budgetja-storage',
        }
    )
);
