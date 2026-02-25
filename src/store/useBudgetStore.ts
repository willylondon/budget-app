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

    addDebt: (debt: Omit<Debt, 'id' | 'paid' | 'totalInterestPaid'>) => void;
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

            setCurrency: (currency) => set({ currency }),
        }),
        {
            name: 'budgetja-storage',
        }
    )
);
