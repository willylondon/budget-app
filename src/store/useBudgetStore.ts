import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Transaction, Debt, Vacation, Subscription, Currency } from '../types';

interface BudgetState {
    transactions: Transaction[];
    debts: Debt[];
    vacations: Vacation[];
    subscriptions: Subscription[];
    currency: Currency;

    // Actions
    addTransaction: (tx: Omit<Transaction, 'id'>) => void;
    removeTransaction: (id: number) => void;

    addDebt: (debt: Omit<Debt, 'id' | 'paid' | 'totalInterestPaid'>) => void;
    removeDebt: (id: number) => void;
    makeDebtPayment: (id: number, amount: number) => void;

    addVacation: (vacation: Omit<Vacation, 'id' | 'saved'>) => void;
    removeVacation: (id: number) => void;
    addVacationSavings: (id: number, amount: number) => void;

    addSubscription: (sub: Omit<Subscription, 'id' | 'isActive'>) => void;
    removeSubscription: (id: number) => void;
    toggleSubscription: (id: number) => void;
    processSubscriptions: () => void; // Auto-logs transactions

    setCurrency: (currency: Currency) => void;
}

export const useBudgetStore = create<BudgetState>()(
    persist(
        (set, get) => ({
            transactions: [],
            debts: [],
            vacations: [],
            subscriptions: [],
            currency: 'JMD',

            addTransaction: (tx) =>
                set((state) => ({
                    transactions: [{ ...tx, id: Date.now() }, ...state.transactions],
                })),

            removeTransaction: (id) =>
                set((state) => ({
                    transactions: state.transactions.filter((t) => t.id !== id),
                })),

            addDebt: (debt) =>
                set((state) => ({
                    debts: [...state.debts, { ...debt, id: Date.now(), paid: 0, totalInterestPaid: 0 }],
                })),

            removeDebt: (id) =>
                set((state) => ({
                    debts: state.debts.filter((d) => d.id !== id),
                })),

            makeDebtPayment: (id, amount) =>
                set((state) => ({
                    debts: state.debts.map((d) => {
                        if (d.id === id) {
                            // Calculate monthly interest based on APR and current balance
                            const monthlyInterestRate = d.rate / 100 / 12;
                            const interestForPeriod = d.balance * monthlyInterestRate;

                            // Check how much of the payment goes to the principal
                            const principalPayment = amount - interestForPeriod;

                            return {
                                ...d,
                                paid: d.paid + amount,
                                totalInterestPaid: (d.totalInterestPaid || 0) + interestForPeriod,
                                balance: Math.max(0, d.balance - principalPayment),
                            };
                        }
                        return d;
                    }),
                })),

            addVacation: (vacation) =>
                set((state) => ({
                    vacations: [...state.vacations, { ...vacation, id: Date.now(), saved: 0 }],
                })),

            removeVacation: (id) =>
                set((state) => ({
                    vacations: state.vacations.filter((v) => v.id !== id),
                })),

            addVacationSavings: (id, amount) =>
                set((state) => ({
                    vacations: state.vacations.map((v) =>
                        v.id === id
                            ? {
                                ...v,
                                saved: Math.min(v.goal, v.saved + amount),
                            }
                            : v
                    ),
                })),

            addSubscription: (sub) =>
                set((state) => ({
                    subscriptions: [...state.subscriptions, { ...sub, id: Date.now(), isActive: true }],
                })),

            removeSubscription: (id) =>
                set((state) => ({
                    subscriptions: state.subscriptions.filter((s) => s.id !== id),
                })),

            toggleSubscription: (id) =>
                set((state) => ({
                    subscriptions: state.subscriptions.map((s) =>
                        s.id === id ? { ...s, isActive: !s.isActive } : s
                    ),
                })),

            processSubscriptions: () => {
                const state = get();
                const today = new Date().toISOString().slice(0, 10);
                let addedTransactions = false;

                const updatedSubs = state.subscriptions.map(sub => {
                    if (sub.isActive && sub.nextDate <= today) {
                        let currentNext = new Date(sub.nextDate);

                        // Process all missed occurrences
                        while (currentNext.toISOString().slice(0, 10) <= today) {
                            // Log the transaction
                            state.addTransaction({
                                type: 'expense',
                                name: sub.name,
                                amount: sub.amount,
                                category: sub.category,
                                date: currentNext.toISOString().slice(0, 10),
                                notes: 'Automated Subscription'
                            });
                            addedTransactions = true;

                            // Advance the date
                            if (sub.frequency === 'monthly') {
                                currentNext.setMonth(currentNext.getMonth() + 1);
                            } else if (sub.frequency === 'yearly') {
                                currentNext.setFullYear(currentNext.getFullYear() + 1);
                            } else if (sub.frequency === 'weekly') {
                                currentNext.setDate(currentNext.getDate() + 7);
                            }
                        }

                        return { ...sub, nextDate: currentNext.toISOString().slice(0, 10) };
                    }
                    return sub;
                });

                if (addedTransactions) {
                    set({ subscriptions: updatedSubs });
                }
            },

            setCurrency: (currency) => set({ currency }),
        }),
        {
            name: 'budgetja-storage',
        }
    )
);
