import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Transaction, Debt, Vacation, Currency } from '../types';

interface BudgetState {
    transactions: Transaction[];
    debts: Debt[];
    vacations: Vacation[];
    currency: Currency;

    // Actions
    addTransaction: (tx: Omit<Transaction, 'id'>) => void;
    removeTransaction: (id: number) => void;

    addDebt: (debt: Omit<Debt, 'id' | 'paid'>) => void;
    removeDebt: (id: number) => void;
    makeDebtPayment: (id: number, amount: number) => void;

    addVacation: (vacation: Omit<Vacation, 'id' | 'saved'>) => void;
    removeVacation: (id: number) => void;
    addVacationSavings: (id: number, amount: number) => void;

    setCurrency: (currency: Currency) => void;
}

export const useBudgetStore = create<BudgetState>()(
    persist(
        (set) => ({
            transactions: [],
            debts: [],
            vacations: [],
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
                    debts: [...state.debts, { ...debt, id: Date.now(), paid: 0 }],
                })),

            removeDebt: (id) =>
                set((state) => ({
                    debts: state.debts.filter((d) => d.id !== id),
                })),

            makeDebtPayment: (id, amount) =>
                set((state) => ({
                    debts: state.debts.map((d) =>
                        d.id === id
                            ? {
                                ...d,
                                paid: d.paid + amount,
                                balance: Math.max(0, d.balance - amount),
                            }
                            : d
                    ),
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

            setCurrency: (currency) => set({ currency }),
        }),
        {
            name: 'budgetja-storage',
        }
    )
);
